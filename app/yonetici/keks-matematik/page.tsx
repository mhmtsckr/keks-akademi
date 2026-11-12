import {redirect} from 'next/navigation';
import {currentUser} from '@/lib/auth';
import {KeksMathAdmin} from '@/app/components/KeksMathAdmin';
export const dynamic='force-dynamic';
export default async function AdminMathPage(){
 const user=await currentUser();
 if(!user){redirect('/yonetici');}
 if(user.role!=='ADMIN')redirect('/yonetici');
 return <main style={{maxWidth:1200,margin:'0 auto',padding:'30px 18px'}}>
  <p><a href="/yonetici">← Yönetici paneline dön</a></p>
  <KeksMathAdmin/>
 </main>;
}
