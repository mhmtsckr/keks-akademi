import { LegalContactBlock,LegalPageShell } from '@/app/components/LegalPageShell';

export default function DistanceSalesPage(){
  return <LegalPageShell eyebrow="YASAL BİLGİLENDİRME" title="Mesafeli Satış Sözleşmesi" description="KEKS Akademi dijital ürün ve hizmetlerinin çevrim içi satışına ilişkin temel sözleşme koşulları.">
    <div className="legalDoc">
      <section><h2>1. Taraflar ve kapsam</h2><p>Bu sözleşme, KEKS Akademi üzerinden sunulan dijital eğitim, koçluk, değerlendirme ve aylık test ürünlerinin elektronik ortamda satın alınmasına ilişkin esasları düzenler. Satın alma ekranında gösterilen ürün adı, dönem, kapsam ve ücret sözleşmenin ayrılmaz parçasıdır.</p></section>
      <section><h2>2. Satıcı / hizmet sağlayıcı bilgileri</h2><LegalContactBlock/><p className="legalWarning">Unvan, açık adres ve telefon alanları işletme tarafından doğrulanıp yayımlanmalıdır. Bu alanlar tamamlanmadan iletişim bilgilendirmesinin eksiksiz olduğu kabul edilmemelidir.</p></section>
      <section><h2>3. Ürün ve hizmet</h2><p>KEKS Akademi ürünleri fiziksel teslimat içermeyen dijital hizmetlerdir. Erişim kontrollü ürünlerde içerik, ödeme doğrulaması veya geçerli erişim kodu sonrasında kullanıcı hesabına tanımlanır.</p></section>
      <section><h2>4. Fiyat ve ödeme</h2><p>Geçerli satış bedeli, satın alma işlemi başlatıldığı anda ödeme ekranında Türk Lirası olarak gösterilir. Kampanya, indirim veya dönemsel fiyat değişikliklerinde ödeme ekranındaki nihai tutar esas alınır. Kartlı ödemeler güvenli ödeme hizmet sağlayıcısı üzerinden yürütülür.</p></section>
      <section><h2>5. Teslim / ifa</h2><p>Başarılı ödeme doğrulaması sonrasında dijital erişim kullanıcı hesabına tanımlanır. Kodla erişimde ürün, geçerli kodun sistem tarafından onaylanmasıyla açılır. Kullanıcı hesabı ve erişim bilgileri kişiye özeldir.</p></section>
      <section><h2>6. Cayma hakkı ve dijital hizmetler</h2><p>Dijital içerik ve elektronik ortamda ifa edilen hizmetlerde cayma hakkının kullanımı; hizmetin niteliğine, ifanın başlama anına ve ilgili mevzuattaki şartlara göre değişebilir. Cayma hakkının sona erdiği veya istisna kapsamına girdiği durumlarda gerekli bilgilendirme ve onay süreçleri uygulanır.</p></section>
      <section><h2>7. Kullanım koşulları</h2><p>Kullanıcı hesabı ve erişim kodu üçüncü kişilerle paylaşılmamalıdır. Tek kullanıcıya veya belirli döneme tanımlanan ürünler, ürün ekranında belirtilen kullanım sınırlarına tabidir.</p></section>
      <section><h2>8. İletişim</h2><p>Destek ve satış sonrası talepler için keksakademi@gmail.com adresi kullanılabilir. Tüketici mevzuatından doğan başvuru hakları saklıdır.</p></section>
    </div>
  </LegalPageShell>;
}
