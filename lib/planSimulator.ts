export type SimulationTopic={
  subject:string;
  topic:string;
  status:string;
  score:number;
  accuracy:number|null;
  overdueReviews:number;
};

export function simulatePlanOptions(input:{
  dailyMinutes:number;
  studyDays:number;
  examsPerWeek:number;
  examMinutes?:number;
  focusBlockMinutes?:number;
  topics:SimulationTopic[];
}){
  const examMinutes=input.examMinutes??135;
  const focusBlockMinutes=Math.max(20,Math.min(60,input.focusBlockMinutes??35));
  const weeklyMinutes=input.dailyMinutes*input.studyDays;
  const examLoadMinutes=input.examsPerWeek*examMinutes;
  const studyMinutes=Math.max(0,weeklyMinutes-examLoadMinutes);
  const focusBlocks=Math.floor(studyMinutes/focusBlockMinutes);
  const estimatedQuestionCapacity=Math.max(0,Math.round(studyMinutes/1.7));

  const statusWeight:Record<string,number>={
    RISKY:5,
    LEARNING:4,
    REINFORCING:3,
    NEW:2,
    DURABLE:0
  };

  const priorities=input.topics
    .map(topic=>{
      const accuracyNeed=topic.accuracy==null?15:Math.max(0,75-topic.accuracy);
      const reviewNeed=Math.min(20,topic.overdueReviews*6);
      const priority=(statusWeight[topic.status]??1)*20+accuracyNeed+reviewNeed+(100-topic.score)*0.15;
      return {
        ...topic,
        priority:Number(priority.toFixed(1)),
        reason:[
          topic.status==='RISKY'?'riskli bilgi hâkimiyeti':topic.status==='LEARNING'?'öğrenme aşamasında':topic.status==='REINFORCING'?'pekiştirme gerekiyor':topic.status==='NEW'?'yeni/açık konu':null,
          topic.accuracy!=null&&topic.accuracy<65?'doğruluk %'+Math.round(topic.accuracy):null,
          topic.overdueReviews>0?topic.overdueReviews+' gecikmiş tekrar':null
        ].filter(Boolean).join(' · ')
      };
    })
    .filter(x=>x.status!=='DURABLE')
    .sort((a,b)=>b.priority-a.priority)
    .slice(0,6);

  const examImpact=input.examsPerWeek===0
    ?'Deneme için süre ayrılmıyor; bütün kapasite konu, soru ve tekrara kalır.'
    :input.examsPerWeek===1
      ?examMinutes+' dk haftalık denemeye ayrılır; kalan kapasite konu, soru ve tekrara dağıtılır.'
      :input.examsPerWeek+' deneme yaklaşık '+examLoadMinutes+' dk kullanır; konu çalışması için kalan blok sayısı azalır ve deneme analizi öncelik kazanır.';

  const capacityWarning=examLoadMinutes>weeklyMinutes*.35
    ?'Deneme yükü haftalık kapasitenin %35’inden fazla. Konu kapatma ve tekrar için alan daralabilir.'
    :null;

  return {
    assumptions:{
      dailyMinutes:input.dailyMinutes,
      studyDays:input.studyDays,
      examsPerWeek:input.examsPerWeek,
      examMinutes,
      focusBlockMinutes
    },
    capacity:{
      weeklyMinutes,
      examLoadMinutes,
      studyMinutes,
      focusBlocks,
      estimatedQuestionCapacity
    },
    priorities,
    examImpact,
    capacityWarning,
    note:'Bu çıktı bir plan değildir. Koçun senaryo karşılaştırması yapması için kapasite ve öncelik seçenekleri sunar.'
  };
}
