import { readJson, withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { buildWeeklyPlan } from '@/lib/smartCoach';

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
  await db.coachBotMessage.create({data:{studentId:student.id,role:'user',content:message}});
  let reply=fallbackReply(message,student);
  let revisedPlan=false;
  if(/(plan|program).*(revize|güncelle|yenile)|(?:revize|güncelle|yenile).*(plan|program)/i.test(message)){
    try{
      const plan=await buildWeeklyPlan(student.id);
      await db.studyPlan.create({data:{
        studentId:student.id,
        title:'Rehber Bot · Revize Haftalık Program · '+new Date().toLocaleDateString('tr-TR'),
        payload:plan,
        active:true
      }});
      revisedPlan=true;
      reply+=' Yeni 7 günlük çalışma programını performans verilerine göre oluşturdum ve öğrenci paneline kaydettim.';
    }catch{}
  }
  if(process.env.OPENAI_API_KEY&&process.env.OPENAI_MODEL){
    try{
      const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{authorization:'Bearer '+process.env.OPENAI_API_KEY,'content-type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_MODEL,input:[{role:'system',content:'Sen KEKS Akademi öğrenci rehberisin. Tanı koyma. Öğrencinin rutin çalışma sorularına kısa, uygulanabilir yanıt ver; mevcut veriyi kullan; koç kararlarını değiştirme, yalnız öneri üret.'},{role:'user',content:JSON.stringify({message,student:{goal:student.goal,gradeLevel:student.gradeLevel,practiceLogs:student.practiceLogs,actions:student.coachingActions,plans:student.plans}})}]})});
      if(r.ok){
        const j:any=await r.json();
        const ai=j.output_text||reply;
        reply=revisedPlan?ai+' Ayrıca revize edilmiş 7 günlük program öğrenci paneline kaydedildi.':ai;
      }
    }catch{}
  }
  await db.coachBotMessage.create({data:{studentId:student.id,role:'assistant',content:reply}});
  return NextResponse.json({ok:true,reply});
}

export const POST = withApiErrors(POST__handler);
