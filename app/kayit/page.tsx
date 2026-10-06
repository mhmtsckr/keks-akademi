import {CoachRegisterForm,StudentRegisterForm} from '@/app/components/AuthForms';
import {PortalShell,PortalSectionTitle} from '@/app/components/PortalShell';

export default function RegisterHubPage(){
  return <PortalShell
    active="sistem"
    eyebrow="KAYDOL"
    title="KEKS’e katılın."
    description="Öğrenci ve KEKS Partner Koç kayıtlarını tek sayfadan başlatın; veli erişim sürecini buradan öğrenin."
    wide
  >
    <section className="section">
      <PortalSectionTitle
        eyebrow="KAYIT TÜRÜ"
        title="Rolünüze uygun kayıt akışını seçin."
        description="Öğrenci ve Partner Koç kayıtları mevcut güvenli kimlik doğrulama altyapısıyla çalışır."
      />
      <div className="roleAccessGrid">
        <article className="roleAccessCard section-anchor" id="ogrenci">
          <span className="portalEyebrow">ÖĞRENCİ</span>
          <h2>Öğrenci Kaydı</h2>
          <p>Temel bilgilerinizi ve eğitim düzeyinizi girerek hesabınızı oluşturun; hedef, çalışma düzeni ve KEKS Partner Koç seçimi ilk giriş sihirbazında tamamlanır.</p>
          <StudentRegisterForm/>
          <a className="roleAccessLink" href="/giris#ogrenci">Zaten hesabın var mı? Giriş yap →</a>
        </article>

        <article className="roleAccessCard section-anchor" id="koc">
          <span className="portalEyebrow">KEKS PARTNER KOÇ</span>
          <h2>Partner Koç Kaydı</h2>
          <p>KEKS Akademi altyapısını öğrencilerinizle kullanmak için Partner Koç hesabınızı oluşturun.</p>
          <CoachRegisterForm/>
          <a className="roleAccessLink" href="/giris#koc">Partner Koç hesabın var mı? Giriş yap →</a>
        </article>

        <article className="roleAccessCard roleAccessInfo section-anchor" id="veli">
          <span className="portalEyebrow">VELİ</span>
          <h2>Veli Erişimi</h2>
          <p>Veli hesabı güvenlik nedeniyle herkese açık bağımsız bir kayıt formuyla oluşturulmaz. Veli erişimi, KEKS’e kayıtlı öğrenciyle eşleştirilmiş ve yetkisi tanımlanmış bir erişim olarak açılır.</p>
          <div className="roleAccessSteps">
            <span><b>1</b> Öğrencinin KEKS kaydı aktif olur.</span>
            <span><b>2</b> Öğrenciyle çalışan KEKS Partner Koç veli erişimini tanımlar.</span>
            <span><b>3</b> Veliye öğrenci kodu ve KEKS Akademi veli giriş kodu iletilir.</span>
            <span><b>4</b> Veli yalnız izin verilen gelişim alanlarını görüntüler.</span>
          </div>
          <a className="btn primary" href="/giris#veli">Veli Girişine Git</a>
          <a className="roleAccessLink" href="/iletisim">Veli erişimi için destek al →</a>
        </article>
      </div>
    </section>
  </PortalShell>;
}
