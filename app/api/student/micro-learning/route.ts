import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { HttpError,readJson,withApiErrors } from '@/lib/apiGuard';
import { isFeatureEnabled } from '@/lib/systemConfig';
import { MICRO_KINDS,buildMicroPack,eligibleMicroKinds,gradeMicroPack,istanbulDay,microDayStart,microLevel,microSummary,publicMicroPack,type MicroKind } from '@/lib/microLearning';

const schema=z.discriminatedUnion('action',[
  z.object({action:z.literal('start'),kind:z.enum(MICRO_KINDS)}),
  z.object({action:z.literal('submit'),sessionId:z.string().min(1),answers:z.record(z.string().max(10),z.string().max(500)).refine(x=>Object.keys(x).length<=5)})
]);
const meta=(v:unknown)=>v as Record<string,any>;
async function student(){
  const user=await requireRole(['STUDENT']);
  if(!user.student)throw new HttpError(400,'Öğrenci profili yok.');
  if(!await isFeatureEnabled('MICRO_LEARNING',user.student.studentCode))throw new HttpError(403,'Mikro öğrenme bu hesap için etkin değil.');
  const s=await db.student.findUnique({where:{id:user.student.id},select:{id:true,gradeLevel:true,academicTrack:true}});
  if(!s)throw new HttpError(404,'Öğrenci bulunamadı.');
  return s;
}
const dueWhere=(id:string)=>({studentId:id,status:{in:['DUE','PENDING']},dueAt:{lte:new Date()},question:{active:true,sourceKind:{startsWith:'STUDENT_WRONG:'}}});
async function GETHandler(){
  const s=await student();
  const [due,logs]=await Promise.all([
    db.reviewQueueItem.count({where:dueWhere(s.id)}),
    db.dailyLog.findMany({where:{studentId:s.id,date:{gte:new Date(microDayStart().getTime()-6*86400000)},payload:{path:['type'],equals:'MICRO_RESULT'}},orderBy:{date:'desc'}})
  ]);
  const kinds:MicroKind[]=[...(due?['WRONG_1' as const]:[]),...eligibleMicroKinds(s)];
  const tasks=kinds.map(kind=>{const {items,...pack}=buildMicroPack(kind,microLevel(s),0);return {...pack,reason:kind==='WRONG_1'?'Tekrar zamanı gelen kendi sorun.':'Eğitim ve sınav grubuna uygun kısa alıştırma.'}});
  // A lower recent accuracy moves that category forward; due personal reviews stay first.
  const accuracy=(kind:string)=>{const rows=logs.filter(x=>meta(x.payload).kind===kind);const total=rows.reduce((n,x)=>n+Number(meta(x.payload).total||0),0);return total?rows.reduce((n,x)=>n+Number(meta(x.payload).correct||0),0)/total:0.5};
  tasks.sort((a,b)=>a.kind==='WRONG_1'?-1:b.kind==='WRONG_1'?1:accuracy(a.kind)-accuracy(b.kind));
  return NextResponse.json({ok:true,tasks,summary:microSummary(logs),dueWrongCount:due});
}
async function POSTHandler(req:Request){
  const s=await student(),input=await readJson(req,schema);
  if(input.action==='start'){
    if(input.kind!=='WRONG_1'&&!eligibleMicroKinds(s).includes(input.kind))throw new HttpError(400,'Bu görev eğitim veya sınav grubuna uygun değil.');
    const attempts=await db.dailyLog.count({where:{studentId:s.id,createdAt:{gte:microDayStart()},payload:{path:['type'],string_starts_with:'MICRO_'}}});
    if(attempts>=30)throw new HttpError(429,'Bugünkü mini çalışma sınırına ulaştın. Ana çalışma planına dönebilirsin.');
    const level=microLevel(s);
    const variant=Math.floor(microDayStart().getTime()/86400000)+attempts;
    let pack=buildMicroPack(input.kind,level,variant);
    let reviewId:string|null=null,imageUrl:string|null=null;
    if(input.kind==='WRONG_1'){
      const item=await db.reviewQueueItem.findFirst({where:dueWhere(s.id),include:{question:true},orderBy:{dueAt:'asc'}});
      if(!item)throw new HttpError(409,'Tekrar zamanı gelmiş yanlış sorunuz yok.');
      reviewId=item.id;
      imageUrl=meta(item.question.options)?.imageUrl||null;
      pack={...pack,subject:item.question.subject,topic:item.question.topic,items:[{id:'0',prompt:item.question.prompt,answer:'',explanation:''}]};
    }
    const row=await db.dailyLog.create({data:{studentId:s.id,date:new Date(),payload:{type:'MICRO_STARTED',version:1,kind:input.kind,level,variant,reviewId,title:pack.title,subject:pack.subject,topic:pack.topic}}});
    return NextResponse.json({ok:true,sessionId:row.id,reviewId,imageUrl,startedAt:row.createdAt,pack:publicMicroPack(pack)});
  }
  const session=await db.dailyLog.findFirst({where:{id:input.sessionId,studentId:s.id}});
  if(!session)throw new HttpError(404,'Çalışma oturumu bulunamadı.');
  const p=meta(session.payload);
  if(p.type==='MICRO_RESULT')return NextResponse.json({ok:true,result:p.result});
  if(p.type!=='MICRO_STARTED'||p.kind==='WRONG_1'||p.version!==1)throw new HttpError(400,'Geçersiz çalışma oturumu.');
  if(Date.now()-session.createdAt.getTime()>86400000)throw new HttpError(409,'Oturumun süresi doldu. Yeni bir mini görev başlat.');
  const pack=buildMicroPack(p.kind,p.level,p.variant),result=gradeMicroPack(pack,input.answers);
  if(result.blank===result.total)throw new HttpError(400,'En az bir soruyu cevapla veya çalışmayı kapat.');
  const durationSeconds=Math.min(300,Math.max(1,Math.round((Date.now()-session.createdAt.getTime())/1000)));
  const saved=await db.dailyLog.updateMany({where:{id:session.id,studentId:s.id,payload:{path:['type'],equals:'MICRO_STARTED'}},data:{date:new Date(),payload:{...p,type:'MICRO_RESULT',day:istanbulDay(),durationSeconds,correct:result.correct,wrong:result.wrong,blank:result.blank,total:result.total,result}}});
  if(!saved.count)throw new HttpError(409,'Bu çalışma zaten kaydedildi.');
  return NextResponse.json({ok:true,result});
}
export const GET=withApiErrors(GETHandler);
export const POST=withApiErrors(POSTHandler);
