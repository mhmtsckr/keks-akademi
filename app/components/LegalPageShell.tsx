import { PortalShell } from '@/app/components/PortalShell';
import { BUSINESS_INFO,businessDisplay } from '@/lib/businessInfo';

export function LegalContactBlock(){
  return <div className="legalContactCard">
    <div><span>Unvan</span><strong>{businessDisplay(BUSINESS_INFO.legalTitle,'Unvan')}</strong></div>
    <div><span>Adres</span><strong>{businessDisplay(BUSINESS_INFO.address,'Adres')}</strong></div>
    <div><span>Telefon</span><strong>{businessDisplay(BUSINESS_INFO.phone,'Telefon')}</strong></div>
    <div><span>E-posta</span><strong>{BUSINESS_INFO.email}</strong></div>
  </div>;
}

export function LegalPageShell({eyebrow,title,description,children}:{eyebrow:string;title:string;description:string;children:React.ReactNode}){
  return <PortalShell
    active="sistem"
    eyebrow={eyebrow}
    title={title}
    description={description}
    wide
  >
    <section className="section legalPage">
      {children}
    </section>
  </PortalShell>;
}
