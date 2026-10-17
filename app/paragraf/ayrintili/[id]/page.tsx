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
  title:'KEKS Akademi · Soruya Özel Öğretici Ayrıntılı Çözüm',
  robots:{index:false,follow:false,noarchive:true}
};
const LETTERS=['A','B','C','D','E'] as const;
const paper={
  borderRadius:14,background:'#f6f9f5',border:'1px solid #dbe9db',padding:'clamp(16px,3vw,24px)'
} as const;
const quote={margin:'8px 0 0',fontSize:15,lineHeight:1.8,color:'#294d3d'} as const;

export default async function ParagrafDetailedSolutionPage({params,searchParams}:Props){
  const [{id},query]=await Promise.all([params,searchParams]);
  const token=typeof query.k==='string'?query.k:'';
  const secret=process.env.KEKS_PARAGRAF_QR_SECRET||'';
  const row=getParagrafDetailedSolution(id);
  if(!row||!verifyParagrafDetailedSignature(id,token,secret))notFound();
  const teaching=row.teaching;
  const question=row.question;
  return <main style={{minHeight:'100vh',background:'#f2f6f2',color:'#143a2b',
    padding:'clamp(12px,4vw,36px) 12px'}}>
    <article style={{maxWidth:860,margin:'0 auto',background:'#fff',borderRadius:18,
      boxShadow:'0 12px 38px rgba(18,64,40,.08)',padding:'clamp(20px,5vw,42px)'}}>
      <header style={{borderBottom:'2px solid #dce9dd',paddingBottom:16}}>
        <div style={{letterSpacing:2,color:'#2b8059',fontWeight:800,fontSize:13}}>
          KEKS AKADEMİ · TYT TÜRKÇE · ÖĞRETİCİ ÇÖZÜM
        </div>
        <h1 style={{fontSize:'clamp(23px,4vw,33px)',margin:'12px 0 6px'}}>
          Soruya Özel Ayrıntılı Çözüm
        </h1>
        <p style={{fontSize:16,margin:'5px 0'}}>
          Test {String(row.testNo).padStart(2,'0')} · Soru {String(row.questionNo).padStart(2,'0')}
          {' '}· {teaching.skill}
        </p>
        <p style={{fontWeight:800,fontSize:20,color:'#226a4c'}}>
          Doğru cevap: {row.answer}
        </p>
      </header>

      <section style={{...paper,marginTop:24}}>
        <h2 style={{fontSize:20,margin:'0 0 9px'}}>1. Bu soru hangi beceriyi ölçüyor?</h2>
        <p style={quote}>{teaching.lesson}</p>
        <p style={{...quote,fontWeight:700}}>{question.stem}</p>
      </section>

      <section style={{marginTop:26}}>
        <h2 style={{fontSize:20,margin:'0 0 10px'}}>2. Paragrafı yeniden oku ve kanıtı bul</h2>
        <p style={{...quote,whiteSpace:'pre-wrap'}}>{question.passage}</p>
        <div style={{display:'grid',gap:10,marginTop:17}}>
          <div style={paper}>
            <strong style={{color:'#1d6548'}}>Yazarın ana savı</strong>
            <p style={quote}>“{teaching.thesis}”</p>
            <p style={{...quote,fontSize:13}}>Bu cümle paragrafın temel iddiasını gösterir.</p>
          </div>
          <div style={paper}>
            <strong style={{color:'#1d6548'}}>Somut örnek</strong>
            <p style={quote}>“{teaching.example}”</p>
            <p style={{...quote,fontSize:13}}>Örnek, iddiayı somutlaştırır; bütün düşüncenin yerini tutmaz.</p>
          </div>
          <div style={paper}>
            <strong style={{color:'#1d6548'}}>Sınır / koşul</strong>
            <p style={quote}>“{teaching.boundary}”</p>
            <p style={{...quote,fontSize:13}}>Yanlış seçenekler genellikle bu sınırı siler veya gereksiz kesinlik ekler.</p>
          </div>
        </div>
      </section>

      <section style={{marginTop:26}}>
        <h2 style={{fontSize:20,margin:'0 0 10px'}}>3. Şık şık gerekçeli çözüm</h2>
        <p style={{...quote,marginBottom:14}}>
          Her seçeneğin neden kabul edildiğini veya neden elendiğini, metnin gerekçelerine bakarak değerlendir.
        </p>
        <div style={{display:'grid',gap:12}}>
          {LETTERS.map(letter=>{
            const item=teaching.analysis[letter];
            const correct=letter===row.answer;
            return <section key={letter} style={{
              border:'1px solid '+(correct?'#8cbd9d':'#e0e7df'),
              background:correct?'#edf6ef':'#fff',borderRadius:13,padding:'16px 18px'
            }}>
              <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                <strong style={{fontSize:18}}>{letter})</strong>
                <span style={{fontSize:12,fontWeight:800,letterSpacing:0.5,
                  color:correct?'#17613d':'#a34b3d'}}>
                  {correct?'DOĞRU SEÇENEK':'NEDEN ELENİR?'}
                </span>
              </div>
              <p style={{...quote,fontWeight:650,marginTop:8}}>{item.text}</p>
              <p style={{...quote,marginTop:12}}>{item.explanation}</p>
            </section>;
          })}
        </div>
      </section>

      <section style={{...paper,marginTop:26}}>
        <h2 style={{fontSize:20,margin:'0 0 9px'}}>4. Yeni soruda uygulayacağın yöntem</h2>
        <p style={quote}>{teaching.method}</p>
      </section>

      <section style={{...paper,marginTop:14}}>
        <h2 style={{fontSize:20,margin:'0 0 9px'}}>5. Öğrendim mi? Kendini yokla</h2>
        <p style={quote}>{teaching.check}</p>
        <p style={{...quote,fontSize:13}}>
          Yanıtını önce metne dönmeden kendi sözlerinle ver. Ardından paragraftaki kanıtı
          göstererek kararını doğrula.
        </p>
      </section>

      <footer style={{borderTop:'1px solid #dce9dd',marginTop:32,paddingTop:18,
        fontSize:12,color:'#697d70'}}>
        Bu sayfa yalnız KEKS Paragraf basılı kitabındaki Test {row.testNo} / Soru {row.questionNo}
        çözümüdür. Başka soruların cevapları bu bağlantıyla açılmaz.
      </footer>
    </article>
  </main>;
}
