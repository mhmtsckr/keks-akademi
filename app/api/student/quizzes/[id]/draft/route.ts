import {readJson,withApiErrors} from '@/lib/apiGuard';
import {NextResponse} from 'next/server';
import {requireRole} from '@/lib/auth';
import {db} from '@/lib/db';
import {z} from 'zod';

const draftSchema=z.object({
  answers:z.record(z.string().max(100),z.string().max(20).nullable()),
  marked:z.record(z.string().max(100),z.boolean()).default({})
}).strict();
const legacyKey=(id:string)=>'KEKS_FOCUS_DRAFT:'+id;
async function findQuiz(id:string,studentId:string){
  return db.practiceQuiz.findFirst({where:{id,studentId},select:{id:true,questionIds:true,attempts:{where:{studentId},select:{id:true},take:1}}});
}
async function GET__handler(_req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:403});
  const {id}=await params;
  const quiz=await findQuiz(id,user.student.id);
  if(!quiz)return NextResponse.json({error:'Test bulunamadı.'},{status:404});
  if(quiz.attempts.length)return NextResponse.json({ok:true,submitted:true,answers:{},marked:{}});
  const row=await db.dailyLog.findUnique({where:{legacyId:legacyKey(id)}});
  if(row&&row.studentId!==user.student.id)return NextResponse.json({error:'Erişim engellendi.'},{status:403});
  const payload=row?.payload&&typeof row.payload==='object'&&!Array.isArray(row.payload)?row.payload as Record<string,unknown>:{};
  return NextResponse.json({ok:true,submitted:false,answers:payload.answers||{},marked:payload.marked||{},savedAt:row?.createdAt||null});
}
async function PUT__handler(req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:403});
  const {id}=await params;
  const input=await readJson(req,draftSchema);
  const quiz=await findQuiz(id,user.student.id);
  if(!quiz)return NextResponse.json({error:'Test bulunamadı.'},{status:404});
  if(quiz.attempts.length)return NextResponse.json({error:'Teslim edilmiş test düzenlenemez.'},{status:409});
  const ids=Array.isArray(quiz.questionIds)?quiz.questionIds.filter((x):x is string=>typeof x==='string'):[];
  if(ids.length===0||ids.length>100)return NextResponse.json({error:'Soru listesi geçersiz.'},{status:409});
  const set=new Set(ids);
  if(Object.keys(input.answers).some(k=>!set.has(k))||Object.keys(input.marked).some(k=>!set.has(k)))
    return NextResponse.json({error:'Yalnız bu testin soruları kaydedilebilir.'},{status:400});
  const questions=await db.questionBankItem.findMany({where:{id:{in:ids}},select:{id:true,options:true}});
  if(questions.length!==ids.length)return NextResponse.json({error:'Sorular doğrulanamadı.'},{status:409});
  const choices=new Map(questions.map(q=>[q.id,new Set(Object.keys((q.options&&typeof q.options==='object'&&!Array.isArray(q.options)?q.options:{}) as Record<string,unknown>))]));
  if(Object.entries(input.answers).some(([id,value])=>value!==null&&!choices.get(id)?.has(value)))
    return NextResponse.json({error:'Geçersiz cevap seçimi.'},{status:400});
  const payload={type:'KEKS_FOCUS_DRAFT_V1',quizId:id,answers:input.answers,marked:input.marked,updatedAt:new Date().toISOString()};
  await db.dailyLog.upsert({
    where:{legacyId:legacyKey(id)},
    create:{legacyId:legacyKey(id),studentId:user.student.id,date:new Date(),payload},
    update:{payload,date:new Date()}
  });
  return NextResponse.json({ok:true,savedAt:payload.updatedAt});
}
export const GET=withApiErrors(GET__handler);
export const PUT=withApiErrors(PUT__handler);
