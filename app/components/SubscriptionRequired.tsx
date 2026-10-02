import { PortalShell } from './PortalShell';
export function SubscriptionRequired({role}:{role:'STUDENT'|'COACH'}){
 return <PortalShell signedIn active={role==='STUDENT'?'ogrenci':'koc'} eyebrow="ABONELİK GEREKLİ" title="Aktif abonelik gerekli." description="Aktif abonelik olmadan abonelik kapsamındaki panel içerikleri gösterilmez.">
  <section className="section"><div className="card"><a className="btn primary" href="/abonelik-planlari">Abonelik Planlarını Gör</a></div></section>
 </PortalShell>
}
