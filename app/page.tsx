export default function Home() {
  return <main className="shell">
    <nav className="nav">
      <div className="brand">KEKS AKADEMİ</div>
      <div className="navlinks">
        <a href="/ogrenci">Öğrenci</a>
        <a href="/koc">Koç</a>
        <a href="/yonetici">Yönetici</a>
      </div>
    </nav>
    <section className="hero">
      <span className="pill">Kazandıran Eğitim ve Koçluk Sistemi</span>
      <h1>Takip, planlama ve KEKS eğilim taraması tek sistemde.</h1>
      <p>Öğrenci çalışma planını sürdürür, koç yalnızca kendi öğrencilerini takip eder. KEKS Eğitsel Çalışma ve Öz-Düzenleme Eğilimleri Taraması ise yönetici kontrollü erişimle kullanılır.</p>
      <div className="row">
        <a className="btn primary" href="/ogrenci">Öğrenci Paneline Gir</a>
        <a className="btn" href="/koc">Koç Paneli</a>
      </div>
    </section>
    <section className="grid">
      <article className="card"><h3>Öğrenci Paneli</h3><p className="muted">Mevcut planlar, günlük takip, deneme kayıtları ve KEKS taramasına erişim.</p></article>
      <article className="card"><h3>Koç Paneli</h3><p className="muted">Kişisel koç hesabı, kendi öğrencilerini oluşturma ve çalışma takibi.</p></article>
      <article className="card"><h3>KEKS Taraması</h3><p className="muted">KEKS Akademi kodu veya doğrulanmış 350 TL ödeme sonrasında öğrenci panelinden açılır.</p></article>
    </section>
  </main>;
}
