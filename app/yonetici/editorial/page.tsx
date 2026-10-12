
import {redirect} from 'next/navigation';
import {requireRole} from '@/lib/auth';
import {AdminEditorialReview} from '@/app/components/AdminEditorialReview';
export const dynamic='force-dynamic';
export default async function EditorialPage(){
  try{await requireRole(['ADMIN'])}catch{redirect('/yonetici')}
  return <main style={{maxWidth:1200,margin:'0 auto',padding:'30px 18px'}}>
    <p><a href="/yonetici">← Yönetici paneline dön</a></p>
    <AdminEditorialReview/>
  </main>;
}
