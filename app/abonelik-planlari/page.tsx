import {redirect} from 'next/navigation';

// Eski bağlantıları fiyatlandırma içermeyen özellikler sayfasına yönlendir.
export default function SubscriptionPlansPage(){
  redirect('/ozellikler');
}
