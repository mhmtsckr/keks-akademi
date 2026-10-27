import {db} from '@/lib/db';
import {resolveEducationLevelProfile} from '@/lib/educationLevelProfile';
import {recoveryReasonFromAnswers} from '@/lib/wrongBlankLearningPolicy';

function record(v:unknown):Record<string,unknown>{
  return v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
}

export type PersonalBankItem={
  questionId:string;
  examType:string;
  subject:string;
  topic:string;
  prompt:string;
  sourceKind:string;
  addedAt:Date;
  reason:'WRONG'|'BLANK'|'MARKED'|'UPLOADED_WRONG';
  imageUrl:string|null;
};

export async function buildPersonalQuestionBank(studentId:string){
  const [reviews,privateQuestions,logs]=await Promise.all([
    db.reviewQueueItem.findMany({
      where:{studentId},
      include:{question:true,sourceAttempt:{select:{answers:true}}},
      orderBy:{updatedAt:'desc'},
      take:400
    }),
    db.questionBankItem.findMany({
      where:{sourceKind:'STUDENT_WRONG:'+studentId,reviewStatus:'STUDENT_PRIVATE'},
      orderBy:{createdAt:'desc'},
      take:250
    }),
    db.dailyLog.findMany({
      where:{studentId,date:{gte:new Date(Date.now()-365*86400000)}},
      orderBy:{date:'desc'},
      take:1200,
      select:{date:true,payload:true}
    })
  ]);

  const map=new Map<string,PersonalBankItem>();

  for(const row of reviews){
    const q=row.question;
    const meta=record(q.options);
    map.set(q.id,{
      questionId:q.id,examType:q.examType,subject:q.subject,topic:q.topic,prompt:q.prompt,sourceKind:q.sourceKind,
      addedAt:row.createdAt,reason:recoveryReasonFromAnswers(q.id,row.sourceAttempt?.answers,meta.bankReason)==='BLANK'
        ?'BLANK':String(q.sourceKind).startsWith('STUDENT_WRONG:')?'UPLOADED_WRONG':'WRONG',
      imageUrl:typeof meta.imageUrl==='string'?meta.imageUrl:null
    });
  }

  for(const q of privateQuestions){
    if(map.has(q.id))continue;
    const meta=record(q.options);
    map.set(q.id,{
      questionId:q.id,examType:q.examType,subject:q.subject,topic:q.topic,prompt:q.prompt,sourceKind:q.sourceKind,
      addedAt:q.createdAt,reason:meta.bankReason==='BLANK'?'BLANK':'UPLOADED_WRONG',
      imageUrl:typeof meta.imageUrl==='string'?meta.imageUrl:null
    });
  }

  const latestBookmark=new Map<string,{active:boolean;date:Date}>();
  for(const log of logs){
    const p=record(log.payload);
    if(p.type!=='QUESTION_BOOKMARK'||typeof p.questionId!=='string')continue;
    if(latestBookmark.has(p.questionId))continue;
    latestBookmark.set(p.questionId,{active:p.active!==false,date:log.date});
  }
  const activeBookmarkIds=[...latestBookmark.entries()].filter(([,v])=>v.active).map(([id])=>id);
  const bookmarkedQuestions=activeBookmarkIds.length
    ?await db.questionBankItem.findMany({where:{id:{in:activeBookmarkIds}}})
    :[];
  for(const q of bookmarkedQuestions){
    if(map.has(q.id))continue;
    // A bookmarked question must be public approved or this student's own
    // private upload. Never expose another learner's private content.
    if(q.sourceKind.startsWith('STUDENT_WRONG:')&&
      (q.sourceKind!=='STUDENT_WRONG:'+studentId||q.reviewStatus!=='STUDENT_PRIVATE'))continue;
    if(!q.sourceKind.startsWith('STUDENT_WRONG:')&&(!q.active||q.reviewStatus!=='APPROVED'))continue;
    const state=latestBookmark.get(q.id);
    if(!state?.active)continue;
    const meta=record(q.options);
    map.set(q.id,{
      questionId:q.id,examType:q.examType,subject:q.subject,topic:q.topic,prompt:q.prompt,sourceKind:q.sourceKind,
      addedAt:state.date,reason:'MARKED',
      imageUrl:typeof meta.imageUrl==='string'?meta.imageUrl:null
    });
  }

  return [...map.values()].sort((a,b)=>b.addedAt.getTime()-a.addedAt.getTime());
}

function distinctBy<T>(rows:T[],key:(x:T)=>string){
  const seen=new Set<string>();
  return rows.filter(x=>{const k=key(x);if(seen.has(k))return false;seen.add(k);return true});
}

export function selectWeeklyWrongTest(items:PersonalBankItem[],now=new Date(),count=15){
  const since=new Date(now.getTime()-7*86400000);
  const recent=items.filter(x=>x.addedAt>=since&&x.reason!=='MARKED');
  return distinctBy(recent,x=>x.questionId).slice(0,count);
}

export function selectMonthlyMixedReview(items:PersonalBankItem[],now=new Date(),count=24){
  const since=new Date(now.getTime()-30*86400000);
  const pool=items.filter(x=>x.addedAt>=since);
  const bySubject=new Map<string,PersonalBankItem[]>();
  for(const x of pool){const arr=bySubject.get(x.subject)||[];arr.push(x);bySubject.set(x.subject,arr)}
  const selected:PersonalBankItem[]=[];
  let round=0;
  while(selected.length<count){
    let added=false;
    for(const arr of bySubject.values()){
      const item=arr[round];
      if(item&&!selected.some(x=>x.questionId===item.questionId)){selected.push(item);added=true;if(selected.length>=count)break}
    }
    if(!added)break;
    round++;
  }
  return selected;
}

export async function createPersonalBankQuiz(input:{
  studentId:string;userId:string;kind:'WEEKLY_WRONGS'|'MONTHLY_MIXED';count?:number;
}){
  const [items,learner]=await Promise.all([
    buildPersonalQuestionBank(input.studentId),
    db.student.findUnique({where:{id:input.studentId},
      select:{gradeLevel:true,academicTrack:true}})
  ]);
  const profile=resolveEducationLevelProfile(learner?.gradeLevel,learner?.academicTrack);
  // A short, assisted assessment for a beginning reader should never silently
  // become a 15–24 question exam. Older learners can receive larger sets.
  const key=profile?.key;
  const cap=key==='PRIMARY_123'?4:key==='PRIMARY_4'?6:
    key==='MIDDLE_56'?8:key==='MIDDLE_7'?10:key==='MIDDLE_8'?12:
    key==='HIGH_910'?12:key==='HIGH_11'?15:
    key==='HIGH_12'||key==='GRADUATE_YKS'?20:12;
  const requested=Math.max(1,Math.min(cap,input.count||
    (input.kind==='WEEKLY_WRONGS'?15:24)));
  const selected=input.kind==='WEEKLY_WRONGS'
    ?selectWeeklyWrongTest(items,new Date(),requested)
    :selectMonthlyMixedReview(items,new Date(),requested);
  if(!selected.length)return null;

  const questionIds=selected.map(x=>x.questionId);
  const quiz=await db.practiceQuiz.create({data:{
    studentId:input.studentId,
    title:input.kind==='WEEKLY_WRONGS'?'Haftalık Yanlışlar Testi':'Aylık Karma Tekrar',
    examType:'KISISEL',
    subject:'Karma',
    topic:input.kind,
    questionIds,
    createdByUserId:input.userId
  }});
  const questions=await db.questionBankItem.findMany({where:{id:{in:questionIds}}});
  const byId=new Map(questions.map(q=>[q.id,q]));
  return {
    quiz:{id:quiz.id,title:quiz.title,kind:input.kind,maxQuestions:cap,levelKey:key||null},
    questions:questionIds.map(id=>byId.get(id)).filter(Boolean).map(q=>{
      const meta=record(q!.options);
      const options=Object.fromEntries(Object.entries(meta)
        .filter(([k,v])=>/^[A-E]$/.test(k)&&typeof v==='string'));
      return {
        id:q!.id,
        examType:q!.examType,
        subject:q!.subject,
        topic:q!.topic,
        prompt:q!.prompt,
        options,
        sourceKind:q!.sourceKind,
        imageUrl:typeof meta.imageUrl==='string'?meta.imageUrl:null,
        inputMode:Object.keys(options).length?'CHOICE':'TEXT'
      };
    })
  };
}
