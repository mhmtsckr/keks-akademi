import { currentUser } from '@/lib/auth';
import { AccountLoginForm } from '@/app/components/AuthForms';
import { AdminActions } from '@/app/components/AdminActions';

export default async function AdminPage() {
  const user = await currentUser();
  if (!user || user.role !== 'ADMIN') {
    return <main className="shell"><nav className="nav"><a className="brand" href="/">KEKS AKADEMİ</a></nav><section className="section" style={{maxWidth:520}}><div className="card"><h1>Yönetici Girişi</h1><p className="muted">Bu alan yalnızca KEKS sistem yöneticisine açıktır.</p><AccountLoginForm redirect="/yonetici"/></div></section></main>;
  }
  return <main className="shell">
    <nav className="nav"><a className="brand" href="/">KEKS AKADEMİ</a><div className="navlinks"><a href="/koc">Koç Paneli</a><a href="/">Ana Sayfa</a></div></nav>
    <section className="section"><span className="pill">Yönetici</span><h1>KEKS Yönetici Paneli</h1><p className="muted">{user.name} · Test, erişim kodları ve koç hesapları yalnızca burada yönetilir.</p></section>
    <AdminActions/>
  </main>;
}