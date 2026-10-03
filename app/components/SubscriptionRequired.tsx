import { PortalShell } from './PortalShell';
export function SubscriptionRequired({role}:{role:'STUDENT'|'COACH'}){
 const coach=role==='COACH';
 return <PortalShell signedIn active={role==='STUDENT'?'ogrenci':'koc'} eyebrow={coach?'KEKS PARTNER KOÇ LİSANSI':'ABONELİK GEREKLİ'} title={coach?'Aktif KEKS Partner Koç lisansı gerekli.':'Aktif abonelik gerekli.'} description={coach?'Partner Koç panelindeki profesyonel araçlara erişmek için aktif KEKS Partner Koç lisansı gerekir.':'Aktif abonelik olmadan abonelik kapsamındaki panel içerikleri gösterilmez.'}>
  <section className="section"><div className="card"><a className="btn primary" href="/abonelik-planlari">{coach?'Partner Koç Lisanslarını Gör':'Abonelik Planlarını Gör'}</a></div></section>
 </PortalShell>
}
