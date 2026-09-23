import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { ParentLoginForm } from '@/app/components/AuthForms';
import { PortalSectionTitle, PortalShell } from '@/app/components/PortalShell';
import { PanelNavigator } from '@/app/components/PanelNavigator';

function pretty(v: unknown) {
  if (!v) return '';
  if (typeof v === 'string') return v;
  try { return JSON.stringify(v); } catch { return String(v); }
}

export default async function ParentPage() {
  const user=await currentUser();

  if(!user || user.role!=='PARENT' || !user.parentProfile) {
    return <PortalShell
      active="veli"
      eyebrow="VELİ GİRİŞİ"
      title="Öğrencinin gelişimini sade ve güvenli biçimde takip et."
      description="Haftalık özet, hedef durumu, denemeler ve koç raporları tek panelde."
    >
      <section className="portalLoginGrid">
        <div className="portalLoginIntro">
          <span className="portalEyebrow">VELİ GELİŞİM PANELİ</span>
          <h2>Teknik ayrıntıya boğulmadan anlamlı gelişim özetleri.</h2>
          <p>Koçun paylaştığı bilgiler, haftalık çalışma verileri ve öğrenciye açık raporlar sade bir görünümde sunulur.</p>
          <div className="portalLoginBullets">
            <span>Haftalık çalışma ve soru özeti</span>
            <span>Hedef ve konu ilerleme durumu</span>
            <span>Koç raporları ve paylaşılan içerikler</span>
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

  const student=await db.student.findUnique({
    where:{id:user.parentProfile.studentId},
    include:{
      plans:{where:{active:true},orderBy:{updatedAt:'desc'}},
      dailyLogs:{orderBy:{date:'desc'},take:14},
      examResults:{orderBy:{createdAt:'desc'},take:10},
      studyTechniques:{where:{active:true},orderBy:{createdAt:'desc'}},
      reports:{where:{visibleToParent:true},orderBy:{createdAt:'desc'}},
      practiceLogs:{where:{date:{gte:new Date(Date.now()-7*24*60*60*1000)}},orderBy:{date:'desc'}},
      topicProgress:{},
      generatedContent:{where:{visibleToParent:true},orderBy:{createdAt:'desc'},take:30},
    }
  });
  if(!student) return null;

  const week=student.practiceLogs.reduce((a,x)=>({c:a.c+x.correct,w:a.w+x.wrong,b:a.b+x.blank,n:a.n+x.net}),{c:0,w:0,b:0,n:0});
  const completedTopics=student.topicProgress.filter(x=>x.completed).length;
  const totalTopics=student.topicProgress.length;
  const progressRate=totalTopics?Math.round((completedTopics/totalTopics)*100):0;

  return <PortalShell signedIn
    active="veli"
    eyebrow="VELİ PANELİ"
    title={student.fullName+' · Gelişim Özeti'}
    description="Öğrencinin güncel çalışma durumu, hedefi ve koç değerlendirmeleri."
    meta={<><span>Kod: {student.studentCode}</span>{student.gradeLevel&&<span>{student.gradeLevel}</span>}<span>%{progressRate} konu ilerleme</span></>}
    wide
  >
    <section className="section">
      <PanelNavigator roleLabel="Veli" groups={[
        {label:'GENEL DURUM',description:'Öğrencinin güncel gelişim fotoğrafını hızlıca gör.',items:[
          {href:'#veli-genel',title:'Genel Gelişim Özeti',description:'Konu ilerleme, program ve çalışma kayıtları'}
        ]},
        {label:'HAFTALIK PERFORMANS',description:'Son 7 günün soru ve net özetini incele.',items:[
          {href:'#haftalik-ozet',title:'Haftalık Özet',description:'Doğru, yanlış, boş ve toplam net'}
        ]},
        {label:'HEDEF & PLANLAMA',description:'Öğrencinin hedefi ve uygulanan programları takip et.',items:[
          {href:'#hedef-plan',title:'Hedef & Programlar',description:'Ana hedef, aktif program ve çalışma yaklaşımı'}
        ]},
        {label:'ÖĞRENME & İÇERİK',description:'Öğrenme teknikleri ve veliye açılan içerikler.',items:[
          {href:'#ogrenme-icerik',title:'Teknikler & İçerikler',description:'Uygulanan teknikler ve paylaşılan öğrenme içerikleri'}
        ]},
        {label:'KOÇ DEĞERLENDİRMESİ',description:'Koçun veliye açtığı profesyonel raporları gör.',items:[
          {href:'#koc-raporlari',title:'Koç Raporları',description:'Gelişim değerlendirmeleri ve öneriler'}
        ]}
      ]}/>
    </section>

    <section id="veli-genel" className="section section-anchor">
      <div className="grid">
        <div className="card"><div className="kpi">%{progressRate}</div><div className="muted">Konu ilerleme oranı</div></div>
        <div className="card"><div className="kpi">{student.plans.length}</div><div className="muted">Aktif program</div></div>
        <div className="card"><div className="kpi">{student.dailyLogs.length}</div><div className="muted">Son çalışma kaydı</div></div>
        <div className="card"><div className="kpi">{student.examResults.length}</div><div className="muted">Deneme kaydı</div></div>
      </div>
    </section>

    <section id="haftalik-ozet" className="section section-anchor">
      <PortalSectionTitle eyebrow="HAFTALIK PERFORMANS" title="Son 7 gün"/>
      <div className="card"><div className="row"><span className="pill">Doğru {week.c}</span><span className="pill">Yanlış {week.w}</span><span className="pill">Boş {week.b}</span><span className="pill">Toplam Net {Number(week.n.toFixed(2))}</span></div></div>
    </section>

    <section id="hedef-plan" className="section section-anchor"><div className="panelSectionBand"><div><small>HEDEF & PLANLAMA</small><strong>Hedef, program ve çalışma yaklaşımı</strong><p>Öğrencinin yönünü ve uygulanan çalışma düzenini tek bölümde izleyin.</p></div><span>VELİ ÖZETİ</span></div><div className="grid" style={{gridTemplateColumns:'1fr 1fr'}}>
      <div className="card"><h2>Hedef ve Genel Durum</h2><p>{student.goal||'Henüz hedef bilgisi eklenmedi.'}</p>{student.profile&&<p className="muted">{pretty(student.profile)}</p>}</div>
      <div className="card"><h2>Uygulanan Teknikler</h2>{student.studyTechniques.length===0?<p className="muted">Henüz teknik yok.</p>:student.studyTechniques.map(t=><div key={t.id} style={{marginBottom:10}}><strong>{t.title}</strong><div className="muted">{t.description}</div></div>)}</div>
    </div></section>

    <section className="section"><div className="grid" style={{gridTemplateColumns:'1fr 1fr'}}>
      <div className="card"><h2>Programlar</h2>{student.plans.length===0?<p className="muted">Henüz program yok.</p>:student.plans.map(p=><div key={p.id} style={{marginBottom:12}}><strong>{p.title}</strong><div className="muted">{pretty(p.payload)}</div></div>)}</div>
      <div className="card"><h2>Denemeler</h2>{student.examResults.length===0?<p className="muted">Henüz deneme yok.</p>:student.examResults.map(x=><div key={x.id} style={{marginBottom:12}}><strong>{x.examType}</strong><div className="muted">{pretty(x.payload)}</div></div>)}</div>
    </div></section>

    <section id="ogrenme-icerik" className="section section-anchor">
      <PortalSectionTitle eyebrow="ÖĞRENME & İÇERİK" title="Öğrenme İçerikleri"/>
      <div className="card">{student.generatedContent.length===0?<p className="muted">Henüz veliye açılmış içerik yok.</p>:<div className="grid">{student.generatedContent.map(x=><a className="card" key={x.id} href={'/icerik/'+x.id}><span className="pill">{x.type}</span><h3>{x.title}</h3><p className="muted">Kalite: {x.qualityScore??'—'} / 100</p></a>)}</div>}</div>
    </section>

    <section id="koc-raporlari" className="section section-anchor">
      <PortalSectionTitle eyebrow="KOÇ DEĞERLENDİRMESİ" title="Raporlar"/>
      <div className="card">{student.reports.length===0?<p className="muted">Henüz veliye açık rapor yayınlanmadı.</p>:student.reports.map(r=><article key={r.id} style={{padding:'14px 0',borderBottom:'1px solid rgba(255,255,255,.08)'}}><strong>{r.title}</strong>{r.summary&&<p className="muted">{r.summary}</p>}<p>{r.content}</p></article>)}</div>
    </section>
  </PortalShell>;
}
