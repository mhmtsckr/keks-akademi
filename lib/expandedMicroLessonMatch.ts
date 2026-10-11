import {EXPANDED_MICRO_LESSONS} from './expandedMicroLessons';
import type {MicroLesson} from './bankFreeMicroLessons';
function norm(s:string){
  return s.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[‐‑–—]/g,'-').replace(/\s+/g,' ').trim();
}
const entry=(id:string)=>EXPANDED_MICRO_LESSONS.find(x=>x.id===id)||null;

// Do not equate a broad subject or "Paragraf"/"Tarih" topic with a specific outcome.
// Every implicit match below requires a specific named skill either in the topic or prompt.
export function findExpandedMicroLesson(input:{subject:string;topic:string;prompt?:string|null}):MicroLesson|null{
 const subject=norm(input.subject);
 const topic=norm(input.topic);
 const prompt=norm(input.prompt||'');
 const has=(s:string,r:RegExp)=>r.test(s);
 if(subject==='turkce'){
   if(has(topic,/(?:ana dusunce|ana fikir)/)||has(prompt,/(?:ana dusunce|ana fikir)/))
     return entry('tur-paragraph-main-idea-v1');
   if(has(topic,/(?:neden.*sonuc|amac.*sonuc|cumlede anlam)/)&&has(topic+' '+prompt,/(?:neden|amac|sebep|sonuc)/))
     return entry('tur-cause-purpose-v1');
   if(has(prompt,/(?:neden.sonuc|amac.sonuc|cumlenin amaci|nedeni nedir)/))
     return entry('tur-cause-purpose-v1');
 }
 if(subject==='turk dili ve edebiyati'){
   if(has(topic,/(?:benzetme|kisislestirme|soz sanatlari)/)||has(prompt,/(?:benzetme|kisislestirme|soz sanati)/))
     return entry('lit-figures-of-speech-v1');
 }
 if(subject==='tarih'){
   if(has(topic,/(?:milli mucadele kronoloji|kongrelerin sirasi)/)
     ||(has(topic,/(?:milli mucadele|milli mücadele|kurtulus savasi)/)&&has(prompt,/(?:once|sonra|sira|kronoloji|tarih)/))
     ||has(prompt,/(?:amasya.*erzurum.*sivas|erzurum.*sivas.*kongre|milli mucadele.*sirala)/))
     return entry('hist-national-struggle-order-v1');
 }
 if(subject==='cografya'){
   if(has(topic,/(?:enlem|boylam|koordinat)/)||has(prompt,/(?:enlem|boylam|paralel.*meridyen|koordinat)/))
     return entry('geo-latitude-longitude-v1');
 }
 if(subject==='fizik'){
   if(has(topic,/(?:temel.*buyukluk|turetilmis.*buyukluk)/)
      ||has(prompt,/(?:temel buyukluk|turetilmis buyukluk|si temel|birim sisteminde)/))
     return entry('physics-quantities-v1');
 }
 if(subject==='kimya'){
   if(has(topic,/(?:element.*bilesik|saf madde|karisimlar|maddenin siniflandirilmasi)/)
       ||has(prompt,/(?:element.*bilesik|saf madde|karisim mi|bilesik mi)/))
     return entry('chem-element-compound-mixture-v1');
 }
 if(subject==='biyoloji'){
   if(has(topic,/(?:organel|hucresel yapilar)/)||has(prompt,/(?:organel|ribozom|mitokondri|kloroplast)/))
     return entry('bio-organel-functions-v1');
 }
 if(subject==='egitim bilimleri'){
   if(has(topic,/(?:gecerlik|guvenirlik)/)
      ||has(prompt,/(?:gecerlik|guvenirlik|olcme aracinin tutarliligi)/))
     return entry('edu-validity-reliability-v1');
 }
 return null;
}
