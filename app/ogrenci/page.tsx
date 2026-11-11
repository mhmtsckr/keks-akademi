import {redirect} from 'next/navigation';
import { StudentMicroLearning } from '@/app/components/StudentMicroLearning';
import { StudentWeeklyReflection } from '@/app/components/StudentWeeklyReflection';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { StudentLoginForm, StudentRegisterForm } from '@/app/components/AuthForms';
import { StudentProgressTools } from '@/app/components/StudentProgressTools';
import { AcademicPerformanceCenter } from '@/app/components/AcademicPerformanceCenter';
import { AdaptiveRecommendation } from '@/app/components/AdaptiveRecommendation';
import { SmartCoachDashboard } from '@/app/components/SmartCoachDashboard';
import { StudyTechniqueLab } from '@/app/components/StudyTechniqueLab';
import { PortalSectionTitle, PortalShell } from '@/app/components/PortalShell';
import { getStudentFeatureSnapshot } from '@/lib/systemConfig';
import { StudentEngagementHub } from '@/app/components/StudentEngagementHub';
import { StudentDailyTasks } from '@/app/components/StudentDailyTasks';
import { StudentCommandCenter } from '@/app/components/StudentCommandCenter';
import { StudentWrongQuestionBank } from '@/app/components/StudentWrongQuestionBank';
import { StudentPersonalQuestionBank } from '@/app/components/StudentPersonalQuestionBank';
import { PanelNavigator } from '@/app/components/PanelNavigator';
import { StudentDevelopmentTimeline } from '@/app/components/StudentDevelopmentTimeline';
import { MonthlyDevelopmentReport } from '@/app/components/MonthlyDevelopmentReport';
import { displayExamGroupWithTrack,getAdultExamGroup,isAgsOabtStudentRecord } from '@/lib/agsExamOptions';
import { getEffectiveOabtField } from '@/lib/oabtFieldApproval';
import { StudentOabtFieldApproval } from '@/app/components/StudentOabtFieldApproval';
import { AccountSecurity } from '@/app/components/AccountSecurity';
import { StudentTodayPlan } from '@/app/components/StudentTodayPlan';
import { StudentResourceTracker } from '@/app/components/StudentResourceTracker';
import { StudentSmartNotifications } from '@/app/components/StudentSmartNotifications';
import { StudentGoalDistance } from '@/app/components/StudentGoalDistance';
import { buildGoalDistance } from '@/lib/learningEngine';
import { buildLatestExamInterventionReport } from '@/lib/examIntervention';
import { StudentExamInterventionReport } from '@/app/components/StudentExamInterventionReport';
import { StudentExamMap } from '@/app/components/StudentExamMap';
import { StudentMobileQuickActions } from '@/app/components/StudentMobileQuickActions';
import { KeksCoreLoop } from '@/app/components/KeksCoreLoop';
import { buildStudentExamMap } from '@/lib/examMap';
import { isStudentOnboardingRequired } from '@/lib/studentOnboarding';
import { publicEducationCurriculum } from '@/lib/educationCurriculumMap';
import { educationLevelKey } from '@/lib/educationLevelProfile';
import { RealUserReviewPrompt } from '@/app/components/RealUserReviewPrompt';
import { MizaLearningOrchestrator } from '@/app/components/MizaLearningOrchestrator';
import { StudentActionHub } from '@/app/components/StudentActionHub';
import { StudentMasteryOverview } from '@/app/components/StudentMasteryOverview';

function str(v:unknown):string{return v==null?'':typeof v==='string'?v:String(v);}

const LOG_TYPE_LABELS:Record<string,string>={
  REVIEW_RESULT:'Tekrar Sonucu',MICRO_RESULT:'Mikro Öğrenme',MICRO_STARTED:'Mikro Öğrenme (devam)',
  GUIDED_PRACTICE_RESULT:'Rehberli Çalışma',GUIDED_PRACTICE_STARTED:'Rehberli Çalışma (devam)',
  MIZA_TODAY_TASK_RESULT:'MİZA Görev Sonucu',LEARNING_METRIC:'Öğrenme Metriği',
  WRONG_REFLECTION:'Yanlış Soru Analizi',QUESTION_BOOKMARK:'Soru İşareti',
  TYMM_PERFORMANCE_SUBMISSION:'Performans Görevi',TYMM_PERFORMANCE_REVIEWED:'Performans (Değerlendirildi)',
  TYMM_TRANSFER_SUBMISSION:'Transfer Görevi',TYMM_TRANSFER_REVIEWED:'Transfer (Değerlendirildi)',
  TYMM_RUBRIC_ACTION:'Rubrik Aksiyonu',COACH_INTERVENTION:'Koç Müdahalesi',
};

function formatDailyLog(payload:unknown):string{
  if(!payload||typeof payload!=='object')return str(payload);
  const p=payload as Record<string,unknown>;
  const label=LOG_TYPE_LABELS[str(p.type)]||str(p.type);
  const parts:string[]=[label];
  if(p.subject)parts.push(str(p.subject));
  if(p.topic)parts.push(str(p.topic));
  if(p.correct!=null||p.wrong!=null)parts.push(`${p.correct??0}D ${p.wrong??0}Y`);
  if(p.durationSeconds)parts.push(Math.round(Number(p.durationSeconds)/60)+'dk');
  if(p.completed!=null)parts.push(p.completed?'Tamamlandı':'Devam ediyor');
  return parts.join(' · ')||str(payload);
}

function formatExamResult(payload:unknown):string{
  if(!payload||typeof payload!=='object')return str(payload);
  const p=payload as Record<string,unknown>;
  const parts:string[]=[];
  if(p.totalNet!=null||p.net!=null)parts.push((p.totalNet??p.net)+' net');
  if(p.score!=null)parts.push(p.score+' puan');
  if(p.usedDurationMinutes)parts.push(p.usedDurationMinutes+' dk');
  if(p.percentile!=null)parts.push('%'+p.percentile+' dilim');
  return parts.join(' · ')||str(payload);
}

function formatPlanSummary(payload:unknown):string{
  if(!payload||typeof payload!=='object')return str(payload);
  const p=payload as Record<string,unknown>;
  const days=Array.isArray(p.days)?p.days:[];
  if(!days.length)return str(p.explanation||payload);
  const totalTasks=days.reduce((n:number,d:any)=>n+(Array.isArray(d.tasks)?d.tasks.length:0),0);
  const totalMin=days.reduce((n:number,d:any)=>n+(Array.isArray(d.tasks)?d.tasks.reduce((m:number,t:any)=>m+(Number(t.duration)||0),0):0),0);
  return `${days.length} gün · ${totalTasks} görev · ~${totalMin} dk toplam`;
}

function formatProfile(v:unknown):string{
  if(!v||typeof v!=='object')return str(v);
  const p=v as Record<string,unknown>;
  const parts:string[]=[];
  if(p.status)parts.push(str(p.status)==='COMPLETED'?'Profil tamamlandı':'Profil devam ediyor');
  if(p.inputs&&typeof p.inputs==='object'){
    const inp=p.inputs as Record<string,unknown>;
    if(inp.goal)parts.push('Hedef: '+str(inp.goal));
    if(inp.gradeLevel)parts.push(str(inp.gradeLevel));
  }
  return parts.join(' · ')||str(v);
}

export default async function StudentPage() {
  const user = await currentUser();

  if (!user || user.role !== 'STUDENT' || !user.student) {
    return <PortalShell
      active="ogrenci"
      eyebrow="ÖĞRENCİ GİRİŞİ"
      title="Kendi öğrenme yolculuğuna giriş yap."
      description="Programların, hedeflerin, testlerin, tekrarların ve çalışma tekniklerin tek bir panelde."
    >
      <section className="portalLoginGrid">
        <div className="portalLoginIntro">
          <span className="portalEyebrow">KEKS ÖĞRENCİ DENEYİMİ</span>
          <h2>Planını gör, çalışmanı uygula, gelişimini takip et.</h2>
          <p>Koçunun oluşturduğu programları takip et; Pomodoro ve diğer teknikleri doğrudan uygula, konu bazlı test çöz ve hedefe yaklaşma durumunu gör.</p>
          <div className="portalLoginBullets">
            <span>Eğitsel profil + eğitim düzeyine göre ön görüşme</span>
            <span>Yıllık → aylık → haftalık → günlük kişisel plan</span>
            <span>Akademik performans, 0–1–3–7–14–28. Gün Tekrar Sistemi ve aylık gelişim</span>
          </div>
        </div>
        <div className="stack">
          <div className="card"><h2>Öğrenci Girişi</h2><p className="muted">Kayıtlı e-posta adresiniz ve kendi oluşturduğunuz şifreyle giriş yapın.</p><StudentLoginForm/></div>
          <div className="card"><h2>Öğrenci Kaydı</h2><p className="muted">Bilgilerinizi girin ve güçlü şifrenizi oluşturun. Koç seçimi ile çalışma profili ilk giriş sihirbazında tamamlanır.</p><StudentRegisterForm/></div>
        </div>
      </section>
    </PortalShell>;
  }

  if(isStudentOnboardingRequired(user.student.profile))redirect('/ogrenci/baslangic');

  const student = await db.student.findUnique({
    where:{id:user.student.id},
    include:{
      plans:{where:{active:true},orderBy:{updatedAt:'desc'}},
      dailyLogs:{orderBy:{date:'desc'},take:120},
      examResults:{orderBy:{createdAt:'desc'},take:20},
      studyTechniques:{where:{active:true},orderBy:{createdAt:'desc'}},
      techniquePreferences:{},
      reports:{where:{visibleToStudent:true},orderBy:{createdAt:'desc'}},
      libraryItems:{orderBy:{createdAt:'desc'}},
      testAccesses:{where:{status:'READY'},orderBy:{createdAt:'asc'},take:1},
      assessments:{orderBy:{completedAt:'desc'},take:1},
      targets:{where:{active:true},orderBy:{createdAt:'desc'},take:1},
      topicProgress:{},
      practiceLogs:{orderBy:{date:'desc'},take:30},
    }
  });
  if (!student) return null;

  const [featureFlags,goalDistance,examInterventionReport,examMap]=await Promise.all([
    getStudentFeatureSnapshot(student.studentCode),
    buildGoalDistance(student.id),
    buildLatestExamInterventionReport(student.id),
    buildStudentExamMap(student.id)
  ]);
  const activeTarget = student.targets[0];
  const grade=(student.gradeLevel||'').toLowerCase();
  const levelKey=educationLevelKey(student.gradeLevel);
  const educationCurriculum=publicEducationCurriculum(student.gradeLevel,student.academicTrack);
  const isAgsOabt=isAgsOabtStudentRecord({gradeLevel:student.gradeLevel,academicTrack:student.academicTrack,profile:student.profile});
  const adultExamGroup=isAgsOabt?'AGS/ÖABT':getAdultExamGroup(student.gradeLevel);
  const schoolMap=educationCurriculum?.examType;
  const allowedExams:string[]=adultExamGroup==='AGS/ÖABT'?['AGS','OABT']:
    adultExamGroup==='AGS/YDS'?['AGS','YDS']:
    adultExamGroup==='KPSS'?['KPSS']:
    adultExamGroup==='ALES'?['ALES']:
    adultExamGroup==='DGS'?['DGS']:
    adultExamGroup==='YDS'||adultExamGroup==='YÖKDİL'?['YDS']:
    levelKey==='MIDDLE_8'?[schoolMap||'ORTAOKUL_8','LGS']:
    levelKey==='HIGH_910'?[schoolMap||'LISE_9_10','TYT']:
    levelKey==='HIGH_11'?[schoolMap||'LISE_11','TYT','AYT']:
    levelKey==='HIGH_12'?[schoolMap||'LISE_12','TYT','AYT']:
    levelKey==='GRADUATE_YKS'?['TYT','AYT']:
    schoolMap?[schoolMap]:
    (grade.includes('8')?['LGS']:['TYT','AYT']);
  const defaultWrongExam=adultExamGroup||(grade.includes('8')||grade.includes('ortaokul')?'LGS':'TYT');
  const oabtField=isAgsOabt?getEffectiveOabtField(student.academicTrack,student.profile):null;
  const studentGroupLabel=isAgsOabt
    ?('AGS/ÖABT'+(oabtField?'- '+oabtField:''))
    :displayExamGroupWithTrack(student.gradeLevel,student.academicTrack);
  const ordinaryLibraryItems=student.libraryItems.filter(i=>!String(i.note||'').startsWith('KEKS_RESOURCE_V1:'));
  const learningMetricByPracticeId=new Map<string,Record<string,any>>();
  for(const log of student.dailyLogs){
    const payload=(log.payload&&typeof log.payload==='object'&&!Array.isArray(log.payload)?log.payload:{}) as Record<string,any>;
    if(payload.type==='LEARNING_METRIC'&&typeof payload.practiceLogId==='string') learningMetricByPracticeId.set(payload.practiceLogId,payload);
  }

  return <PortalShell signedIn
    active="ogrenci"
    eyebrow="ÖĞRENCİ PANELİ"
    title={'Merhaba, '+student.fullName}
    description="Bugünkü çalışmalarını başlat, hedefini kontrol et ve gelişimini tek ekrandan yönet."
    meta={<><span>Kod: {student.studentCode}</span>{student.gradeLevel&&<span>{adultExamGroup?'Sınav grubu: ':'Düzey: '}{studentGroupLabel}</span>}<span>{student.plans.length} aktif program</span></>}
    wide
  >
    <StudentMobileQuickActions examTypes={[...allowedExams]}/>

    {featureFlags.TODAY_PLAN&&<section id="sonraki-aksiyon" className="section section-anchor">
      <StudentActionHub/>
    </section>}

    {featureFlags.MIZA_ORCHESTRATOR&&featureFlags.TODAY_PLAN&&<section id="miza-orkestrator" className="section section-anchor">
      <MizaLearningOrchestrator/>
    </section>}

    <section id="konu-hakimiyeti" className="section section-anchor">
      <StudentMasteryOverview/>
    </section>

    <section className="section">
      <details className="card">
        <summary>Bugünün ayrıntıları ve diğer öğrenci araçları</summary>
        <div className="stack" style={{marginTop:16}}>
          <KeksCoreLoop compact/>
          {featureFlags.TODAY_PLAN&&<div id="bugunun-plani" className="section-anchor"><StudentTodayPlan/></div>}
          {featureFlags.MICRO_LEARNING&&<div id="mikro-ogrenme" className="section-anchor"><StudentMicroLearning/></div>}
          <div id="haftalik-oz-degerlendirme" className="section-anchor"><StudentWeeklyReflection/></div>
          {featureFlags.SMART_NOTIFICATIONS&&<div id="akilli-bildirimler" className="section-anchor"><StudentSmartNotifications/></div>}
          <div id="genel-bakis" className="section-anchor"><StudentCommandCenter/></div>
          <div id="gunluk-gorevler" className="section-anchor"><PortalSectionTitle eyebrow="BUGÜN" title="Günlük Görevlerim" description="Koçunuzun verdiği görevleri soru sonuçlarıyla birlikte kaydedin."/><StudentDailyTasks/></div>
          <RealUserReviewPrompt/>
        </div>
      </details>
    </section>

    <section className="section"><details className="card"><summary>Diğer bölümler ve ayrıntılı araçlar</summary>
      <PanelNavigator roleLabel="Öğrenci" groups={[
        {label:'BUGÜN & PLANLAMA',description:'Önce tek doğru aksiyon; ayrıntılar yalnız gerektiğinde açılır.',items:[
          ...(featureFlags.TODAY_PLAN?[{href:'#sonraki-aksiyon',title:'Sonraki En Doğru Aksiyon',description:'KEKS verisine göre şimdi yapılacak tek işi gösterir',badge:'ÖNCE BUNU'}]:[]),
          ...(featureFlags.MIZA_ORCHESTRATOR&&featureFlags.TODAY_PLAN?[{href:'#miza-orkestrator',title:'MİZA Öğrenme Orkestratörü',description:'Bugünkü sırayı çıkarır ve çalışma sonucunu KEKS’e kaydeder',badge:'MİZA'}]:[]),
          ...(featureFlags.TODAY_PLAN?[{href:'#bugunun-plani',title:'Bugünün Planı',description:'Gerçek kapasiteye göre sıralanmış günlük akış',badge:'ŞİMDİ'}]:[]),
          ...(featureFlags.SMART_NOTIFICATIONS?[{href:'#akilli-bildirimler',title:'Akıllı Bildirimler',description:'Yalnız eylem gerektiren çalışma sinyalleri'}]:[]),
          {href:'#genel-bakis',title:'Kontrol Merkezi',description:'Bugünkü durum ve hızlı aksiyonlar'},
          {href:'#gunluk-gorevler',title:'Günlük Görevler',description:'Koç görevleri ve günlük kayıt'},
          {href:'#haftalik-oz-degerlendirme',title:'Haftalık Öz Değerlendirme',description:'Her pazar 5 kısa soruyla haftanı değerlendir',badge:'PAZAR'},
          {href:'#programlar',title:'Kişisel Planlar',description:'Yıllık, aylık, haftalık ve günlük plan'}
        ]},
        {label:'ÖĞRENME & TEKRAR',description:'Yanlışları kapat, bilgiyi kalıcı hâle getir.',items:[
          {href:'#konu-hakimiyeti',title:'Konu Hâkimiyeti',description:'Yeni → Öğreniliyor → Pekiştiriliyor → Kalıcı → Riskli',badge:'AÇIKLANABİLİR'},
          {href:'#yanlis-soru-bankasi',title:'Yanlış Soru Bankası',description:'Fotoğraf/metin yükle ve tekrar görevine dönüştür',badge:'0–1–3–7–14–28'},
          {href:'#ogrenme-tekrar',title:'Çalışma Teknikleri',description:'Pomodoro, aktif hatırlama, Feynman ve diğer teknikler'}
        ]},
        {label:'AKADEMİK PERFORMANS',description:'Net, konu, doğruluk, kaynak ve hedef gelişimini izle.',items:[
          {href:'#sinav-haritasi',title:'ÖSYM/MEB Sınav Haritası',description:'Ders → konu → alt konu → kazanım → soru tipi',badge:'YENİ'},
          {href:'#hedef-mesafe',title:'Hedefe Kalan Mesafe',description:'Hedef net farkı, konu açığı ve en yüksek katkı sağlayacak dersler',badge:'YENİ'},
          {href:'#deneme-raporu',title:'Otomatik Deneme Raporu',description:'Değişim, net katkısı/kaybı, süre ve 7 günlük müdahale planı',badge:'OTOMATİK'},
          ...(featureFlags.SMART_COACH?[{href:'#akilli-koc',title:'Akıllı Koç',description:'Hedefe yaklaşma, trend ve haftalık öneriler'}]:[]),
          {href:'#akademik-performans',title:'Konu & Soru Analizi',description:'Doğru, yanlış, boş, net ve hata nedenleri'},
          {href:'#kaynak-takibi',title:'Kaynak Takibi',description:'Kitap, konu, sayfa, soru ve doğruluk takibi',badge:'YENİ'}
        ]},
        ...(featureFlags.GAMIFICATION?[{label:'KOÇLUK & OYUNLAŞTIRMA',description:'Koçluk aksiyonları, seanslar, XP ve mikro tekrar.',items:[
          {href:'#kocluk-oyunlastirma',title:'Koçluk & Oyunlaştırma',description:'Aksiyon, seans, XP, rozet ve mikro tekrar'}
        ]}]:[]),
        {label:'RAPORLAR & KAYITLAR',description:'Geçmiş çalışmalar, denemeler ve koç raporları.',items:[
          {href:'#aylik-keks-gelisim-raporu',title:'Aylık KEKS Gelişim Raporu',description:'Akademik, davranış, tekrar ve gelecek ay hedefleri',badge:'CANLI'},
          {href:'#gelisim-zaman-cizelgesi',title:'Gelişim Zaman Çizelgem',description:'Son bir yıllık KEKS yolculuğunu kronolojik gör',badge:'YENİ'},
          {href:'#kayitlar-raporlar',title:'Kayıtlar & Raporlar',description:'Çalışma geçmişi, denemeler, raporlar ve kütüphane'}
        ]},
        {label:'TEST & DEĞERLENDİRME',description:'KEKS aylık değerlendirme ürünleri.',items:[
          ...(isAgsOabt?[{href:'#oabt-alani',title:'ÖABT Alanı',description:oabtField?('AGS/ÖABT- '+oabtField):'Alanınızı seçip kaydedin',badge:oabtField?'KİLİTLİ':'ZORUNLU'}]:[]),
          {href:'#keks-egilim-taramasi',title:'Aylık KEKS Test Ürünü',description:'Eğilim taraması ve ön görüşme',badge:'AYLIK'}
        ]}
      ]}/></details>
    </section>

    {isAgsOabt&&<section id="oabt-alani" className="section section-anchor">
      <PortalSectionTitle
        eyebrow="AGS/ÖABT PROFİLİ"
        title={oabtField?('AGS/ÖABT- '+oabtField):'ÖABT Alanı'}
        description={oabtField
          ?'Kayıt sırasında seçilen alan doğrudan öğrenci profilinize işlenmiştir. Yönetici onayı gerekmez.'
          :'Alanınızı bir kez seçip kaydedin. Kaydettiğiniz anda profilinize otomatik işlenir ve kilitlenir.'}
      />
      <StudentOabtFieldApproval/>
    </section>}

    <section id="sinav-haritasi" className="section section-anchor">
      <StudentExamMap data={examMap}/>
    </section>

    <section id="hedef-mesafe" className="section section-anchor">
      <StudentGoalDistance data={goalDistance}/>
    </section>

    <section id="deneme-raporu" className="section section-anchor">
      <StudentExamInterventionReport report={examInterventionReport}/>
    </section>

    <section className="section">
      <div className="grid">
        <div className="card"><div className="kpi">{student.plans.length}</div><div className="muted">Aktif program</div></div>
        <div className="card"><div className="kpi">{student.studyTechniques.length}</div><div className="muted">Atanmış teknik</div></div>
        <div className="card"><div className="kpi">{student.examResults.length}</div><div className="muted">Deneme kaydı</div></div>
      </div>
    </section>

    <section id="aylik-keks-gelisim-raporu" className="section section-anchor"><MonthlyDevelopmentReport studentId={student.id} audience="STUDENT"/></section>\n\n    <section id="gelisim-zaman-cizelgesi" className="section section-anchor"><StudentDevelopmentTimeline studentId={student.id} audience="STUDENT"/></section>

    <section id="kisisel-soru-bankasi" className="section section-anchor">
      <PortalSectionTitle eyebrow="KİŞİSEL ÖĞRENME HAVUZU" title="Kişisel Soru Bankam" description="Yanlış yaptığın ve işaretlediğin sorular tek yerde; haftalık yanlışlar testi ve aylık karma tekrar bu havuzdan oluşturulur."/>
      <StudentPersonalQuestionBank/>
    </section>

    <section id="yanlis-soru-bankasi" className="section section-anchor"><PortalSectionTitle eyebrow="0–1–3–7–14–28 TEKRAR MOTORU" title="Günlük Yanlış Soru Bankam" description="Her derste yanlış yaptığın soruyu yükle. KEKS konuyu otomatik sınıflandırır ve tekrar gününde soruyu yeniden görev olarak önüne getirir."/><StudentWrongQuestionBank defaultExam={defaultWrongExam}/></section>
    {featureFlags.ADAPTIVE_RECOMMENDATION&&<section className="section"><AdaptiveRecommendation/></section>}
    {featureFlags.SMART_COACH&&<section id="akilli-koc" className="section section-anchor"><SmartCoachDashboard/></section>}
    {featureFlags.GAMIFICATION&&<section id="kocluk-oyunlastirma" className="section section-anchor"><PortalSectionTitle eyebrow="KOÇLUK & OYUNLAŞTIRMA" title="Aksiyonlar, seanslar, XP ve mikro tekrar" description="Koçluk sürecindeki görevleri, seansları, puanları, rozetleri ve kısa öğrenme oyunlarını tek alanda yönet."/><StudentEngagementHub/></section>}

    <section id="ogrenme-tekrar" className="section section-anchor">
      <PortalSectionTitle eyebrow="AKILLI ÖĞRENME LABORATUVARI" title="Ders Çalışma Teknikleri ve Tekrar Motoru" description="Tekniği seç, hemen uygula; yanlış soru ve aralıklı tekrarlarını aynı öğrenme döngüsünde yönet."/>
      <StudyTechniqueLab initialPreferences={student.techniquePreferences}/>
    </section>

    <section id="hedef-teknikler" className="section section-anchor"><div className="panelSectionBand"><div><small>HEDEF & ÇALIŞMA AYARLARI</small><strong>Hedefim ve atanmış tekniklerim</strong><p>Hedef bilgisi ile koçun önerdiği çalışma tekniklerini aynı yerde gör.</p></div><span>KİŞİSEL AYAR</span></div><div className="grid" style={{gridTemplateColumns:'1fr 1fr'}}>
      <div className="card"><h2>Hedefim</h2><p>{student.goal || 'Koçunuz henüz hedef bilgisi eklemedi.'}</p>{activeTarget&&<div className="notice"><strong>{activeTarget.institutionName}</strong>{activeTarget.departmentName?' · '+activeTarget.departmentName:''}<br/><span className="muted">{activeTarget.source} · {activeTarget.dataYear||'Yıl belirtilmedi'} · Puan {activeTarget.score??'—'} · Sıra {activeTarget.ranking??'—'} · Yüzdelik {activeTarget.percentile??'—'}</span></div>}{student.profile&&<p className="muted">{formatProfile(student.profile)}</p>}</div>
      <div className="card"><h2>Çalışma Tekniklerim</h2>{student.studyTechniques.length===0?<p className="muted">Henüz teknik atanmadı.</p>:student.studyTechniques.map(t=><div key={t.id} style={{marginBottom:12}}><strong>{t.title}</strong><div className="muted">{t.description}</div></div>)}</div>
    </div></section>

    <section id="programlar" className="section section-anchor"><PortalSectionTitle eyebrow="AKILLI KİŞİSEL ÇALIŞMA PLANI" title="Yıllık, Aylık, Haftalık ve Günlük Planlarım" description="Onaylı planların hedef, eksik ders, çalışma süresi ve gelişim verilerine göre aynı sistemde yürür."/>{student.plans.length===0?<div className="card muted">Henüz aktif program bulunmuyor.</div>:<div className="stack">{student.plans.map(p=><div className="card" key={p.id}><strong>{p.title}</strong><p className="muted">{formatPlanSummary(p.payload)}</p></div>)}</div>}</section>

    <section id="kayitlar-raporlar" className="section section-anchor"><div className="panelSectionBand"><div><small>RAPORLAR & KAYITLAR</small><strong>Çalışma geçmişi ve gelişim kayıtları</strong><p>Çalışmalar, denemeler, koç raporları ve kütüphane içerikleri aynı bölümde.</p></div><span>GEÇMİŞ VERİ</span></div><div className="grid" style={{gridTemplateColumns:'1fr 1fr'}}>
      <div className="card"><h2>Çalışma Kayıtlarım</h2>{student.dailyLogs.length===0?<p className="muted">Henüz kayıt yok.</p>:student.dailyLogs.map(l=><div key={l.id} style={{marginBottom:12}}><strong>{new Date(l.date).toLocaleDateString('tr-TR')}</strong><div className="muted">{formatDailyLog(l.payload)}</div></div>)}</div>
      <div className="card"><h2>Denemelerim</h2>{student.examResults.length===0?<p className="muted">Henüz deneme kaydı yok.</p>:student.examResults.map(x=><div key={x.id} style={{marginBottom:12}}><strong>{x.examType}</strong><div className="muted">{formatExamResult(x.payload)}</div></div>)}</div>
    </div></section>

    <section className="section"><div className="grid" style={{gridTemplateColumns:'2fr 1fr'}}>
      <div className="card"><h2>Koç Raporlarım</h2>{student.reports.length===0?<p className="muted">Henüz rapor yayınlanmadı.</p>:student.reports.map(r=><article key={r.id} style={{padding:'12px 0',borderBottom:'1px solid var(--line)'}}><strong>{r.title}</strong>{r.summary&&<p className="muted">{r.summary}</p>}<p>{r.content}</p></article>)}</div>
      <div className="card"><h2>Kütüphanem</h2>{ordinaryLibraryItems.length===0?<p className="muted">Henüz not veya dosya yok.</p>:ordinaryLibraryItems.map(i=><div key={i.id} style={{marginBottom:14}}><strong>{i.title}</strong>{i.note&&<div className="muted">{i.note}</div>}{i.fileName&&<a href={'/api/library/'+i.id}>Dosyayı Aç · {i.fileName}</a>}</div>)}</div>
    </div></section>

    <section id="kaynak-takibi" className="section section-anchor"><PortalSectionTitle eyebrow="KAYNAK TAKİP SİSTEMİ" title="Kitap ve Kaynak Çalışmalarım" description="Kullandığın kaynağı ekle; konu, sayfa, soru ve doğruluk ilerlemesini kaydet. Koçun da kaynak kullanım ritmini görebilsin."/><StudentResourceTracker/></section>

    <section id="akademik-performans" className="section section-anchor"><div className="row" style={{justifyContent:'space-between',alignItems:'center'}}><PortalSectionTitle eyebrow="AKADEMİK PERFORMANS MERKEZİ" title="Konu, Soru ve Hata Analizi" description="Doğru, yanlış, boş, net, konu ilerlemesi ve hata nedenlerini birlikte takip et."/><a className="btn primary" href="/ogrenci/testler">Konu Bazlı Test Çöz</a></div><AcademicPerformanceCenter audience="STUDENT"/><StudentProgressTools allowedExams={allowedExams} educationCurriculum={educationCurriculum} oabtField={oabtField} initialProgress={student.topicProgress.map(x=>({examType:x.examType,subject:x.subject,topic:x.topic,completed:x.completed}))} initialPractice={student.practiceLogs.map(x=>{const m=learningMetricByPracticeId.get(x.id);return {id:x.id,examType:x.examType,subject:x.subject,topic:x.topic,correct:x.correct,wrong:x.wrong,blank:x.blank,net:x.net,date:x.date.toISOString(),errorReason:x.errorReason,durationSeconds:typeof m?.durationSeconds==='number'?m.durationSeconds:null,questionType:typeof m?.questionType==='string'?m.questionType:null,problemType:typeof m?.problemType==='string'?m.problemType:null,masteryScore:typeof m?.masteryScore==='number'?m.masteryScore:null,masteryState:typeof m?.masteryState==='string'?m.masteryState:null,metricPayload:m||null}})}/></section>

    <section id="hesap-guvenligi" className="section section-anchor"><PortalSectionTitle eyebrow="HESAP & GÜVENLİK" title="Hesap Güvenliği" description="Şifrenizi, son girişlerinizi ve aktif oturumlarınızı yönetin."/><AccountSecurity loginPath="/ogrenci"/></section>

    <section id="keks-egilim-taramasi" className="section section-anchor">
      <PortalSectionTitle eyebrow="KEKS AKADEMİ · TEK UYGULAMA" title="Eğilim Taraması ve Ön Görüşme" description="Tarama, ön görüşme, koç değerlendirmesi ve kişisel çalışma planı artık tek bir KEKS Akademi sayfasında."/>
      <div className="card keksNativeAssessmentShortcut">
        <img src="/keks-official-2026.webp" alt="KEKS Akademi" width="54" height="81"/>
        <div><h3>KEKS Focus Pro · Öğrenme Profilim</h3>
        <p>Mevcut öğrenci bilgilerin, erişim kodun ve tamamladığın KEKS taramaları korunur. Ayrı bir siteye gitmen gerekmez.</p>
        <a className="btn primary" href="/ogrenci/egilim-taramasi">Eğilim Taraması ve Ön Görüşmeyi Aç</a></div>
      </div>
    </section>
  </PortalShell>;
}
