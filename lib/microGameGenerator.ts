import crypto from 'node:crypto';
import { db } from '@/lib/db';

type GameType='WORD'|'MATCH'|'CONNECTIONS'|'CROSSWORD';

function tr(s:string){return s.toLocaleLowerCase('tr-TR').trim()}
function clean(s:string){return s.replace(/\s+/g,' ').trim()}
function titleCase(s:string){return s.replace(/(^|\s)\S/g,m=>m.toLocaleUpperCase('tr-TR'))}
function clip(s:string,n=90){const x=clean(s);return x.length>n?x.slice(0,n-1).trim()+'…':x}

function optionText(options:any,answer:string){
  if(!options)return answer;
  if(Array.isArray(options)){
    const hit=options.find((x:any)=>String(x?.key??x?.id??'')===answer);
    return String(hit?.text??hit?.label??hit??answer);
  }
  if(typeof options==='object')return String(options[answer]??answer);
  return answer;
}

function extractKeyword(text:string,topic:string){
  const stop=new Set(['olarak','olduğu','olması','içinde','üzerinde','arasında','tarafından','hangisidir','aşağıdaki','değildir','biridir','sonucudur','özelliğidir','vardır','yoktur','göre','olan','için','ile','veya','ancak','fakat','çünkü','daha']);
  const topicWords=new Set(tr(topic).split(/\s+/));
  const words=clean(text).match(/[A-Za-zÇĞİÖŞÜçğıöşü]{4,}/g)||[];
  const scored=words.filter(w=>!stop.has(tr(w))&&!topicWords.has(tr(w)));
  return scored.sort((a,b)=>b.length-a.length)[0]||topic.split(/\s+/)[0]||'KAVRAM';
}

function makeMatch(items:any[],subject:string,topic:string){
  const pairs=items.slice(0,6).map((q:any)=>({
    left:clip(q.prompt,78),
    right:clip(optionText(q.options,q.correctAnswer),55),
    explanation:q.explanation?clip(q.explanation,150):undefined,
    concept:q.id
  }));
  return {
    gameType:'MATCH' as GameType,
    title:subject+' · '+topic+' Hızlı Eşleştirme',
    payload:{pairs,explanation:'Soruları doğru cevaplarıyla eşleştirerek '+topic+' konusunu hızlıca tekrar et.'}
  };
}

function makeWord(items:any[],subject:string,topic:string){
  const q=items.find((x:any)=>x.explanation)||items[0];
  const answer=extractKeyword(String(q?.explanation||optionText(q?.options,q?.correctAnswer)||topic),topic).toLocaleUpperCase('tr-TR');
  const safeAnswer=answer.replace(/[^A-ZÇĞİÖŞÜ]/g,'');
  return {
    gameType:'WORD' as GameType,
    title:subject+' · '+topic+' Kavramı',
    payload:{
      answer:safeAnswer.length>=4?safeAnswer:topic.replace(/\s+/g,'').toLocaleUpperCase('tr-TR').slice(0,12),
      clue:clip(String(q?.explanation||q?.prompt||topic),140),
      explanation:clean(String(q?.explanation||'Bu kavram '+topic+' konusu içinde tekrar edilmelidir.'))
    }
  };
}

function makeConnections(items:any[],subject:string,topic:string){
  const source=items.slice(0,8);
  const groups=['Temel bilgi','Kavram','Uygulama','Dikkat noktası'];
  const concepts:any[]=[];
  source.forEach((q:any,i:number)=>{
    concepts.push({label:clip(optionText(q.options,q.correctAnswer),45),group:groups[i%4]});
    if(concepts.length<16)concepts.push({label:titleCase(extractKeyword(String(q.explanation||q.prompt),topic)),group:groups[(i+1)%4]});
  });
  while(concepts.length<16)concepts.push({label:topic+' '+(concepts.length+1),group:groups[concepts.length%4]});
  return {
    gameType:'CONNECTIONS' as GameType,
    title:subject+' · '+topic+' Kavram Gruplama',
    payload:{items:concepts.slice(0,16),explanation:topic+' konusundaki ilişkili bilgileri doğru gruplara ayır.'}
  };
}

function makeCrossword(items:any[],subject:string,topic:string){
  const clues=items.slice(0,6).map((q:any)=>{
    const answer=extractKeyword(String(q.explanation||optionText(q.options,q.correctAnswer)||topic),topic).toLocaleUpperCase('tr-TR').replace(/[^A-ZÇĞİÖŞÜ]/g,'');
    return {clue:clip(String(q.explanation||q.prompt),110),answer:answer||'KAVRAM'};
  });
  return {
    gameType:'CROSSWORD' as GameType,
    title:subject+' · '+topic+' Kavram Bulmacası',
    payload:{clues,explanation:'İpuçlarından ders kavramlarını bul.'}
  };
}

async function aiGame(input:{subject:string;topic:string;examType?:string|null;gradeLevel?:string|null;gameType:GameType;source:any[]}){
  if(!process.env.OPENAI_API_KEY||!process.env.OPENAI_MODEL)return null;
  try{
    const requiredShape=input.gameType==='WORD'
      ? '{"answer":"TEK_KELIME","clue":"ipucu","explanation":"kısa açıklama"}'
      : input.gameType==='MATCH'
        ? '{"pairs":[{"left":"kavram/soru","right":"doğru karşılık"}],"explanation":"kısa yönerge"}'
        : input.gameType==='CONNECTIONS'
          ? '{"items":[{"label":"kavram","group":"grup"}],"explanation":"kısa yönerge"}'
          : '{"clues":[{"clue":"ipucu","answer":"CEVAP"}],"explanation":"kısa yönerge"}';
    const r=await fetch('https://api.openai.com/v1/responses',{
      method:'POST',
      headers:{authorization:'Bearer '+process.env.OPENAI_API_KEY,'content-type':'application/json'},
      body:JSON.stringify({
        model:process.env.OPENAI_MODEL,
        input:[
          {role:'system',content:'KEKS Akademi için yalnız verilen ders, konu ve kaynak maddelere dayalı Türkçe, kısa ve öğretici mikro tekrar oyunu üret. Kaynaklar MEB/TYMM olarak işaretliyse kavramları yalnız bu kaynakların desteklediği çerçevede kullan. Ders kitabı cümlelerini uzun biçimde kopyalama; kavramı özgün ve kısa ifadeyle öğret. Yeni bilgi uydurma. Yalnız JSON döndür.'},
          {role:'user',content:JSON.stringify({
            examType:input.examType,gradeLevel:input.gradeLevel,subject:input.subject,topic:input.topic,
            gameType:input.gameType,requiredShape,
            sources:input.source.map((q:any)=>({prompt:q.prompt,correct:optionText(q.options,q.correctAnswer),explanation:q.explanation})),
            instruction:input.source.length?'Yalnız bu kaynak maddelerden yararlan.':'Bu ders ve konu için temel, yaygın ve müfredata uygun bilgileri kullan; emin olmadığın ayrıntıyı üretme.'
          })}
        ]
      })
    });
    if(!r.ok)return null;
    const j:any=await r.json();
    let raw=String(j.output_text||'').trim();
    if(raw.startsWith('{')&&raw.endsWith('}'))return JSON.parse(raw);
    const first=raw.indexOf('{'),last=raw.lastIndexOf('}');
    if(first>=0&&last>first)raw=raw.slice(first,last+1);
    return JSON.parse(raw);
  }catch{return null}
}

export async function chooseWeakTopic(studentId:string){
  const logs=await db.practiceLog.findMany({where:{studentId},orderBy:{date:'desc'},take:120});
  const map=new Map<string,{examType:string;subject:string;topic:string;total:number;correct:number;recent:number}>();
  for(const x of logs){
    if(!x.topic)continue;
    const key=[x.examType,x.subject,x.topic].join('|');
    const row=map.get(key)||{examType:x.examType,subject:x.subject,topic:x.topic,total:0,correct:0,recent:0};
    row.total+=x.total;
    row.correct+=x.correct;
    row.recent=Math.max(row.recent,x.date.getTime());
    map.set(key,row);
  }
  const ranked=[...map.values()].filter(x=>x.total>=5).map(x=>({...x,accuracy:x.correct/x.total}))
    .sort((a,b)=>a.accuracy-b.accuracy||b.recent-a.recent);
  if(ranked[0])return ranked[0];

  const action=await db.coachingAction.findFirst({where:{studentId,status:'ACTIVE',subject:{not:null}},orderBy:{periodEnd:'asc'}});
  if(action)return {examType:'GENEL',subject:action.subject!,topic:action.topic||'Genel Tekrar',total:0,correct:0,recent:0,accuracy:0};

  const progress=await db.topicProgress.findFirst({where:{studentId,completed:false},orderBy:{updatedAt:'desc'}});
  if(progress)return {examType:progress.examType,subject:progress.subject,topic:progress.topic,total:0,correct:0,recent:0,accuracy:0};
  return null;
}

export async function generateMicroGame(input:{
  studentId?:string|null;createdByUserId?:string|null;examType?:string|null;
  subject:string;topic:string;gradeLevel?:string|null;gameType?:GameType;
  sourcePolicy?:'MEB_ONLY'|'PREFER_MEB'|'ANY';
}){
  const day=new Date().toISOString().slice(0,10);
  const type:GameType=input.gameType||(['MATCH','WORD','CONNECTIONS','CROSSWORD'][Math.abs(hashCode(input.subject+'|'+input.topic+'|'+day))%4] as GameType);
  const generationKey=crypto.createHash('sha256').update([input.studentId||'GLOBAL',input.examType||'GENEL',input.subject,input.topic,type,day].join('|')).digest('hex');
  const existing=await db.gameContent.findUnique({where:{generationKey}});
  if(existing)return existing;

  const sourceKinds=(process.env.AUTO_GAME_SOURCE_KINDS||'MEB_TEXTBOOK,MEB_TYMM,MEB_OFFICIAL')
    .split(',').map(x=>x.trim()).filter(Boolean);
  const baseWhere={
    active:true,reviewStatus:'APPROVED',
    subject:{equals:input.subject,mode:'insensitive' as const},
    topic:{equals:input.topic,mode:'insensitive' as const},
    ...(input.examType&&input.examType!=='GENEL'?{examType:{equals:input.examType,mode:'insensitive' as const}}:{})
  };
  const policy=input.sourcePolicy||'PREFER_MEB';
  let questions=await db.questionBankItem.findMany({
    where:{...baseWhere,sourceKind:{in:sourceKinds}},
    orderBy:{createdAt:'desc'},take:16
  });
  if(policy==='ANY'||(policy==='PREFER_MEB'&&questions.length<2)){
    const fallback=await db.questionBankItem.findMany({
      where:baseWhere,
      orderBy:{createdAt:'desc'},take:16
    });
    const seen=new Set(questions.map(x=>x.id));
    questions=[...questions,...fallback.filter(x=>!seen.has(x.id))].slice(0,16);
  }

  const ai=await aiGame({
    subject:input.subject,topic:input.topic,examType:input.examType,gradeLevel:input.gradeLevel,gameType:type,source:questions
  });

  let generated:any;
  if(ai)generated={gameType:type,title:input.subject+' · '+input.topic+' Mikro Tekrar',payload:ai};
  else if(questions.length>=2){
    const safeType:GameType=(type==='CONNECTIONS'&&questions.length<8)?'MATCH':(type==='CROSSWORD'&&questions.length<4)?'WORD':type;
    generated=safeType==='WORD'?makeWord(questions,input.subject,input.topic):
      safeType==='CONNECTIONS'?makeConnections(questions,input.subject,input.topic):
      safeType==='CROSSWORD'?makeCrossword(questions,input.subject,input.topic):
      makeMatch(questions,input.subject,input.topic);
  }else{
    throw new Error('Bu ders ve konu için otomatik oyun oluşturacak yeterli doğrulanmış içerik bulunamadı.');
  }

  const mebQuestions=questions.filter(q=>sourceKinds.includes(q.sourceKind));
  const sourceMeta={
    sourceBasis:mebQuestions.length===questions.length&&questions.length?'MEB_OFFICIAL':
      mebQuestions.length?'MEB_PREFERRED':'APPROVED_QBANK',
    sourceKinds:[...new Set(questions.map(q=>q.sourceKind))],
    officialSourceUrls:[...new Set(questions.map(q=>q.officialSourceUrl).filter(Boolean))].slice(0,8)
  };
  const payload={...(generated.payload||{}),_meta:sourceMeta};

  return db.gameContent.create({data:{
    gameType:generated.gameType,examType:input.examType||null,subject:input.subject,topic:input.topic,
    title:generated.title,payload:payload as any,difficulty:'ORTA',active:true,
    createdByUserId:input.createdByUserId||null,studentId:input.studentId||null,
    generationSource:sourceMeta.sourceBasis==='MEB_OFFICIAL'?(ai?'AUTO_AI_MEB':'AUTO_MEB_QBANK'):(ai?'AUTO_AI_QBANK':'AUTO_QBANK'),generationKey
  }});
}

function hashCode(s:string){let h=0;for(let i=0;i<s.length;i++)h=((h<<5)-h)+s.charCodeAt(i)|0;return h}
