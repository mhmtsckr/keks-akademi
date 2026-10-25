import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requireRole} from '@/lib/auth';
import {db} from '@/lib/db';
import {HttpError,readJson,withApiErrors} from '@/lib/apiGuard';
import {opticalAttemptLegacyId} from '@/lib/paragrafWrongLearning';
import {FOLLOWUP_EVENT,FOLLOWUP_PREFIX,followupLegacyPrefix,gradeFollowupTransfer,
 pickFollowupTransfer,publicFollowupTransfer,usedFollowupQuestionIds} from '@/lib/paragrafFollowupTransfer';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const noStore={'Cache-Control':'private, no-store'} as const;
const query=z.object({
 testNo:z.number().int().min(1).max(50),
 sourceQuestionNo:z.number().int().min(1).max(30)
}).strict();
const submission=query.extend({
 questionId:z.string().regex(/^\d{5}$/),
 answer:z.enum(['A','B','C','D','E']),
 evidence:z.string().trim().min(15).max(500)
}).strict();
const asObject=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
const sourceOf=(p:Record<string,unknown>,testNo:number)=>
 p.kind==='PARAGRAF_OPTIK_WRONG_RECOVERY'&&p.testNo===testNo&&
 typeof p.encoded==='string'&&/^[A-EX]{30}$/.test(p.encoded)?p.encoded:null;

async function scope(input:z.infer<typeof query>){
 const user=await requireRole(['STUDENT']);
 if(!user.student)throw new HttpError(403,'Öğrenci profili bulunamadı.');
 const studentId=user.student.id;
 const first=await db.dailyLog.findUnique({
  where:{legacyId:opticalAttemptLegacyId(studentId,input.testNo)},
  select:{date:true,payload:true}
 });
 const firstPayload=asObject(first?.payload);
 const encoded=sourceOf(firstPayload,input.testNo);
 if(!first||!encoded)throw new HttpError(404,'Önce bu testin ilk yanlış/boş sonucunu öğrenci hesabına kaydet.');
 // All of this student's prior follow-ups are considered, not other students' records.
 const past=await db.dailyLog.findMany({
  where:{studentId,legacyId:{startsWith:FOLLOWUP_PREFIX+studentId+':'}},
  select:{legacyId:true,date:true,payload:true},orderBy:{date:'asc'},take:1501
 });
 if(past.length>1500)throw new HttpError(409,'Geçmiş çalışma hacmi kontrolü gerekiyor.');
 const used=usedFollowupQuestionIds(firstPayload,past.map(x=>x.payload));
 const question=pickFollowupTransfer(input.testNo,encoded,input.sourceQuestionNo,used);
 if(!question)throw new HttpError(404,'Bu beceri için daha önce kullanılmamış uygun başka soru bulunamadı.');
 return {studentId,first,question,past,encoded};
}
async function GET__handler(req:Request){
 const u=new URL(req.url);
 const parsed=query.safeParse({
  testNo:Number(u.searchParams.get('testNo')),
  sourceQuestionNo:Number(u.searchParams.get('sourceQuestionNo'))
 });
 if(!parsed.success)throw new HttpError(400,'Geçersiz test veya soru numarası.');
 const data=await scope(parsed.data);
 return NextResponse.json({ok:true,question:publicFollowupTransfer(data.question,parsed.data.sourceQuestionNo),
  note:'Cevap anahtarı gösterilmez. Her özgün soru öğrenci hesabında tek kez değerlendirilir.'},{headers:noStore});
}
async function POST__handler(req:Request){
 const input=await readJson(req,submission);
 const {studentId,first,question,past}=await scope(input);
 if(question.id!==input.questionId)throw new HttpError(409,
  'Bu soru artık sıradaki bağımsız soru değil. Yeni soruyu tekrar aç.');
 const sourcePrefix=followupLegacyPrefix(studentId,input.testNo,input.sourceQuestionNo);
 const now=new Date();
 // A narrow daily cap prevents artificial inflation of the student/coach metrics.
 const dailyCount=past.filter(x=>x.legacyId?.startsWith(sourcePrefix) &&
  x.date.toISOString().slice(0,10)===now.toISOString().slice(0,10)).length;
 if(dailyCount>=5)throw new HttpError(429,'Bu soru için bugün en fazla beş yeni deneme kaydedilebilir.');
 const result=gradeFollowupTransfer(question,input.answer);
 const delayMs=now.getTime()-first.date.getTime();
 const stage=delayMs>=24*60*60*1000?'DELAYED_DIFFERENT_QUESTION':'IMMEDIATE_DIFFERENT_QUESTION';
 const payload={
  kind:FOLLOWUP_EVENT,version:1,source:'KEKS_PARAGRAF_OPTIK_50_V1',
  testNo:input.testNo,sourceQuestionNo:input.sourceQuestionNo,
  questionId:question.id,topic:question.topic,chosen:input.answer,correct:result.correct,
  evidence:input.evidence,evidenceStatus:'STUDENT_SELF_REPORT_UNVERIFIED',
  stage,firstOpticalAt:first.date.toISOString(),countsAsMastery:false,
  verifiedMastery:false
 };
 const legacyId=sourcePrefix+question.id;
 try{
  await db.dailyLog.create({data:{studentId,legacyId,date:now,payload}});
 }catch(error){
  if((error as {code?:string}).code==='P2002')
   throw new HttpError(409,'Bu bağımsız soru daha önce kaydedildi. Yeni soruyu aç.');
  throw error;
 }
 return NextResponse.json({
  ok:true,stage,countsAsMastery:false,result,
  note:'Farklı soruya başarılı aktarım, tek başına kalıcı öğrenme doğrulaması veya koç müdahalesinin etkisinin kanıtı değildir.'
 },{headers:noStore});
}
export const GET=withApiErrors(GET__handler);
export const POST=withApiErrors(POST__handler);
