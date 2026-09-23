import { LegalContactBlock,LegalPageShell } from '@/app/components/LegalPageShell';

export default function RefundPage(){
  return <LegalPageShell eyebrow="SATIŞ SONRASI" title="İptal & İade Koşulları" description="KEKS Akademi dijital ürünlerinde iptal, erişim ve iade taleplerinin değerlendirilme esasları.">
    <div className="legalDoc">
      <section><h2>1. Genel ilke</h2><p>İade ve iptal talepleri ürünün niteliği, ödemenin durumu, erişimin açılıp açılmadığı, hizmetin ifasına başlanıp başlanmadığı ve tüketici mevzuatındaki emredici hükümler dikkate alınarak değerlendirilir.</p></section>
      <section><h2>2. Ödeme tamamlanmadan önce</h2><p>Ödeme henüz başarılı olarak doğrulanmamışsa ürün erişimi açılmaz. Başarısız veya yarım kalan ödeme oturumlarında tahsilat yapılmadıysa iade işlemi oluşmaz.</p></section>
      <section><h2>3. Ödeme alındı ancak erişim açılmadıysa</h2><p>Başarılı tahsilata rağmen ürün erişimi teknik nedenle kullanıcı hesabına tanımlanmadıysa öncelikle erişim sorunu giderilir. Erişimin sağlanamaması hâlinde iade talebi işlem ve teknik kayıtlar üzerinden değerlendirilir.</p></section>
      <section><h2>4. Dijital erişim başladıktan sonra</h2><p>Test, rapor, ön görüşme veya diğer dijital hizmetlere erişimin başlamış olması iade değerlendirmesini etkileyebilir. Dijital içerik ve hizmetlerde cayma hakkına ilişkin yasal istisnalar yalnızca ilgili mevzuatın şartları oluştuğu ölçüde uygulanır.</p></section>
      <section><h2>5. Mükerrer veya hatalı tahsilat</h2><p>Aynı işlem için mükerrer tahsilat, sistemsel fiyat hatası veya doğrulanabilir yanlış tahsilat tespit edilirse uygun düzeltme veya iade süreci başlatılır.</p></section>
      <section><h2>6. İade talebi için gerekli bilgiler</h2><p>Kullanıcı adı veya öğrenci kodu, ödeme tarihi, ödeme tutarı, varsa işlem/sipariş numarası ve talep nedeni paylaşılmalıdır. Kartın tam numarası, CVV veya internet bankacılığı şifresi hiçbir zaman istenmez.</p></section>
      <section><h2>7. İletişim</h2><LegalContactBlock/></section>
    </div>
  </LegalPageShell>;
}
