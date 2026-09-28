// Stable, versioned KEKS exercises. Answers stay on the server until submission.
export const MICRO_KINDS=['WORDS_5','LIT_MATCH_3','HISTORY_5','PROBLEM_3','WRONG_1'] as const;
export type MicroKind=typeof MICRO_KINDS[number];
export type MicroItem={id:string;prompt:string;answer:string;explanation:string;options?:string[]};
export type MicroPack={kind:MicroKind;title:string;subject:string;topic:string;minutes:number;items:MicroItem[]};
export type MicroProfile={gradeLevel?:string|null;academicTrack?:string|null};
export function microLevel(p:MicroProfile){
  const g=(p.gradeLevel||'').toLocaleLowerCase('tr-TR');
  if(/(^|\D)[1-4](\D|$)|ilkokul/.test(g))return 'primary';
  if(/(^|\D)[5-8](\D|$)|ortaokul|lgs/.test(g))return 'middle';
  return 'upper';
}
export function eligibleMicroKinds(p:MicroProfile):MicroKind[]{
  const g=(p.gradeLevel||'').toLocaleUpperCase('tr-TR');
  const track=(p.academicTrack||'').toLocaleUpperCase('tr-TR');
  if(/YDS|YÖKDİL|YOKDIL/.test(g))return ['WORDS_5'];
  if(!g.trim())return [];
  const level=microLevel(p);
  if(level==='primary')return /(^|\D)1(\D|$)/.test(g)?['PROBLEM_3']:['WORDS_5','PROBLEM_3'];
  if(level==='middle')return ['WORDS_5','PROBLEM_3',...(/(^|\D)8(\D|$)|LGS/.test(g)?['HISTORY_5' as const]:[])];
  if(/ALES|DGS/.test(g))return ['PROBLEM_3'];
  const kinds:MicroKind[]=['PROBLEM_3','HISTORY_5'];
  if(!/KPSS|EKPSS|AGS|ÖABT/.test(g))kinds.unshift('WORDS_5');
  if(/EDEBİYAT|EDEBIYAT|TÜRKÇE/.test(track)||(!/KPSS|EKPSS|AGS|ÖABT/.test(g)&&(!track||/EA|EŞİT|SÖZEL/.test(track))))kinds.push('LIT_MATCH_3');
  return kinds;
}
export function istanbulDay(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(now)}
export function microDayStart(now=new Date()){return new Date(istanbulDay(now)+'T00:00:00+03:00')}
const basicWords=[['book','kitap'],['water','su'],['school','okul'],['friend','arkadaş'],['house','ev'],['apple','elma'],['door','kapı'],['sun','güneş'],['tree','ağaç'],['bird','kuş'],['pencil','kalem'],['table','masa'],['milk','süt'],['bread','ekmek'],['window','pencere']];
const upperWords=[['evidence','kanıt'],['research','araştırma'],['improve','geliştirmek'],['require','gerektirmek'],['achieve','başarmak'],['increase','artmak'],['reduce','azaltmak'],['compare','karşılaştırmak'],['support','desteklemek'],['prevent','önlemek'],['reliable','güvenilir'],['method','yöntem'],['purpose','amaç'],['benefit','fayda'],['environment','çevre']];
const literature=[['Çalıkuşu','Reşat Nuri Güntekin'],['Kürk Mantolu Madonna','Sabahattin Ali'],['İnce Memed','Yaşar Kemal'],['Mai ve Siyah','Halit Ziya Uşaklıgil'],['Eylül','Mehmet Rauf'],['Araba Sevdası','Recaizade Mahmut Ekrem'],['İntibah','Namık Kemal'],['Felâtun Bey ile Râkım Efendi','Ahmet Mithat Efendi'],['Sergüzeşt','Samipaşazade Sezai']];
const history=[
  [['Mustafa Kemal’in Samsun’a çıkışı','19 Mayıs 1919'],['Amasya Genelgesi','22 Haziran 1919'],['Erzurum Kongresi’nin açılışı','23 Temmuz 1919'],['Sivas Kongresi’nin açılışı','4 Eylül 1919'],['TBMM’nin açılışı','23 Nisan 1920']],
  [['Saltanatın kaldırılması','1 Kasım 1922'],['Lozan Antlaşması’nın imzalanması','24 Temmuz 1923'],['Cumhuriyetin ilanı','29 Ekim 1923'],['Halifeliğin kaldırılması','3 Mart 1924'],['Türk Medeni Kanunu’nun kabulü','17 Şubat 1926']],
  [['Birinci İnönü Muharebesi’nin sona ermesi','10 Ocak 1921'],['İkinci İnönü Muharebesi’nin sona ermesi','1 Nisan 1921'],['Sakarya Meydan Muharebesi’nin sona ermesi','13 Eylül 1921'],['Büyük Taarruz’un başlaması','26 Ağustos 1922'],['Mudanya Ateşkes Antlaşması','11 Ekim 1922']]
];
function rotate<T>(a:T[],offset:number){const n=((offset%a.length)+a.length)%a.length;return [...a.slice(n),...a.slice(0,n)]}
export function buildMicroPack(kind:MicroKind,level:string,variant:number):MicroPack{
  const v=Math.abs(variant)%10000;
  if(kind==='WORDS_5'){
    const rows=(level==='primary'||level==='middle'?basicWords:upperWords).slice((v%3)*5,(v%3)*5+5);
    return {kind,title:'5 kelime',subject:'İngilizce',topic:'Kelime anlamı',minutes:3,items:rows.map(([word,answer],i)=>({id:String(i),prompt:word+' kelimesinin Türkçe karşılığını seç.',answer,options:rotate(rows.map(x=>x[1]),i+v+1),explanation:word+' → '+answer+'.'}))};
  }
  if(kind==='LIT_MATCH_3'){
    const rows=literature.slice((v%3)*3,(v%3)*3+3);
    return {kind,title:'3 edebiyat eşleştirmesi',subject:'Türk Dili ve Edebiyatı',topic:'Yazar–eser',minutes:4,items:rows.map(([work,answer],i)=>({id:String(i),prompt:work+' eserini yazarıyla eşleştir.',answer,options:rotate(rows.map(x=>x[1]),v+i+1),explanation:work+' — '+answer+'.'}))};
  }
  if(kind==='HISTORY_5'){
    const rows=history[v%3];
    return {kind,title:'5 tarih kronolojisi',subject:'Tarih',topic:'Millî Mücadele ve Cumhuriyet',minutes:4,items:rotate(rows.map(([event,date],i)=>({id:String(i),prompt:event,answer:String(i+1),options:['1','2','3','4','5'],explanation:date+' · Kronolojik sıra: '+(i+1)})),v%4+1)};
  }
  if(kind==='PROBLEM_3'){
    const a=2+v%7,b=2+(v*3)%7;
    const rows=level==='primary'?[
      [`Kutuda ${a} kalem var. ${b} kalem daha ekleniyor. Toplam kaç kalem olur?`,a+b,`${a} + ${b} = ${a+b}`],
      [`${a+b} elmanın ${b} tanesi yeniyor. Kaç elma kalır?`,a,`${a+b} − ${b} = ${a}`],
      [`Bir rafta ${a} kitap, diğer rafta ${a+2} kitap var. Toplam kaç kitap var?`,2*a+2,`${a} + ${a+2} = ${2*a+2}`]
    ]:level==='middle'?[
      [`${a} kutunun her birinde ${b} kalem var. Toplam kaç kalem var?`,a*b,`${a} × ${b} = ${a*b}`],
      [`${a*b} kitap ${b} rafa eşit dağıtılıyor. Her rafta kaç kitap olur?`,a,`${a*b} ÷ ${b} = ${a}`],
      [`Bir ürün ${a*20} TL. %25 indirim tutarı kaç TL olur?`,a*5,`${a*20} × 25 / 100 = ${a*5}`]
    ]:[
      [`Bir ürün %20 indirimle ${a*80} TL'ye satılıyor. İndirimsiz fiyatı kaç TL'dir?`,a*100,`İlk fiyat × 0,80 = ${a*80}; ilk fiyat ${a*100} TL.`],
      [`Bir araç saatte ${a*10} km hızla ${b} saat gidiyor. Kaç km yol alır?`,a*b*10,`Yol = hız × süre = ${a*10} × ${b} = ${a*b*10} km.`],
      [`İki sayının toplamı ${3*a}, biri diğerinin iki katı. Küçük sayı kaçtır?`,a,`x + 2x = ${3*a}; x = ${a}.`]
    ];
    return {kind,title:'3 problem',subject:'Matematik',topic:'Kısa problemler',minutes:5,items:rows.map(([prompt,answer,explanation],i)=>({id:String(i),prompt:String(prompt),answer:String(answer),explanation:String(explanation)}))};
  }
  return {kind,title:'1 yanlış soru tekrar',subject:'Tekrar',topic:'Kişisel yanlışlar',minutes:3,items:[]};
}
export function publicMicroPack(pack:MicroPack){return {...pack,items:pack.items.map(({answer,explanation,...item})=>item)}}
export function gradeMicroPack(pack:MicroPack,answers:Record<string,string>){
  const items=pack.items.map(item=>{const answer=(answers[item.id]||'').trim();return {id:item.id,prompt:item.prompt,answer,correctAnswer:item.answer,explanation:item.explanation,correct:answer===item.answer,blank:!answer}});
  const correct=items.filter(x=>x.correct).length,blank=items.filter(x=>x.blank).length;
  return {items,correct,blank,wrong:items.length-correct-blank,total:items.length};
}
export function microSummary(logs:Array<{date:Date|string;payload:unknown}>,now=new Date()){
  const completed=logs.flatMap(log=>{const p=log.payload as Record<string,unknown>|null;return p?.type==='MICRO_RESULT'?[{...p,date:log.date}]:[]}) as Array<Record<string,unknown>&{date:Date|string}>;
  const today=completed.filter(x=>istanbulDay(new Date(x.date))===istanbulDay(now));
  const sum=(rows:typeof completed,key:string)=>rows.reduce((n,x)=>n+(Number(x[key])||0),0);
  return {sessions:completed.length,today:today.length,correct:sum(completed,'correct'),wrong:sum(completed,'wrong'),blank:sum(completed,'blank'),minutes:Math.round(sum(completed,'durationSeconds')/60),recent:completed.slice(0,7).map(x=>({title:String(x.title),date:new Date(x.date).toISOString(),correct:Number(x.correct),total:Number(x.total)}))};
}
