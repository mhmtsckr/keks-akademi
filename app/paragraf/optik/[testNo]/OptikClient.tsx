'use client';
import {useState} from 'react';
import type {Mark} from '@/lib/paragrafOptik';
const LABELS=['A','B','C','D','E'] as const;
const navy='#0b2c57',gold='#d5a02d',light='#f6f9fc';
const card:React.CSSProperties={border:'1px solid #d5a02d',borderRadius:16,padding:18,background:'#fff'};
export default function ParagrafOptikClient({testNo}:{testNo:string}){
 const [answers,setAnswers]=useState<Mark[]>(Array(30).fill('X'));
 const [finished,setFinished]=useState(false);
 const [confirmation,setConfirmation]=useState(false);
 const resultCode=answers.join('');
 const resultUrl='/paragraf/optik/'+testNo+'/sonuc?c='+resultCode;
 const qrUrl='/paragraf/optik/'+testNo+'/qr?c='+resultCode;
 const done=answers.filter(a=>a!=='X').length;
 function select(i:number,letter:Mark){
  setFinished(false);setConfirmation(false);
  setAnswers(prev=>prev.map((v,j)=>i===j?(v===letter?'X':letter):v));
 }
 return <main style={{fontFamily:'Arial, sans-serif',background:light,minHeight:'100vh',color:navy,padding:'16px 12px 56px'}}>
  <article style={{maxWidth:1000,margin:'auto'}}>
   <header style={{background:navy,color:'#fff',borderRadius:16,padding:'24px 20px',borderBottom:'5px solid '+gold}}>
    <div style={{fontSize:14,fontWeight:800,letterSpacing:2,color:'#f5d27e'}}>KEKS AKADEMİ</div>
    <h1 style={{fontSize:28,margin:'9px 0'}}>Paragraf Dersi · Dijital Optik</h1>
    <div style={{fontSize:17}}>TEST {testNo} · 30 soru · {done} kodlandı / {30-done} boş</div>
    <p style={{fontSize:13,color:'#e3ebf5',lineHeight:1.6}}>TYT · AYT · DGS · MSÜ · ALES · AGS · KPSS | Kâğıttaki cevaplarını işaretle, sonra Testi Bitir.</p>
   </header>
   <nav style={{display:'flex',justifyContent:'space-between',padding:'18px 2px',gap:12}}>
     {Number(testNo)>1?<a href={'/paragraf/optik/'+String(Number(testNo)-1).padStart(2,'0')} style={{color:navy}}>← Önceki Test</a>:<span/>}
     {Number(testNo)<50?<a href={'/paragraf/optik/'+String(Number(testNo)+1).padStart(2,'0')} style={{color:navy}}>Sonraki Test →</a>:<span/>}
   </nav>
   <div style={{...card,marginBottom:16}}>
    <h2 style={{marginTop:0,fontSize:20}}>Cevaplarını işaretle</h2>
    <p style={{fontSize:14,color:'#40546a'}}>Bir şıkkı seçmek için dokun. Aynı şıkka yeniden dokunarak soruyu boş bırakabilirsin.</p>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(310px,1fr))',gap:12}}>
     {[0,1].map(group=><div key={group} style={{display:'grid',gap:7}}>
      {answers.slice(group*15,group*15+15).map((value,j)=>{
       const idx=group*15+j;
       return <div key={idx} style={{display:'flex',alignItems:'center',gap:7,background:idx%2?'#f3f7fb':'#fff',padding:'7px 4px',borderRadius:8}}>
        <strong style={{minWidth:29}}>{String(idx+1).padStart(2,'0')}</strong>
        {LABELS.map(letter=><button key={letter} type="button" onClick={()=>select(idx,letter)}
         aria-label={(idx+1)+'. soru '+letter} aria-pressed={value===letter}
         style={{background:value===letter?navy:'#fff',color:value===letter?'#fff':navy,
          border:'1px solid '+(value===letter?navy:gold),borderRadius:'50%',width:37,height:37,
          fontWeight:800,cursor:'pointer'}}>{letter}</button>)}
        <span style={{fontSize:12,color:'#65768e',marginLeft:'auto'}}>{value==='X'?'Boş':''}</span>
       </div>;
      })}
     </div>)}
    </div>
   </div>
   <div style={{...card,textAlign:'center'}}>
    <p style={{marginTop:0,color:'#40546a'}}>İşaretlemediğin sorular boş kabul edilir. Sonuçlar için doğru anahtar sunucuda kullanılacaktır.</p>
    <button type="button" onClick={()=>{setFinished(true);setConfirmation(true);}}
     style={{background:navy,color:'#fff',border:'3px solid '+gold,borderRadius:14,padding:'16px 40px',fontSize:19,fontWeight:800,cursor:'pointer'}}>
     TESTİ BİTİR
    </button>
    {confirmation&&finished?<section style={{marginTop:25,paddingTop:20,borderTop:'1px solid #e0e4e9'}}>
     <h2 style={{fontSize:21}}>Kişisel Sonuç QR Kodun</h2>
     <p>Bu QR kodu, işaretlediğin 30 cevabı ve sonucunu açar. Kodun altında doğrudan sonuç bağlantısı da var.</p>
     <img src={qrUrl} width={235} height={235} alt={'TEST '+testNo+' kişisel sonuç QR kodu'} style={{maxWidth:'100%',border:'8px solid #fff',boxShadow:'0 0 0 1px #dde6ed'}}/>
     <p style={{fontSize:13,color:'#5a6878'}}>QR kodunu paylaştığın kişiler cevaplarını görebilir.</p>
     <a href={resultUrl} style={{display:'inline-block',background:gold,color:navy,fontWeight:800,padding:'14px 21px',borderRadius:11,textDecoration:'none'}}>Kodladığım Cevapları ve Sonucumu Gör</a>
    </section>:null}
   </div>
  </article>
 </main>;
}
