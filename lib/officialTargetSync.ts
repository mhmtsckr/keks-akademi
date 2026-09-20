import { db } from '@/lib/db';

const KPSS_RESULTS_PAGE='https://www.osym.gov.tr/kpss-20261-bazi-kamu-kurum-ve-kuruluslarin-kadro-ve-pozisyonlarina-yerlestirme-sonuclarina-iliskin-sayisal-bilgiler';
const AGS_PDF='https://personel.meb.gov.tr/meb_iys_dosyalar/2026_01/09094622_milli_egitim_akademisi_hazirlik_egitimi_basvuru_duyurusu_ocak_20261.pdf';

function tr(s:string){return s.toLocaleUpperCase('tr-TR').replace(/\s+/g,' ').trim()}
function num(s:string){const n=Number(s.replace(/\./g,'').replace(',','.'));return Number.isFinite(n)?n:null}
async function pdfText(url:string){
  const r=await fetch(url,{headers:{'user-agent':'KEKS-Akademi/1.0'},cache:'no-store'});
  if(!r.ok)throw new Error('HTTP '+r.status);
  const bytes=new Uint8Array(await r.arrayBuffer());
  const mod:any=await import('pdf-parse');const parse=mod.default||mod;
  const out=await parse(Buffer.from(bytes));return String(out.text||'').replace(/\r/g,'');
}
function abs(base:string,href:string){try{return new URL(href,base).toString()}catch{return href}}
async function kpssPdf(level:string){
  const r=await fetch(KPSS_RESULTS_PAGE,{headers:{'user-agent':'KEKS-Akademi/1.0'},cache:'no-store'});
  if(!r.ok)throw new Error('ÖSYM sonuç sayfası okunamadı.');
  const html=await r.text();
  const links=[...html.matchAll(/href=["']([^"']+\.pdf[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map(m=>({url:abs(KPSS_RESULTS_PAGE,m[1]),label:m[2].replace(/<[^>]+>/g,' ').replace(/\s+/g,' ')}));
  const want=level==='LISANS'?'LİSANS':level==='ONLISANS'?'ÖN LİSANS':'ORTAÖĞRETİM';
  const hit=links.find(x=>tr(x.label).includes(want));
  if(!hit)throw new Error('ÖSYM '+want+' puan tablosu bulunamadı.');
  return hit.url;
}

function parseKpssRow(text:string,target:any){
  const lines=text.split('\n').map(x=>x.replace(/\s+/g,' ').trim()).filter(Boolean);
  const code=String(target.programCode||'').trim();
  let line=code?lines.find(x=>x.startsWith(code+' ')):undefined;
  if(!line){
    const inst=tr(target.institutionName||'');
    const title=tr(target.departmentName||'');
    line=lines.find(x=>tr(x).includes(inst)&&(!title||tr(x).includes(title)));
  }
  if(!line)return null;
  const m=line.match(/^(\d{6,})\s+(.+?)\s+(\d+)\s+(\d+)\s+(\d+)\s+([0-9]+,[0-9]+)\s+([0-9]+,[0-9]+)$/);
  if(!m)return null;
  return {
    programCode:m[1],
    label:m[2],
    appointmentCount:Number(m[3]),
    placedCount:Number(m[4]),
    officialMinScore:num(m[6]),
    officialMaxScore:num(m[7])
  };
}

function parseAgsRow(text:string,target:any){
  const lines=text.split('\n').map(x=>x.replace(/\s+/g,' ').trim()).filter(Boolean);
  const wanted=tr(target.departmentName||target.institutionName||'');
  for(let i=0;i<lines.length;i++){
    const x=lines[i];
    if(!wanted||!tr(x).includes(wanted))continue;
    const merged=[x,lines[i+1]||'',lines[i+2]||''].join(' ').replace(/\s+/g,' ');
    const scoreType=(merged.match(/MEB-AGS-P[123](?:-\d{2})?/i)||[])[0];
    const before=scoreType?merged.slice(0,merged.indexOf(scoreType)):merged;
    const nums=[...before.matchAll(/\b(\d{1,5})\b/g)].map(m=>Number(m[1]));
    const quota=nums.length?nums[nums.length-1]:null;
    if(scoreType&&quota!=null)return {appointmentCount:quota,placedCount:null,officialScoreType:scoreType,officialEligibilityScore:50};
  }
  return null;
}

export async function syncOfficialTarget(targetId:string){
  const target=await db.studentTarget.findUnique({where:{id:targetId}});
  if(!target)throw new Error('Hedef bulunamadı.');

  if(target.examLevel==='KPSS'){
    if(!target.qualificationLevel)throw new Error('KPSS öğrenim düzeyi gerekli.');
    const url=await kpssPdf(target.qualificationLevel);
    const text=await pdfText(url);
    const row=parseKpssRow(text,target);
    const update:any={
      source:'OSYM',sourceUrl:url,syncedAt:new Date(),officialPeriod:'KPSS-2026/1',
      officialNets:null,officialNetsStatus:'NOT_PUBLISHED'
    };
    if(row){
      Object.assign(update,row,{score:row.officialMinScore,syncStatus:'SYNCED',
        sourceSnapshot:{authority:'ÖSYM',period:'KPSS-2026/1',url,row,nets:'ÖSYM yerleştirme tablolarında atanan kişilerin test bazlı netleri yayımlanmamaktadır.'}});
    }else{
      Object.assign(update,{syncStatus:'NEEDS_VERIFICATION',
        sourceSnapshot:{authority:'ÖSYM',period:'KPSS-2026/1',url,message:'Hedef kadro otomatik eşleştirilemedi. Kesin eşleşme için ÖSYM Program Kodu girin.',nets:'Resmî net verisi yayımlanmamaktadır.'}});
    }
    return db.studentTarget.update({where:{id:target.id},data:update});
  }

  if(target.examLevel==='AGS_OBAT'){
    const text=await pdfText(AGS_PDF);
    const row=parseAgsRow(text,target);
    const update:any={
      source:'MEB',sourceUrl:AGS_PDF,syncedAt:new Date(),officialPeriod:'Ocak 2026',
      officialNets:null,officialNetsStatus:'NOT_PUBLISHED'
    };
    if(row){
      Object.assign(update,row,{syncStatus:'SYNCED',
        sourceSnapshot:{authority:'MEB Personel Genel Müdürlüğü',period:'Ocak 2026',url:AGS_PDF,row,note:'Bu değer alan kontenjanı ve başvuru için gerekli resmî MEB-AGS eşik puanıdır; fiilî son yerleşen aday puanı yayımlanırsa ayrıca senkronlanmalıdır.',nets:'MEB duyurusunda yerleşen adayın AGS/ÖABT test bazlı netleri yayımlanmamaktadır.'}});
    }else{
      Object.assign(update,{syncStatus:'NEEDS_VERIFICATION',
        sourceSnapshot:{authority:'MEB Personel Genel Müdürlüğü',period:'Ocak 2026',url:AGS_PDF,message:'Öğretmenlik alanı resmî listede otomatik eşleştirilemedi.',nets:'Resmî net verisi yayımlanmamaktadır.'}});
    }
    return db.studentTarget.update({where:{id:target.id},data:update});
  }
  return target;
}
