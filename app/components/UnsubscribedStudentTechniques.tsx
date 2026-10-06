import { PortalSectionTitle,PortalShell } from './PortalShell';
import { StudyTechniqueLab } from './StudyTechniqueLab';

export function UnsubscribedStudentTechniques({
 fullName,
 initialPreferences,
 starterPlan
}:{fullName:string;initialPreferences:any;starterPlan?:any}){
 const plan=starterPlan&&typeof starterPlan==='object'&&!Array.isArray(starterPlan)?starterPlan:null;
 return <PortalShell signedIn active="ogrenci" eyebrow="BAŞLANGIÇ PLANI" title={'Merhaba, '+fullName} description="İlk 7 günlük başlangıç planın aktif. Çalışma teknikleri abonelik olmadan da kullanılabilir." wide>
  {plan&&<section className="section section-anchor">
   <PortalSectionTitle eyebrow="İLK 7 GÜN" title="Başlangıç Planın" description={String(plan.explanation||'KEKS ilk hafta çalışma düzenini başlangıç verilerine göre oluşturdu.')}/>
   <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))'}}>
    {Array.isArray(plan.days)&&plan.days.map((day:any)=><article className="card" key={day.date}>
     <span className="portalEyebrow">{day.day}. GÜN</span>
     <h3>{day.dayName} · {day.date}</h3>
     <p className="muted">{day.dailyMinutes} dk · {day.studyWindow}</p>
     <div className="stack">
      {Array.isArray(day.tasks)&&day.tasks.map((task:any,index:number)=><div className="notice" key={index}>
       <strong>{task.title}</strong>
       <div className="muted">{task.minutes} dk{task.questions>0?' · '+task.questions+' soru':''}</div>
      </div>)}
     </div>
    </article>)}
   </div>
  </section>}
  <section id="ogrenme-tekrar" className="section section-anchor">
   <PortalSectionTitle eyebrow="ÇALIŞMA TEKNİKLERİ" title="Ders Çalışma Teknikleri" description="Pomodoro, aktif hatırlama, Feynman ve diğer çalışma tekniklerini uygula."/>
   <StudyTechniqueLab initialPreferences={initialPreferences}/>
  </section>
 </PortalShell>
}
