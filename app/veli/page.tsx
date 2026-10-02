import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { ParentLoginForm } from '@/app/components/AuthForms';
import { PortalSectionTitle, PortalShell } from '@/app/components/PortalShell';
import { PanelNavigator } from '@/app/components/PanelNavigator';
import { MonthlyDevelopmentReport } from '@/app/components/MonthlyDevelopmentReport';
import { StudentDevelopmentTimeline } from '@/app/components/StudentDevelopmentTimeline';

function trDay(v: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(v);
}

function deltaLabel(value: number, unit = 'puan') {
  if (value === 0) return 'Önceki haftayla aynı';
  return `${value > 0 ? '+' : ''}${value} ${unit} önceki haftaya göre`;
}

export default async function ParentPage() {
  const user = await currentUser();

  if (!user || user.role !== 'PARENT' || !user.parentProfile || !user.parentProfile.active) {
    return <PortalShell
      active="veli"
      eyebrow="VELİ GİRİŞİ"
      title="Öğrencinin gelişimini baskı kurmadan takip et."
      description="Veli paneli sonuçları ve yanlışları değil; devamlılık, görev uygulama, çalışma ritmi ve koç rehberliğini gösterir."
    >
      <section className="portalLoginGrid">
        <div className="portalLoginIntro">
          <span className="portalEyebrow">VELİ DESTEK PANELİ</span>
          <h2>Sonucu denetlemek yerine öğrenme davranışını destekleyin.</h2>
          <p>Bu panel öğrencinin tek tek yanlışlarını, ham test cevaplarını ve ayrıntılı performans dökümlerini göstermez. Amaç; evde baskı üretmeden çalışma düzenini desteklemektir.</p>
          <div className="portalLoginBullets">
            <span>Haftalık devamlılık</span>
            <span>Görev tamamlama</span>
            <span>Çalışma süresi trendi</span>
            <span>Koçun veliye notu</span>
            <span>Bu hafta ne yapmalı / ne yapmamalı</span>
          </div>
        </div>
        <div className="card">
          <h2>Veli Girişi</h2>
          <p className="muted">Koç tarafından verilen öğrenci kodu ve KEKS Akademi veli giriş kodu ile giriş yapın.</p>
          <ParentLoginForm />
        </div>
      </section>
    </PortalShell>;
  }

  if (!user.parentProfile.consentRecordedAt) {
    return <PortalShell
      active="veli"
      eyebrow="VELİ ERİŞİMİ"
      title="Veli izni gerekli"
      description="Koçunuzdan izin kapsamı doğrulanmış yeni bir veli bağlantısı isteyin."
    >
      <div className="card">Veriler henüz paylaşıma açık değil.</div>
    </PortalShell>;
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000);

  const student = await db.student.findUnique({
    where: { id: user.parentProfile.studentId },
    include: {
      reports: {
        where: {
          visibleToParent: true,
          ...(user.parentProfile.allowReports ? {} : { id: '__hidden__' })
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { id: true, title: true, summary: true, content: true, createdAt: true }
      },
      coachingActions: {
        where: { taskDate: { gte: fourteenDaysAgo, lte: now } },
        select: {
          taskDate: true,
          status: true,
          submission: { select: { submittedAt: true } }
        }
      },
      techniqueSessions: {
        where: { createdAt: { gte: fourteenDaysAgo, lte: now } },
        select: { createdAt: true, activeSeconds: true }
      }
    }
  });

  if (!student) return null;

  const currentActions = student.coachingActions.filter(x => x.taskDate && x.taskDate >= sevenDaysAgo);
  const previousActions = student.coachingActions.filter(x => x.taskDate && x.taskDate < sevenDaysAgo);

  const completed = (rows: typeof currentActions) =>
    rows.filter(x => x.submission || x.status === 'COMPLETED').length;

  const completionRate = (rows: typeof currentActions) =>
    rows.length ? Math.round((completed(rows) / rows.length) * 100) : 0;

  const currentSessions = student.techniqueSessions.filter(x => x.createdAt >= sevenDaysAgo);
  const previousSessions = student.techniqueSessions.filter(x => x.createdAt < sevenDaysAgo);

  const focusMinutes = (rows: typeof currentSessions) =>
    Math.round(rows.reduce((sum, x) => sum + (x.activeSeconds || 0), 0) / 60);

  const currentFocus = focusMinutes(currentSessions);
  const previousFocus = focusMinutes(previousSessions);
  const focusDelta = currentFocus - previousFocus;

  const activeDays = new Set<string>();
  for (const action of currentActions) {
    if (action.submission) activeDays.add(trDay(action.submission.submittedAt));
  }
  for (const session of currentSessions) {
    if ((session.activeSeconds || 0) > 0) activeDays.add(trDay(session.createdAt));
  }

  const previousActiveDays = new Set<string>();
  for (const action of previousActions) {
    if (action.submission) previousActiveDays.add(trDay(action.submission.submittedAt));
  }
  for (const session of previousSessions) {
    if ((session.activeSeconds || 0) > 0) previousActiveDays.add(trDay(session.createdAt));
  }

  const currentCompletion = completionRate(currentActions);
  const previousCompletion = completionRate(previousActions);
  const completionDelta = currentCompletion - previousCompletion;
  const continuityDelta = activeDays.size - previousActiveDays.size;
  const latestCoachReport = student.reports[0] || null;
  const coachNote = latestCoachReport?.summary || latestCoachReport?.content || null;

  const parentDo = currentCompletion < 60
    ? 'Görev sayısını artırmak yerine düzenli başlama saatini ve sakin çalışma ortamını destekleyin. Program hacmini koçun değerlendirmesine bırakın.'
    : activeDays.size < 4
      ? 'Öğrencinin belirli gün ve saatlerde çalışmaya başlamasını kolaylaştırın. Hatırlatın, fakat başında bekleyerek kontrol etmeyin.'
      : 'Mevcut çalışma ritmini korumasına yardımcı olun. Çabayı ve sürekliliği fark edin; program sorumluluğunu öğrencide bırakın.';

  const parentAvoid = 'Tek tek yanlışları sorgulamayın, deneme sonucunu ceza veya ödül aracına çevirmeyin, başka öğrencilerle kıyaslamayın ve koç planına habersiz ek görev yüklemeyin.';

  return <PortalShell
    signedIn
    active="veli"
    eyebrow="VELİ PANELİ"
    title={student.fullName + ' · Haftalık Davranış Özeti'}
    description="Sonuçları değil; çalışma düzenini ve destek ihtiyacını görün."
    meta={<><span>Kod: {student.studentCode}</span>{student.gradeLevel && <span>{student.gradeLevel}</span>}<span>{activeDays.size}/7 aktif gün</span></>}
    wide
  >
    <section className="section">
      <PanelNavigator roleLabel="Veli" groups={[
        {label:'VELİ PANELİ',description:'Gelişimi anlayın, koçun yönlendirmesini görün ve doğru desteği verin.',items:[
          {href:'#haftalik-ozet',title:'1. Bu Hafta Ne Oldu?',description:'Devamlılık, görev uygulama ve çalışma ritmi',badge:'ÖNCELİKLİ'},
          {href:'#akademik-gelisim',title:'2. Akademik Gelişim',description:'Canlı gelişim raporu ve gelişim zaman çizelgesi'},
          {href:'#calisma-davranisi',title:'3. Çalışma Davranışı',description:'Plan uygulama, odak ve süreklilik'},
          {href:'#koc-veli',title:'4. Koç–Veli İletişim Merkezi',description:'Koçun veliye açtığı değerlendirme ve yönlendirmeler'},
          {href:'#aylik-keks-gelisim-raporu',title:'5. KEKS Aylık Veli Raporu',description:'Gelişim, müdahale alanları ve sonraki hedefler',badge:'CANLI'},
          {href:'#miza-veli',title:'6. Veliye Özel MİZA',description:'Öğrenci mahremiyetini koruyan veli destek rehberi',badge:'YENİ'}
        ]}
      ]}/>
    </section>

    <section id="haftalik-ozet" className="section section-anchor">
      <PortalSectionTitle
        eyebrow="HAFTALIK DAVRANIŞ ÖZETİ"
        title="Bu hafta çalışma düzeni nasıldı?"
      />

      <div className="grid">
        <div className="card">
          <div className="moduleEyebrow">HAFTALIK DEVAMLILIK</div>
          <div className="kpi">{activeDays.size}/7</div>
          <div className="muted">Aktif çalışma günü</div>
          <small>{deltaLabel(continuityDelta, 'gün')}</small>
        </div>

        <div className="card">
          <div className="moduleEyebrow">GÖREV TAMAMLAMA</div>
          <div className="kpi">%{currentCompletion}</div>
          <div className="muted">{completed(currentActions)} / {currentActions.length} görev tamamlandı</div>
          <small>{deltaLabel(completionDelta)}</small>
        </div>

        <div className="card">
          <div className="moduleEyebrow">ÇALIŞMA SÜRESİ TRENDİ</div>
          <div className="kpi">{currentFocus} dk</div>
          <div className="muted">Bu hafta kayıtlı odak süresi</div>
          <small>{deltaLabel(focusDelta, 'dk')}</small>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="moduleEyebrow">VELİ PANELİ İLKESİ</div>
        <p>Bu ekranda yanlış soru listesi, ham test cevapları, ayrıntılı deneme dökümü veya ders bazlı hata takibi gösterilmez. Bu veriler öğrenci ve koçun çalışma alanında kalır.</p>
      </div>
    </section>

    <section id="akademik-gelisim" className="section section-anchor">
      <PortalSectionTitle eyebrow="AKADEMİK GELİŞİM" title="Gelişimi sonuçtan bağımsız, dönemsel olarak izleyin."/>
      <div className="grid">
        <div className="card"><div className="moduleEyebrow">GELİŞİM GÖRÜNÜMÜ</div><p>Veliye yalnız paylaşım izni verilmiş gelişim göstergeleri sunulur. Ham cevaplar ve tek tek yanlış sorular öğrenci–koç çalışma alanında kalır.</p></div>
        <div className="card"><div className="moduleEyebrow">GELİŞİM YÖNÜ</div><p>Haftalık ve aylık değişim; güçlü gelişen alanlar ile destek gerektiren alanlar üzerinden açıklanır.</p></div>
      </div>
      <StudentDevelopmentTimeline studentId={student.id} audience="PARENT" compact/>
    </section>

    <section id="calisma-davranisi" className="section section-anchor">
      <PortalSectionTitle eyebrow="ÇALIŞMA DAVRANIŞI" title="Öğrenci nasıl çalışıyor?"/>
      <div className="grid">
        <div className="card"><div className="moduleEyebrow">SÜREKLİLİK</div><div className="kpi">{activeDays.size}/7</div><p className="muted">Aktif çalışma günü</p></div>
        <div className="card"><div className="moduleEyebrow">UYGULAMA</div><div className="kpi">%{currentCompletion}</div><p className="muted">Görev tamamlama</p></div>
        <div className="card"><div className="moduleEyebrow">ODAK</div><div className="kpi">{currentFocus} dk</div><p className="muted">Kayıtlı odak süresi</p></div>
      </div>
    </section>

    <section id="koc-veli" className="section section-anchor">
      <PortalSectionTitle eyebrow="KOÇ–VELİ İLETİŞİM MERKEZİ" title="Koçun veliyle paylaşmayı seçtiği bilgiler"/>
      <div className="card">{coachNote?<><strong>{latestCoachReport?.title}</strong><p>{coachNote}</p><small className="muted">{latestCoachReport?.createdAt.toLocaleDateString('tr-TR')}</small></>:<p className="muted">Veliyle paylaşılmış yeni bir koç değerlendirmesi bulunmuyor.</p>}</div>
    </section>

    <section id="aylik-keks-gelisim-raporu" className="section section-anchor"><MonthlyDevelopmentReport studentId={student.id} audience="PARENT"/></section>

    <section id="miza-veli" className="section section-anchor">
      <PortalSectionTitle eyebrow="VELİYE ÖZEL MİZA" title="Bu hafta öğrenciyi nasıl desteklemelisiniz?"/>
      <div className="grid" style={{gridTemplateColumns:'1fr 1fr'}}>
        <div className="card"><div className="moduleEyebrow">DESTEKLEYİN</div><p>{parentDo}</p></div>
        <div className="card"><div className="moduleEyebrow">MÜDAHALE ETMEYİN</div><p>{parentAvoid}</p></div>
      </div>
      <div className="card" style={{marginTop:14}}><div className="moduleEyebrow">MAHREMİYET SINIRI</div><p>MİZA veli görünümü öğrencinin özel koç görüşmelerini, kişisel notlarını veya MİZA ile özel konuşmalarını veliye aktarmaz. Yalnız veli desteği için paylaşılabilir eğitim verilerinden rehberlik üretir.</p></div>
    </section>

    <section id="veli-rehberligi" className="section section-anchor">
      <PortalSectionTitle
        eyebrow="VELİ REHBERLİĞİ"
        title="Bu hafta nasıl destek olmalısınız?"
      />

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <div className="moduleEyebrow">BU HAFTA YAPIN</div>
          <p>{parentDo}</p>
        </div>

        <div className="card">
          <div className="moduleEyebrow">BU HAFTA YAPMAYIN</div>
          <p>{parentAvoid}</p>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="moduleEyebrow">KOÇUN VELİYE NOTU</div>
        {coachNote
          ? <>
              <strong>{latestCoachReport?.title}</strong>
              <p>{coachNote}</p>
              <small className="muted">{latestCoachReport?.createdAt.toLocaleDateString('tr-TR')}</small>
            </>
          : <p className="muted">Bu hafta veliye açılmış bir koç notu bulunmuyor.</p>}
      </div>
    </section>
  </PortalShell>;
}
