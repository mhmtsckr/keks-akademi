import { PortalShell } from './PortalShell';
export function SubscriptionRequired({role}:{role:'STUDENT'|'COACH'}){
 return <PortalShell signedIn active={role==='STUDENT'?'ogrenci':'koc'} eyebrow="ABONELİK GEREKLİ" title="KEKS araçlarını kullanmak için aktif bir plan seçin." description="Aktif abonelik olmadan panel özellikleri açılmaz. KEKS Akademi özelliklerini inceleyebilir ve size uygun abonelik planını seçebilirsiniz.">
  <section className="section"><div className="card"><h2>Henüz aktif aboneliğiniz yok</h2><p className="muted">Plan erişimi yalnız doğrulanmış aktif abonelik kaydıyla açılır.</p><div className="row"><a className="btn primary" href="/abonelik-planlari">Abonelik Planlarını Gör</a><a className="btn" href="/ozellikler">KEKS Akademi Özellikleri</a></div></div></section>
 </PortalShell>
}
