import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { ParentLoginForm } from '@/app/components/AuthForms';
import { PortalSectionTitle, PortalShell } from '@/app/components/PortalShell';
import { PanelNavigator } from '@/app/components/PanelNavigator';

function trDay(v:Date){
  return new Intl.DateTimeFormat('en-CA',{
    timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'
  }).format(v);
}

export default async function ParentPage() {
  const user=await currentUser();

  if(!user || user.role!=='PARENT' || !user.parentProfile || !user.parentProfile.active) {
    return <PortalShell
      active="veli"
      eyebrow="VELİ GİRİŞİ"
      title="Öğrencinin gelişimini sade ve güvenli biçimde takip et."
      description="Haftalık devamlılık, görev uygulama, çalışma süresi ve koç değerlendirmeleri tek panelde."
    >
      <section className="portalLoginGrid">
        <div className="portalLoginIntro">
          <span className="portalEyebrow">VELİ GELİŞİM PANELİ</span>
          <h2>Sonucu denetlemek yerine öğrenme davranışını destekle.</h2>
          <p>Veli paneli öğrencinin tek tek yanlışlarını veya ham test cevaplarını göstermez. Amaç; çalışma düzenini, sürekliliği ve koçun veliye açtığı rehberliği görünür kılmaktır.</p>
          <div className="portalLoginBullets">
            <span>Haftalık devamlılık ve görev tamamlama</span>
            <span>Çalışma süresi trendi ve program ritmi</span>
            <span>Koç notu ve veli için destek önerileri</span>
          </div>
        </div>
        <div className="card">
          <h2>Veli Girişi</h2>
          <p className="muted">Koç tarafından verilen öğrenci kodu ve KEKS Akademi veli giriş kodu ile giriş yapın.</p>
          <ParentLoginForm/>
        </div>
      </section>
    </PortalShell>;
  }

  if(!user.parentProfile.consentRecordedAt)return <PortalShell active="veli" eyebrow="VELİ ERİŞİMİ" title="Veli izni gerekli" description="Koçunuzdan izin kapsamı doğrulanmış yeni bir veli bağlantısı isteyin."><div className="card">Veriler henüz paylaşıma açık değil.</div></PortalShell>;

  const now=new Date();
  const sevenDaysAgo=new Date(now.getTime()-7*86400000);
  const fourteenDaysAgo=new Date(now.getTime()-14*86400000);

  const student=await db.student.findUnique({
    where:{id:user.parentProfile.studentId},
    include:{
      plans:{where:{active:true},orderBy:{updatedAt:'desc'},select:{id:true,title:true,updatedAt:true}},
      examResults:{orderBy:{createdAt:'desc'},take:5,select:{id:true,examType:true,createdAt:true}},
      studyTechniques:{where:{active:true},orderBy:{createdAt:'desc'},select:{id:true,title:true,description:true}},
      reports:{where:{visibleToParent:true,...(user.parentProfile.allowReports?{}:{id:'__hidden__'})},orderBy:{createdAt:'desc'},take:10},
      topicProgress:{select:{completed:true}},
      generatedContent:{where:{visibleToParent:true},orderBy:{createdAt:'desc'},take:20},
      coachingActions:{
        where:{taskDate:{gte:fourteenDaysAgo,lte:now}},
        select:{taskDate:true,status:true,submission:{select:{submittedAt:true,completionRate:true}}}
      },
      techniqueSessions:{
        where:{createdAt:{gte:fourteenDaysAgo,lte:now}},
        select:{createdAt:true,activeSeconds:true,completed:true}
      },
      weeklyReflections:{orderBy:{weekStart:'desc'},take:1,select:{weekStart:true,selfRating:true,bestThing:true,biggestChallenge:true,nextWeekChange:true}}
    }
  });
  if(!student) return null;

  const currentActions=student.coachingActions.filter(x=>x.taskDate&&x.taskDate>=sevenDaysAgo);
  const previousActions=student.coachingActions.filter(x=>x.taskDate&&x.taskDate<sevenDaysAgo);
  const completed=(rows:typeof currentActions)=>rows.filter(x=>x.submission||x.status==='COMPLETED').length;
  const completionRate=(rows:typeof currentActions)=>rows.length?Math.round(completed(rows)/rows.length*100):0;

  const currentSessions=student.techniqueSessions.filter(x=>x.createdAt>=sevenDaysAgo);
  const previousSessions=student.techniqueSessions.filter(x=>x.createdAt<sevenDaysAgo);
  const focusMinutes=(rows:typeof currentSessions)=>Math.round(rows.reduce((n,x)=>n+(x.activeSeconds||0),0)/60);
  const currentFocus=focusMinutes(currentSessions);
  const previousFocus=focusMinutes(previousSessions);
  const focusDelta=currentFocus-previousFocus;

  const activeDays=new Set<string>();
  for(const action of currentActions){
    if(action.submission)activeDays.add(trDay(action.submission.submittedAt));
  }
  for(const session of currentSessions){
    if((session.activeSeconds||0)>0)activeDays.add(trDay(session.createdAt));
  }

  const completedTopics=student.topicProgress.filter(x=>x.completed).length;
  const totalTopics=student.topicProgress.length;
  const progressRate=totalTopics?Math.round(completedTopics/totalTopics*100):0;
  const currentCompletion=completionRate(currentActions);
  const previousCompletion=completionRate(previousActions);
  const completionDelta=currentCompletion-previousCompletion;
  const latestCoachReport=student.reports[0]||null;
  const reflection=student.weeklyReflections[0]||null;
  const latestExam=student.examResults[0]||null;

  const parentDo=currentCompletion<60
    ?'Görev sayısını evde artırmaya çalışmayın. Düzenli çalışma saatini koruyun ve koçun program hacmini yeniden değerlendirmesine alan açın.'
    :activeDays.size<4
      ?'Belirli bir çalışma saatini ve dikkat dağıtmayan ortamı destekleyin; öğrencinin programa başlama ritmini güçlendirin.'
      :'Mevcut düzeni koruyun; tamamlanan çalışmayı fark edin ve öğrencinin kendi plan sorumluluğunu sürdürmesine alan bırakın.';
  const parentAvoid='Tek tek yanlışları sorgulamayın, deneme sonucunu ceza/ödül aracına çevirmeyin ve koç planına habersiz ek görev bindirmeyin.';

  return <PortalShell signedIn
    active="veli"
    eyebrow="VELİ PANELİ"
    title={student.fullName+' · Davranışsal Gelişim Özeti'}
    description="Sonuç baskısı yerine devamlılık, görev uygulama, çalışma süresi ve koç yönlendirmesini izleyin."
    meta={<><span>Kod: {student.studentCode}</span>{student.gradeLevel&&<span>{student.gradeLevel}</span>}<span>{activeDays.size}/7 aktif gün</span></>}
    wide
  >
    <section className="section">
      <PanelNavigator roleLabel="Veli" groups={[
        {label:'BU HAFTA',description:'Öğrencinin çalışma davranışını hızlıca gör.',items:[
          {href:'#veli-genel',title:'Haftalık Davranış Özeti',description:'Devamlılık, görev tamamlama ve çalışma süresi',badge:'ÖNCELİKLİ'}
        ]},
        {label:'VELİ REHBERLİĞİ',description:'Destek ver; baskı ve mikro-yönetim üretme.',items:[
          {href:'#veli-rehberligi',title:'Bu Hafta Ne Yapmalı?',description:'Koçluk çizgisini bozmadan destek önerileri'}
        ]},
        {label:'HEDEF & PLANLAMA',description:'Hedefi ve aktif çalışma düzenini genel düzeyde takip et.',items:[
          {href:'#hedef-plan',title:'Hedef & Program Ritmi',description:'Aktif planlar, deneme ritmi ve çalışma yaklaşımı'}
        ]},
        {label:'KOÇ DEĞERLENDİRMESİ',description:'Koçun veliye açtığı profesyonel notları gör.',items:[
          {href:'#koc-raporlari',title:'Koç Notları',description:'Paylaşıma açılmış gelişim değerlendirmeleri'}
        ]}
      ]}/>
    </section>

    <section id="veli-genel" className="section section-anchor">
      <PortalSectionTitle eyebrow="HAFTALIK DAVRANIŞ ÖZETİ" title="Bu hafta nasıl ilerledi?"/>
      <div className="grid">
        <div className="card"><div className="kpi">{activeDays.size}/7</div><div className="muted">Aktif çalışma günü</div></div>
        <div className="card"><div className="kpi">%{currentCompletion}</div><div className="muted">Görev tamamlama</div><small>{completionDelta===0?'Önceki haftayla aynı':(completionDelta>0?'+':'')+completionDelta+' puan önceki haftaya göre'}</small></div>
        <div className="card"><div className="kpi">{currentFocus}</div><div className="muted">Kayıtlı odak dakikası</div><small>{focusDelta===0?'Önceki haftayla aynı':(focusDelta>0?'+':'')+focusDelta+' dk önceki haftaya göre'}</small></div>
        <div className="card"><div className="kpi">%{progressRate}</div><div className="muted">İşaretlenmiş konu ilerlemesi</div></div>
      </div>
      {reflection&&<div className="card" style={{marginTop:14}}>
        <div className="moduleEyebrow">ÖĞRENCİNİN KENDİ DEĞERLENDİRMESİ</div>
        <p><strong>Bu hafta iyi giden:</strong> {reflection.bestThing||'Belirtilmedi'}</p>
        <p><strong>En çok zorlayan:</strong> {reflection.biggestChallenge||'Belirtilmedi'}</p>
        {reflection.nextWeekChange&&<p><strong>Gelecek hafta değiştirmek istediği:</strong> {reflection.nextWeekChange}</p>}
      </div>}
    </section>

    <section id="veli-rehberligi" className="section section-anchor">
      <PortalSectionTitle eyebrow="VELİ REHBERLİĞİ" title="Bu hafta ne yapmalı, ne yapmamalı?"/>
      <div className="grid" style={{gridTemplateColumns:'1fr 1fr'}}>
        <div className="card"><div className="moduleEyebrow">YAPIN</div><p>{parentDo}</p></div>
        <div className="card"><div className="moduleEyebrow">KAÇININ</div><p>{parentAvoid}</p></div>
      </div>
      {latestCoachReport&&<div className="card" style={{marginTop:14}}>
        <div className="moduleEyebrow">KOÇUN VELİYE NOTU</div>
        <strong>{latestCoachReport.title}</strong>
        {latestCoachReport.summary&&<p>{latestCoachReport.summary}</p>}
      </div>}
    </section>

    <section id="hedef-plan" className="section section-anchor">
      <div className="panelSectionBand"><div><small>HEDEF & PROGRAM RİTMİ</small><strong>Yönü görün, ayrıntıyı koç ve öğrenciye bırakın</strong><p>Veli paneli ham soru yanıtları ve ayrıntılı yanlış dökümlerini göstermez.</p></div><span>VELİ ÖZETİ</span></div>
      <div className="grid" style={{gridTemplateColumns:'1fr 1fr'}}>
        <div className="card"><h2>Hedef</h2><p>{student.goal||'Henüz hedef bilgisi eklenmedi.'}</p><p className="muted">Aktif plan: {student.plans.length} · Son deneme: {latestExam?latestExam.examType+' · '+latestExam.createdAt.toLocaleDateString('tr-TR'):'Henüz deneme kaydı yok'}</p></div>
        <div className="card"><h2>Aktif Çalışma Teknikleri</h2>{student.studyTechniques.length===0?<p className="muted">Henüz teknik yok.</p>:student.studyTechniques.map(t=><div key={t.id} style={{marginBottom:10}}><strong>{t.title}</strong><div className="muted">{t.description}</div></div>)}</div>
      </div>
      {student.plans.length>0&&<div className="card" style={{marginTop:14}}><h2>Aktif Programlar</h2>{student.plans.map(p=><div key={p.id} className="row" style={{justifyContent:'space-between'}}><strong>{p.title}</strong><span className="muted">{p.updatedAt.toLocaleDateString('tr-TR')}</span></div>)}</div>}
    </section>

    <section id="ogrenme-icerik" className="section section-anchor">
      <PortalSectionTitle eyebrow="ÖĞRENME & İÇERİK" title="Veliye Açılan Öğrenme İçerikleri"/>
      <div className="card">{student.generatedContent.length===0?<p className="muted">Henüz veliye açılmış içerik yok.</p>:<div className="grid">{student.generatedContent.map(x=><a className="card" key={x.id} href={'/icerik/'+x.id}><span className="pill">{x.type}</span><h3>{x.title}</h3><p className="muted">Kalite kontrolünden geçmiş paylaşım</p></a>)}</div>}</div>
    </section>

    <section id="koc-raporlari" className="section section-anchor">
      <PortalSectionTitle eyebrow="KOÇ DEĞERLENDİRMESİ" title="Veliye Açılmış Koç Notları"/>
      <div className="card">{student.reports.length===0?<p className="muted">Henüz veliye açık rapor yayınlanmadı.</p>:student.reports.map(r=><article key={r.id} style={{padding:'14px 0',borderBottom:'1px solid rgba(255,255,255,.08)'}}><strong>{r.title}</strong>{r.summary&&<p className="muted">{r.summary}</p>}<p>{r.content}</p></article>)}</div>
    </section>
  </PortalShell>;
}
