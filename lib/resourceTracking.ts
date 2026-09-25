import { db } from '@/lib/db';

const RESOURCE_PREFIX='KEKS_RESOURCE_V1:';

type ResourceMeta={
  kind:'STUDY_RESOURCE';
  examType:string;
  subject:string;
  publisher:string|null;
  totalPages:number|null;
};

type ResourceProgress={
  kind:'RESOURCE_PROGRESS';
  resourceId:string;
  topic:string|null;
  pageStart:number|null;
  pageEnd:number|null;
  questions:number;
  correct:number;
  wrong:number;
  blank:number;
};

function record(v:unknown):Record<string,unknown>{
  return v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
}

export function encodeResourceMeta(input:Omit<ResourceMeta,'kind'>){
  return RESOURCE_PREFIX+JSON.stringify({kind:'STUDY_RESOURCE',...input});
}

export function parseResourceMeta(note:string|null):ResourceMeta|null{
  if(!note?.startsWith(RESOURCE_PREFIX))return null;
  try{
    const x=JSON.parse(note.slice(RESOURCE_PREFIX.length));
    if(x?.kind!=='STUDY_RESOURCE'||typeof x.examType!=='string'||typeof x.subject!=='string')return null;
    return {
      kind:'STUDY_RESOURCE',
      examType:x.examType,
      subject:x.subject,
      publisher:typeof x.publisher==='string'?x.publisher:null,
      totalPages:Number.isInteger(x.totalPages)&&x.totalPages>0?x.totalPages:null
    };
  }catch{return null}
}

export function parseResourceProgress(payload:unknown):ResourceProgress|null{
  const x=record(payload);
  if(x.kind!=='RESOURCE_PROGRESS'||typeof x.resourceId!=='string')return null;
  return {
    kind:'RESOURCE_PROGRESS',
    resourceId:x.resourceId,
    topic:typeof x.topic==='string'?x.topic:null,
    pageStart:Number.isInteger(x.pageStart)?Number(x.pageStart):null,
    pageEnd:Number.isInteger(x.pageEnd)?Number(x.pageEnd):null,
    questions:Math.max(0,Number(x.questions)||0),
    correct:Math.max(0,Number(x.correct)||0),
    wrong:Math.max(0,Number(x.wrong)||0),
    blank:Math.max(0,Number(x.blank)||0)
  };
}

export async function createStudyResource(studentId:string,createdByUserId:string,input:{
  title:string;examType:string;subject:string;publisher?:string|null;totalPages?:number|null
}){
  return db.libraryItem.create({
    data:{
      studentId,
      title:input.title.trim(),
      note:encodeResourceMeta({
        examType:input.examType.trim(),
        subject:input.subject.trim(),
        publisher:input.publisher?.trim()||null,
        totalPages:input.totalPages||null
      }),
      createdByUserId
    },
    select:{id:true,title:true,createdAt:true}
  });
}

export async function addResourceProgress(studentId:string,input:{
  resourceId:string;topic?:string|null;pageStart?:number|null;pageEnd?:number|null;
  questions:number;correct:number;wrong:number;blank:number
}){
  const resource=await db.libraryItem.findFirst({
    where:{id:input.resourceId,studentId},
    select:{id:true,note:true}
  });
  if(!resource||!parseResourceMeta(resource.note))throw new Error('RESOURCE_NOT_FOUND');
  const payload:ResourceProgress={
    kind:'RESOURCE_PROGRESS',
    resourceId:resource.id,
    topic:input.topic?.trim()||null,
    pageStart:input.pageStart||null,
    pageEnd:input.pageEnd||null,
    questions:input.questions,
    correct:input.correct,
    wrong:input.wrong,
    blank:input.blank
  };
  return db.dailyLog.create({data:{studentId,date:new Date(),payload:payload as any}});
}

export async function listResourceTracking(studentId:string){
  const [items,logs]=await Promise.all([
    db.libraryItem.findMany({
      where:{studentId},
      select:{id:true,title:true,note:true,createdAt:true},
      orderBy:{createdAt:'desc'}
    }),
    db.dailyLog.findMany({
      where:{studentId,date:{gte:new Date(Date.now()-365*86400000)}},
      select:{id:true,date:true,payload:true},
      orderBy:{date:'asc'},
      take:3000
    })
  ]);
  const resources=items.map(item=>({item,meta:parseResourceMeta(item.note)})).filter(x=>x.meta);
  const progress=logs.map(log=>({log,progress:parseResourceProgress(log.payload)})).filter(x=>x.progress);

  return resources.map(({item,meta})=>{
    const entries=progress
      .filter(x=>x.progress!.resourceId===item.id)
      .map(x=>({...x.progress!,id:x.log.id,date:x.log.date}));
    const questions=entries.reduce((n,x)=>n+x.questions,0);
    const correct=entries.reduce((n,x)=>n+x.correct,0);
    const wrong=entries.reduce((n,x)=>n+x.wrong,0);
    const blank=entries.reduce((n,x)=>n+x.blank,0);
    const maxPage=entries.reduce((n,x)=>Math.max(n,x.pageEnd||0),0)||null;
    const accuracy=questions?Math.round(correct/questions*100):null;
    const recent=entries.slice(-4);
    const recentPageGain=recent.length>=2
      ?Math.max(0,(recent[recent.length-1].pageEnd||0)-(recent[0].pageStart||recent[0].pageEnd||0))
      :null;
    const paceSignal=recent.length>=4&&recentPageGain!=null&&recentPageGain<8
      ?'Son 4 kaynak kaydında sayfa ilerlemesi sınırlı; aynı kaynakta gereğinden uzun kalınıp kalınmadığı koçla değerlendirilmeli.'
      :accuracy!=null&&accuracy<55&&questions>=30
        ?'Kaynakta soru doğruluğu düşük; yeni sayfalara geçmeden konu eksikliği ve yanlış nedenleri gözden geçirilmeli.'
        :null;
    return {
      id:item.id,
      title:item.title,
      examType:meta!.examType,
      subject:meta!.subject,
      publisher:meta!.publisher,
      totalPages:meta!.totalPages,
      currentPage:maxPage,
      pageProgress:meta!.totalPages&&maxPage?Math.min(100,Math.round(maxPage/meta!.totalPages*100)):null,
      questions,correct,wrong,blank,accuracy,
      topics:[...new Set(entries.map(x=>x.topic).filter(Boolean))],
      lastActivityAt:entries[entries.length-1]?.date||null,
      paceSignal,
      recentEntries:entries.slice(-8).reverse()
    };
  });
}
