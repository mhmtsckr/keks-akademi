import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { ParentLoginForm } from '@/app/components/AuthForms';
import { PortalSectionTitle, PortalShell } from '@/app/components/PortalShell';
import { PanelNavigator } from '@/app/components/PanelNavigator';
import { MonthlyDevelopmentReport } from '@/app/components/MonthlyDevelopmentReport';
import { StudentDevelopmentTimeline } from '@/app/components/StudentDevelopmentTimeline';
import { buildStudentIndicators } from '@/lib/studentIndicators';
import { buildParentWeeklyBrief } from '@/lib/parentWeeklyBrief';

function trDay(v: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(v);
}

export default async function ParentPage() {
  const user = await currentUser();

  if (!user || user.role !== 'PARENT' || !user.parentProfile || !user.parentProfile.active) {
    return <PortalShell
      active="veli"
      eyebrow="VELİ GİRİŞİ"
      title="Öğrencinin gelişimini baskı kurmadan takip et."
      description="Veli paneli ham sonuçları değil; bu hafta iyi gidenleri, dikkat alanlarını ve veliden beklenen doğru desteği gösterir."
    >
      <section className="portalLoginGrid">
        <div className="portalLoginIntro">
          <span className="portalEyebrow">VELİ DESTEK PANELİ</span>
          <h2>Sonucu denetlemek yerine öğrenme davranışını destekleyin.</h2>
          <p>Bu panel öğrencinin tek tek yanlışlarını, ham test cevaplarını ve ayrıntılı performans dökümlerini göstermez. Amaç; evde baskı üretmeden çalışma düzenini desteklemektir.</p>
          <div className="portalLoginBullets">
            <span>Haftalık devamlılık</span>
            <span>Görev tamamlama</span>
            <span>Plan uyumu ve tekrar disiplini</span>
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
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000);

  const [student,weeklyIndicators] = await Promise.all([
    db.student.findUnique({
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
      }
    }
  }),
    buildStudentIndicators(user.parentProfile.studentId, now)
  ]);

  if (!student) return null;

  const latestCoachReport = student.reports[0] || null;
  const coachNote = latestCoachReport?.summary || latestCoachReport?.content || null;
  const indicator=(key:string)=>weeklyIndicators.indicators.find(x=>x.key===key)||null;
  const continuityIndicator=indicator('CONTINUITY');
  const planIndicator=indicator('PLAN_ALIGNMENT');
  const reviewIndicator=indicator('REVIEW_DISCIPLINE');
  const todayKey=trDay(now);
  const todayActions=student.coachingActions.filter(x=>x.taskDate&&trDay(x.taskDate)===todayKey);
  const todayCompleted=todayActions.filter(x=>x.submission||x.status==='COMPLETED').length;
  const parentBrief=buildParentWeeklyBrief({
    indicators:weeklyIndicators.indicators,
    todayPlan:{total:todayActions.length,completed:todayCompleted},
    coachNote
  });

  const parentDo = parentBrief.support[0]?.detail || 'Mevcut çalışma ritmini destekleyin ve program sorumluluğunu öğrencide bırakın.';
  const parentAvoid = 'Tek tek yanlışları sorgulamayın, deneme sonucunu ceza veya ödül aracına çevirmeyin, başka öğrencilerle kıyaslamayın ve koç planına habersiz ek görev yüklemeyin.';
  const continuityMeta=continuityIndicator?.value==null?'Süreklilik verisi birikiyor':'Çalışma sürekliliği %'+continuityIndicator.value;

  return <PortalShell
    signedIn
    active="veli"
    eyebrow="VELİ PANELİ"
    title={student.fullName + ' · Haftalık Davranış Özeti'}
    description="Sonuçları değil; çalışma düzenini ve destek ihtiyacını görün."
    meta={<><span>Kod: {student.studentCode}</span>{student.gradeLevel && <span>{student.gradeLevel}</span>}<span>{continuityMeta}</span></>}
    wide
  >
    <section className="section">
      <PanelNavigator roleLabel="Veli" groups={[
        {label:'VELİ PANELİ',description:'Gelişimi anlayın, koçun yönlendirmesini görün ve doğru desteği verin.',items:[
          {href:'#haftalik-ozet',title:'1. Bu Haftanın Veli Özeti',description:'İyi gidenler, dikkat alanları ve sizden beklenen destek',badge:'ÖNCELİKLİ'},
          {href:'#akademik-gelisim',title:'2. Akademik Gelişim',description:'Canlı gelişim raporu ve gelişim zaman çizelgesi'},
          {href:'#calisma-davranisi',title:'3. Çalışma Davranışı',description:'Plan uyumu, tekrar disiplini ve çalışma sürekliliği'},
          {href:'#koc-veli',title:'4. Koç–Veli İletişim Merkezi',description:'Koçun veliye açtığı değerlendirme ve yönlendirmeler'},
          {href:'#aylik-keks-gelisim-raporu',title:'5. KEKS Aylık Veli Raporu',description:'Gelişim, müdahale alanları ve sonraki hedefler',badge:'CANLI'},
          {href:'#miza-veli',title:'6. Veliye Özel MİZA',description:'Öğrenci mahremiyetini koruyan veli destek rehberi',badge:'YENİ'}
        ]}
      ]}/>
    </section>

    <section id="haftalik-ozet" className="section section-anchor">
      <PortalSectionTitle
        eyebrow="HAFTALIK VELİ ÖZETİ"
        title="Bu hafta ne bilmeniz ve ne yapmanız gerekiyor?"
      />

      <div className={'card '+(parentBrief.reassurance.tone==='ATTENTION'?'notice error':'')}>
        <div className="moduleEyebrow">BUGÜN VELİ MÜDAHALESİ GEREKİYOR MU?</div>
        <h2>{parentBrief.reassurance.headline}</h2>
        <p>{parentBrief.reassurance.detail}</p>
      </div>

      <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',marginTop:14}}>
        <div className="card">
          <div className="moduleEyebrow">BU HAFTA İYİ GİDENLER</div>
          <div className="stack">
            {parentBrief.good.map((item,i)=><div key={i}>
              <strong>{item.title}</strong>
              <p style={{margin:'6px 0'}}>{item.detail}</p>
              {item.evidence&&<small className="muted">{item.evidence}</small>}
            </div>)}
          </div>
        </div>

        <div className="card">
          <div className="moduleEyebrow">DİKKAT EDİLMESİ GEREKENLER</div>
          <div className="stack">
            {parentBrief.attention.map((item,i)=><div key={i}>
              <strong>{item.title}</strong>
              <p style={{margin:'6px 0'}}>{item.detail}</p>
              {item.evidence&&<small className="muted">{item.evidence}</small>}
            </div>)}
          </div>
        </div>

        <div className="card">
          <div className="moduleEyebrow">VELİDEN BEKLENEN DESTEK</div>
          <div className="stack">
            {parentBrief.support.map((item,i)=><div key={i}>
              <strong>{item.title}</strong>
              <p style={{margin:'6px 0'}}>{item.detail}</p>
            </div>)}
          </div>
        </div>
      </div>

      <details className="card" style={{marginTop:14}}>
        <summary><strong>Bu özet hangi göstergelerden üretildi?</strong></summary>
        <div className="grid" style={{marginTop:12}}>
          {[continuityIndicator,planIndicator,reviewIndicator].filter(Boolean).map((item:any)=><div key={item.key}>
            <strong>{item.label}: {item.value==null?'Veri yok':'%'+item.value}</strong>
            <p className="muted">{item.evidence}</p>
            <small>{item.delta==null?'Geçen hafta karşılaştırması yok':item.delta===0?'Geçen haftayla aynı':(item.delta>0?'+':'')+item.delta+' puan geçen haftaya göre'}</small>
          </div>)}
        </div>
        <p className="muted">{parentBrief.privacyNote}</p>
      </details>
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
      <PortalSectionTitle eyebrow="ÇALIŞMA DAVRANIŞI" title="Ham tablo yerine davranışın yönünü görün."/>
      <div className="grid">
        <div className="card"><div className="moduleEyebrow">ÇALIŞMA SÜREKLİLİĞİ</div><div className="kpi">{continuityIndicator?.value==null?'—':'%'+continuityIndicator.value}</div><p className="muted">{continuityIndicator?.delta==null?'Karşılaştırma verisi birikiyor':continuityIndicator.delta===0?'Geçen haftayla aynı':(continuityIndicator.delta>0?'+':'')+continuityIndicator.delta+' puan'}</p></div>
        <div className="card"><div className="moduleEyebrow">PLAN UYUMU</div><div className="kpi">{planIndicator?.value==null?'—':'%'+planIndicator.value}</div><p className="muted">{planIndicator?.delta==null?'Karşılaştırma verisi birikiyor':planIndicator.delta===0?'Geçen haftayla aynı':(planIndicator.delta>0?'+':'')+planIndicator.delta+' puan'}</p></div>
        <div className="card"><div className="moduleEyebrow">TEKRAR DİSİPLİNİ</div><div className="kpi">{reviewIndicator?.value==null?'—':'%'+reviewIndicator.value}</div><p className="muted">{reviewIndicator?.delta==null?'Karşılaştırma verisi birikiyor':reviewIndicator.delta===0?'Geçen haftayla aynı':(reviewIndicator.delta>0?'+':'')+reviewIndicator.delta+' puan'}</p></div>
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
