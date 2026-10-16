import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requireRole} from '@/lib/auth';
import {db} from '@/lib/db';
import {HttpError, readJson, withApiErrors} from '@/lib/apiGuard';
import {gradeParagrafPage,paragrafPageLegacyId,parseParagrafPageNo} from '@/lib/paragrafPage';
import {paragrafPrintedPageAnswerKey,PRINT_EDITION} from '@/lib/paragrafPrintAnswerKey';
import {printedParagrafWrongRows} from '@/lib/paragrafPrintReview';

const answer=z.enum(['A','B','C','D','E']).nullable();
const inputSchema=z.object({answers:z.record(z.string(),answer)}).strict();
type Context={params:Promise<{pageNo:string}>};

function parsePage(pageNo:string){
  const page=parseParagrafPageNo(pageNo);
  if(!page) throw new HttpError(404,'Böyle bir KEKS Paragraf sayfası bulunamadı.');
  return page;
}
function savedPayload(record:{payload:unknown}|null){
  if(!record)return null;
  const p=record.payload;
  return p&&typeof p==='object'&&!Array.isArray(p)?p:null;
}

async function GET__handler(_req:Request,{params}:Context){
  const user=await requireRole(['STUDENT']);
  if(!user.student)throw new HttpError(403,'Öğrenci profili bulunamadı.');
  const page=parsePage((await params).pageNo);
  // Exact 50-test edition, not the legacy 6,000-row answer table.
  const questions=paragrafPrintedPageAnswerKey(page.testNo,page.questionNos)
    .map(({id,questionNo,topic})=>({id,questionNo,topic}));
  if(questions.length!==page.questionNos.length)throw new HttpError(404,'Bu sayfa henüz dijital kullanıma açılmadı.');
  const saved=await db.dailyLog.findUnique({
    where:{legacyId:paragrafPageLegacyId(user.student.id,page.code)},
    select:{payload:true}
  });
  return NextResponse.json({
    ok:true,page:{code:page.code,testNo:page.testNo,pageInTest:page.pageInTest,
      questionNos:page.questionNos},
    questions,attempt:savedPayload(saved)
  },{headers:{'Cache-Control':'private, no-store'}});
}

async function POST__handler(req:Request,{params}:Context){
  const user=await requireRole(['STUDENT']);
  if(!user.student)throw new HttpError(403,'Öğrenci profili bulunamadı.');
  const page=parsePage((await params).pageNo);
  const {answers}=await readJson(req,inputSchema);
  const studentId=user.student.id;
  const legacyId=paragrafPageLegacyId(studentId,page.code);
  // Immutable first submission: refreshing/reposting never awards points twice.
  const prior=await db.dailyLog.findUnique({where:{legacyId},select:{payload:true}});
  if(prior)return NextResponse.json({ok:true,alreadySubmitted:true,attempt:savedPayload(prior)},
    {headers:{'Cache-Control':'private, no-store'}});
  const questions=paragrafPrintedPageAnswerKey(page.testNo,page.questionNos);
  if(questions.length!==page.questionNos.length)throw new HttpError(404,'Cevap anahtarı eksik; gönderim yapılmadı.');
  let graded:ReturnType<typeof gradeParagrafPage>;
  try{graded=gradeParagrafPage(page.questionNos,questions,answers);}
  catch(e){throw new HttpError(400,(e as Error).message);}
  const now=new Date();
  const wrongRows=printedParagrafWrongRows(questions,graded.items);
  const attempt={
    kind:'PARAGRAF_PAGE_ATTEMPT',edition:PRINT_EDITION,
    pageCode:page.code,testNo:page.testNo,pageInTest:page.pageInTest,
    submittedAt:now.toISOString(),...graded,reviewLinked:wrongRows.length
  };
  try{
    const result=await db.$transaction(async tx=>{
      const existing=await tx.dailyLog.findUnique({where:{legacyId},select:{payload:true}});
      if(existing)return {alreadySubmitted:true,attempt:savedPayload(existing)};
      await tx.dailyLog.create({data:{studentId,legacyId,date:now,payload:attempt}});
      // Create the paper-reference question and due-now review atomically with
      // the single immutable page attempt. No fabricated full question text.
      for(const q of wrongRows){
        const row=await tx.questionBankItem.upsert({
          where:{id:q.id},create:{...q},update:{}
        });
        if(row.sourceKind!==q.sourceKind||
           row.correctAnswer!==q.correctAnswer||
           row.topic!==q.topic) {
          throw new HttpError(409,'Bu basılı sorunun tekrar kaydı başka sürümle çakışıyor.');
        }
        await tx.reviewQueueItem.upsert({
          where:{studentId_questionId:{studentId,questionId:q.id}},
          create:{studentId,questionId:q.id,stepIndex:0,dueAt:now,
            status:'DUE',lastCorrect:false},
          update:{}
        });
      }
      await tx.practiceLog.create({data:{
        studentId,examType:'TYT',subject:'Türkçe',
        topic:'Paragraf · Test '+page.testNo,correct:graded.correct,wrong:graded.wrong,
        blank:graded.blank,total:graded.items.length,net:graded.net,date:now
      }});
      await tx.studentReport.create({data:{
        studentId,title:'KEKS Paragraf · Test '+page.testNo+' · Sayfa '+page.pageInTest,
        summary:graded.correct+' D · '+graded.wrong+' Y · '+graded.blank+' B · '+graded.net+' Net',
        content:[
          'Basılı KEKS Paragraf çalışması, sayfa '+page.code+'.',
          'Yanlış konular: '+(graded.wrongTopics.join(', ')||'Yok')+'.',
          'Öğrencinin seçtiği yanıtlar ve soru bazlı geri bildirim kendi oturumunda saklanmıştır. Bu baskı 50 testlik ayrı cevap anahtarından puanlanmıştır.',
          'Yanlış işaretlenen '+wrongRows.length+' soru basılı kaynak referansıyla 0. gün tekrar kuyruğuna eklendi. Sonraki aralıklar öğrencinin tekrar başarısına göre değişir.'
        ].join('\n'),
        createdByUserId:user.id,visibleToStudent:true,visibleToParent:false
      }});
      return {alreadySubmitted:false,attempt};
    });
    return NextResponse.json({ok:true,...result},{headers:{'Cache-Control':'private, no-store'}});
  }catch(e){
    // Concurrency-safe: a duplicate request cannot create a second practice log.
    if((e as {code?:string}).code==='P2002'){
      const saved=await db.dailyLog.findUnique({where:{legacyId},select:{payload:true}});
      if(saved)return NextResponse.json({ok:true,alreadySubmitted:true,attempt:savedPayload(saved)},
        {headers:{'Cache-Control':'private, no-store'}});
    }
    throw e;
  }
}
export const GET=withApiErrors(GET__handler);
export const POST=withApiErrors(POST__handler);
