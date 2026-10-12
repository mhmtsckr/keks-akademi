
import {redirect} from 'next/navigation';
import {currentUser} from '@/lib/auth';
import {AccountLoginForm} from '@/app/components/AuthForms';
import {AdminEditorialReview} from '@/app/components/AdminEditorialReview';
export const dynamic='force-dynamic';
export default async function EditorialPage(){
  const user=await currentUser();
  if(!user)return <main style={{maxWidth:560,margin:'50px auto',padding:22}}>
    <h1>KEKS Akademi · Editör Girişi</h1>
    <p>Bilimsel kaynak, alan ve ölçme-değerlendirme editörlerine özel güvenli giriş.</p>
    <AccountLoginForm redirect="/yonetici/editorial" requiredRole="EDITOR"/>
    <p><a href="/yonetici">Yönetici girişine git</a></p>
  </main>;
  if(user.role!=='ADMIN'&&user.role!=='EDITOR')redirect('/giris');
  return <main style={{maxWidth:1200,margin:'0 auto',padding:'30px 18px'}}>
    <p><a href="/yonetici">← Yönetici paneline dön</a></p>
    <AdminEditorialReview/>
  </main>;
}
