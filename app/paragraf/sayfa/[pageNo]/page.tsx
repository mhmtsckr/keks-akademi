import type {Metadata} from 'next';
import Link from 'next/link';
import {currentUser} from '@/lib/auth';
import {notFound} from 'next/navigation';
import {parseParagrafPageNo} from '@/lib/paragrafPage';
import {ParagrafPageForm} from '@/app/components/ParagrafPageForm';

export const dynamic='force-dynamic';
export const runtime='nodejs';
type Props={params:Promise<{pageNo:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{
  const page=parseParagrafPageNo((await params).pageNo);
  return {title:page?'KEKS Paragraf · Test '+page.testNo+' · Sayfa '+page.pageInTest:'KEKS Paragraf',
    robots:{index:false,follow:false}};
}
export default async function ParagrafPaperPage({params}:Props){
  const page=parseParagrafPageNo((await params).pageNo);
  if(!page)notFound();
  const user=await currentUser();
  return <main style={{minHeight:'100vh',background:'#f3f7f4',color:'#143a30',padding:'28px 12px'}}>
    <section style={{maxWidth:780,margin:'0 auto',background:'white',padding:'clamp(18px,4vw,36px)',borderRadius:18}}>
      <div style={{fontSize:13,fontWeight:900,letterSpacing:2,color:'#2d7553'}}>KEKS AKADEMİ</div>
      <h1 style={{fontSize:27,marginBottom:8}}>Paragraf · Dijital Cevap Formu</h1>
      <p>Test {page.testNo} · Basılı sayfa {page.pageInTest}/8 · Sayfa kodu {page.code}</p>
      {!user
        ? <div style={{border:'1px solid #ccdcd1',borderRadius:12,padding:20}}>
            <p>Cevaplarınızın kişisel hesabınıza kaydedilmesi için öğrenci girişi gerekir.</p>
            <Link href="/ogrenci">Öğrenci hesabına giriş yap</Link>
            <p style={{fontSize:13}}>Girişten sonra aynı QR kodunu yeniden okutabilirsiniz.</p>
          </div>
        : user.role!=='STUDENT'||!user.student
          ? <p>Bu form yalnızca öğrenci profiliyle kullanılabilir.</p>
          : <ParagrafPageForm pageNo={page.code}/>}
      <p style={{fontSize:12,marginTop:30,color:'#697b70'}}>
        Bu kitap editöryal baskı provasıdır. Soruları basılı kitap üzerinden okuyunuz;
        burada yalnızca cevap işaretlenir. Çözümler gönderimden sonra açılır.
      </p>
    </section>
  </main>;
}
