export const LEARNING_TYPES=['MINI_TEST','FLASHCARDS','MATCHING','FILL_BLANK','ACTIVE_RECALL','MICRO_GAME'] as const;
export type LearningContentType=typeof LEARNING_TYPES[number];

function clean(s:string){return s.replace(/\r/g,'').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim();}
function sentences(text:string){return clean(text).split(/(?<=[.!?])\s+|\n+/).map(x=>x.trim()).filter(x=>x.length>=18);}
function terms(text:string){
  const stop=new Set(['ve','veya','ile','için','gibi','olan','olarak','bir','bu','şu','çok','daha','ise','da','de','mi','mı','mu','mü']);
  const words=text.toLocaleLowerCase('tr-TR').match(/[a-zçğıöşü0-9]{4,}/gi)||[];
  const counts=new Map<string,number>();
  for(const w of words){if(!stop.has(w))counts.set(w,(counts.get(w)||0)+1)}
  return [...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,20).map(x=>x[0]);
}
function keySentences(text:string,limit=18){
  const ss=sentences(text),ts=terms(text);
  return ss.map((s,i)=>({s,i,score:ts.reduce((n,t)=>n+(s.toLocaleLowerCase('tr-TR').includes(t)?1:0),0)}))
    .sort((a,b)=>b.score-a.score||a.i-b.i).slice(0,limit).map(x=>x.s);
}
export function studentLevelBand(gradeLevel?:string|null){
  const g=String(gradeLevel||'').toLocaleUpperCase('tr-TR');
  const nums=(g.match(/\d+/g)||[]).map(Number);
  const n=nums[0]||0;
  if(n>=1&&n<=4)return 'FOUNDATION';
  if(n>=5&&n<=8)return 'MIDDLE';
  if(n>=9&&n<=12)return 'HIGH';
  if(/YKS|MEZUN|KPSS|ALES|AGS|YDS|YÖKDİL|DGS/.test(g))return 'ADULT';
  return 'GENERAL';
}
function limitFor(level:string){return level==='FOUNDATION'?5:level==='MIDDLE'?7:10;}

function flashcards(text:string,level:string){
  const ks=keySentences(text),ts=terms(text),limit=limitFor(level);
  return {mode:'flashcards',levelBand:level,items:ks.slice(0,limit).map((s,i)=>({
    front:(ts[i]||'Ana fikir')+' nedir?',
    back:s,
    difficulty:level==='FOUNDATION'?'kolay':i%3===2?'zor':'orta'
  }))};
}
function miniTest(text:string,level:string){
  const ks=keySentences(text,22),ts=terms(text),limit=limitFor(level);
  return {mode:'mini-test',levelBand:level,items:ks.slice(0,limit).map((s,i)=>{
    const others=ks.filter(x=>x!==s).slice(i+1).concat(ks.filter(x=>x!==s)).slice(0,3);
    while(others.length<3)others.push('Bu ifade onaylı kaynak içerikte desteklenmemektedir.');
    return {prompt:'Onaylı içeriğe göre “'+(ts[i]||'bu kavram')+'” için doğru açıklama hangisidir?',options:{A:s,B:others[0],C:others[1],D:others[2]},correctAnswer:'A',explanation:s};
  })};
}
function matching(text:string,level:string){
  const ks=keySentences(text),ts=terms(text),limit=limitFor(level);
  return {mode:'matching',levelBand:level,items:ts.slice(0,limit).map((t,i)=>({key:String(i+1),left:t,right:ks[i]||'Onaylı kaynakta bu kavramla ilişkili açıklama.'}))};
}
function fillBlank(text:string,level:string){
  const ks=keySentences(text),ts=terms(text),limit=limitFor(level);
  return {mode:'fill-blank',levelBand:level,items:ks.slice(0,limit).map((s,i)=>{
    const answer=ts.find(t=>s.toLocaleLowerCase('tr-TR').includes(t))||ts[i]||'kavram';
    const index=s.toLocaleLowerCase('tr-TR').indexOf(answer.toLocaleLowerCase('tr-TR'));
    const prompt=index>=0?s.slice(0,index)+'_____'+s.slice(index+answer.length):'_____ : '+s;
    return {prompt,answer};
  })};
}
function activeRecall(text:string,level:string){
  const ks=keySentences(text),ts=terms(text),limit=limitFor(level);
  return {mode:'active-recall',levelBand:level,items:ks.slice(0,limit).map((s,i)=>({
    prompt:'Kaynağa bakmadan '+(ts[i]?'“'+ts[i]+'” kavramını':'bu bölümün ana fikrini')+' kendi cümlelerinle açıkla.',
    expectedPoints:[s],
    selfCheck:'Cevabını onaylı kaynakla karşılaştır; temel kavram, ilişki ve sonucu kontrol et.'
  }))};
}
function microGame(text:string,level:string){
  const base=matching(text,level);
  return {mode:'micro-game',levelBand:level,gameType:'QUICK_MATCH',timeLimitSeconds:level==='FOUNDATION'?90:120,items:base.items,scoring:{correct:10,wrong:-2,streakBonus:5}};
}

export function evaluateLearningContent(type:LearningContentType,payload:any,qualityScore:number){
  const issues:string[]=[];
  const items=Array.isArray(payload?.items)?payload.items:[];
  if(qualityScore<70)issues.push('kalite puanı 70 altı');
  if(items.length<4)issues.push('öğrenme öğesi sayısı yetersiz');
  if(type==='MINI_TEST'&&items.some((x:any)=>!x.prompt||!x.correctAnswer||!x.explanation))issues.push('mini test soru/cevap/açıklama eksik');
  if(type==='FLASHCARDS'&&items.some((x:any)=>!x.front||!x.back))issues.push('flashcard ön/arka yüz eksik');
  if(type==='MATCHING'&&items.some((x:any)=>!x.left||!x.right))issues.push('eşleştirme çifti eksik');
  if(type==='FILL_BLANK'&&items.some((x:any)=>!x.prompt||!x.answer))issues.push('boşluk doldurma cevap anahtarı eksik');
  if(type==='ACTIVE_RECALL'&&items.some((x:any)=>!x.prompt||!Array.isArray(x.expectedPoints)||!x.expectedPoints.length))issues.push('aktif hatırlama kontrol noktası eksik');
  if(type==='MICRO_GAME'&&!payload?.gameType)issues.push('mikro oyun türü eksik');
  return {passed:issues.length===0,issues,threshold:70};
}

export function generateApprovedLearningContent(type:LearningContentType,text:string,gradeLevel?:string|null){
  const safe=clean(text);
  if(!safe)throw new Error('Onaylı kaynakta üretim yapılabilecek metin yok.');
  const level=studentLevelBand(gradeLevel);
  const builders:Record<LearningContentType,(t:string,l:string)=>any>={
    MINI_TEST:miniTest,FLASHCARDS:flashcards,MATCHING:matching,FILL_BLANK:fillBlank,ACTIVE_RECALL:activeRecall,MICRO_GAME:microGame
  };
  const payload=builders[type](safe,level);
  const raw=JSON.stringify(payload);
  const unique=new Set(raw.toLocaleLowerCase('tr-TR').match(/[a-zçğıöşü]{5,}/gi)||[]).size;
  const qualityScore=Math.round(Math.min(100,35+Math.min(30,raw.length/180)+Math.min(25,unique/2)+Math.min(10,(payload.items?.length||0))));
  const quality=evaluateLearningContent(type,payload,qualityScore);
  return {title:'KEKS · '+type+' · '+level,payload,qualityScore,quality};
}
