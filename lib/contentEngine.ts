import { generateStudioContent as generateLegacyStudioContent } from '@/lib/contentStudio';

export type LearningContentType =
  | 'FLASHCARDS'
  | 'QUIZ'
  | 'SLIDES'
  | 'INFOGRAPHIC'
  | 'AUDIO_SCRIPT'
  | 'VIDEO_LESSON'
  | 'SIMILAR_QUESTIONS'
  | 'MINI_TEST'
  | 'MATCHING'
  | 'FILL_BLANK'
  | 'ACTIVE_RECALL'
  | 'MICRO_GAME';

type QualityResult={score:number;passed:boolean;issues:string[]};

function clean(s:string){return s.replace(/\s+/g,' ').trim();}
function clip(s:string,n:number){const x=clean(s);return x.length>n?x.slice(0,n-1).trim()+'…':x;}
function sentences(text:string){
  return text.replace(/\r/g,'').split(/(?<=[.!?])\s+|\n+/).map(clean).filter(x=>x.length>=20);
}
function terms(text:string){
  const stop=new Set(['ve','veya','ile','için','gibi','olan','olarak','bir','bu','şu','çok','daha','ise','da','de','mi','mı','mu','mü']);
  const words=text.toLocaleLowerCase('tr-TR').match(/[a-zçğıöşü0-9]{4,}/gi)||[];
  const counts=new Map<string,number>();
  for(const w of words){if(!stop.has(w))counts.set(w,(counts.get(w)||0)+1);}
  return [...counts.entries()].sort((a,b)=>b[1]-a[1]).map(x=>x[0]);
}
function titleCase(s:string){return s.replace(/(^|\s)\S/g,m=>m.toLocaleUpperCase('tr-TR'));}

export function learnerBand(gradeLevel?:string|null){
  const g=(gradeLevel||'').toLocaleUpperCase('tr-TR');
  if(/1|2|3|4/.test(g)&&!/10|11|12/.test(g)) return {key:'PRIMARY',label:'İlkokul',itemCount:6,maxPrompt:120};
  if(/5|6|7|8/.test(g)) return {key:'MIDDLE',label:'Ortaokul',itemCount:8,maxPrompt:150};
  if(/9|10/.test(g)) return {key:'HIGH',label:'Lise 9–10',itemCount:10,maxPrompt:180};
  if(/11|12|YKS|MEZUN|AGS|KPSS|ALES|YDS|YÖKDİL|DGS|EKPSS/.test(g)) return {key:'ADVANCED',label:'İleri',itemCount:12,maxPrompt:220};
  return {key:'GENERAL',label:'Genel',itemCount:8,maxPrompt:170};
}

function sourceOverlapScore(payload:any,sourceText:string){
  const sourceTerms=new Set(terms(sourceText).slice(0,40));
  const outputTerms=terms(JSON.stringify(payload)).slice(0,40);
  if(!outputTerms.length)return 0;
  const hits=outputTerms.filter(x=>sourceTerms.has(x)).length;
  return Math.min(25,Math.round(hits/outputTerms.length*40));
}

function structuralIssues(type:LearningContentType,payload:any){
  const issues:string[]=[];
  const items=Array.isArray(payload?.items)?payload.items:[];
  if(['FLASHCARDS','QUIZ','MINI_TEST','ACTIVE_RECALL','FILL_BLANK'].includes(type)&&items.length<3)issues.push('Yeterli sayıda madde üretilmedi.');
  if(type==='MATCHING'&&(!Array.isArray(payload?.pairs)||payload.pairs.length<3))issues.push('Eşleştirme için yeterli çift yok.');
  if(type==='MICRO_GAME'&&(!Array.isArray(payload?.rounds)||payload.rounds.length<3))issues.push('Mikro oyun için yeterli tur yok.');
  if(type==='QUIZ'||type==='MINI_TEST'){
    for(const q of items){
      if(!q?.prompt||!q?.options||!q?.correctAnswer)issues.push('Test maddesinde soru/seçenek/doğru cevap eksik.');
      if(q?.options&&typeof q.options==='object'&&!Object.prototype.hasOwnProperty.call(q.options,q.correctAnswer))issues.push('Doğru cevap seçeneklerle eşleşmiyor.');
    }
  }
  return [...new Set(issues)];
}

export function evaluateContentQuality(type:LearningContentType,payload:any,sourceText:string,gradeLevel?:string|null):QualityResult{
  const issues=structuralIssues(type,payload);
  const raw=JSON.stringify(payload||{});
  const structure=issues.length?Math.max(5,30-issues.length*10):35;
  const completeness=raw.length>1000?20:raw.length>500?15:raw.length>220?10:4;
  const sourceAnchoring=sourceOverlapScore(payload,sourceText);
  const band=learnerBand(gradeLevel);
  const tooLong=(raw.match(/[^.!?]+[.!?]?/g)||[]).some(x=>x.trim().length>band.maxPrompt*2);
  const levelFit=tooLong?10:20;
  if(tooLong)issues.push('Bazı maddeler öğrenci düzeyi için gereğinden uzun.');
  const score=Math.max(0,Math.min(100,structure+completeness+sourceAnchoring+levelFit));
  if(score<75)issues.push('Kalite puanı yayın eşiğinin altında.');
  const blocking=issues.filter(x=>x!=='Bazı maddeler öğrenci düzeyi için gereğinden uzun.');
  return {score,passed:score>=75&&blocking.length===0,issues:[...new Set(issues)]};
}

function deterministic(type:LearningContentType,text:string,gradeLevel?:string|null){
  if(['FLASHCARDS','QUIZ','SLIDES','INFOGRAPHIC','AUDIO_SCRIPT','VIDEO_LESSON','SIMILAR_QUESTIONS'].includes(type)){
    return generateLegacyStudioContent(type as any,text);
  }
  const band=learnerBand(gradeLevel);
  const ss=sentences(text);
  const ts=terms(text);
  const count=Math.min(band.itemCount,Math.max(4,ss.length));
  if(!ss.length)throw new Error('Kaynak metin içerik üretmek için yetersiz.');

  if(type==='MINI_TEST'){
    const items=ss.slice(0,count).map((s,i)=>{
      const distractors=ss.filter(x=>x!==s).slice(i+1).concat(ss.filter(x=>x!==s)).slice(0,3);
      while(distractors.length<3)distractors.push('Bu ifade kaynakta desteklenmemektedir.');
      return {prompt:clip('Kaynağa göre aşağıdakilerden hangisi doğrudur?',band.maxPrompt),options:{A:clip(s,band.maxPrompt),B:clip(distractors[0],band.maxPrompt),C:clip(distractors[1],band.maxPrompt),D:clip(distractors[2],band.maxPrompt)},correctAnswer:'A',explanation:clip(s,band.maxPrompt*2)};
    });
    return {title:'KEKS Mini Test',payload:{level:band.label,items}};
  }

  if(type==='MATCHING'){
    const pairs=ss.slice(0,count).map((s,i)=>({left:titleCase(ts[i]||('Kavram '+(i+1))),right:clip(s,band.maxPrompt)}));
    return {title:'KEKS Eşleştirme',payload:{level:band.label,pairs}};
  }

  if(type==='FILL_BLANK'){
    const items=ss.slice(0,count).map((s,i)=>{
      const term=ts[i]||clean(s).split(' ')[0];
      const escaped=term.replace(/[.*+?^$()|[\]{}\\]/g,'\\$&');
      const prompt=clean(s).replace(new RegExp(escaped,'i'),'_____');
      return {prompt:clip(prompt,band.maxPrompt*2),answer:term,hint:'Kavramı kaynaktaki bağlama göre tamamla.'};
    });
    return {title:'KEKS Boşluk Doldurma',payload:{level:band.label,items}};
  }

  if(type==='ACTIVE_RECALL'){
    const items=ss.slice(0,count).map((s,i)=>({prompt:clip((titleCase(ts[i]||'Bu konu'))+' hakkında kaynağa bakmadan ne hatırlıyorsun?',band.maxPrompt),answer:clip(s,band.maxPrompt*2),selfCheck:'Cevabını kaynak açıklamasıyla karşılaştır.'}));
    return {title:'KEKS Aktif Hatırlama Kartları',payload:{level:band.label,items}};
  }

  const rounds=ss.slice(0,Math.min(6,count)).map((s,i)=>({challenge:clip((titleCase(ts[i]||'Kavram'))+' için doğru açıklamayı seç.',band.maxPrompt),answer:clip(s,band.maxPrompt),points:10}));
  return {title:'KEKS Mikro Oyun',payload:{level:band.label,gameType:'QUICK_RECALL',rounds}};
}

async function aiDraft(type:LearningContentType,text:string,gradeLevel?:string|null){
  if(!process.env.OPENAI_API_KEY||!process.env.OPENAI_MODEL)return null;
  const band=learnerBand(gradeLevel);
  try{
    const r=await fetch('https://api.openai.com/v1/responses',{
      method:'POST',
      headers:{authorization:'Bearer '+process.env.OPENAI_API_KEY,'content-type':'application/json'},
      body:JSON.stringify({
        model:process.env.OPENAI_MODEL,
        input:[
          {role:'system',content:'KEKS Akademi için yalnız verilen onaylı kaynak metne dayalı öğrenme içeriği üret. Yeni bilgi uydurma. Öğrenci düzeyine uygun Türkçe kullan. Yalnız geçerli JSON döndür.'},
          {role:'user',content:JSON.stringify({type,gradeLevel:gradeLevel||'GENEL',level:band.label,maxPromptChars:band.maxPrompt,targetItemCount:band.itemCount,sourceText:text.slice(0,12000),instruction:'İçeriği kaynakla tutarlı, kısa, öğretici ve ölçülebilir üret. JSON yapısı içerik türüne uygun olsun.'})}
        ]
      })
    });
    if(!r.ok)return null;
    const j:any=await r.json();
    let raw=String(j.output_text||'').trim();
    const a=raw.indexOf('{'),b=raw.lastIndexOf('}');
    if(a>=0&&b>a)raw=raw.slice(a,b+1);
    const payload=JSON.parse(raw);
    return {title:String(payload.title||('KEKS '+type)),payload:payload.payload||payload};
  }catch{return null;}
}

export async function generateLearningContent(type:LearningContentType,text:string,gradeLevel?:string|null){
  const ai=await aiDraft(type,text,gradeLevel);
  const base=ai||deterministic(type,text,gradeLevel);
  const quality=evaluateContentQuality(type,base.payload,text,gradeLevel);
  return {
    title:base.title,
    payload:{...base.payload,_meta:{engineVersion:'KEKS_CONTENT_ENGINE_V2',gradeLevel:gradeLevel||null,generationSource:ai?'AI_DRAFT':'DETERMINISTIC_FALLBACK',quality}},
    qualityScore:quality.score,
    qualityPassed:quality.passed,
    qualityIssues:quality.issues,
    generationSource:ai?'AI_DRAFT':'DETERMINISTIC_FALLBACK'
  };
}
