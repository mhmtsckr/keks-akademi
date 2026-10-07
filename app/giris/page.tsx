import {AccountLoginForm,ParentLoginForm,StudentLoginForm} from '@/app/components/AuthForms';
import {PortalShell,PortalSectionTitle} from '@/app/components/PortalShell';

export default function LoginHubPage(){
  return <PortalShell
    active="sistem"
    eyebrow="GİRİŞ YAP"
    title="KEKS hesabınıza giriş yapın."
    description="Öğrenci, KEKS Partner Koç ve Veli girişlerini tek ekrandan seçin."
    wide
  >
    <section className="section">
      <PortalSectionTitle
        eyebrow="ROLÜNÜZÜ SEÇİN"
        title="Tek sistem, role göre ayrı ve güvenli erişim."
        description="Her kullanıcı yalnız kendi yetkisine uygun paneli görür."
      />
      <div className="roleAccessGrid">
        <article className="roleAccessCard section-anchor" id="ogrenci">
          <span className="portalEyebrow">ÖĞRENCİ</span>
          <h2>Öğrenci Girişi</h2>
          <p>Plan, görev, tekrar, yanlış soru, deneme ve gelişim ekranına giriş yapın.</p>
          <StudentLoginForm/>
          <a className="roleAccessLink" href="/kayit#ogrenci">Hesabın yok mu? Öğrenci kaydı oluştur →</a>
        </article>

        <article className="roleAccessCard section-anchor" id="koc">
          <span className="portalEyebrow">KEKS PARTNER KOÇ</span>
          <h2>Partner Koç Girişi</h2>
          <p>Öğrenci yönetimi, MİZA, görüşme hazırlığı, rapor ve koç aksiyonlarına erişin.</p>
          <AccountLoginForm redirect="/koc" requiredRole="COACH"/>
          <a className="roleAccessLink" href="/kayit#koc">Partner Koç hesabı oluştur →</a>
        </article>

        <article className="roleAccessCard section-anchor" id="veli">
          <span className="portalEyebrow">VELİ</span>
          <h2>Veli Girişi</h2>
          <p>Öğrenci kodu ve size tanımlanan KEKS Akademi veli giriş koduyla gelişim paneline erişin.</p>
          <ParentLoginForm/>
          <a className="roleAccessLink" href="/kayit#veli">Veli erişimi nasıl oluşturulur? →</a>
        </article>
      </div>
    </section>
  </PortalShell>;
}
