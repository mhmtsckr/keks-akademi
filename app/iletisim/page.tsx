import { LegalPageShell } from '@/app/components/LegalPageShell';
import { BUSINESS_INFO } from '@/lib/businessInfo';

export default function ContactPage(){
  const phone=BUSINESS_INFO.phone.replace(/^(\d{4})(\d{3})(\d{2})(\d{2})$/, '$1 $2 $3 $4');

  return <LegalPageShell eyebrow="İLETİŞİM" title="İletişim" description="">
    <div className="legalDoc">
      <section>
        <div className="legalContactCard">
          <div>
            <span>Telefon</span>
            <strong><a href={`tel:${BUSINESS_INFO.phone}`}>{phone}</a></strong>
          </div>
          <div>
            <span>E-posta</span>
            <strong><a href={`mailto:${BUSINESS_INFO.email}`}>{BUSINESS_INFO.email}</a></strong>
          </div>
        </div>
      </section>
    </div>
  </LegalPageShell>;
}
