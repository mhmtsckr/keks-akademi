export type MizaResultMode=
  |'ACTION_QUESTIONS'
  |'ACTION_PROGRESS'
  |'PRACTICE_QUESTIONS'
  |'TOPIC_COMPLETE'
  |'REVIEW_FLOW'
  |'SIMPLE_COMPLETE';

export type MizaRebalanceSummary={
  redistributedTasks:number;
  deferredTasks:number;
  deferredUnits:number;
};

export type MizaTodayTask={
  id:string;
  order:number;
  source:string;
  title:string;
  subject:string|null;
  topic:string|null;
  examType:string|null;
  why:string|null;
  targetValue:number;
  metricType:string;
  estimatedMinutes:number;
  completed:boolean;
  actionId:string|null;
  reviewIds:string[];
  resultMode:MizaResultMode;
};

export function isMizaPlanChangeIntent(message:string){
  const text=message.toLocaleLowerCase('tr-TR').replace(/\s+/g,' ').trim();
  if(!text)return false;
  return [
    /(?:plan|program).*(?:değiştir|güncelle|revize|yenile)/,
    /(?:değiştir|güncelle|revize|yenile).*(?:plan|program)/,
    /koç.*(?:görev|plan|program).*(?:değiştir|sil|iptal)/,
    /(?:görev|plan|program).*(?:sil|iptal).*(?:koç|koc)/
  ].some(rx=>rx.test(text));
}

export function isMizaTodayPlanIntent(message:string){
  const text=message.toLocaleLowerCase('tr-TR').replace(/\s+/g,' ').trim();
  if(!text)return false;
  return [
    /bugün ne çalış(?:ayım|malıyım)/,
    /bugün ne yap(?:ayım|malıyım)/,
    /bugünkü (?:planım|programım|çalışmam)/,
    /bugün için (?:plan|program|çalışma)/,
    /şimdi ne çalış(?:ayım|malıyım)/,
    /sırada ne var/,
    /miza.*bugün/
  ].some(rx=>rx.test(text));
}

function resultMode(item:any):MizaResultMode{
  if(item.source==='REVIEW_BATCH')return 'REVIEW_FLOW';
  if(item.source==='TOPIC')return 'TOPIC_COMPLETE';
  if(item.source==='PRACTICE')return 'PRACTICE_QUESTIONS';
  if(item.source==='ACTION')return item.metricType==='QUESTIONS'?'ACTION_QUESTIONS':'ACTION_PROGRESS';
  return 'SIMPLE_COMPLETE';
}

export function buildMizaTodayOrchestration(today:any,rebalance?:any){
  const tasks:MizaTodayTask[]=(Array.isArray(today?.plan)?today.plan:[]).map((item:any,index:number)=>({
    id:String(item.id),
    order:Number(item.order||index+1),
    source:String(item.source||'UNKNOWN'),
    title:String(item.title||'Görev'),
    subject:typeof item.subject==='string'?item.subject:null,
    topic:typeof item.topic==='string'?item.topic:null,
    examType:typeof item.examType==='string'?item.examType:null,
    why:typeof item.why==='string'?item.why:null,
    targetValue:Number(item.targetValue||0),
    metricType:String(item.metricType||'COUNT'),
    estimatedMinutes:Number(item.estimatedMinutes||0),
    completed:Boolean(item.completed),
    actionId:typeof item.actionId==='string'?item.actionId:null,
    reviewIds:Array.isArray(item.reviewIds)?item.reviewIds.map(String):[],
    resultMode:resultMode(item)
  }));

  const remaining=tasks.filter(x=>!x.completed);
  const coachTasks=remaining.filter(x=>x.source==='ACTION').length;
  const dueReviews=remaining.filter(x=>x.source==='REVIEW_BATCH').reduce((n,x)=>n+x.targetValue,0);
  const plannedMinutes=remaining.reduce((n,x)=>n+x.estimatedMinutes,0);
  const deferredRows=Array.isArray(rebalance?.deferred)?rebalance.deferred:[];
  const movedRows=Array.isArray(rebalance?.created)?rebalance.created:[];
  const deferredUnits=deferredRows.reduce((n:number,x:any)=>n+Math.max(0,Number(x?.unallocated||0)),0);
  const rebalanceSummary:MizaRebalanceSummary={
    redistributedTasks:movedRows.length,
    deferredTasks:deferredRows.length,
    deferredUnits
  };
  const coachReviewRequired=deferredRows.length>0;
  const coachEscalation=coachReviewRequired
    ?{
        required:true,
        code:'CAPACITY_BLOCKED_CARRYOVER' as const,
        severity:deferredRows.length>=2?'HIGH' as const:'MEDIUM' as const,
        message:'Kaçırılan '+deferredRows.length+' görev öğrencinin güvenli kapasitesi içine otomatik sığdırılamadı. MİZA bu görevleri zorla plana eklemez; koçun yeniden planlama kararı vermesi gerekir.'
      }
    :{
        required:false,
        code:null,
        severity:'NONE' as const,
        message:'Koç müdahalesi gerektiren kapasite çakışması yok.'
      };

  return {
    mode:'TODAY_ORCHESTRATION' as const,
    date:String(today?.date||''),
    generatedAt:String(today?.generatedAt||new Date().toISOString()),
    engineVersion:String(today?.engineVersion||''),
    plannedMinutes,
    coachTasks,
    dueReviews,
    explanation:String(today?.explanation||''),
    notifications:Array.isArray(today?.notifications)?today.notifications.map(String):[],
    rebalance:rebalanceSummary,
    coachEscalation,
    tasks,
    remainingTasks:remaining.length,
    completedTasks:tasks.length-remaining.length,
    coachBoundary:{
      authority:'COACH_OVERRIDES_MIZA' as const,
      message:'MİZA koçun hedefini, görevini, haftalık planını veya müdahale kararını değiştirmez. Koç aksiyonlarını önceliklendirir; günlük sırayı KEKS verisinden oluşturur, güvenli kapasiteyi aşan durumu koça eskale eder ve yalnız öğrencinin çalışma sonucunu kaydeder.'
    }
  };
}

export function formatMizaTodayReply(orchestration:ReturnType<typeof buildMizaTodayOrchestration>){
  if(orchestration.remainingTasks===0){
    return 'Bugünkü planın tamamlandı. Yeni görev eklemiyorum; koçunun mevcut planı ve sonraki tekrar tarihleri korunuyor.';
  }
  const lines=orchestration.tasks
    .filter(x=>!x.completed)
    .map((task,index)=>{
      const target=task.metricType==='QUESTIONS'
        ?task.targetValue+' soru'
        :task.metricType==='MINUTES'
          ?task.targetValue+' dk'
          :task.source==='REVIEW_BATCH'
            ?task.targetValue+' tekrar'
            :task.targetValue>0?String(task.targetValue):'';
      return (index+1)+'. '+task.title+(target?' · '+target:'')+' · yaklaşık '+task.estimatedMinutes+' dk';
    });

  return [
    'Bugün için KEKS verilerine göre çalışma sıran:',
    ...lines,
    '',
    'Toplam yaklaşık süre: '+orchestration.plannedMinutes+' dk.'
      +(orchestration.dueReviews?' Gecikmiş tekrar: '+orchestration.dueReviews+'.':'')
      +(orchestration.coachTasks?' Koç görevi: '+orchestration.coachTasks+'.':''),
    orchestration.rebalance.redistributedTasks
      ?'Kaçırılan '+orchestration.rebalance.redistributedTasks+' görev gerçek kapasiteye göre ileri günlere dengeli dağıtıldı.'
      :'',
    orchestration.coachEscalation.required
      ?'Koç müdahalesi gerekiyor: '+orchestration.coachEscalation.message
      :'',
    'Bu sıra; mevcut koç görevlerini değiştirmez. MİZA yalnız önceliklendirir, kapasite dışı durumu koça iletir ve çalışma sonucunu KEKS’e kaydeder.'
  ].filter(Boolean).join('\n');
}
