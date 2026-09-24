import { notFound } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { StudentWorkspaceForms } from '@/app/components/StudentWorkspaceForms';
import { TargetManager } from '@/app/components/TargetManager';
import { CoachAlerts } from '@/app/components/CoachAlerts';
import { CoachSmartPlan } from '@/app/components/CoachSmartPlan';
import { computeGoalProgress } from '@/lib/smartCoach';
import { CoachTrendSummary } from '@/app/components/CoachTrendSummary';
import { TechniqueUsageSummary } from '@/app/components/TechniqueUsageSummary';
import { PortalShell } from '@/app/components/PortalShell';
import { CoachOperationsHub } from '@/app/components/CoachOperationsHub';
import { CoachSessionWorkflow } from '@/app/components/CoachSessionWorkflow';
import { CoachPreInterviewSummary } from '@/app/components/CoachPreInterviewSummary';
import { AgsStudyArithmetic } from '@/app/components/AgsStudyArithmetic';
import { PanelNavigator } from '@/app/components/PanelNavigator';
import { displayExamGroupWithTrack,getAdultExamGroup,isAgsOabtStudentRecord } from '@/lib/agsExamOptions';
import { getOabtFieldApproval } from '@/lib/oabtFieldApproval';
import { CoachLiveApprovalSync } from '@/app/components/CoachLiveApprovalSync';
import { CoachOabtApprovalStatus } from '@/app/components/CoachOabtApprovalStatus';

export default async function CoachStudentPage({params}:{params:Promise<{id:string}>}) {
  const user=await currentUser();
  if(!user || (user.role!=='COACH'&&user.role!=='ADMIN') || !user.coachProfile) return notFound();
  const {id}=await params;
  const student=await db.student.findFirst({
    where:{id,coachId:user.coachProfile.id},
    include:{
      plans:{orderBy:{createdAt:'desc'},take:10},
      dailyLogs:{orderBy:{date:'desc'},take:10},
      examResults:{orderBy:{createdAt:'desc'},take:10},
      studyTechniques:{orderBy:{createdAt:'desc'},take:10},
      techniqueSessions:{orderBy:{createdAt:'desc'},take:30},
      reports:{orderBy:{createdAt:'desc'},take:10},
      libraryItems:{orderBy:{createdAt:'desc'},take:20},
      parentProfiles:{where:{active:true},select:{id:true,codeHint:true,createdAt:true}},
      targets:{where:{active:true},orderBy:{createdAt:'desc'},take:1},
      practiceLogs:{orderBy:{date:'desc'},take:30},
      topicProgress:{},
      reviewQueue:{where:{status:{in:['DUE','PENDING']}},orderBy:{dueAt:'asc'},include:{question:{select:{subject:true,topic:true,sourceKind:true}}}},
      preInterviewAttempts:{orderBy:{completedAt:'desc'},take:3,include:{form:{include:{questions:{orderBy:{orderNo:'asc'}}}}}},
      assessments:{orderBy:{completedAt:'desc'},take:5},
      weeklyReflections:{orderBy:{weekStart:'desc'},take:2}
    }
  });
  if(!student) return notFound();
  const goalProgress=await computeGoalProgress(student.id);
  const coachAssessments=student.assessments.filter(a=>['PLAN_ADMIN_APPROVED','COMPLETED'].includes(String(((a.report||{}) as any).workflowStatus||'')));
  const gradeLabel=(student.gradeLevel||'').toLocaleUpperCase('tr-TR');
  const adultExamGroup=getAdultExamGroup(student.gradeLevel);
  const isAgsOabt=isAgsOabtStudentRecord({gradeLevel:student.gradeLevel,academicTrack:student.academicTrack,profile:student.profile});
  const oabtApproval=getOabtFieldApproval(student.profile);
  const approvedOabtField=isAgsOabt&&oabtApproval.status==='APPROVED'?(oabtApproval.approvedField||student.academicTrack):null;
  const studentGroupLabel=isAgsOabt
    ?('AGS/ÖABT'+(approvedOabtField?' · '+approvedOabtField:''))
    :displayExamGroupWithTrack(student.gradeLevel,student.academicTrack);
  const showAgsStudyArithmetic=isAgsOabt&&Boolean(approvedOabtField)&&coachAssessments.length>0;
  const wrongTopicMap=new Map<string,{subject:string;topic:string;count:number;due:number}>();
  for(const row of student.reviewQueue){
    const q=row.question;
    if(!q||!String(q.sourceKind||'').startsWith('STUDENT_WRONG:'))continue;
    const key=q.subject+'||'+q.topic;
    const current=wrongTopicMap.get(key)||{subject:q.subject,topic:q.topic,count:0,due:0};
    current.count+=1;
    if(row.dueAt<=new Date())current.due+=1;
    wrongTopicMap.set(key,current);
  }
  const wrongTopicSummary=[...wrongTopicMap.values()].sort((a,b)=>b.count-a.count);

  return <PortalShell signedIn
    active="koc"
    eyebrow="KOÇ ÖĞRENCİ ÇALIŞMA ALANI"
    title={student.fullName}
    description="Program, hedef, deneme, teknik ve veli erişimini tek öğrenci çalışma alanından yönetin."
    meta={<><span>Öğrenci kodu: {student.studentCode}</span>{student.gradeLevel&&<span>{adultExamGroup?'Sınav grubu: ':'Düzey: '}{studentGroupLabel}</span>}{student.goal&&<span>Hedef tanımlı</span>}<a className="btn" href="/koc">← Öğrencilerim</a></>}
    wide
  >
    <CoachLiveApprovalSync/>
    {isAgsOabt&&<section className="section"><CoachOabtApprovalStatus studentId={student.id}/></section>}
    <nav className="tabs coachPrimaryTabs no-print" aria-label="Koç öğrenci çalışma alanı ana bölümleri">
      <a href="#egilim-taramasi">Profil & Değerlendirme</a>
      <a href="#program">Planlama & Performans</a>
      <a href="#seans-akisi">Koçluk & Müdahale</a>
      <a href="#calisma">Öğrenme & Tekrar</a>
      <a href="#aylik-gelisim">Raporlama & Gelişim</a>
      {showAgsStudyArithmetic&&<a href="#ags-calisma-aritmetigi">AGS / ÖABT</a>}
    </nav>

    <section className="section">
      <PanelNavigator roleLabel={'Koç · '+student.fullName} groups={[
        {label:'PROFİL & DEĞERLENDİRME',description:'Öğrenciyi tanı, yönetici onaylı verileri birlikte yorumla.',items:[
          {href:'#egilim-taramasi',title:'KEKS Eğilim Raporu',description:'Yönetici onaylı eğitsel profil ve davranış göstergeleri'},
          {href:'#ongorusme',title:'Ön Görüşme',description:'Öğrenci yanıtları, planlama girdileri ve onay akışı'}
        ]},
        {label:'PLANLAMA & PERFORMANS',description:'Hedefi programa dönüştür ve akademik sonucu izle.',items:[
          {href:'#program',title:'Kişisel Çalışma Planı',description:student.plans.filter(x=>x.active).length+' aktif plan'},
          {href:'#denemeler',title:'Deneme & Soru Performansı',description:student.examResults.length+' deneme · '+student.practiceLogs.length+' soru çözüm kaydı'},
          {href:'#hedef',title:'Hedef Yönetimi',description:student.goal?'Hedef tanımlı':'Hedef bilgisi bekleniyor'}
        ]},
        {label:'KOÇLUK & MÜDAHALE',description:'Görüşme, aksiyon ve risk müdahalelerini yönet.',items:[
          {href:'#seans-akisi',title:'Seans Akışı',description:'Görüşme öncesi brifing ve haftalık değişim'},
          {href:'#operasyon',title:'Seans & Aksiyon',description:'Takvim, görev, analitik ve koçluk operasyonları'}
        ]},
        {label:'ÖĞRENME & TEKRAR',description:'Yanlış, teknik ve tekrar yoğunluğunu takip et.',items:[
          {href:'#calisma',title:'Çalışma & Tekrar',description:student.reviewQueue.filter(x=>x.dueAt<=new Date()).length+' vadesi gelmiş tekrar'},
          {href:'#teknikler',title:'Teknik Kullanımı',description:student.techniqueSessions.length+' yakın dönem teknik oturumu'}
        ]},
        {label:'RAPORLAMA & PAYLAŞIM',description:'Aylık gelişimi, raporları ve veli erişimini yönet.',items:[
          {href:'#aylik-gelisim',title:'Aylık Gelişim',description:student.weeklyReflections[0]?'Öz değerlendirme verisi hazır':'Veri birikimi bekleniyor'},
          {href:'#raporlar',title:'Raporlar & Kütüphane',description:student.reports.length+' rapor · '+student.libraryItems.length+' kütüphane kaydı'},
          {href:'#veli',title:'Veli Erişimi',description:student.parentProfiles.length+' aktif veli erişimi'}
        ]},
        ...(showAgsStudyArithmetic?[{label:'AGS / ÖABT UZMANLIK ALANI',description:'Yönetici onaylı AGS/ÖABT öğrenci stratejisi.',items:[
          {href:'#ags-calisma-aritmetigi',title:'AGS Çalışma Aritmetiği',description:'Ders sırası, uygulama, analiz ve tekrar sistemi',badge:'ÖZEL'}
        ]}]:[])
      ]}/>
    </section>
    <section className="section"><CoachSmartPlan studentId={student.id} goalPercent={goalProgress.percent} goalLabel={goalProgress.label}/></section>
    <section className="section"><CoachAlerts studentId={student.id}/></section>
    <section className="section"><CoachTrendSummary exams={student.examResults.slice().reverse().map(x=>({createdAt:x.createdAt.toISOString(),examType:x.examType,payload:x.payload}))} reviewDue={student.reviewQueue.filter(x=>x.dueAt<=new Date()).length}/></section>
    <section id="egilim-taramasi" className="section section-anchor">
      <div className="stack">
        <div>
          <div className="moduleEyebrow">KOÇA ÖZEL</div>
          <h2>Yönetici Onaylı KEKS Eğilim Raporu</h2>
          <p className="muted">Ayrıntılı eğilim raporu, ön görüşme ve plan yönetici tarafından onaylanıp koça gönderildikten sonra burada görünür.</p>
        </div>
        {coachAssessments.length===0?<div className="card"><p className="muted">Henüz yönetici tarafından koça gönderilmiş KEKS değerlendirmesi yok.</p></div>:coachAssessments.map(a=>{
          const scores=(a.scores||{}) as Record<string,number>;
          const report=(a.report||{}) as any;
          return <article className="card" key={a.id}>
            <div className="moduleHeaderRow">
              <div><div className="moduleEyebrow">TARAMA KAYDI</div><h3>{report.title||'KEKS Eğitsel Çalışma ve Öz-Düzenleme Eğilimleri Taraması'}</h3><p className="muted">{new Date(a.completedAt).toLocaleString('tr-TR')} · {a.formVersion}</p></div>
              <span className="pill">KOÇA ÖZEL</span>
            </div>
            <div className="interviewScoreGrid">
              {Object.entries(scores).sort((x,y)=>Number(y[1])-Number(x[1])).map(([name,value])=><div className="briefMetric" key={name}><b>{Number(value).toFixed(2)}</b><span>{name}</span></div>)}
            </div>
            {Array.isArray(report.leadingDimensions)&&report.leadingDimensions.length>0&&<div className="notice"><strong>Öne çıkan eğilimler:</strong> {report.leadingDimensions.map((x:any)=>x.name+' '+Number(x.score).toFixed(2)+'/5').join(' · ')}</div>}
            {report.habitScores&&<><h3>Çalışma Alışkanlıkları</h3><div className="interviewScoreGrid">{Object.entries(report.habitScores).map(([name,value]:any)=><div className="briefMetric" key={name}><b>{Number(value).toFixed(2)}</b><span>{name}</span></div>)}</div></>}
            {report.developmentSummary?.immediateActions?.length>0&&<div className="notice"><strong>Gelişim öncelikleri</strong>{report.developmentSummary.immediateActions.map((x:string,i:number)=><div key={i}>{i+1}. {x}</div>)}</div>}
            {report.disclaimer&&<p className="muted">{String(report.disclaimer)}</p>}
            <details style={{marginTop:12}}>
              <summary><strong>Ayrıntılı sonuç verisini görüntüle</strong></summary>
              <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{JSON.stringify(report,null,2)}</pre>
            </details>
            <details style={{marginTop:10}}>
              <summary><strong>Öğrencinin cevaplarını görüntüle</strong></summary>
              <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{JSON.stringify(a.answers,null,2)}</pre>
            </details>
          </article>
        })}
      </div>
    </section>
    <section id="ongorusme" className="section section-anchor"><CoachPreInterviewSummary studentId={student.id}/></section>
    {showAgsStudyArithmetic&&<section id="ags-calisma-aritmetigi" className="section section-anchor"><AgsStudyArithmetic studentName={student.fullName} field={approvedOabtField}/></section>}
    <section id="seans-akisi" className="section section-anchor"><CoachSessionWorkflow studentId={student.id}/></section>
    <section id="operasyon" className="section section-anchor"><CoachOperationsHub studentId={student.id}/></section>
    <section id="genel" className="grid section-anchor">
      <div className="card"><div className="kpi">{student.plans.length}</div><div className="muted">Program</div></div>
      <div className="card"><div className="kpi">{student.examResults.length}</div><div className="muted">Deneme</div></div>
      <div className="card"><div className="kpi">{student.reports.length}</div><div className="muted">Rapor</div></div>
      <div className="card"><div className="kpi">{student.practiceLogs.length}</div><div className="muted">Soru çözüm kaydı</div></div>
    </section>
    <section id="program" className="section section-anchor"><StudentWorkspaceForms studentId={student.id}/></section>

    <section className="section">
      <div className="card">
        <div className="moduleHeaderRow"><div><div className="moduleEyebrow">YANLIŞ SORU KONU HARİTASI</div><h2>Öğrencinin tekrar yoğunluğu</h2><p className="muted">Öğrencinin günlük yüklediği yanlış sorular, otomatik konu sınıflandırmasına göre burada gruplanır.</p></div><span className="pill">{student.reviewQueue.filter(x=>String(x.question?.sourceKind||'').startsWith('STUDENT_WRONG:')).length} aktif yanlış</span></div>
        {wrongTopicSummary.length===0?<p className="muted">Henüz öğrenci tarafından yüklenmiş aktif yanlış soru bulunmuyor.</p>:<div className="wrongTopicCoachGrid">{wrongTopicSummary.slice(0,12).map(x=><div key={x.subject+'-'+x.topic}><span>{x.subject}</span><strong>{x.topic}</strong><small>{x.count} soru · {x.due} bugün tekrar</small></div>)}</div>}
      </div>
    </section>

    <section className="section"><TechniqueUsageSummary sessions={student.techniqueSessions}/></section>
    <section id="calisma" className="section section-anchor"><h2>Mevcut Kayıtlar</h2>
      <div className="grid">
        <div className="card"><h3>Programlar</h3>{student.plans.map(p=><div key={p.id} style={{marginBottom:10}}><strong>{p.title}</strong><div className="muted">{JSON.stringify(p.payload)}</div></div>)}</div>
        <div id="teknikler" className="card section-anchor"><h3>Teknikler</h3>{student.studyTechniques.map(t=><div key={t.id} style={{marginBottom:10}}><strong>{t.title}</strong><div className="muted">{t.description}</div></div>)}</div>
        <div id="denemeler" className="card section-anchor"><h3>Denemeler</h3>{student.examResults.map(x=><div key={x.id} style={{marginBottom:10}}><strong>{x.examType}</strong><div className="muted">{JSON.stringify(x.payload)}</div></div>)}</div>
      </div>
    </section>

    <section id="aylik-gelisim" className="section section-anchor">
      <div className="card">
        <div className="moduleHeaderRow"><div><div className="moduleEyebrow">AYLIK GELİŞİM VE DEĞERLENDİRME</div><h2>Davranışsal gelişim ve öğrenci öz değerlendirmesi</h2><p className="muted">Başlangıç eğilim profilinden ayrı olarak süreklilik, odak, görev, tekrar ve öğrenci öz değerlendirmesindeki değişimi takip edin.</p></div><span className="pill">{student.weeklyReflections.length} yakın dönem kayıt</span></div>
        {student.weeklyReflections.length===0?<p className="muted">Öğrenci henüz haftalık öz değerlendirme göndermedi. Aylık değerlendirme için yeterli veri birikince burada görünür.</p>:<div className="stack">{student.weeklyReflections.map((x:any)=><div className="monthlyCoachReflection" key={x.id}>
          <div><strong>{new Date(x.weekStart).toLocaleDateString('tr-TR')} haftası</strong><span>Öz puan: {x.selfRating}/5</span></div>
          <p>{x.bestThing?'Gelişen: '+x.bestThing:'Gelişen alan belirtilmedi.'}</p>
          <p>{x.biggestChallenge?'Zorlanma: '+x.biggestChallenge:'Zorlanma alanı belirtilmedi.'}</p>
          {x.nextWeekChange&&<p><strong>Sonraki değişim hedefi:</strong> {x.nextWeekChange}</p>}
        </div>)}</div>}
      </div>
    </section>

    <section id="raporlar" className="section section-anchor"><div className="grid" style={{gridTemplateColumns:'2fr 1fr'}}>
      <div className="card"><h2>Raporlar</h2>{student.reports.length===0?<p className="muted">Henüz rapor yok.</p>:student.reports.map(r=><article key={r.id} style={{padding:'12px 0',borderBottom:'1px solid var(--line)'}}><strong>{r.title}</strong><p className="muted">{r.summary}</p><p>{r.content}</p><a className="btn" href={'/koc/ogrenci/'+student.id+'/rapor/'+r.id}>Raporu Yazdır</a></article>)}</div>
      <div id="kutuphane" className="card section-anchor"><h2>Kütüphane</h2>{student.libraryItems.length===0?<p className="muted">Henüz kayıt yok.</p>:student.libraryItems.map(i=><div key={i.id} style={{marginBottom:14}}><strong>{i.title}</strong>{i.note&&<div className="muted">{i.note}</div>}{i.fileName&&<a href={'/api/library/'+i.id}>Dosyayı Aç · {i.fileName}</a>}</div>)}</div>
    </div></section>
    <section id="hedef" className="section section-anchor"><TargetManager studentId={student.id} initial={student.targets[0]||null}/></section>
    <section id="veli" className="section section-anchor"><div className="card"><h2>Veli Erişimi</h2><p className="muted">Aktif veli erişimi: {student.parentProfiles.length}</p><p>Yeni veya yenilenmiş veli giriş kodunu yukarıdaki “Veli Girişi Oluştur” bölümünden oluşturabilirsiniz.</p></div></section>
  </PortalShell>;
}
