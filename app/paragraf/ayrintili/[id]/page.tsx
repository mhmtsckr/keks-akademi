import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {
  getParagrafDetailedSolution,verifyParagrafDetailedSignature
} from '@/lib/paragrafDetailedSolutions';

export const dynamic='force-dynamic';
export const runtime='nodejs';
type Props={
  params:Promise<{id:string}>;
  searchParams:Promise<{k?:string|string[]}>;
};
export const metadata:Metadata={
  title:'KEKS Akademi · Soruya Özel Ayrıntılı Çözüm',
  robots:{index:false,follow:false,noarchive:true}
};

const PARTS=['Kökü tanı','Kanıt haritası','Çeldirici analizi','Hata defteri','Altın ilke'];

function splitSolution(text:string){
  const heading=/^\\s*([1-5])\\.\\s*(Kökü tanı|Kanıt haritası|Çeldirici analizi|Hata defteri|Altın ilke):\\s*/gm;
  const matches=[...text.matchAll(heading)];
  if(matches.length!==5)return [{title:'Ayrıntılı çözüm',content:text}];
  return matches.map((match,i)=>({
    title:match[2],
    content:text.slice((match.index||0)+match[0].length,
      i+1<matches.length?matches[i+1].index:undefined).trim()
  }));
}
export default async function ParagrafDetailedSolutionPage({params,searchParams}:Props){
  const [{id},query]=await Promise.all([params,searchParams]);
  const token=typeof query.k==='string'?query.k:'';
  const secret=process.env.KEKS_PARAGRAF_QR_SECRET||'';
  const row=getParagrafDetailedSolution(id);
  if(!row||!verifyParagrafDetailedSignature(id,token,secret))notFound();
  const sections=splitSolution(row.content);
  return <main style={{minHeight:'100vh',background:'#f2f6f2',color:'#143a2b',
    padding:'clamp(12px,4vw,36px) 12px'}}>
    <article style={{maxWidth:840,margin:'0 auto',background:'#fff',borderRadius:18,
      boxShadow:'0 12px 38px rgba(18,64,40,.08)',padding:'clamp(20px,5vw,42px)'}}>
      <header style={{borderBottom:'2px solid #dce9dd',paddingBottom:16}}>
        <div style={{letterSpacing:2,color:'#2b8059',fontWeight:800,fontSize:13}}>
          KEKS AKADEMİ · PARAGRAF DERSİ
        </div>
        <h1 style={{fontSize:'clamp(23px,4vw,33px)',margin:'12px 0 6px'}}>
          Soruya Özel Ayrıntılı Çözüm
        </h1>
        <p style={{fontSize:16,margin:'5px 0'}}>
          Test {String(row.testNo).padStart(2,'0')} · Soru {String(row.questionNo).padStart(2,'0')}
          {' '}· {row.topic}
        </p>
        <p style={{fontWeight:800,fontSize:20,color:'#226a4c'}}>
          Doğru cevap: {row.answer}
        </p>
      </header>
      {sections.map((section,i)=><section key={i} style={{margin:'23px 0',
        border:'1px solid #e0eae0',borderRadius:13,padding:'15px 20px'}}>
        <h2 style={{fontSize:19,margin:'0 0 12px',color:'#195c41'}}>
          {i+1}. {PARTS.includes(section.title)?section.title:'Ayrıntılı çözüm'}
        </h2>
        <p style={{lineHeight:1.78,whiteSpace:'pre-wrap',margin:0,fontSize:15.5}}>
          {section.content}
        </p>
      </section>)}
      <footer style={{borderTop:'1px solid #dce9dd',marginTop:30,paddingTop:16,
        fontSize:12,color:'#697d70'}}>
        Bu bağlantı yalnızca basılı KEKS Paragraf kitabının bu sorusuna ait çözümü gösterir.
        Doğru sonuca ulaşmadan önce kanıt ve çeldirici gerekçelerini inceleyiniz.
      </footer>
    </article>
  </main>;
}
