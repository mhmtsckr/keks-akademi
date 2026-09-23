import { LegalContactBlock,LegalPageShell } from '@/app/components/LegalPageShell';
import { BUSINESS_INFO } from '@/lib/businessInfo';

export default function ContactPage(){
  const missing=!BUSINESS_INFO.legalTitle||!BUSINESS_INFO.address||!BUSINESS_INFO.phone;
  return <LegalPageShell eyebrow="AÇIK İLETİŞİM" title="İletişim Bilgileri" description="KEKS Akademi satış, destek, gizlilik ve yasal bildirim iletişim kanalları.">
    <div className="legalDoc">
      <section><h2>KEKS Akademi</h2><p>Hizmet adı: {BUSINESS_INFO.serviceName}</p><LegalContactBlock/></section>
      {missing&&<section className="legalWarning"><h2>İletişim kaydı tamamlanmalı</h2><p>Yasal unvan, açık adres ve telefon bilgisi henüz sistemde doğrulanmış biçimde bulunmuyor. Bu üç alan işletme tarafından kesin bilgilerle doldurulmalıdır.</p></section>}
      <section><h2>Destek kapsamı</h2><p>Ürün erişimi, ödeme, kod kullanımı, hesap sorunları, gizlilik talepleri ve iade başvuruları için e-posta üzerinden iletişime geçebilirsiniz.</p></section>
    </div>
  </LegalPageShell>;
}
