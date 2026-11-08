import {readJson,withApiErrors} from '@/lib/apiGuard';
import {NextResponse} from 'next/server';
import {requireRole} from '@/lib/auth';
import {db} from '@/lib/db';
import {z} from 'zod';

const taskSchema=z.object({
  studentId:z.string().min(5).max(100),
  date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  kind:z.enum(['PRACTICE','REVIEW','COACH_CHECK']),
  minutes:z.number().int().min(10).max(120),
  priority:z.enum(['HIGH','MEDIUM','LOW']),
  reason:z.string().min(4).max(250)
}).strict();
const schema=z.object({dailyCapacity:z.number().int().min(20).max(180),tasks:z.array(taskSchema).min(1).max(60)}).strict();
const taskTitle=(kind:'PRACTICE'|'REVIEW'|'COACH_CHECK')=>kind==='PRACTICE'?'KEKS Focus Pro · Yeni soruyla öğrenme ölçümü':kind==='REVIEW'?'KEKS Focus Pro · Gecikmeli tekrar':'KEKS Focus Pro · Koç değerlendirme ve geri bildirim';
const parseDate=(v:string)=>{
  const d=new Date(v+'T12:00:00+03:00');
  return Number.isNaN(d.getTime())||new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(d)!==v?null:d;
};
async function GET__handler(){
  const user=await requireRole(['COACH','ADMIN']);
  if(!user.coachProfile)return NextResponse.json({error:'Koç profili yok.'},{status:403});
  const from=new Date(Date.now()-86400000);
  const until=new Date(Date.now()+14*86400000);
  const [coachTasks,studentActions]=await Promise.all([
    db.coachTask.findMany({
      where:{coachId:user.coachProfile.id,sourceType:'FOCUS_PRO_WEEK_V1',dueAt:{gte:from,lte:until},status:{in:['OPEN','COMPLETED']}},
      select:{id:true,studentId:true,title:true,description:true,dueAt:true,status:true,priority:true},orderBy:{dueAt:'asc'},take:100
    }),
    db.coachingAction.findMany({
      where:{student:{coachId:user.coachProfile.id},planSource:'FOCUS_PRO_WEEK_V1',taskDate:{gte:from,lte:until}},
      select:{id:true,studentId:true,title:true,taskDate:true,status:true,submission:{select:{id:true}}},orderBy:{taskDate:'asc'},take:100
    })
  ]);
  return NextResponse.json({ok:true,coachTasks,studentActions});
}
async function POST__handler(req:Request){
  const user=await requireRole(['COACH','ADMIN']);
  if(!user.coachProfile)return NextResponse.json({error:'Koç profili yok.'},{status:403});
  const input=await readJson(req,schema);
  const ids=[...new Set(input.tasks.map(t=>t.studentId))];
  const owned=await db.student.findMany({where:{id:{in:ids},coachId:user.coachProfile.id},select:{id:true}});
  if(owned.length!==ids.length)return NextResponse.json({error:'Yalnız size atanmış öğrencilere plan oluşturabilirsiniz.'},{status:403});
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const maxDate=new Date(Date.now()+14*86400000);
  const dates=new Map<string,Date>();
  const loads=new Map<string,number>();
  const unique=new Set<string>();
  for(const item of input.tasks){
    const date=parseDate(item.date);
    if(!date||item.date<today||date>maxDate)return NextResponse.json({error:'Plan tarihleri bugün ile sonraki 14 gün arasında olmalı.'},{status:400});
    dates.set(item.date,date);
    loads.set(item.date,(loads.get(item.date)||0)+item.minutes);
    const key=item.studentId+'|'+item.date+'|'+item.kind;
    if(unique.has(key))return NextResponse.json({error:'Aynı öğrenciye aynı gün aynı müdahale iki kez eklenemez.'},{status:400});
    unique.add(key);
  }
  const bookedSessions=await db.coachingSession.findMany({
    where:{coachId:user.coachProfile.id,status:'SCHEDULED',startsAt:{gte:new Date(today+'T00:00:00+03:00'),lte:maxDate}},
    select:{startsAt:true,endsAt:true}
  });
  for(const session of bookedSessions){
    const key=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(session.startsAt);
    if(loads.has(key))loads.set(key,(loads.get(key)||0)+Math.max(0,Math.ceil((session.endsAt.getTime()-session.startsAt.getTime())/60000)));
  }
  if([...loads.values()].some(v=>v>input.dailyCapacity))
    return NextResponse.json({error:'Plan, mevcut koç görüşmeleriyle birlikte günlük kapasiteyi aşıyor.'},{status:400});
  const outcome=await db.$transaction(async tx=>{
    // Prevent overlapping approvals from creating duplicate records.
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${user.coachProfile!.id}), 2046) IS NULL AS locked`;
    const existing=await tx.coachTask.findMany({
      where:{coachId:user.coachProfile!.id,sourceType:'FOCUS_PRO_WEEK_V1',dueAt:{gte:new Date(today+'T00:00:00+03:00'),lte:maxDate}},
      select:{studentId:true,sourceId:true}
    });
    const keys=new Set(existing.map(x=>x.sourceId));
    let createdCoach=0,createdStudent=0,skipped=0;
    for(const item of input.tasks){
      const sourceId=item.studentId+'|'+item.date+'|'+item.kind;
      if(keys.has(sourceId)){skipped++;continue}
      const day=dates.get(item.date)!;
      const description=item.reason+' · Tahmini koç süresi: '+item.minutes+' dk. Gerekçe, yeni soru sonuçlarıyla kontrol edilmelidir.';
      await tx.coachTask.create({data:{
        coachId:user.coachProfile!.id,studentId:item.studentId,title:taskTitle(item.kind),
        description,priority:item.priority,dueAt:day,sourceType:'FOCUS_PRO_WEEK_V1',sourceId
      }});
      createdCoach++;
      if(item.kind!=='COACH_CHECK'){
        await tx.coachingAction.create({data:{
          studentId:item.studentId,createdByUserId:user.id,title:taskTitle(item.kind),
          description:item.kind==='REVIEW'?'Önce yöntemi hatırla, ardından 5 yeni soruyla tekrar yap.':'5 yeni soruyla konuyu farklı bağlamlarda ölç. Yanlış ve boşlarını ayrıca kaydet.',
          metricType:'QUESTIONS',targetValue:5,cadence:'WEEKLY',
          periodStart:day,periodEnd:new Date(day.getTime()+86400000),
          taskDate:day,status:'ACTIVE',planSource:'FOCUS_PRO_WEEK_V1'
        }});
        createdStudent++;
      }
      keys.add(sourceId);
    }
    return {createdCoach,createdStudent,skipped};
  });
  return NextResponse.json({ok:true,...outcome,message:'Koç onayıyla plan kaydedildi; çalışma görevleri ilgili öğrenci paneline aktarıldı.'});
}
export const GET=withApiErrors(GET__handler);
export const POST=withApiErrors(POST__handler);
