import { PortalSectionTitle,PortalShell } from './PortalShell';
import { StudyTechniqueLab } from './StudyTechniqueLab';

export function UnsubscribedStudentTechniques({fullName,initialPreferences}:{fullName:string;initialPreferences:any}){
 return <PortalShell signedIn active="ogrenci" eyebrow="ÇALIŞMA TEKNİKLERİ" title={'Merhaba, '+fullName} description="Aktif abonelik olmadan yalnızca çalışma teknikleri kullanılabilir." wide>
  <section id="ogrenme-tekrar" className="section section-anchor">
   <PortalSectionTitle eyebrow="ÇALIŞMA TEKNİKLERİ" title="Ders Çalışma Teknikleri" description="Pomodoro, aktif hatırlama, Feynman ve diğer çalışma tekniklerini uygula."/>
   <StudyTechniqueLab initialPreferences={initialPreferences}/>
  </section>
 </PortalShell>
}
