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

export function assessResourceEfficiency(entries:{
  topic:string|null;pageStart:number|null;pageEnd:number|null;
  questions:number;correct:number;wrong:number;blank:number;date:Date;
}[],totalPages:number|null){
  if(!entries.length)return {
    status:'NEW' as const,
    label:'Yeni',
    reasons:[] as string[],
    suggestedCoachAction:null as string|null,
    activeDays:0,pagesStudied:0,questionsPerPage:null as number|null,
    recentAccuracy:null as number|null,previousAccuracy:null as number|null,
    accuracyDelta:null as number|null,repeatedTopicShare:null as number|null
  };

  const dayKeys=new Set(entries.map(x=>x.date.toISOString().slice(0,10)));
  const pageSet=new Set<number>();
  for(const e of entries){
    if(e.pageStart&&e.pageEnd){
      for(let p=e.pageStart;p<=e.pageEnd&&p-e.pageStart<=500;p++)pageSet.add(p);
    }else if(e.pageEnd)pageSet.add(e.pageEnd);
  }
  const pagesStudied=pageSet.size;
  const totalQuestions=entries.reduce((n,x)=>n+x.questions,0);
  const questionsPerPage=pagesStudied?Number((totalQuestions/pagesStudied).toFixed(1)):null;

  const topicCounts=new Map<string,number>();
  for(const e of entries){
    const key=e.topic?.trim()||'Genel';
    topicCounts.set(key,(topicCounts.get(key)||0)+1);
  }
  const maxTopicCount=Math.max(...topicCounts.values());
  const repeatedTopicShare=entries.length?Math.round(maxTopicCount/entries.length*100):null;

  const accuracy=(rows:typeof entries)=>{
    const q=rows.reduce((n,x)=>n+x.questions,0);
    const correct=rows.reduce((n,x)=>n+x.correct,0);
    return q?Math.round(correct/q*100):null;
  };
  const recent=entries.slice(-4);
  const previous=entries.slice(-8,-4);
  const recentAccuracy=accuracy(recent);
  const previousAccuracy=previous.length?accuracy(previous):null;
  const accuracyDelta=recentAccuracy!=null&&previousAccuracy!=null?recentAccuracy-previousAccuracy:null;

  const recentPageStart=recent[0]?.pageStart||recent[0]?.pageEnd||null;
  const recentPageEnd=recent[recent.length-1]?.pageEnd||null;
  const recentPageGain=recentPageStart&&recentPageEnd?Math.max(0,recentPageEnd-recentPageStart+1):null;
  const progressPercent=totalPages&&pageSet.size?Math.min(100,Math.round(pageSet.size/totalPages*100)):null;

  const reasons:string[]=[];
  let score=0;

  if(entries.length>=5&&repeatedTopicShare!=null&&repeatedTopicShare>=75){
    reasons.push('Çalışma kayıtlarının %'+repeatedTopicShare+' kadarı aynı konu çevresinde dönüyor.');
    score+=2;
  }
  if(recent.length>=4&&recentPageGain!=null&&recentPageGain<8&&recent.reduce((n,x)=>n+x.questions,0)>=40){
    reasons.push('Son 4 kayıtta sayfa ilerlemesi '+recentPageGain+' sayfada kalırken en az 40 soru çözülmüş.');
    score+=2;
  }
  if(recentAccuracy!=null&&recentAccuracy<60&&recent.reduce((n,x)=>n+x.questions,0)>=30){
    reasons.push('Son kaynak çalışmalarında doğruluk %'+recentAccuracy+' seviyesinde.');
    score+=2;
  }
  if(accuracyDelta!=null&&accuracyDelta<=2&&previousAccuracy!=null&&recentAccuracy!=null&&recentAccuracy<70){
    reasons.push('Son iki çalışma bloğunda doğruluk belirgin artmamış ('+previousAccuracy+'% → '+recentAccuracy+'%).');
    score+=2;
  }
  if(progressPercent!=null&&progressPercent>=60&&recentAccuracy!=null&&recentAccuracy<55){
    reasons.push('Kaynağın önemli bölümü ilerlemiş olmasına rağmen doğruluk hâlâ düşük.');
    score+=2;
  }

  const status=score>=4?'REVIEW':score>=2?'WATCH':'NORMAL';
  const label=status==='REVIEW'?'Gözden geçir':status==='WATCH'?'İzlenmeli':'Normal';
  const suggestedCoachAction=status==='REVIEW'
    ?'Kaynağa devam kararını otomatik vermeyin: 10–15 soruluk bağımsız kontrol seti uygulayın. Aynı zayıflık sürüyorsa konu öğretimi veya farklı kaynak türüne geçişi değerlendirin.'
    :status==='WATCH'
      ?'Bir sonraki 2–3 kaynak kaydında sayfa ilerlemesi ve doğruluk trendini birlikte izleyin.'
      :null;

  return {
    status,label,reasons,suggestedCoachAction,
    activeDays:dayKeys.size,pagesStudied,questionsPerPage,
    recentAccuracy,previousAccuracy,accuracyDelta,repeatedTopicShare
  };
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
    const efficiency=assessResourceEfficiency(entries,meta!.totalPages);
    const paceSignal=efficiency.status==='REVIEW'
      ?'Kaynak kullanımı gözden geçirilmeli: '+efficiency.reasons[0]
      :efficiency.status==='WATCH'
        ?'Kaynak kullanımı izlenmeli: '+efficiency.reasons[0]
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
      efficiency,
      recentEntries:entries.slice(-8).reverse()
    };
  });
}
