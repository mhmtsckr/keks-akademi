import { getKeksMonthlyProduct } from '@/lib/monthlyProduct';
import { KeksCoreLoop } from '@/app/components/KeksCoreLoop';
import { KEKS_CORE_SENTENCE } from '@/lib/keksCore';

export const dynamic='force-dynamic';

export default async function Home() {
  const product=await getKeksMonthlyProduct();
  return <main className="home">
    <section className="homeHero">
      <nav className="homeNav">
        <a href="/" className="homeBrand" aria-label="KEKS Akademi ana sayfa">
          <img className="homeBrandLogo" src="/keks-robot-logo.svg" alt="KEKS Akademi" />
        </a>
        <div className="homeNavLinks">
          <a href="/sistem">Sistem</a>
          <a href="/ozellikler">Özellikler</a>
          <a href="/ogrenci">Öğrenci</a>
          <a href="/koc">Koç</a>
          <a href="/veli">Veli</a>
          <a className="homeNavCta" href="/yonetici">Yönetici</a>
        </div>
      </nav>

      <div className="homeHeroGlow homeHeroGlowOne" />
      <div className="homeHeroGlow homeHeroGlowTwo" />

      <div className="homeHeroGrid">
        <aside className="homeMotto">
          <span>FARK ET</span>
          <span>ÖĞREN</span>
          <span>GELİŞ</span>
          <span>BAŞAR</span>
          <i />
        </aside>

        <div className="homeHeroCopy">
          <div className="homeEyebrow">KAZANDIRAN EĞİTİM VE KOÇLUK SİSTEMİ</div>
          <div className="homeWordmark">
            <span>KE</span><span className="homeGoldK">K</span><span>S</span>
            <svg className="homeArrow" viewBox="0 0 160 90" aria-hidden="true">
              <defs>
                <linearGradient id="arrowGold" x1="0" x2="1">
                  <stop offset="0" stopColor="#b97818"/>
                  <stop offset=".45" stopColor="#ffe394"/>
                  <stop offset="1" stopColor="#d29124"/>
                </linearGradient>
              </defs>
              <path d="M5 76C55 70 90 49 126 17" fill="none" stroke="url(#arrowGold)" strokeWidth="11" strokeLinecap="round"/>
              <path d="M112 17l37-10-15 34Z" fill="url(#arrowGold)"/>
            </svg>
          </div>
          <div className="homeAcademy">AKADEMİ</div>
          <p className="homeTagline">{KEKS_CORE_SENTENCE}</p>
          <div className="homeActions">
            <a className="homeBtn homeBtnGold" href="/ogrenci">Öğrenci Girişi</a>
            <a className="homeBtn homeBtnGhost" href="/koc">Koç Paneli</a>
          </div>
          <div className="homeTrust">
            <span>Akıllı Eğitim Koçu</span>
            <span>Hedef Takibi</span>
            <span>Kişisel Çalışma Teknikleri</span>
          </div>
        </div>

        <div className="homeMountain" aria-hidden="true">
          <svg viewBox="0 0 360 300">
            <defs>
              <linearGradient id="mountain" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0" stopColor="#0b2543"/>
                <stop offset=".55" stopColor="#28445f"/>
                <stop offset="1" stopColor="#8a704a"/>
              </linearGradient>
              <linearGradient id="road" x1="0" x2="1">
                <stop offset="0" stopColor="#9d671d"/>
                <stop offset=".5" stopColor="#f3cf74"/>
                <stop offset="1" stopColor="#fff1b0"/>
              </linearGradient>
            </defs>
            <path d="M8 280 98 218l44 18 65-92 35 32 54-97 56 201Z" fill="url(#mountain)" opacity=".95"/>
            <path d="M96 276c33-17 65-23 87-52 24-32-1-44 24-70 20-21 43-9 55-31 9-16 9-32 13-48" fill="none" stroke="url(#road)" strokeWidth="7" strokeLinecap="round"/>
            <path d="M276 70v-28" stroke="#f4cc6a" strokeWidth="4"/>
            <path d="M278 42h31l-13 10 13 10h-31Z" fill="#f4cc6a"/>
            <circle cx="276" cy="69" r="8" fill="#fff3bd"/>
          </svg>
          <div className="homeMountainCopy">
            <span>DAHA BİLİNÇLİ</span>
            <span>DAHA GÜÇLÜ</span>
            <span>DAHA SEN</span>
          </div>
        </div>
      </div>
    </section>

    <section id="sistem" className="homeIntro">
      <div className="homeSectionTitle">
        <span>KEKS AKADEMİ</span>
        <h2>Öğrenciyi sadece takip etmeyen, veriyi yorumlayıp yönlendiren sistem.</h2>
        <p>Koç, öğrenci ve veli aynı gelişim yolculuğunu kendi yetkileriyle görür. Sistem hedefleri, denemeleri, çalışma sürelerini, teknik kullanımını ve konu ilerlemesini tek yerde birleştirir.</p>
      </div>
      <div className="homeStats">
        <div><strong>7/24</strong><span>kişisel takip altyapısı</span></div>
        <div><strong>0–1–3–7–14–28</strong><span>akıllı tekrar döngüsü</span></div>
        <div><strong>3 Panel</strong><span>öğrenci · koç · veli</span></div>
      </div>
    </section>

    <section className="homeCoreSection"><KeksCoreLoop/></section>

    <section id="ozellikler" className="homeFeatures">
      <div className="homeFeature homeFeatureLarge">
        <span className="homeFeatureIcon">↗</span>
        <div><small>HEDEF ODAKLI</small><h3>Akıllı Eğitim Koçu</h3><p>Hedef okul veya üniversiteyi, netleri, konu ilerlemesini ve çalışma alışkanlıklarını birlikte değerlendirerek haftalık plan oluşturur.</p></div>
      </div>
      <div className="homeFeature">
        <span className="homeFeatureIcon">◉</span>
        <div><small>GERÇEK SÜRE</small><h3>Odak ve Teknik Laboratuvarı</h3><p>Pomodoro, Feynman, Cornell, Aktif Hatırlama ve SQ3R teknikleri doğrudan uygulanır; arka planda açık kalan süre çalışma sayılmaz.</p></div>
      </div>
      <div className="homeFeature">
        <span className="homeFeatureIcon">◎</span>
        <div><small>GELİŞİM ANALİZİ</small><h3>Net Trendleri ve Koç Uyarıları</h3><p>Düşük performans, konu birikimi ve hedef açığı otomatik belirlenir; koç müdahale gerektiren noktaları tek panelde görür.</p></div>
      </div>
    </section>

    <section className="homeFeatures" aria-label="KEKS aylık ürün kampanyası">
      <div className="homeFeature homeFeatureLarge">
        <span className="homeFeatureIcon">%</span>
        <div>
          <small>{product.monthName} AYI ÜRÜNÜ</small>
          <h3>{product.name}</h3>
          <p>Liste fiyatı <strong>{product.listPriceLabel}</strong>. Güncel satış fiyatı <strong>{product.priceLabel}</strong>{product.discountPercent>0?' · %'+product.discountPercent+' indirim':''}. Fiyat yönetici panelindeki tek merkezi kaynaktan gelir.</p>
          <a className="homeBtn homeBtnGold" href="/ogrenci">Ürünü Gör ve Eriş</a>
        </div>
      </div>
    </section>

    <section className="homePortal">
      <div className="homePortalCopy">
        <span>KEKS EKOSİSTEMİNE GİR</span>
        <h2>Her kullanıcı için ayrı, sade ve güvenli panel.</h2>
      </div>
      <div className="homePortalGrid">
        <a href="/ogrenci" className="homePortalCard"><b>01</b><h3>Öğrenci</h3><p>Planlar, testler, teknikler ve hedef takibi.</p><span>Panele Gir →</span></a>
        <a href="/koc" className="homePortalCard"><b>02</b><h3>Koç</h3><p>Öğrenci yönetimi, raporlar, uyarılar ve kişisel programlama.</p><span>Panele Gir →</span></a>
        <a href="/veli" className="homePortalCard"><b>03</b><h3>Veli</h3><p>Haftalık gelişim, koç raporları ve öğrenci durumu.</p><span>Panele Gir →</span></a>
        <a href="/yonetici" className="homePortalCard"><b>04</b><h3>Yönetici</h3><p>Koç onayı, kod yönetimi, soru bankası ve sistem kontrolü.</p><span>Panele Gir →</span></a>
      </div>
    </section>

    <footer className="homeFooter">
      <div><strong>KEKS AKADEMİ</strong><span>© 2026 Keks Akademi. Tüm Hakları Saklıdır.</span></div>
      <div className="legalFooterLinks" aria-label="Yasal sayfalar">
        <a href="/mesafeli-satis-sozlesmesi">Mesafeli Satış Sözleşmesi</a>
        <a href="/gizlilik-guvenlik">Gizlilik &amp; Güvenlik</a>
        <a href="/iptal-iade">İptal &amp; İade</a>
        <a href="/iletisim">İletişim</a>
      </div>
    </footer>
  </main>;
}
