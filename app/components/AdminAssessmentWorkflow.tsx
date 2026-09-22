'use client';

import { useEffect,useState } from 'react';

export function AdminAssessmentWorkflow(){
  const [data,setData]=useState<any>(null);
  const [busy,setBusy]=useState('');
  const [msg,setMsg]=useState('');
  const [previewAnswers,setPreviewAnswers]=useState<Record<string,number>>({});
  const [preInterviewPreviewAnswers,setPreInterviewPreviewAnswers]=useState<Record<string,string|number>>({});

  async function load(){
    const r=await fetch('/api/admin/workflow',{cache:'no-store'});
    const j=await r.json();
    setData(j);
  }
  useEffect(()=>{load()},[]);

  async function act(action:string,id:string){
    setBusy(action+id);setMsg('');
    const body=action.includes('screening')?{action,assessmentId:id}:{action,attemptId:id};
    const r=await fetch('/api/admin/workflow',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
    const j=await r.json();setBusy('');
    if(!r.ok)return setMsg('Hata: '+(j.error||'İşlem başarısız.'));
    if(action==='approve_screening')setMsg('Eğilim taraması incelemesi onaylandı. Açık uçlu ön görüşme tarama sonrasında otomatik atama üzerinden devam ediyor.');
    if(action==='retake_screening')setMsg('Öğrenciye yeni KEKS tarama erişimi açıldı.');
    if(action==='approve_plan')setMsg('Birleşik plan yönetici tarafından onaylandı ve koça gönderildi.');
    if(action==='return_plan')setMsg('Ön görüşme yeniden doldurulmak üzere öğrenciye döndürüldü.');
    await load();
  }

  if(!data)return <div className="card"><p className="muted">Değerlendirme ve plan onay kuyruğu yükleniyor…</p></div>;

  return <div className="stack">
    {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')}>{msg}</div>}
    <div className="grid">
      <div className="card"><div className="kpi">{data.counts?.screenings||0}</div><div className="muted">Eğilim raporu yönetici onayı bekliyor</div></div>
      <div className="card"><div className="kpi">{data.counts?.plans||0}</div><div className="muted">Birleşik çalışma planı yönetici onayı bekliyor</div></div>
    </div>

    <div className="card">
      <div className="moduleEyebrow">KEKS TEST KÜTÜPHANESİ</div>
      <h2>Eğitim Düzeyine Göre Eğilim Taraması Formları</h2>
      <p className="muted">Formlar PDF olarak açılmaz. Yönetici her eğitim düzeyindeki formu doğrudan ekranda 1–5 seçeneklerinden işaretleyerek inceleyebilir. Bu alan önizlemedir; yapılan işaretlemeler öğrenci sonucu olarak kaydedilmez.</p>
      <div className="stack">
        {(data.forms||[]).map((form:any)=>{
          const answered=(form.questions||[]).filter((q:any)=>previewAnswers[q.id]!=null).length;
          return <details key={form.educationBand}>
            <summary><strong>{form.label} · {form.questionCount} soru</strong> <span className="muted">· İşaretlemeli form · {answered}/{form.questionCount} işaretlendi</span></summary>
            <div className="notice" style={{marginTop:10}}>
              <strong>Yönerge:</strong> {form.instruction}
              <div className="muted" style={{marginTop:8}}>
                (1) {form.scale?.[0]||'Hiç katılmıyorum'} · (2) {form.scale?.[1]||'Katılmıyorum'} · (3) {form.scale?.[2]||'Bazen / Kararsızım'} · (4) {form.scale?.[3]||'Katılıyorum'} · (5) {form.scale?.[4]||'Tamamen katılıyorum'}
              </div>
            </div>
            <div className="notice" style={{marginTop:10}}><strong>Bilimsel kullanım sınırı:</strong> {form.disclaimer}</div>
            <div className="row" style={{justifyContent:'space-between',alignItems:'center',margin:'12px 0'}}>
              <span className="pill">{answered}/{form.questionCount} işaretlendi</span>
              <button className="btn" type="button" onClick={()=>{
                const ids=new Set((form.questions||[]).map((q:any)=>q.id));
                setPreviewAnswers(prev=>Object.fromEntries(Object.entries(prev).filter(([id])=>!ids.has(id))));
              }}>İşaretlemeleri Temizle</button>
            </div>
            <div className="stack">
              {(form.questions||[]).map((q:any)=><div className="preInterviewQuestion" key={q.id}>
                <div className="questionMeta"><span>{q.orderNo}</span><small>{q.dimension}</small></div>
                <div style={{flex:1}}>
                  <strong>{q.prompt}</strong>
                  <div className="likertRow">
                    {[1,2,3,4,5].map(n=><label key={n} title={form.scale?.[n-1]||['Hiç katılmıyorum','Katılmıyorum','Bazen / Kararsızım','Katılıyorum','Tamamen katılıyorum'][n-1]}>
                      <input
                        type="radio"
                        name={'admin-preview-'+q.id}
                        value={n}
                        checked={previewAnswers[q.id]===n}
                        onChange={()=>setPreviewAnswers(a=>({...a,[q.id]:n}))}
                      />
                      <span>{n}</span>
                    </label>)}
                  </div>
                  <div className="muted" style={{fontSize:12,marginTop:4}}>
                    1 Hiç katılmıyorum · 2 Katılmıyorum · 3 Bazen / Kararsızım · 4 Katılıyorum · 5 Tamamen katılıyorum
                  </div>
                </div>
              </div>)}
            </div>
          </details>;
        })}
      </div>
    </div>

    <div className="card">
      <div className="moduleEyebrow">KEKS ÖN GÖRÜŞME KÜTÜPHANESİ</div>
      <h2>Eğitim ve Gelişim Düzeyine Göre Ön Görüşme Formları</h2>
      <p className="muted">Bu form eğilim taraması tamamlandıktan sonra öğrencinin eğitim düzeyine göre otomatik açılır. Davranış ifadeleri işaretlemeli, açıklama isteyen sorular açık uçludur.</p>
      <div className="stack">
        {(data.preInterviewForms||[]).map((form:any)=>{
          const answered=(form.questions||[]).filter((q:any)=>{
            const v=preInterviewPreviewAnswers[q.id];
            return v!==undefined&&v!==null&&String(v).trim()!=='';
          }).length;
          return <details key={form.id}>
            <summary><strong>{form.title}</strong> <span className="muted">· {form.questionCount} soru · {answered}/{form.questionCount} cevaplandı</span></summary>
            <div className="notice" style={{marginTop:10}}>
              <strong>Yönerge:</strong> Ders, ödev, arkadaşlık ve günlük sorumluluklarında son iki ayı düşün. Sana en çok uyan seçeneği işaretle. Doğru ya da yanlış cevap yoktur; seni en iyi anlatan seçeneği işaretle.
              <div className="muted" style={{marginTop:8}}>(1) Hiç katılmıyorum · (2) Katılmıyorum · (3) Bazen / Kararsızım · (4) Katılıyorum · (5) Tamamen katılıyorum</div>
              <div className="muted" style={{marginTop:8}}>Açık uçlu sorular kendi sözleriyle yazılarak cevaplanabilir. Bu alan yönetici önizlemesidir; cevaplar öğrenci sonucu olarak kaydedilmez.</div>
            </div>
            <div className="row" style={{justifyContent:'space-between',alignItems:'center',margin:'12px 0'}}>
              <span className="pill">{answered}/{form.questionCount} cevaplandı</span>
              <button className="btn" type="button" onClick={()=>{
                const ids=new Set((form.questions||[]).map((q:any)=>q.id));
                setPreInterviewPreviewAnswers(prev=>Object.fromEntries(Object.entries(prev).filter(([id])=>!ids.has(id))));
              }}>Cevapları Temizle</button>
            </div>
            <div className="stack">
              {(form.questions||[]).map((q:any)=><div className="preInterviewQuestion" key={q.id}>
                <div className="questionMeta"><span>{q.orderNo}</span><small>{q.dimension}</small></div>
                <div style={{flex:1}}>
                  <strong>{q.prompt}</strong>
                  {q.responseType==='TEXT'
                    ?<textarea
                        rows={4}
                        value={String(preInterviewPreviewAnswers[q.id]??'')}
                        onChange={e=>setPreInterviewPreviewAnswers(a=>({...a,[q.id]:e.target.value}))}
                        placeholder="Yönetici önizleme cevabını yazabilir…"
                      />
                    :q.responseType==='CHOICE'&&Array.isArray(q.options)
                      ?<select
                          value={String(preInterviewPreviewAnswers[q.id]??'')}
                          onChange={e=>setPreInterviewPreviewAnswers(a=>({...a,[q.id]:e.target.value}))}
                        >
                          <option value="">Seçiniz</option>
                          {q.options.map((o:any)=><option key={String(o.value??o)} value={String(o.value??o)}>{String(o.label??o)}</option>)}
                        </select>
                      :<fieldset className="likertChecklist" style={{border:0,padding:0,margin:'12px 0 0'}}>
                        {[1,2,3,4,5].map(n=>{
                          const label=['Hiç katılmıyorum','Katılmıyorum','Bazen / Kararsızım','Katılıyorum','Tamamen katılıyorum'][n-1];
                          return <label key={n} className="likertChecklistOption" style={{display:'flex',gap:10,alignItems:'center',padding:'9px 10px',border:'1px solid var(--line)',borderRadius:10,marginBottom:8,cursor:'pointer'}}>
                            <input
                              type="radio"
                              name={'admin-preinterview-preview-'+q.id}
                              value={n}
                              checked={Number(preInterviewPreviewAnswers[q.id])===n}
                              onChange={()=>setPreInterviewPreviewAnswers(a=>({...a,[q.id]:n}))}
                            />
                            <span><strong>({n})</strong> {label}</span>
                          </label>;
                        })}
                      </fieldset>}
                </div>
              </div>)}
            </div>
          </details>;
        })}
      </div>
    </div>

    <div className="card">
      <div className="moduleEyebrow">AŞAMA 1 · EĞİLİM TARAMASI</div>
      <h2>Ayrıntılı Değerlendirme ve Gelişim Raporları</h2>
      <p className="muted">Ön görüşme, eğilim taraması tamamlanınca eğitim ve gelişim düzeyine göre otomatik açılır. Yönetici tarama sonucunu ayrıca inceler; koça gönderim için son onay plan aşamasında verilir.</p>
    </div>

    {(data.screenings||[]).length===0?<div className="card muted">Yönetici onayı bekleyen eğilim taraması yok.</div>:(data.screenings||[]).map((a:any)=>{
      const report=a.report||{},leading=report.leadingDimensions||[],quality=report.responseQuality||{};
      const answerRows=Array.isArray(a.answers)?a.answers:[];
      const answerMap=new Map(answerRows.map((x:any)=>[x.questionId,x.value]));
      return <article className="card" key={a.id}>
        <div className="moduleHeaderRow">
          <div><div className="moduleEyebrow">YÖNETİCİ İNCELEMESİ</div><h2>{a.student.fullName}</h2><p className="muted">Kod: {a.student.studentCode} · {a.student.gradeLevel||'Düzey belirtilmedi'} · {new Date(a.completedAt).toLocaleString('tr-TR')} · Koç: {a.student.coach?.user?.name||'Atanmamış'}</p></div>
          <span className="pill">{report.dominance?.clarity||'DEĞERLENDİRME'}</span>
        </div>
        <div className="notice"><strong>Bilimsel kullanım sınırı:</strong> {report.disclaimer}</div>
        <div className="interviewScoreGrid">{Object.entries(a.scores||{}).sort((x:any,y:any)=>Number(y[1])-Number(x[1])).map(([k,v]:any)=><div className="briefMetric" key={k}><b>{Number(v).toFixed(2)}</b><span>{k}</span></div>)}</div>
        {report.habitScores&&<><h3 style={{marginTop:16}}>Çalışma Alışkanlıkları</h3><div className="interviewScoreGrid">{Object.entries(report.habitScores).map(([k,v]:any)=><div className="briefMetric" key={k}><b>{Number(v).toFixed(2)}</b><span>{k}</span></div>)}</div></>}
        {report.developmentSummary?.immediateActions?.length>0&&<div className="notice"><strong>İlk 28 gün için gelişim öncelikleri</strong>{report.developmentSummary.immediateActions.map((x:string,i:number)=><div key={i}>{i+1}. {x}</div>)}</div>}
        {leading.length>0&&<div className="stack">{leading.map((x:any)=><div className="card" key={x.name} style={{padding:14}}>
          <strong>{x.name} · {Number(x.score).toFixed(2)}/5</strong>
          {x.profile&&<><p><b>Motivasyon:</b> {x.profile.motivation}</p><p><b>Güçlü yönler:</b> {x.profile.strengths}</p><p><b>Gelişim riski:</b> {x.profile.risks}</p><p><b>Çalışma yaklaşımı:</b> {x.profile.plan}</p></>}
        </div>)}</div>}
        {quality.warnings?.length>0&&<div className="notice error"><strong>Yanıt kalitesi uyarısı</strong>{quality.warnings.map((x:string,i:number)=><div key={i}>{x}</div>)}</div>}
        {report.developmentFocus?.length>0&&<details><summary><strong>Gelişim odakları</strong></summary><div className="briefAgenda">{report.developmentFocus.map((x:string,i:number)=><div key={i}><span>{i+1}</span><p>{x}</p></div>)}</div></details>}
        {report.habitSignals?.length>0&&<details><summary><strong>Çalışma alışkanlığı yanıtları</strong></summary><div className="interviewAnswers">{report.habitSignals.map((x:any,i:number)=><div className="interviewAnswerRow" key={i}><div><span>{x.orderNo}</span><strong>{x.prompt}</strong></div><p>{x.response??'—'} / 5</p></div>)}</div></details>}
        <details style={{marginTop:12}}>
          <summary><strong>Öğrencinin çözdüğü testin tamamını ve cevaplarını görüntüle</strong></summary>
          <div className="notice" style={{marginTop:10}}><strong>{a.form?.label}</strong> · {a.form?.questionCount} soru · Kullanılan form: {a.formVersion}</div>
          <div className="interviewAnswers">
            {(a.form?.questions||[]).map((q:any)=><div className="interviewAnswerRow" key={q.id}>
              <div><span>{q.orderNo}</span><strong>{q.prompt}</strong><small>{q.dimension}</small></div>
              <p><strong>{String(answerMap.get(q.id)??'—')} / 5</strong></p>
            </div>)}
          </div>
        </details>
        <div className="row" style={{justifyContent:'flex-end',marginTop:14}}>
          <button className="btn" disabled={busy!==''} onClick={()=>act('retake_screening',a.id)}>Yeniden Tarama İste</button>
          <button className="btn primary" disabled={busy!==''} onClick={()=>act('approve_screening',a.id)}>{busy==='approve_screening'+a.id?'Onaylanıyor…':'Tarama İncelemesini Onayla'}</button>
        </div>
      </article>;
    })}

    <div className="card">
      <div className="moduleEyebrow">AŞAMA 2 · BİRLEŞİK PLAN</div>
      <h2>Ön Görüşme + Eğilim Taraması Plan Onayı</h2>
      <p className="muted">Bu aşamada 1 yıllık, aylık, haftalık ve günlük taslak birlikte incelenir; yönetici onayından sonra koça gönderilir.</p>
    </div>

    {(data.plans||[]).length===0?<div className="card muted">Yönetici onayı bekleyen çalışma planı yok.</div>:(data.plans||[]).map((a:any)=>{
      const report=a.report||{},draft=report.planDraft||{};
      return <article className="card interviewReviewCard awaitingApproval" key={a.id}>
        <div className="moduleHeaderRow">
          <div><div className="moduleEyebrow">PLAN ONAYI BEKLİYOR</div><h2>{a.student.fullName}</h2><p className="muted">Kod: {a.student.studentCode} · {a.form?.title} · {new Date(a.completedAt).toLocaleString('tr-TR')} · Koç: {a.student.coach?.user?.name||'Atanmamış'}</p></div>
          <span className="pill">{String(a.academicTrack).replaceAll('_',' ')}</span>
        </div>
        <div className="interviewScoreGrid">{Object.entries(a.scores||{}).map(([k,v]:any)=><div className="briefMetric" key={k}><b>{Number(v).toFixed(2)}</b><span>{k}</span></div>)}</div>
        {report.weakest?.length>0&&<div className="notice"><strong>Öncelikli gelişim alanları:</strong> {report.weakest.map((x:any)=>x.dimension+' '+x.score+'/5').join(' · ')}</div>}
        <div className="grid" style={{gridTemplateColumns:'1fr 1fr'}}>
          <div className="card"><h3>1 Yıllık Plan</h3>{draft.annual?.phases?.map((x:any)=><p key={x.phase}><strong>{x.phase}. Faz:</strong> {x.name} · Aylar {x.months?.join('-')}</p>)}<p className="muted">{draft.annual?.reviewCadence}</p></div>
          <div className="card"><h3>Aylık Plan</h3>{draft.monthly?.weeks?.map((x:string,i:number)=><p key={i}>{x}</p>)}</div>
        </div>
        <div className="card"><h3>Haftalık Plan</h3><p className="muted">{draft.weekly?.goals?.join(' · ')}</p>{draft.weekly?.weeks?.slice(0,1).map((w:any)=><div key={w.week}>{w.days?.map((d:any)=><div key={d.date} style={{marginBottom:8}}><strong>{new Date(d.date).toLocaleDateString('tr-TR')} · {d.subject}</strong><div className="muted">{d.durationMinutes} dk · {d.questions} soru · {d.method}</div></div>)}</div>)}</div>
        <details><summary><strong>İlk 28 günlük görev taslağını görüntüle</strong></summary><div className="stack">{draft.daily?.map((d:any)=><div className="card" style={{padding:12}} key={d.date}><strong>{new Date(d.date).toLocaleDateString('tr-TR')} · {d.subject}</strong><div className="muted">{d.durationMinutes} dk · {d.questions} soru · {d.method} · Destek: {d.supportDimension}</div></div>)}</div></details>
        <details style={{marginTop:12}}><summary><strong>Ön görüşme soru–cevaplarının tamamını görüntüle</strong></summary>
          <div className="notice" style={{marginTop:10}}><strong>Planlama ilkesi:</strong> İşaretlemeli sorular çalışma davranışı puanlamasına katkı sağlar; açık uçlu yanıtlar hedef, engel, öğrenme tercihi ve destek beklentisi için bağlamsal girdi sağlar.</div>
          <div className="interviewAnswers">{(a.form?.questions||[]).map((q:any)=><div className="interviewAnswerRow" key={q.id}><div><span>{q.orderNo}</span><strong>{q.prompt}</strong><small>{q.dimension}</small></div><p>{String((a.answers||{})[q.id]??'—')}</p></div>)}</div>
        </details>
        <div className="row" style={{justifyContent:'flex-end',marginTop:14}}>
          <button className="btn" disabled={busy!==''} onClick={()=>act('return_plan',a.id)}>Ön Görüşmeyi Yeniden Doldurt</button>
          <button className="btn primary" disabled={busy!==''} onClick={()=>act('approve_plan',a.id)}>{busy==='approve_plan'+a.id?'Koça gönderiliyor…':'Onayla ve Koça Gönder'}</button>
        </div>
      </article>;
    })}
  </div>;
}
