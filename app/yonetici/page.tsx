import { currentUser } from '@/lib/auth';
import { AccountLoginForm } from '@/app/components/AuthForms';
import { AdminConsole } from '@/app/components/AdminConsole';
import { PortalShell } from '@/app/components/PortalShell';

export default async function AdminPage() {
  const user = await currentUser();

  if (!user || user.role !== 'ADMIN') {
    return <PortalShell
      active="yonetici"
      eyebrow="YÖNETİCİ GİRİŞİ"
      title="KEKS Akademi sistem kontrol merkezi."
      description="Koç hesapları, erişim kodları, test yönetimi ve sistem ayarları yalnızca yetkili yönetici tarafından yönetilir."
    >
      <section className="portalLoginGrid">
        <div className="portalLoginIntro">
          <span className="portalEyebrow">SİSTEM YÖNETİMİ</span>
          <h2>Yetki, içerik ve erişim tek merkezde.</h2>
          <p>Yönetici paneli; koç onayları, öğrenci erişimleri, soru bankası ve KEKS kodlarının kontrol edildiği güvenli çalışma alanıdır.</p>
          <div className="portalLoginBullets">
            <span>Koç hesapları ve onay akışı</span>
            <span>KEKS erişim kodları ve soru bankası</span>
            <span>Sistem seviyesinde kontrol</span>
          </div>
        </div>
        <div className="card">
          <h2>Yönetici Girişi</h2>
          <p className="muted">Bu alan yalnızca KEKS sistem yöneticisine açıktır.</p>
          <AccountLoginForm redirect="/yonetici"/>
        </div>
      </section>
    </PortalShell>;
  }

  return <PortalShell signedIn
    active="yonetici"
    eyebrow="YÖNETİCİ PANELİ"
    title="KEKS Yönetici Kontrol Merkezi"
    description="Koç hesapları, test erişimi ve sistem yönetimini tek panelden yönetin."
    meta={<><span>{user.name}</span><span>ADMIN</span><span>Sistem kontrolü</span></>}
    wide
  >
    <section className="section"><AdminConsole/></section>
  </PortalShell>;
}
