import crypto from 'node:crypto';

export type StudioType =
  | 'FLASHCARDS'
  | 'QUIZ'
  | 'SLIDES'
  | 'INFOGRAPHIC'
  | 'AUDIO_SCRIPT'
  | 'VIDEO_LESSON'
  | 'SIMILAR_QUESTIONS';

function decodeXml(s:string){
  return s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
}

function cleanText(s:string){
  return s.replace(/\r/g,'').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim();
}

export async function extractDocumentText(bytes:Uint8Array,mimeType:string,fileName:string){
  const lower=fileName.toLowerCase();
  if(mimeType.startsWith('text/')||lower.endsWith('.txt')||lower.endsWith('.md')) return cleanText(new TextDecoder().decode(bytes));
  if(mimeType==='application/pdf'||lower.endsWith('.pdf')){
    const mod:any=await import('pdf-parse');
    const pdfParse=mod.default||mod;
    const out=await pdfParse(Buffer.from(bytes));
    return cleanText(String(out.text||''));
  }
  if(mimeType.includes('wordprocessingml')||lower.endsWith('.docx')){
    const mammoth:any=await import('mammoth');
    const out=await mammoth.extractRawText({buffer:Buffer.from(bytes)});
    return cleanText(String(out.value||''));
  }
  if(mimeType.includes('presentationml')||lower.endsWith('.pptx')){
    const JSZip=(await import('jszip')).default;
    const zip=await JSZip.loadAsync(bytes);
    const slideNames=Object.keys(zip.files).filter(x=>/^ppt\/slides\/slide\d+\.xml$/.test(x)).sort((a,b)=>{
      const na=Number(a.match(/slide(\d+)/)?.[1]||0), nb=Number(b.match(/slide(\d+)/)?.[1]||0); return na-nb;
    });
    const parts:string[]=[];
    for(const name of slideNames){
      const xml=await zip.file(name)!.async('text');
      const texts=[...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map(m=>decodeXml(m[1]));
      if(texts.length) parts.push(texts.join(' '));
    }
    return cleanText(parts.join('\n\n'));
  }
  return '';
}

export function sha256(bytes:Uint8Array){return crypto.createHash('sha256').update(bytes).digest('hex');}
export function contentFingerprint(uploadHash:string,type:string,studentId:string|null){return crypto.createHash('sha256').update([uploadHash,type,studentId||'none'].join('|')).digest('hex');}

function sentences(text:string){
  return cleanText(text).split(/(?<=[.!?])\s+|\n+/).map(x=>x.trim()).filter(x=>x.length>=18);
}
function terms(text:string){
  const stop=new Set(['ve','veya','ile','için','gibi','olan','olarak','bir','bu','şu','çok','daha','ise','da','de','mi','mı','mu','mü','the','and','for','that','with']);
  const words=text.toLocaleLowerCase('tr-TR').match(/[a-zçğıöşü0-9]{4,}/gi)||[];
  const counts=new Map<string,number>();
  for(const w of words){if(!stop.has(w))counts.set(w,(counts.get(w)||0)+1)}
  return [...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,18).map(x=>x[0]);
}
function headings(text:string){
  const lines=text.split('\n').map(x=>x.trim()).filter(Boolean);
  const cand=lines.filter(x=>x.length<90 && x.length>3 && (!/[.!?]$/.test(x)||/^\d+[.)]/.test(x)));
  return [...new Set(cand)].slice(0,12);
}
function keySentences(text:string,limit=12){
  const ss=sentences(text), ts=terms(text);
  return ss.map((s,i)=>({s,i,score:ts.reduce((a,t)=>a+(s.toLocaleLowerCase('tr-TR').includes(t)?1:0),0)}))
    .sort((a,b)=>b.score-a.score||a.i-b.i).slice(0,limit).sort((a,b)=>a.i-b.i).map(x=>x.s);
}
function questionCandidates(text:string){
  const ls=text.split(/\n+/).map(x=>x.trim()).filter(Boolean);
  return ls.filter(x=>/^(\d+[.)]|soru\s*\d+)/i.test(x)||x.endsWith('?')).slice(0,40);
}
function titleFrom(text:string){
  return headings(text)[0]||keySentences(text,1)[0]?.slice(0,70)||'KEKS Öğrenme İçeriği';
}
function scorePayload(payload:any){
  const raw=JSON.stringify(payload);
  const size=Math.min(35,raw.length/300);
  const unique=new Set(raw.toLocaleLowerCase('tr-TR').match(/[a-zçğıöşü]{5,}/gi)||[]).size;
  const diversity=Math.min(35,unique/2);
  const structure=Array.isArray(payload?.items)?20:Array.isArray(payload?.slides)?20:Array.isArray(payload?.blocks)?18:12;
  const completeness=raw.length>800?10:raw.length>350?7:3;
  return Math.round(Math.min(100,size+diversity+structure+completeness));
}
function chooseBest(candidates:any[]){return candidates.map(payload=>({payload,score:scorePayload(payload)})).sort((a,b)=>b.score-a.score)[0];}

function flashcards(text:string,deep=false){
  const ks=keySentences(text,deep?18:12), ts=terms(text);
  const items=ks.slice(0,deep?14:9).map((s,i)=>({front:i<ts.length?ts[i].replace(/^./,c=>c.toLocaleUpperCase('tr-TR'))+' nedir / neden önemlidir?':'Bu bilgiyi açıklayın.',back:s,difficulty:i%3===0?'kolay':i%3===1?'orta':'zor'}));
  return {mode:deep?'comprehensive':'concise',items};
}
function quiz(text:string,deep=false){
  const ks=keySentences(text,deep?22:14);
  const ts=terms(text);
  const pool=[...ks];
  const items=ks.slice(0,deep?12:8).map((s,i)=>{
    const key=ts[i%Math.max(ts.length,1)]||'kavram';
    const distractors=pool.filter(x=>x!==s).slice((i+1)%Math.max(1,pool.length-1)).concat(pool.filter(x=>x!==s)).slice(0,3);
    while(distractors.length<3)distractors.push('Bu açıklama verilen içerikte doğrudan desteklenmemektedir.');
    return {
      prompt:`Metne göre “${key}” kavramını en doğru açıklayan seçenek hangisidir?`,
      options:{A:s,B:distractors[0],C:distractors[1],D:distractors[2]},
      correctAnswer:'A',
      explanation:s,
      concept:key,
      difficulty:i%3===0?'kolay':i%3===1?'orta':'zor'
    };
  });
  return {mode:deep?'comprehensive':'concise',items};
}
function slides(text:string,deep=false){
  const hs=headings(text), ks=keySentences(text,deep?24:14);
  const count=deep?Math.min(12,Math.max(6,hs.length||8)):Math.min(8,Math.max(5,hs.length||6));
  const slides=[] as any[];
  slides.push({title:titleFrom(text),bullets:['Kaynak içeriğin yapılandırılmış özeti'],notes:'Bu sunum yüklenen kaynaktan otomatik hazırlanmıştır.'});
  for(let i=1;i<count;i++){
    const start=(i-1)*Math.ceil(ks.length/Math.max(1,count-1));
    const chunk=ks.slice(start,start+3);
    if(!chunk.length) break;
    slides.push({title:hs[i-1]||`Bölüm ${i}`,bullets:chunk,notes:chunk.join(' ')});
  }
  return {mode:deep?'comprehensive':'concise',slides};
}
function infographic(text:string,deep=false){
  const ts=terms(text).slice(0,deep?10:7), ks=keySentences(text,deep?10:7);
  return {mode:deep?'comprehensive':'concise',headline:titleFrom(text),blocks:ts.map((t,i)=>({title:t.replace(/^./,c=>c.toLocaleUpperCase('tr-TR')),body:ks[i]||'Kaynak içerikte öne çıkan kavram.'}))};
}
function audioScript(text:string,deep=false){
  const ks=keySentences(text,deep?18:10);
  const intro=`Merhaba. Bu anlatımda ${titleFrom(text)} konusunu çalışacağız.`;
  const body=ks.map((x,i)=>`${i+1}. ${x}`).join(' ');
  const outro='Şimdi ana kavramları kendi cümlelerinle tekrar et ve ardından kısa bir test çöz.';
  return {mode:deep?'detailed':'quick',estimatedMinutes:deep?10:5,script:[intro,body,outro].join(' ')};
}
function videoLesson(text:string,deep=false){
  const deck=slides(text,deep);
  return {mode:deep?'detailed':'quick',slides:deck.slides.map((s:any,i:number)=>({...s,scene:i+1,narration:s.notes||s.bullets.join(' ')}))};
}
function similarQuestions(text:string,deep=false){
  const qs=questionCandidates(text);
  const base=qs.length?qs:keySentences(text,deep?10:6);
  const keyTerms=terms(text);
  const items=base.slice(0,deep?10:6).map((q,i)=>{
    const concept=keyTerms[i%Math.max(1,keyTerms.length)]||'temel kavram';
    const difficulty=i%3===0?'kolay':i%3===1?'orta':'zor';
    return {
      sourceStyle:q,
      measuredConcept:concept,
      difficulty,
      generated:`Benzer kazanım sorusu ${i+1}: ${concept} bilgisini, kaynak sorudaki çözüm mantığına benzeyen fakat farklı bağlam ve veriler içeren yeni bir örnekte uygulayın. Soru düzeyi: ${difficulty}.`,
      generationRule:'Aynı kazanım + farklı bağlam + farklı veri + özgün ifade',
      note:'Kaynak soru kopyalanmamış; yalnız ölçme mantığı ve kazanım örnek alınmıştır.'
    };
  });
  return {mode:deep?'varied':'focused',items};
}

export function generateStudioContent(type:StudioType,text:string){
  const safe=text.trim();
  if(!safe) throw new Error('Bu dosyadan üretim yapılabilecek metin çıkarılamadı.');
  const builders:Record<StudioType,(t:string,d:boolean)=>any>={
    FLASHCARDS:flashcards,QUIZ:quiz,SLIDES:slides,INFOGRAPHIC:infographic,AUDIO_SCRIPT:audioScript,VIDEO_LESSON:videoLesson,SIMILAR_QUESTIONS:similarQuestions
  };
  const best=chooseBest([builders[type](safe,false),builders[type](safe,true)]);
  return {title:`${titleFrom(safe)} · ${type}`,payload:best.payload,qualityScore:best.score};
}

export function analyzeSource(text:string,fileName:string){
  const qs=questionCandidates(text);
  return {
    title:titleFrom(text||fileName),
    headings:headings(text),
    keyTerms:terms(text),
    questionCount:qs.length,
    isQuestionSource:qs.length>=2 || /soru|deneme|test/i.test(fileName),
    suggestedTypes:qs.length>=2?['SIMILAR_QUESTIONS','QUIZ','FLASHCARDS']:['FLASHCARDS','SLIDES','INFOGRAPHIC','AUDIO_SCRIPT','VIDEO_LESSON','QUIZ']
  };
}
