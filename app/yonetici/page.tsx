import { currentUser } from '@/lib/auth';
export default async function AdminPage() {
  const user = await currentUser();
  if (!user || user.role !== 'ADMIN') return <main style={{padding:40}}><h1>Yönetici Paneli</h1><p>Bu alan yalnızca sistem yöneticisine açıktır.</p></main>;
  return <main style={{padding:40}}><h1>KEKS Yönetici Paneli</h1><p>{user.name}</p><ul><li>Koç hesaplarını onayla/pasifleştir</li><li>KEKS Akademi kodu oluştur ve öğrenciye ata</li><li>Test fiyatını ve erişim kurallarını yönet</li><li>Gerçek soru havuzunu veritabanına yükle</li><li>Tüm test raporlarını görüntüle</li></ul></main>;
}
