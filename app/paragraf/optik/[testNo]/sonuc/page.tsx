import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {parseOpticalTest,gradeOptical} from '@/lib/paragrafOptik';
import {buildOpticalWrongLearningPlan} from '@/lib/paragrafWrongLearning';
import {RecoveryActions} from './RecoveryActions';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'KEKS Paragraf | Test Sonuç ve Konu Analizi',robots:{index:false,follow:false,noarchive:true}};
type Props={params:Promise<{testNo:string}>;searchParams:Promise<{c?:string|string[]}>};
const navy='#092c58',gold='#d4a231',light='#f4f7fb';
export default async function ResultPage({params,searchParams}:Props){
 const [{testNo},query]=await Promise.all([params,searchParams]);
 const test=parseOpticalTest(testNo);
 if(test===null)notFound();
 const encoded=typeof query.c==='string'?query.c:'';
 const result=gradeOptical(test,encoded);
 if(!result)return <main style={{fontFamily:'Arial,sans-serif',padding:32,background:light,minHeight:'100vh'}}>
  <h1>Test yanıtları bulunamadı</h1><p>Test {testNo} için 30 cevabı dijital optiğe girmen gerekiyor.</p>
  <a href={'/paragraf/optik/'+testNo}>Dijital optiğe dön</a>
 </main>;
 const recovery=buildOpticalWrongLearningPlan(test,encoded);
 const statistic=[['Doğru',result.correct,'#e7f5e9'],['Yanlış',result.wrong,'#ffeded'],['Boş',result.blank,'#f2f2f2'],['Net',result.net.toLocaleString('tr-TR',{maximumFractionDigits:2}),'#e8f2ff']];
 return <main style={{fontFamily:'Arial,sans-serif',background:light,minHeight:'100vh',color:navy,padding:'16px 12px 56px'}}>
  <article style={{maxWidth:1000,margin:'auto'}}>
   <header style={{background:navy,color:'#fff',padding:'24px',borderRadius:16,borderBottom:'5px solid '+gold}}>
    <div style={{color:'#f7d983',fontWeight:800,letterSpacing:2}}>KEKS AKADEMİ · PARAGRAF DERSİ</div>
    <h1>Test {testNo} · Dijital Optik Sonucun</h1>
    <p>Bu sonuç, QR kodundaki 30 cevaba göre hesaplandı. Net hesabında dört yanlış bir doğruyu götürür.</p>
   </header>
   <div style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:8,marginTop:17}}>
    {statistic.map(([label,value,bg])=><div key={label} style={{background:String(bg),border:'1px solid #ddd',borderRadius:13,padding:'17px 8px',textAlign:'center'}}>
     <div style={{fontSize:12,fontWeight:700}}>{label}</div>
     <div style={{fontSize:'clamp(22px,4vw,32px)',fontWeight:900,marginTop:6}}>{value}</div>
    </div>)}
   </div>
   <section style={{background:'#fff',padding:20,borderRadius:15,marginTop:18}}>
    <h2>Kodladığın Cevaplar · 1–30</h2>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(126px,1fr))',gap:8}}>
     {result.details.map(d=><div key={d.number} style={{display:'flex',justifyContent:'space-between',padding:10,borderRadius:8,
      background:d.status==='DOĞRU'?'#eef8f0':d.status==='YANLIŞ'?'#fff0ef':'#f3f5f7'}}>
      <strong>{String(d.number).padStart(2,'0')}.</strong>
      <span>{d.chosen==='X'?'Boş':d.chosen}</span>
      <strong style={{color:d.status==='DOĞRU'?'#166b3e':d.status==='YANLIŞ'?'#ad2828':'#666'}}>{d.status==='DOĞRU'?'✓':d.status==='YANLIŞ'?'✕':'–'}</strong>
     </div>)}
    </div>
   </section>
   <section style={{background:'#fff',padding:20,borderRadius:15,marginTop:18}}>
    <h2>Konu Analizi ve Çalışma Önerileri</h2>
    {result.recommendations.length===0?<p>Harika! Bu testte yanlış veya boş soru yok. Öğrendiklerini kalıcı kılmak için haftalık kısa tekrar yap.</p>:<p>Öncelikle yanlış yaptığın soru türlerini çalış. Aşağıda her konuda kaç soruyu yanlış veya boş bıraktığını görebilirsin.</p>}
    {result.topics.map(t=><div key={t.topic} style={{borderBottom:'1px solid #e5e9ef',display:'flex',gap:10,alignItems:'center',padding:'12px 0',flexWrap:'wrap'}}>
     <div style={{fontWeight:700,flex:'1 1 180px'}}>{t.topic}</div>
     <div style={{fontSize:13,flex:'1 1 180px'}}>{t.correct}/{t.total} doğru · {t.wrong} yanlış · {t.blank} boş</div>
     <div style={{fontWeight:800,color:t.wrong?'#ab2b25':t.blank?'#ad7420':'#187244'}}>{t.wrong?'Çalışılması önerilir':t.blank?'Boşları tamamla':'İyi'}</div>
    </div>)}
    {result.recommendations.length>0?<div style={{padding:'18px 0 0',fontSize:15}}>
     <strong>Öncelikli çalışma planın:</strong>
     <ol>{result.recommendations.map(x=><li key={x.topic} style={{margin:'9px 0'}}>
      <strong>{x.topic}</strong> — {x.advice}. {x.wrong>0?'Yanlış soru(lar): '+x.questions.join(', '):'Boş bırakılanları yeniden çöz.'}
     </li>)}</ol>
    </div>:null}
   </section>
   {recovery&&<RecoveryActions testNo={test} encoded={encoded} missed={recovery.missed} priorities={recovery.priorities}/>}
   <section style={{background:'#fff',padding:20,borderRadius:15,marginTop:18}}>
    <h2>Yanlış soruların doğru cevapları ve öğretici çözümleri</h2>
    {result.details.filter(d=>d.status!=='DOĞRU').length===0?<p>İncelenecek yanlış veya boş soru bulunmuyor.</p>:<div style={{display:'grid',gap:10}}>
     {result.details.filter(d=>d.status!=='DOĞRU').map(d=><div key={d.number} style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap',borderBottom:'1px solid #ddd',padding:'10px 0'}}>
      <span><strong>{d.number}. soru</strong> · {d.topic} · Senin cevabın: {d.chosen==='X'?'Boş':d.chosen} · Doğru cevap: <strong>{d.answer}</strong></span>
      {d.solutionUrl?<a href={d.solutionUrl} style={{color:'#0759a5',fontWeight:700}}>Şık şık öğretici çözümü aç</a>:null}
     </div>)}
    </div>}
   </section>
   <div style={{padding:'25px 4px',display:'flex',justifyContent:'space-between',gap:15,flexWrap:'wrap'}}>
    <a href={'/paragraf/optik/'+testNo} style={{color:navy}}>← Optiğe dön / yeni deneme</a>
    {test<50?<a href={'/paragraf/optik/'+String(test+1).padStart(2,'0')} style={{color:navy}}>Sonraki Test {String(test+1).padStart(2,'0')} →</a>:null}
   </div>
   <p style={{fontSize:12,color:'#69798d'}}>Uyarı: QR bağlantısını paylaştığın kişiler kodladığın cevapları görebilir. QR sonucu yalnız bağlantı üzerinden görüntülenir; kişisel tekrar listesine aktarım için yukarıdaki kaydetme işlemini öğrenci hesabınla onaylaman gerekir.</p>
  </article>
 </main>;
}
