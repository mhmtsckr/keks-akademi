export type PersonalBankItem={
  id:string;examType:string;subject:string;topic:string;prompt:string;createdAt:Date;
  options:unknown;
};

function meta(v:unknown){return v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{}}

export function personalBankReason(item:PersonalBankItem){
  const m=meta(item.options);
  const reason=String(m.bankReason||'WRONG').toUpperCase();
  return reason==='MARKED'?'MARKED':'WRONG';
}

function diversify(items:PersonalBankItem[],limit:number){
  const sorted=[...items].sort((a,b)=>b.createdAt.getTime()-a.createdAt.getTime());
  const chosen:PersonalBankItem[]=[];
  const counts=new Map<string,number>();
  while(chosen.length<limit&&sorted.length){
    sorted.sort((a,b)=>(counts.get(a.subject)||0)-(counts.get(b.subject)||0)||b.createdAt.getTime()-a.createdAt.getTime());
    const x=sorted.shift()!;
    chosen.push(x);
    counts.set(x.subject,(counts.get(x.subject)||0)+1);
  }
  return chosen;
}

export function buildPersonalQuestionSets(items:PersonalBankItem[],now=new Date()){
  const weekStart=new Date(now.getTime()-7*86400000);
  const monthStart=new Date(now.getTime()-30*86400000);

  const weeklyPool=items.filter(x=>personalBankReason(x)==='WRONG'&&x.createdAt>=weekStart);
  const monthlyPool=items.filter(x=>x.createdAt>=monthStart);

  const weekly=diversify(weeklyPool,10);
  const monthly=diversify(monthlyPool,20);

  return {
    weekly:{
      title:'Haftalık Yanlışlar Testi',
      windowDays:7,
      count:weekly.length,
      items:weekly.map(x=>({id:x.id,examType:x.examType,subject:x.subject,topic:x.topic,prompt:x.prompt}))
    },
    monthly:{
      title:'Aylık Karma Tekrar',
      windowDays:30,
      count:monthly.length,
      items:monthly.map(x=>({id:x.id,examType:x.examType,subject:x.subject,topic:x.topic,prompt:x.prompt,reason:personalBankReason(x)}))
    }
  };
}

export type MicroTask={
  key:string;title:string;description:string;durationMinutes:number;kind:string;subject:string|null;topic:string|null;
};

export function buildMicroLearningTasks(input:{
  examGroup?:string|null;
  weakSubject?:string|null;
  weakTopic?:string|null;
  dueWrongCount:number;
  hasLiterature:boolean;
  hasHistory:boolean;
  hasLanguage:boolean;
  hasMath:boolean;
}):MicroTask[]{
  const tasks:MicroTask[]=[];
  if(input.hasLanguage)tasks.push({key:'WORDS_5',title:'5 kelime',description:'5 kelimeyi anlamı ve kısa örneğiyle aktif hatırlama yap.',durationMinutes:3,kind:'VOCAB',subject:'Yabancı Dil',topic:null});
  if(input.hasLiterature)tasks.push({key:'LIT_MATCH_3',title:'3 edebiyat eşleştirmesi',description:'3 dönem–yazar–eser eşleştirmesini hızlıca tamamla.',durationMinutes:4,kind:'LITERATURE_MATCH',subject:'Türk Dili ve Edebiyatı',topic:null});
  if(input.hasHistory)tasks.push({key:'HISTORY_5',title:'5 tarih kronolojisi',description:'5 olayı doğru kronolojik sıraya yerleştir.',durationMinutes:4,kind:'HISTORY_CHRONOLOGY',subject:'Tarih',topic:null});
  if(input.hasMath)tasks.push({key:'PROBLEM_3',title:'3 problem',description:'3 kısa problem çöz; her soruda işlem yolunu kontrol et.',durationMinutes:5,kind:'PROBLEM',subject:'Matematik',topic:'Problemler'});
  if(input.dueWrongCount>0)tasks.push({key:'WRONG_1',title:'1 yanlış soru tekrar',description:'Tekrar günü gelen yanlış sorulardan birini yeniden çöz.',durationMinutes:3,kind:'WRONG_REVIEW',subject:null,topic:null});
  if(input.weakSubject&&input.weakTopic)tasks.push({
    key:'WEAK_TOPIC_3',
    title:'3 dakikalık zayıf konu tekrarı',
    description:input.weakSubject+' · '+input.weakTopic+' için kısa aktif hatırlama yap.',
    durationMinutes:3,kind:'WEAK_TOPIC',subject:input.weakSubject,topic:input.weakTopic
  });

  const unique=new Map(tasks.map(x=>[x.key,x]));
  return [...unique.values()].slice(0,5);
}
