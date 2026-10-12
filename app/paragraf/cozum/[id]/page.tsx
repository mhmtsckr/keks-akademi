import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {db} from '@/lib/db';

export const dynamic='force-dynamic';
export const runtime='nodejs';

type Props={params:Promise<{id:string}>};

export async function generateMetadata({params}:Props):Promise<Metadata>{
  const {id}=await params;
  return {
    title:/^\d{5}$/.test(id)?'KEKS Paragraf - '+id+' Çözümü':'KEKS Paragraf Çözümü',
    description:'KEKS Akademi TYT Türkçe Paragraf soru kitabı karekodlu bireysel çözüm.',
    robots:{index:false,follow:false}
  };
}

export default async function ParagrafSolutionPage({params}:Props){
  const {id}=await params;
  if(!/^\d{5}$/.test(id))notFound();

  // id is one 5-digit printed code; no bulk listing or neighboring questions.
  const q=await db.paragrafBookSolution.findUnique({
    where:{id},
    select:{id:true,topic:true,testNo:true,questionNo:true,correctAnswer:true,explanation:true}
  });
  if(!q)notFound();

  const split=q.explanation.split(/Çeldiriciler\s*:/i);
  const main=split[0].trim();
  const traps=split.slice(1).join(' ').trim();
  const box:{[key:string]:string|number}={
    maxWidth:680,margin:'0 auto',padding:'clamp(18px,4vw,40px)',
    color:'#18372f',fontFamily:'system-ui,-apple-system,Segoe UI,sans-serif'
  };
  return (
    <main style={{minHeight:'100vh',background:'#f4f7f3',padding:'30px 14px'}}>
      <article style={{...box,background:'#fff',borderRadius:16,boxShadow:'0 12px 38px #153e2f15'}}>
        <header style={{borderBottom:'1px solid #d8e2da',paddingBottom:18,marginBottom:24}}>
          <div style={{fontSize:13,letterSpacing:2,fontWeight:800,color:'#426e56'}}>KEKS AKADEMİ</div>
          <h1 style={{fontSize:29,margin:'10px 0'}}>KEKS PARAGRAF</h1>
          <p style={{margin:'6px 0',color:'#526558'}}>{q.topic} · Test {q.testNo} · Soru {q.questionNo}</p>
          <div style={{fontSize:12,color:'#67786a'}}>Soru kodu: {q.id}</div>
        </header>

        <section aria-label="Yalnızca bu sorunun çözümü">
          <div style={{background:'#e9f3eb',borderRadius:12,padding:19,marginBottom:24}}>
            <div style={{fontSize:13,color:'#365f45',fontWeight:700}}>DOĞRU CEVAP</div>
            <div style={{fontSize:31,fontWeight:800,paddingTop:4}}>{q.correctAnswer}</div>
          </div>
          <h2 style={{fontSize:20,margin:'0 0 12px'}}>Ayrıntılı çözüm</h2>
          <p style={{fontSize:16,lineHeight:1.8,whiteSpace:'pre-wrap'}}>{main}</p>
          {traps&&<>
            <h2 style={{fontSize:18,margin:'28px 0 12px'}}>Çeldiricilerin açıklaması</h2>
            <p style={{fontSize:15,lineHeight:1.8,whiteSpace:'pre-wrap'}}>{traps}</p>
          </>}
        </section>
        <footer style={{borderTop:'1px solid #d8e2da',marginTop:32,paddingTop:18,
          fontSize:12,lineHeight:1.6,color:'#68786c'}}>
          Bu sayfa yalnızca {q.id} kodlu sorunun taslak çözümünü içerir.
          Bağımsız editör onayı tamamlanmadan ticari yayıma hazır kabul edilmez.
        </footer>
      </article>
    </main>
  );
}
