'use client';

import { useEffect,useMemo,useState } from 'react';
import { AdminGameCMS } from '@/app/components/AdminGameCMS';
import { AdminAssessmentWorkflow } from '@/app/components/AdminAssessmentWorkflow';

type Tab='overview'|'workflow'|'users'|'academic'|'payments'|'security';

const TAB_LABELS:Record<Tab,string>={
  overview:'Genel Bakış',
  workflow:'Değerlendirme & Plan Onayı',
  users:'Kullanıcılar',
  academic:'Akademik İçerik',
  payments:'Ödeme & Erişim',
  security:'Sistem & Güvenlik'
};

function money(kurus:number){return new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format((kurus||0)/100)}
function dt(v:string){return new Date(v).toLocaleString('tr-TR')}

export function AdminConsole(){
  const [tab,setTab]=useState<Tab>('overview');
  const [loading,setLoading]=useState(false);
  const [msg,setMsg]=useState('');

  const [dashboard,setDashboard]=useState<any>(null);
  const [users,setUsers]=useState<any[]>([]);
  const [userRole,setUserRole]=useState('ALL');
  const [userQ,setUserQ]=useState('');

  const [questions,setQuestions]=useState<any[]>([]);
  const [questionCounts,setQuestionCounts]=useState<any[]>([]);
  const [questionStatus,setQuestionStatus]=useState('PENDING');

  const [payments,setPayments]=useState<any[]>([]);
  const [paymentTotals,setPaymentTotals]=useState<any[]>([]);
  const [codes,setCodes]=useState<any[]>([]);
  const [accesses,setAccesses]=useState<any[]>([]);

  const [health,setHealth]=useState<any>(null);
  const [logs,setLogs]=useState<any[]>([]);
  const [auditQ,setAuditQ]=useState('');
  const [gmailAppPassword,setGmailAppPassword]=useState('');
  const [gmailBusy,setGmailBusy]=useState(false);
  const [paytrMerchantId,setPaytrMerchantId]=useState('');
  const [paytrMerchantKey,setPaytrMerchantKey]=useState('');
  const [paytrMerchantSalt,setPaytrMerchantSalt]=useState('');
  const [paytrTestMode,setPaytrTestMode]=useState(true);
  const [paytrBusy,setPaytrBusy]=useState(false);

  async function loadOverview(){
    const j=await fetch('/api/admin/dashboard').then(r=>r.json());
    if(j.ok)setDashboard(j.stats);
  }
  async function loadUsers(){
    const p=new URLSearchParams();
    if(userRole!=='ALL')p.set('role',userRole);
    if(userQ.trim())p.set('q',userQ.trim());
    const j=await fetch('/api/admin/users?'+p.toString()).then(r=>r.json());
    if(j.ok)setUsers(j.users||[]);
  }
  async function loadQuestions(){
    const j=await fetch('/api/admin/questions/review?status='+questionStatus).then(r=>r.json());
    if(j.ok){setQuestions(j.items||[]);setQuestionCounts(j.counts||[])}
  }
  async function loadPayments(){
    const [p,a]=await Promise.all([
      fetch('/api/admin/payments').then(r=>r.json()),
      fetch('/api/admin/access').then(r=>r.json())
    ]);
    if(p.ok){setPayments(p.payments||[]);setPaymentTotals(p.totals||[])}
    if(a.ok){setCodes(a.codes||[]);setAccesses(a.accesses||[])}
  }
  async function loadSecurity(){
    const p=new URLSearchParams(); if(auditQ.trim())p.set('q',auditQ.trim());
    const [s,a]=await Promise.all([
      fetch('/api/admin/system').then(r=>r.json()),
      fetch('/api/admin/audit?'+p.toString()).then(r=>r.json())
    ]);
    if(s.ok)setHealth(s.health);
    if(a.ok)setLogs(a.logs||[]);
  }

  async function refresh(){
    setLoading(true);
    try{
      if(tab==='overview')await loadOverview();
      if(tab==='users')await loadUsers();
      if(tab==='academic')await loadQuestions();
      if(tab==='payments')await loadPayments();
      if(tab==='security')await loadSecurity();
    }finally{setLoading(false)}
  }

  useEffect(()=>{refresh()},[tab,questionStatus]);

  async function updateUser(userId:string,status:string){
    setMsg('');
    const r=await fetch('/api/admin/users',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({userId,status})});
    const j=await r.json();
    if(!r.ok){setMsg('Hata: '+(j.error||'Kullanıcı güncellenemedi.'));return}
    setMsg('Kullanıcı durumu güncellendi.');await loadUsers();await loadOverview();
  }

  async function reviewQuestion(id:string,action:'APPROVE'|'REJECT'|'PENDING'){
    const note=action==='REJECT'?window.prompt('Ret notu (isteğe bağlı):')||'':undefined;
    const r=await fetch('/api/admin/questions/review',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({id,action,note})});
    const j=await r.json();
    if(!r.ok){setMsg('Hata: '+(j.error||'Soru güncellenemedi.'));return}
    setMsg(action==='APPROVE'?'Soru onaylandı.':action==='REJECT'?'Soru reddedildi.':'Soru tekrar incelemeye alındı.');
    await loadQuestions();await loadOverview();
  }

  async function setPayment(id:string,status:string){
    const r=await fetch('/api/admin/payments',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({paymentId:id,status})});
    const j=await r.json();
    if(!r.ok){setMsg('Hata: '+(j.error||'Ödeme güncellenemedi.'));return}
    setMsg('Ödeme durumu güncellendi.');await loadPayments();await loadOverview();
  }

  async function makeCode(){
    const r=await fetch('/api/admin/codes',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({maxUses:1})});
    const j=await r.json();
    if(!r.ok){setMsg('Hata: '+(j.error||'Kod üretilemedi.'));return}
    setMsg('Yeni KEKS aylık ürün kodu: '+j.code);await loadPayments();
  }

  async function savePaytr(){
    setMsg('');setPaytrBusy(true);
    try{
      const r=await fetch('/api/admin/paytr-config',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({
          merchantId:paytrMerchantId,
          merchantKey:paytrMerchantKey,
          merchantSalt:paytrMerchantSalt,
          testMode:paytrTestMode
        })
      });
      const j=await r.json();
      if(!r.ok){setMsg('Hata: '+(j.error||'PayTR yapılandırılamadı.'));return}
      setPaytrMerchantKey('');
      setPaytrMerchantSalt('');
      setMsg(j.message||'PayTR yapılandırıldı.');
      await loadSecurity();
    }finally{setPaytrBusy(false)}
  }

  async function connectGmail(){
    setMsg('');setGmailBusy(true);
    try{
      const r=await fetch('/api/admin/email-config',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({appPassword:gmailAppPassword})
      });
      const j=await r.json();
      if(!r.ok){setMsg('Hata: '+(j.error||'Gmail bağlantısı kurulamadı.'));return}
      setGmailAppPassword('');
      setMsg(j.message||'Gmail bağlantısı kuruldu.');
      await loadSecurity();
    }finally{setGmailBusy(false)}
  }

  const pendingUsers=useMemo(()=>users.filter(x=>x.status==='PENDING').length,[users]);

  return <div className="adminConsole">
    <div className="adminTabs">
      {(Object.keys(TAB_LABELS) as Tab[]).map(k=><button key={k} className={tab===k?'active':''} onClick={()=>{setTab(k);setMsg('')}}>{TAB_LABELS[k]}</button>)}
    </div>

    {loading&&<div className="notice">Veriler yükleniyor…</div>}
    {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')}>{msg}</div>}

    {tab==='overview'&&dashboard&&<section className="adminPanelSection">
      <div className="moduleHeaderRow"><div><div className="moduleEyebrow">SİSTEM ÖZETİ</div><h2>Genel Bakış</h2><p className="muted">KEKS Akademi'nin güncel operasyon göstergeleri.</p></div><button className="btn" onClick={refresh}>Yenile</button></div>
      <div className="adminKpiGrid">
        <AdminKpi icon="👥" value={dashboard.users} label="Toplam kullanıcı"/>
        <AdminKpi icon="🎓" value={dashboard.students} label="Öğrenci"/>
        <AdminKpi icon="🧭" value={dashboard.coaches} label="Koç"/>
        <AdminKpi icon="👪" value={dashboard.parents} label="Veli"/>
        <AdminKpi icon="⏳" value={dashboard.pendingCoaches} label="Bekleyen koç" warn={dashboard.pendingCoaches>0}/>
        <AdminKpi icon="?" value={dashboard.pendingQuestions} label="Onay bekleyen soru" warn={dashboard.pendingQuestions>0}/>
        <AdminKpi icon="✓" value={dashboard.pendingScreenings||0} label="Eğilim raporu onayı" warn={(dashboard.pendingScreenings||0)>0}/>
        <AdminKpi icon="▤" value={dashboard.pendingPlans||0} label="Plan onayı" warn={(dashboard.pendingPlans||0)>0}/>
        <AdminKpi icon="!" value={dashboard.openAlerts} label="Açık öğrenci uyarısı" warn={dashboard.openAlerts>0}/>
        <AdminKpi icon="₺" value={money(dashboard.revenueKurus)} label="Tahsil edilen"/>
      </div>
      <div className="adminOverviewSplit">
        <div className="card">
          <div className="moduleEyebrow">SON 7 GÜN</div><h3>Kullanım aktivitesi</h3>
          <div className="adminActivityRows">
            <MetricLine label="Soru çözüm kaydı" value={dashboard.practice7}/>
            <MetricLine label="Teknik çalışma oturumu" value={dashboard.tech7}/>
            <MetricLine label="Yönetici bekleyen değerlendirme" value={(dashboard.pendingScreenings||0)+(dashboard.pendingPlans||0)}/>
          </div>
        </div>
        <div className="card">
          <div className="moduleEyebrow">ÖDEME DURUMU</div><h3>İşlem özeti</h3>
          <div className="adminActivityRows">
            <MetricLine label="Toplam ödeme" value={dashboard.payments}/>
            <MetricLine label="Başarılı" value={dashboard.paidPayments}/>
            <MetricLine label="Bekleyen" value={dashboard.pendingPayments}/>
          </div>
        </div>
      </div>
    </section>}

    {tab==='workflow'&&<section className="adminPanelSection">
      <div className="moduleHeaderRow"><div><div className="moduleEyebrow">İKİ AŞAMALI ONAY AKIŞI</div><h2>Değerlendirme & Plan Onayı</h2><p className="muted">Önce KEKS Eğilim Taraması raporunu onaylayın; ön görüşme tamamlandıktan sonra birleşik yıllık/aylık/haftalık/günlük planı onaylayıp koça gönderin.</p></div></div>
      <AdminAssessmentWorkflow/>
    </section>}

    {tab==='users'&&<section className="adminPanelSection">
      <div className="moduleHeaderRow"><div><div className="moduleEyebrow">HESAP YÖNETİMİ</div><h2>Kullanıcılar</h2><p className="muted">Koç, öğrenci, veli ve yönetici hesaplarını ara ve durumlarını yönet.</p></div><span className="pill">{users.length} sonuç · {pendingUsers} bekleyen</span></div>
      <div className="card adminFilterBar">
        <div className="field"><label>Ara</label><input value={userQ} onChange={e=>setUserQ(e.target.value)} placeholder="Ad veya e-posta"/></div>
        <div className="field"><label>Rol</label><select value={userRole} onChange={e=>setUserRole(e.target.value)}><option value="ALL">Tümü</option><option value="COACH">Koç</option><option value="STUDENT">Öğrenci</option><option value="PARENT">Veli</option><option value="ADMIN">Yönetici</option></select></div>
        <button className="btn primary" onClick={loadUsers}>Filtrele</button>
      </div>
      <div className="card adminTableCard">
        <table className="table"><thead><tr><th>Kullanıcı</th><th>Rol</th><th>Bağlantı</th><th>Durum</th><th>İşlem</th></tr></thead>
        <tbody>{users.map(u=><tr key={u.id}>
          <td><strong>{u.name}</strong><div className="muted">{u.email||'E-posta yok'} · {dt(u.createdAt)}</div></td>
          <td><span className="pill">{u.role}</span></td>
          <td>{u.student?<>
            <strong>Kod {u.student.studentCode}</strong>
            <div className="muted">{u.student.gradeLevel||'—'}{u.student.coach?.user?.name?' · Koç '+u.student.coach.user.name:''}</div>
            <div style={{marginTop:8}}><span className="muted">Giriş anahtarı</span><br/>{u.student.accessKey?<code className="adminPrivateCode">{u.student.accessKey}</code>:<span className="muted">Eski kayıt · şifreli kopya yok</span>}</div>
            <div className="muted">Geçerlilik: {u.student.accessKeyExpiresAt?dt(u.student.accessKeyExpiresAt):'—'} · {u.student.accessKeyExpired?'SÜRESİ DOLDU':'AKTİF'}</div>
            <div className="muted">{u.student.credentialsDeliveryStatus==='SENT'?'E-posta gönderildi':'E-posta bekliyor'}{u.student.credentialsEmailedAt?' · '+dt(u.student.credentialsEmailedAt):''}</div>
          </>:u.coachProfile?u.coachProfile._count.students+' öğrenci':u.parentProfile?'Öğrenci: '+u.parentProfile.student.fullName:'—'}</td>
          <td><span className={'adminStatus '+u.status.toLowerCase()}>{u.status}</span></td>
          <td><div className="row"><button className="btn" onClick={()=>updateUser(u.id,'ACTIVE')}>Aktif</button><button className="btn" onClick={()=>updateUser(u.id,'PENDING')}>Beklet</button><button className="btn danger" onClick={()=>updateUser(u.id,'SUSPENDED')}>Askıya Al</button></div></td>
        </tr>)}</tbody></table>
      </div>
    </section>}

    {tab==='academic'&&<section className="adminPanelSection">
      <div className="moduleHeaderRow"><div><div className="moduleEyebrow">AKADEMİK KALİTE</div><h2>Soru Bankası Onay Merkezi</h2><p className="muted">Yeni veya incelenmesi gereken soruları yayınlanmadan önce kontrol et.</p></div><div className="row"><select value={questionStatus} onChange={e=>setQuestionStatus(e.target.value)}><option value="PENDING">Bekleyen</option><option value="APPROVED">Onaylı</option><option value="REJECTED">Reddedilen</option><option value="ALL">Tümü</option></select></div></div>
      <div className="adminQuestionStats">{questionCounts.map((x:any)=><span className="pill" key={x.reviewStatus}>{x.reviewStatus}: {x._count._all}</span>)}</div>
      <AdminGameCMS/>
      <div className="adminQuestionList">
        {questions.length===0?<div className="card muted">Bu filtrede soru bulunmuyor.</div>:questions.map(q=><article className="card adminQuestionCard" key={q.id}>
          <div className="moduleHeaderRow"><div><span className="pill">{q.examType} · {q.subject} · {q.topic}</span><h3>{q.prompt}</h3></div><span className={'adminStatus '+q.reviewStatus.toLowerCase()}>{q.reviewStatus}</span></div>
          <div className="adminQuestionOptions">{Object.entries(q.options||{}).map(([k,v]:any)=><div key={k} className={k===q.correctAnswer?'correct':''}><strong>{k})</strong> {v}</div>)}</div>
          {q.explanation&&<p className="muted"><strong>Açıklama:</strong> {q.explanation}</p>}
          <div className="row"><button className="btn primary" onClick={()=>reviewQuestion(q.id,'APPROVE')}>Onayla</button><button className="btn danger" onClick={()=>reviewQuestion(q.id,'REJECT')}>Reddet</button><button className="btn" onClick={()=>reviewQuestion(q.id,'PENDING')}>İncelemeye Al</button></div>
        </article>)}
      </div>
    </section>}

    {tab==='payments'&&<section className="adminPanelSection">
      <div className="moduleHeaderRow"><div><div className="moduleEyebrow">FİNANS & AYLIK ÜRÜN ERİŞİMİ</div><h2>KEKS Test Ürünü · Ödeme & Kodlar</h2><p className="muted">“KEKS Eğilim Taraması ve Eğitim Düzeyine Göre Ön Görüşme Test Formu” için PayTR ödemelerini ve ürün erişim kodlarını tek yerde yönetin. Kod öğrenciye veya koça iletilebilir; ürün her kullanıcı için ay bazında yalnızca bir kez tamamlanabilir.</p></div><button className="btn primary" onClick={makeCode}>Yeni Ürün Kodu Oluştur</button></div>
      <div className="adminPaymentStats">{paymentTotals.map((x:any)=><div className="card" key={x.status}><div className="moduleEyebrow">{x.status}</div><div className="kpi">{x._count._all}</div><div className="muted">{money(x._sum.amountKurus||0)}</div></div>)}</div>
      <div className="card adminTableCard"><h3>Son Ödemeler</h3><table className="table"><thead><tr><th>Öğrenci</th><th>İşlem</th><th>Tutar</th><th>Durum</th><th>İşlem</th></tr></thead><tbody>{payments.map(p=><tr key={p.id}><td><strong>{p.student.fullName}</strong><div className="muted">{p.student.studentCode}</div></td><td>{p.merchantOid}<div className="muted">{dt(p.createdAt)}</div></td><td>{money(p.amountKurus)}</td><td><span className={'adminStatus '+p.status.toLowerCase()}>{p.status}</span></td><td><div className="row"><button className="btn" onClick={()=>setPayment(p.id,'PENDING')}>Bekleyen</button><button className="btn danger" onClick={()=>setPayment(p.id,'FAILED')}>Başarısız</button><button className="btn" onClick={()=>setPayment(p.id,'REFUNDED')}>İade</button></div></td></tr>)}</tbody></table></div>
      <div className="adminAccessGrid">
        <div className="card">
          <div className="moduleEyebrow">AYLIK KEKS ÜRÜN KODLARI</div>
          <h3>Ürün Erişim Kodları</h3>
          <p className="muted">Kodlar yönetici panelinde üretilir ve koça/öğrenciye iletilebilir. Kod kullanıldığı ayın ürünü hesaba tanımlanır; aynı kullanıcı aynı aylık ürünü ikinci kez açamaz.</p>
          {codes.slice(0,40).map(c=><div className="adminSimpleRow" key={c.id}>
            <div>
              <strong>{c.student?.fullName||'Atanmamış kod'} {c.student?.studentCode?'· '+c.student.studentCode:''}</strong>
              <span>{c.monthlyRecurring?'Aylık tekrar eden':'Tek kullanımlık'} · {c.currentMonthStatus==='AVAILABLE'?'Bu ay hazır':'Bu ay '+c.currentMonthStatus}</span>
              <code className="adminPrivateCode">{c.code||('•••• '+c.codeHint)}</code>
            </div>
            <span>{c.currentMonthActivatedAt?dt(c.currentMonthActivatedAt):dt(c.createdAt)}</span>
          </div>)}
        </div>
        <div className="card"><h3>Son Test Erişimleri</h3>{accesses.slice(0,20).map(a=><div className="adminSimpleRow" key={a.id}><div><strong>{a.student.fullName}</strong><span>{a.source} · {a.status}</span></div><span>{dt(a.createdAt)}</span></div>)}</div>
      </div>
    </section>}

    {tab==='security'&&<section className="adminPanelSection">
      <div className="moduleHeaderRow"><div><div className="moduleEyebrow">SİSTEM YÖNETİMİ</div><h2>Sistem & Güvenlik</h2><p className="muted">Servis durumlarını ve yönetici işlem geçmişini güvenli biçimde izle.</p></div><button className="btn" onClick={loadSecurity}>Yenile</button></div>
      {health&&<div className="adminHealthGrid">
        <HealthCard label="Neon Veritabanı" ok={health.database==='OK'} detail={health.database}/>
        <HealthCard label="Kimlik Doğrulama" ok={health.authSecret} detail={health.authSecret?'Yapılandırıldı':'Eksik'}/>
        <HealthCard label="PayTR" ok={health.paytr} detail={health.paytr?(health.paytrMerchantId||'Yapılandırıldı')+' · '+(health.paytrTestMode?'Test modu':'Canlı mod'):'Kimlik bilgileri bekleniyor'}/>
        <HealthCard label="Kayıt E-postası / Gmail" ok={health.gmail} detail={health.gmail?(health.gmailAddress||'keksakademi@gmail.com'):'Bağlantı bekleniyor'}/>
        <HealthCard label="Rapor E-postası / Gmail" ok={health.reportEmail} detail={health.reportEmail?(health.reportEmailAddress||'keksakademi@gmail.com')+' · Gönderim hazır':'Gmail bağlantısı bekleniyor'}/>
        <HealthCard label="Uygulama URL" ok={health.appUrl} detail={health.appUrl?'Yapılandırıldı':'Eksik'}/>
        <HealthCard label="Son 24 saat audit" ok={true} detail={String(health.recentAudit)+' kayıt'}/>
      </div>}
      <div className="card" style={{marginBottom:16}}>
        <div className="moduleEyebrow">ÖDEME ENTEGRASYONU</div>
        <h3>PayTR iFrame API Yapılandırması</h3>
        <p className="muted">PayTR Mağaza Paneli → BİLGİ sayfasındaki Merchant ID, Merchant Key ve Merchant Salt değerlerini girin. Key ve Salt düz metin olarak saklanmaz; şifreli biçimde korunur.</p>
        {health?.paytr&&<div className="notice"><strong>Yapılandırıldı:</strong> Merchant ID {health.paytrMerchantId||'—'} · {health.paytrTestMode?'Test modu':'Canlı mod'} · Ödeme başlatma ve callback doğrulaması aktif.</div>}
        <div className="row" style={{alignItems:'end',marginTop:12,flexWrap:'wrap'}}>
          <div className="field" style={{minWidth:180}}><label>Merchant ID</label><input value={paytrMerchantId} onChange={e=>setPaytrMerchantId(e.target.value)} placeholder={health?.paytrMerchantId||'Merchant ID'}/></div>
          <div className="field" style={{minWidth:220}}><label>Merchant Key</label><input type="password" value={paytrMerchantKey} onChange={e=>setPaytrMerchantKey(e.target.value)} placeholder="Merchant Key" autoComplete="new-password"/></div>
          <div className="field" style={{minWidth:220}}><label>Merchant Salt</label><input type="password" value={paytrMerchantSalt} onChange={e=>setPaytrMerchantSalt(e.target.value)} placeholder="Merchant Salt" autoComplete="new-password"/></div>
          <label className="row" style={{gap:8,alignItems:'center',paddingBottom:10}}><input type="checkbox" checked={paytrTestMode} onChange={e=>setPaytrTestMode(e.target.checked)}/><span>Test modu</span></label>
          <button className="btn primary" onClick={savePaytr} disabled={paytrBusy||paytrMerchantId.trim().length<2||paytrMerchantKey.trim().length<8||paytrMerchantSalt.trim().length<8}>{paytrBusy?'Kaydediliyor…':'PayTR’yi Kaydet ve Etkinleştir'}</button>
        </div>
      </div>
      <div className="card" style={{marginBottom:16}}>
        <div className="moduleEyebrow">ÖĞRENCİ KAYIT E-POSTASI</div>
        <h3>keksakademi@gmail.com Gönderici Bağlantısı</h3>
        <p className="muted">Öğrenci kayıt olduğunda öğrenci kodu, 1 yıl geçerli giriş anahtarı ve son geçerlilik tarihi doğrudan bu Gmail hesabından kayıt sırasında girilen Gmail adresine otomatik gönderilir.</p>
        {health?.gmail
          ? <div className="notice"><strong>Bağlı:</strong> {health.gmailAddress||'keksakademi@gmail.com'} · Otomatik kayıt e-postaları aktif.</div>
          : <div className="notice">Google hesabında 2 Adımlı Doğrulamayı açıp KEKS Akademi için 16 karakterli bir Uygulama Şifresi oluşturun. Şifre yalnızca güvenli, şifrelenmiş biçimde saklanır.</div>}
        <div className="row" style={{alignItems:'end',marginTop:12}}>
          <div className="field" style={{flex:1,minWidth:240}}>
            <label>Google Uygulama Şifresi</label>
            <input type="password" value={gmailAppPassword} onChange={e=>setGmailAppPassword(e.target.value)} placeholder="16 karakterli uygulama şifresi" autoComplete="new-password"/>
          </div>
          <button className="btn primary" onClick={connectGmail} disabled={gmailBusy||gmailAppPassword.replace(/\s+/g,'').length!==16}>{gmailBusy?'Bağlantı test ediliyor…':'Gmail’i Bağla ve Test Et'}</button>
        </div>
      </div>
      <div className="card adminFilterBar"><div className="field"><label>İşlem geçmişinde ara</label><input value={auditQ} onChange={e=>setAuditQ(e.target.value)} placeholder="Açıklama veya kullanıcı adı"/></div><button className="btn primary" onClick={loadSecurity}>Ara</button></div>
      <div className="card adminAuditCard"><h3>İşlem Geçmişi</h3>{logs.length===0?<p className="muted">Henüz kayıt yok.</p>:<div className="adminAuditList">{logs.map(l=><div className="adminAuditRow" key={l.id}><span className="adminAuditDot"/><div><strong>{l.summary}</strong><span>{l.actor?.name||'Sistem'}{l.actor?.email?' · '+l.actor.email:''} · {dt(l.createdAt)}</span></div></div>)}</div>}</div>
    </section>}
  </div>;
}

function AdminKpi({icon,value,label,warn=false}:{icon:string;value:any;label:string;warn?:boolean}){
  return <div className={'card adminKpi '+(warn?'warn':'')}><span className="moduleIcon">{icon}</span><div><div className="kpi">{value}</div><p>{label}</p></div></div>;
}
function MetricLine({label,value}:{label:string;value:any}){return <div className="adminMetricLine"><span>{label}</span><strong>{value}</strong></div>}
function HealthCard({label,ok,detail}:{label:string;ok:boolean;detail:string}){return <div className={'card adminHealthCard '+(ok?'ok':'bad')}><span className="adminHealthDot"/><div><strong>{label}</strong><p>{detail}</p></div></div>}
