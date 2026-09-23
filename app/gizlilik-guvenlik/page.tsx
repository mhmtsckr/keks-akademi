import { LegalContactBlock,LegalPageShell } from '@/app/components/LegalPageShell';

export default function PrivacySecurityPage(){
  return <LegalPageShell eyebrow="VERİ GÜVENLİĞİ" title="Gizlilik & Güvenlik Politikası" description="KEKS Akademi'de kişisel verilerin hangi amaçlarla işlendiğini ve güvenlik yaklaşımımızı açıklayan politika.">
    <div className="legalDoc">
      <section><h2>1. Kapsam</h2><p>Bu politika; öğrenci, koç, veli ve yönetici hesapları kapsamında KEKS Akademi tarafından işlenen kullanıcı, iletişim, eğitim, değerlendirme, çalışma takibi, ödeme ve teknik işlem verilerine ilişkin genel esasları açıklar.</p></section>
      <section><h2>2. İşlenen veri grupları</h2><p>Hesap ve kimlik bilgileri, iletişim bilgileri, eğitim düzeyi ve sınav grubu, test/ön görüşme yanıtları, çalışma ve deneme kayıtları, koçluk notları, erişim ve güvenlik kayıtları ile ödeme işlem bilgileri hizmetin gerektirdiği ölçüde işlenebilir.</p></section>
      <section><h2>3. İşleme amaçları</h2><p>Veriler; hesap oluşturma, kimlik doğrulama, kişiselleştirilmiş eğitim/koçluk hizmeti sunma, raporlama, kullanıcı desteği, ödeme ve erişim yönetimi, güvenlik, kötüye kullanımın önlenmesi ve yasal yükümlülüklerin yerine getirilmesi amaçlarıyla kullanılabilir.</p></section>
      <section><h2>4. Ödeme güvenliği</h2><p>Kart bilgileri KEKS Akademi uygulamasında saklanmaz. Kartlı ödeme işlemleri ödeme hizmet sağlayıcısının güvenli ödeme altyapısında yürütülür. KEKS tarafında yalnızca işlem sonucu, tutar, sipariş/işlem kimliği ve erişim için gerekli ödeme durumu tutulabilir.</p></section>
      <section><h2>5. Paylaşım ve hizmet sağlayıcılar</h2><p>Veriler yalnızca hizmetin yürütülmesi için gerekli olduğu ölçüde barındırma, veritabanı, ödeme, e-posta ve benzeri teknik hizmet sağlayıcılarla; ayrıca hukuken yetkili kurumlarla paylaşılabilir.</p></section>
      <section><h2>6. Saklama ve güvenlik</h2><p>Veriler amaç için gerekli süre ve uygulanabilir yasal saklama yükümlülükleri dikkate alınarak tutulur. Rol tabanlı erişim, parola/anahtar koruması, şifreleme, güvenlik kayıtları ve erişim kontrolleri uygulanır.</p></section>
      <section><h2>7. Başvuru ve iletişim</h2><p>Kişisel verilerinizle ilgili talepleriniz için aşağıdaki iletişim kanallarını kullanabilirsiniz.</p><LegalContactBlock/></section>
    </div>
  </LegalPageShell>;
}
