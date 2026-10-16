import type {Metadata} from 'next';
import Link from 'next/link';
import {currentUser} from '@/lib/auth';
import {ParagrafPrintedReviews} from '@/app/components/ParagrafPrintedReviews';

export const dynamic='force-dynamic';
export const metadata:Metadata={title:'KEKS Paragraf · Kişisel Tekrarlar',robots:{index:false,follow:false}};

export default async function ParagrafPrintedReviewsPage(){
  const user=await currentUser();
  return <main style={{background:'#f3f7f4',minHeight:'100vh',padding:'25px 12px',color:'#183d2f'}}>
    <section style={{maxWidth:760,margin:'0 auto',background:'white',
      borderRadius:16,padding:'clamp(18px,4vw,36px)'}}>
      <div style={{fontSize:12,letterSpacing:2,color:'#367b56',fontWeight:800}}>KEKS AKADEMİ</div>
      <h1>Paragraf · Yanlıştan Öğrenme</h1>
      <p>Basılı kitaptaki yanlışlarını tekrar et. 0–1–3–7–14–28 günlük sistem,
        verdiğin doğru ve yanlış yanıtlara göre tekrar aralığını değiştirir.</p>
      {!user
        ? <p>Tekrarlarını görmek için <Link href="/ogrenci">öğrenci hesabına giriş yap</Link>.</p>
        : user.role!=='STUDENT'||!user.student
          ? <p>Bu alan yalnız öğrenci hesabıyla kullanılabilir.</p>
          : <ParagrafPrintedReviews/>}
      <p style={{fontSize:12,color:'#728476',marginTop:26}}>
        Basılı kitap gereklidir. Soruların tam metni dijital olarak aktarılmış değildir.
        Ayrıntılı çözüm için KEKS Paragraf ayrı çözüm PDF'sini kullanın.
      </p>
    </section>
  </main>;
}
