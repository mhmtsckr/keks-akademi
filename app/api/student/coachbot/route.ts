import { readJson, withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { buildWeeklyPlan } from '@/lib/smartCoach';
import { isFeatureEnabled } from '@/lib/systemConfig';
import { ensureTodayLearningPlan,rebalanceMissedTasksCapacityAware } from '@/lib/learningEngine';
import { buildMizaTodayOrchestration,formatMizaTodayReply,isMizaTodayPlanIntent } from '@/lib/mizaOrchestrator';

const schema=z.object({message:z.string().min(2).max(2000)});

function fallbackReply(message:string,student:any){
  const weak=student.practiceLogs?.slice(0,20).sort((a:any,b:any)=>a.net-b.net)[0];
  const open=student.coachingActions?.find((x:any)=>x.status==='ACTIVE');
  const parts=[
    'KEKS rehber yanıtı:',
    weak?(' Son kayıtlarda '+weak.subject+' alanı daha fazla tekrar gerektiriyor.'):'',
    open?(' Aktif aksiyonun: '+open.title+' ('+open.currentValue+'/'+open.targetValue+').'):'',
    ' Sorunu daha küçük bir göreve böl: 25–40 dakika odak + 5–10 dakika mola, ardından kısa aktif hatırlama uygula.'
  ];
  if(/plan|program|hafta/i.test(message))parts.push(' Bu hafta için zayıf derse 2 odak bloğu, 1 konu testi ve 1 yanlış soru tekrarı eklemeni öneririm.');
  if(/özet|özetle/i.test(message))parts.push(' Son çalışmalarını konu başlıkları, yanlışlar ve tamamlanmayan aksiyonlar üzerinden özetleyebilirim.');
  return parts.join('');
}

async function POST__handler(req:Request){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const {message}=await readJson(req, schema);
  const student=await db.student.findUnique({where:{id:user.student.id},include:{practiceLogs:{orderBy:{date:'desc'},take:20},coachingActions:{where:{status:'ACTIVE'},orderBy:{periodEnd:'asc'},take:10},plans:{where:{active:true},orderBy:{updatedAt:'desc'},take:3}}});
  if(!student)return NextResponse.json({error:'Öğrenci bulunamadı.'},{status:404});

  if(isMizaTodayPlanIntent(message)){
    if(!(await isFeatureEnabled('MIZA_ORCHESTRATOR',student.studentCode)))return NextResponse.json({error:'MİZA Öğrenme Orkestratörü bu hesap için etkin değil.'},{status:403});
    if(!(await isFeatureEnabled('TODAY_PLAN',student.studentCode)))return NextResponse.json({error:'Bugünün Planı bu hesap için etkin değil.'},{status:403});

    await db.coachBotMessage.create({data:{studentId:student.id,role:'user',content:message,intent:'TODAY_ORCHESTRATION'}});
    await rebalanceMissedTasksCapacityAware(student.id);
    const today=await ensureTodayLearningPlan(student.id);
    const orchestration=buildMizaTodayOrchestration(today);
    const reply=formatMizaTodayReply(orchestration);
    const basis='Dayanak: Bugünün Planı motoru; koç aksiyonları, vadesi gelen tekrarlar, konu/performans sinyalleri ve öğrencinin gözlenen günlük kapasitesi.';
    await db.coachBotMessage.create({data:{studentId:student.id,role:'assistant',content:reply,intent:'TODAY_ORCHESTRATION'}});
    return NextResponse.json({ok:true,mode:'TODAY_ORCHESTRATION',reply,basis,orchestration});
  }

  if(!(await isFeatureEnabled('SMART_COACH',student.studentCode)))return NextResponse.json({error:'KEKS Rehber bu hesap için etkin değil.'},{status:403});
  await db.coachBotMessage.create({data:{studentId:student.id,role:'user',content:message,intent:'GENERAL_GUIDANCE'}});
  let reply=fallbackReply(message,student);
  const basis='Dayanak: son '+student.practiceLogs.length+' çalışma kaydı, '+student.coachingActions.length+' aktif koçluk aksiyonu ve '+student.plans.length+' aktif plan değerlendirildi.';
  let planPreview='';
  if(/(plan|program).*(revize|güncelle|yenile)|(?:revize|güncelle|yenile).*(plan|program)/i.test(message)){
    try{
      const plan=await buildWeeklyPlan(student.id);
      const preview=plan.days.slice(0,3).flatMap((day:any)=>day.tasks.slice(0,2).map((task:any)=>task.title)).slice(0,5);
      planPreview=' Koçunla değerlendirmek üzere plan taslağı önerisi: '+(preview.join(' · ')||'mevcut verilerle yeterli görev önerisi oluşmadı')+'. Bu taslak mevcut programını otomatik değiştirmez.';
      reply+=planPreview;
    }catch{}
  }
  if(process.env.OPENAI_API_KEY&&process.env.OPENAI_MODEL){
    try{
      const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{authorization:'Bearer '+process.env.OPENAI_API_KEY,'content-type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_MODEL,input:[{role:'system',content:'Sen KEKS Akademi öğrenci rehberisin. Tanı koyma. Öğrencinin rutin çalışma sorularına kısa, uygulanabilir yanıt ver; mevcut veriyi kullan; koç kararlarını değiştirme, yalnız öneri üret. Öneri verdiğinde hangi gözleme/veriye dayandığını kısa ve anlaşılır biçimde açıkla; açıklamasız karar verme.'},{role:'user',content:JSON.stringify({message,student:{goal:student.goal,gradeLevel:student.gradeLevel,practiceLogs:student.practiceLogs,actions:student.coachingActions,plans:student.plans}})}]})});
      if(r.ok){
        const j:any=await r.json();
        const ai=j.output_text||reply;
        reply=ai+(planPreview?planPreview:'');
      }
    }catch{}
  }
  if(!/Dayanak:/i.test(reply))reply=reply.trim()+'\n\n'+basis;
  await db.coachBotMessage.create({data:{studentId:student.id,role:'assistant',content:reply,intent:'GENERAL_GUIDANCE'}});
  return NextResponse.json({ok:true,reply,basis,mode:'GUIDANCE'});
}

export const POST = withApiErrors(POST__handler);
