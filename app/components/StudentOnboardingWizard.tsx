'use client';

import {useEffect,useMemo,useState} from 'react';
import {KeksDraftIndicator,useKeksFormDraft} from './useKeksFormDraft';
import {ADULT_EXAM_GROUPS} from '@/lib/agsExamOptions';
import {EDUCATION_LEVEL_OPTIONS} from '@/lib/educationLevels';
import {defaultExamTypeForOnboarding,subjectsForOnboarding} from '@/lib/studentOnboarding';
import {resolveEducationLevelProfile} from '@/lib/educationLevelProfile';

type Coach={
  id:string;name:string;studentCount:number;eligible:boolean;acceptingStudents:boolean;fitRank:number;
  displayTitle:string|null;specialties:string[];availableSlots:number;
  responseHours:number|null;responseTargetHours:number;
  sessionCompletionRate:number|null;profileCompleteness:number;fitReasons:string[];
};
type Resource={title:string;subject:string;publisher:string};

const STEPS=[
  'Hedefin',
  'Eğitim düzeyin',
  'Gerçekçi günlük süren',
  'Zayıf derslerin',
  'Kullandığın kaynaklar',
  'Son deneme sonucun',
  'Çalışma saatlerin',
  'Koçun'
];

const DAYS=['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi','Pazar'] as const;

export function StudentOnboardingWizard({
  initialGradeLevel,
  initialGoal,
  initialAcademicTrack,
  initialCoachId,
  studentId,
  coaches
}:{
  initialGradeLevel:string;
  initialGoal:string;
  initialAcademicTrack:string;
  initialCoachId:string;
  studentId:string;
  coaches:Coach[];
}){
  const [step,setStep]=useState(0);
  const [goal,setGoal]=useState(initialGoal||'');
  const [gradeLevel,setGradeLevel]=useState(initialGradeLevel||'');
  const [academicTrack,setAcademicTrack]=useState(initialAcademicTrack||'');
  const [coachOptions,setCoachOptions]=useState<Coach[]>(coaches);
  const [coachView,setCoachView]=useState<'all'|'recommended'>('all');
  const [coachLoading,setCoachLoading]=useState(false);
  const profile=useMemo(()=>resolveEducationLevelProfile(gradeLevel,academicTrack),[gradeLevel,academicTrack]);
  const trackSensitive=['HIGH_11','HIGH_12','GRADUATE_YKS'].includes(profile?.key||'');
  const subjects=useMemo(()=>subjectsForOnboarding(gradeLevel,academicTrack),[gradeLevel,academicTrack]);
  const [dailyMinutes,setDailyMinutes]=useState(profile?.study.defaultDailyMinutes||90);
  const [weakSubjects,setWeakSubjects]=useState<string[]>([]);
  const [resources,setResources]=useState<Resource[]>([]);
  const [noResources,setNoResources]=useState(false);
  const [resourceDraft,setResourceDraft]=useState<Resource>({title:'',subject:'',publisher:''});
  const [hasExam,setHasExam]=useState(false);
  const [examType,setExamType]=useState(defaultExamTypeForOnboarding(gradeLevel));
  const [totalNet,setTotalNet]=useState('');
  const [durationMinutes,setDurationMinutes]=useState('');
  const [preferredDays,setPreferredDays]=useState<string[]>(['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi']);
  const [studyStart,setStudyStart]=useState('19:00');
  const [studyEnd,setStudyEnd]=useState('21:00');
  const [coachId,setCoachId]=useState(initialCoachId||'');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [result,setResult]=useState<any>(null);
  const restoreDraft=(draft:any)=>{
    if(!draft||typeof draft!=='object')return;
    if(Number.isInteger(draft.step))setStep(draft.step);
    if(typeof draft.goal==='string')setGoal(draft.goal);
    if(typeof draft.gradeLevel==='string')setGradeLevel(draft.gradeLevel);
    if(typeof draft.academicTrack==='string')setAcademicTrack(draft.academicTrack);
    if(Number.isFinite(draft.dailyMinutes))setDailyMinutes(draft.dailyMinutes);
    if(Array.isArray(draft.weakSubjects))setWeakSubjects(draft.weakSubjects);
    if(Array.isArray(draft.resources))setResources(draft.resources);
    if(typeof draft.noResources==='boolean')setNoResources(draft.noResources);
    if(draft.resourceDraft)setResourceDraft(draft.resourceDraft);
    if(typeof draft.hasExam==='boolean')setHasExam(draft.hasExam);
    if(typeof draft.examType==='string')setExamType(draft.examType);
    if(typeof draft.totalNet==='string')setTotalNet(draft.totalNet);
    if(typeof draft.durationMinutes==='string')setDurationMinutes(draft.durationMinutes);
    if(Array.isArray(draft.preferredDays))setPreferredDays(draft.preferredDays);
    if(typeof draft.studyStart==='string')setStudyStart(draft.studyStart);
    if(typeof draft.studyEnd==='string')setStudyEnd(draft.studyEnd);
    if(typeof draft.coachId==='string')setCoachId(draft.coachId);
  };
  const draft=useKeksFormDraft<any>({kind:'ONBOARDING',scope:'first-visit-v1',studentId,onRestore:restoreDraft});
  useEffect(()=>{
    if(!draft.ready||result?.plan)return;
    draft.save({step,goal,gradeLevel,academicTrack,dailyMinutes,weakSubjects,resources,
      noResources,resourceDraft,hasExam,examType,totalNet,durationMinutes,
      preferredDays,studyStart,studyEnd,coachId});
  },[draft.ready,draft.save,result?.plan,step,goal,gradeLevel,academicTrack,dailyMinutes,
    weakSubjects,resources,noResources,resourceDraft,hasExam,examType,totalNet,
    durationMinutes,preferredDays,studyStart,studyEnd,coachId]);


  useEffect(()=>{
    if(!gradeLevel)return;
    const controller=new AbortController();
    setCoachLoading(true);
    const q=new URLSearchParams({gradeLevel});
    if(academicTrack)q.set('academicTrack',academicTrack);
    fetch('/api/public/coaches?'+q.toString(),{signal:controller.signal,cache:'no-store'})
      .then(async r=>{const j=await r.json();if(!r.ok)throw new Error(j.error||'Koçlar yüklenemedi.');setCoachOptions(j.coaches||[]);})
      .catch(e=>{if(e?.name!=='AbortError')setError('Partner Koç önerileri yenilenemedi.');})
      .finally(()=>setCoachLoading(false));
    return ()=>controller.abort();
  },[gradeLevel,academicTrack]);

  function toggleWeak(subject:string){
    setWeakSubjects(current=>current.includes(subject)?current.filter(x=>x!==subject):current.length<5?[...current,subject]:current);
  }

  function toggleDay(day:string){
    setPreferredDays(current=>current.includes(day)?current.filter(x=>x!==day):[...current,day]);
  }

  function changeLevel(value:string){
    setGradeLevel(value);
    const next=resolveEducationLevelProfile(value);
    setDailyMinutes(next?.study.defaultDailyMinutes||90);
    setWeakSubjects([]);
    setResources([]);
    setNoResources(false);
    setResourceDraft({title:'',subject:'',publisher:''});
    setExamType(defaultExamTypeForOnboarding(value));
    setCoachId('');
    const nextProfile=resolveEducationLevelProfile(value,academicTrack);
    if(!['HIGH_11','HIGH_12','GRADUATE_YKS'].includes(nextProfile?.key||''))setAcademicTrack(initialAcademicTrack||'');
  }

  function addResource(){
    if(!resourceDraft.title.trim()||!resourceDraft.subject){
      setError('Kaynak adı ve ders seçimi gerekli.');
      return;
    }
    setResources(current=>[...current,{...resourceDraft,title:resourceDraft.title.trim(),publisher:resourceDraft.publisher.trim()}]);
    setResourceDraft({title:'',subject:'',publisher:''});
    setNoResources(false);
    setError('');
  }

  function validateCurrent(){
    if(step===0&&goal.trim().length<3)return 'Hedefini en az birkaç kelimeyle yaz.';
    if(step===1&&!gradeLevel)return 'Eğitim düzeyini seç.';
    if(step===1&&trackSensitive&&!academicTrack)return 'Alanını seç.';
    if(step===2&&(dailyMinutes<30||dailyMinutes>(profile?.study.maxDailyMinutes||480)))return 'Bu düzey için gerçekçi bir günlük süre seç.';
    if(step===3&&!weakSubjects.length)return 'En az bir zayıf ders seç.';
    if(step===4&&!noResources&&!resources.length)return 'En az bir kaynak ekle veya “Henüz kaynak kullanmıyorum” seçeneğini işaretle.';
    if(step===5&&hasExam&&(!examType||totalNet===''))return 'Deneme türü ve net bilgisi gerekli.';
    if(step===6&&!preferredDays.length)return 'En az bir çalışma günü seç.';
    if(step===6&&studyEnd<=studyStart)return 'Bitiş saati başlangıç saatinden sonra olmalı.';
    if(step===7&&!coachId)return 'Bir koç seç.';
    if(step===7&&!coachOptions.some(x=>x.id===coachId&&x.eligible))return 'Koç şu anda öğrenci kabul etmiyor. Lütfen başka bir koç seç.';
    return '';
  }

  function next(){
    const issue=validateCurrent();
    if(issue){setError(issue);return}
    setError('');
    setStep(x=>Math.min(STEPS.length-1,x+1));
  }

  async function complete(){
    const issue=validateCurrent();
    if(issue){setError(issue);return}
    setBusy(true);setError('');
    try{
      const response=await fetch('/api/student/onboarding',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({
          action:'complete',
          goal:goal.trim(),
          gradeLevel,
          academicTrack:academicTrack||null,
          dailyMinutes,
          weakSubjects,
          resources:noResources?[]:resources.map(x=>({...x,publisher:x.publisher||null})),
          lastExam:hasExam?{
            examType,
            totalNet:Number(totalNet),
            durationMinutes:durationMinutes?Number(durationMinutes):null
          }:null,
          preferredDays,
          studyStart,
          studyEnd,
          coachId
        })
      });
      const json=await response.json();
      if(!response.ok){setError(json.error||'Başlangıç planı oluşturulamadı.');return}
      void draft.clear();
      setResult(json);
    }catch{
      setError('Bağlantı hatası oluştu. Bilgileriniz kaydedilemedi.');
    }finally{setBusy(false)}
  }

  if(result?.plan){
    return <div className="stack keksFocusOnboarding">
      <div className="notice">
        <strong>Başlangıç profilin hazır.</strong>
        <div className="muted">{result.plan.explanation}</div>
      </div>
      <div className="card">
        <span className="portalEyebrow">İLK DEĞER</span>
        <h2>İlk 7 Günlük Başlangıç Planı</h2>
        <p className="muted">Günlük {result.plan.dailyMinutes} dakika · {result.plan.studyWindow} · Koç: {result.coach?.name||'Seçildi'}</p>
      </div>
      <div className="stack">
        {result.plan.days.map((day:any)=><article className="card" key={day.date}>
          <div className="row" style={{justifyContent:'space-between',gap:12,alignItems:'flex-start'}}>
            <div><span className="portalEyebrow">{day.day}. GÜN</span><h3>{day.dayName} · {day.date}</h3></div>
            <strong>{day.dailyMinutes} dk</strong>
          </div>
          <div className="stack">
            {day.tasks.map((task:any,index:number)=><div className="notice" key={index}>
              <strong>{task.title}</strong>
              <div className="muted">{task.minutes} dk{task.questions>0?' · '+task.questions+' soru':''} · {task.reason}</div>
            </div>)}
          </div>
        </article>)}
      </div>
      <a className="btn primary" href="/ogrenci">Öğrenci Paneline Geç</a>
    </div>;
  }

  return <div className="stack keksFocusOnboarding keksStudentFormJourney">
    <div className="keksStudentFormIntro">
      <img src="/keks-official-2026.webp" width="54" height="82" alt="KEKS Akademi amblemi"/>
      <div><span className="keksAssessmentKicker">KEKS FOCUS PRO · İLK GİRİŞ</span>
      <h2>Öğrenme yolculuğunu birlikte planlayalım.</h2>
      <p>Bilgilerin her adımda korunur. Bağlantı kesilirse aynı cihazdan veya sunucuya eşitlendiyse hesabından devam edebilirsin.</p></div>
    </div>
    <KeksDraftIndicator status={draft.status} retry={()=>{void draft.retry()}}/>
    <div className="card keksFocusStepHeader">
      <div className="row" style={{justifyContent:'space-between',gap:16,alignItems:'center'}}>
        <div>
          <span className="portalEyebrow">İLK GİRİŞ SİHİRBAZI</span>
          <h2>{step+1}/8 · {STEPS[step]}</h2>
        </div>
        <strong>%{Math.round((step+1)/STEPS.length*100)}</strong>
      </div>
      <div className="keksFocusProgress" role="progressbar" aria-label="İlk giriş adımları" aria-valuemin={0} aria-valuemax={STEPS.length} aria-valuenow={step+1}>
        <span style={{width:((step+1)/STEPS.length*100)+'%'}}/>
      </div>
      <div className="keksOnboardingSteps" aria-label="İlk giriş adımları">
        {STEPS.map((name,i)=><button key={name} type="button" disabled={i>step||busy} className={'keksOnboardingStep '+(i===step?'current':i<step?'completed':'upcoming')} onClick={()=>{if(i<=step){setError('');setStep(i)}}} aria-current={i===step?'step':undefined}><span>{i<step?'✓':i+1}</span><small>{name}</small></button>)}
      </div>
    </div>

    <div className="card form keksFocusForm keksStudentFormCard">
      {step===0&&<>
        <label>Bu dönem ana hedefin ne?</label>
        <textarea value={goal} onChange={e=>setGoal(e.target.value)} rows={5} maxLength={240} placeholder="Örn. LGS’de nitelikli bir proje okuluna yerleşmek / Hukuk kazanmak / Matematik temelimi güçlendirmek"/>
        <small className="muted">KEKS planı hedefinle bağ kuracak; soyut bir “başarılı olmak” yerine mümkün olduğunca somut yaz.</small>
      </>}

      {step===1&&<>
        <label>Eğitim düzeyi / sınav grubu</label>
        <select value={gradeLevel} onChange={e=>changeLevel(e.target.value)}>
          <option value="">Seçiniz</option>
          <optgroup label="Eğitim Düzeyi">{EDUCATION_LEVEL_OPTIONS.map(x=><option key={x} value={x}>{x}</option>)}</optgroup>
          <optgroup label="Sınav Grubu">{ADULT_EXAM_GROUPS.map(x=><option key={x} value={x}>{x}</option>)}</optgroup>
        </select>
        {trackSensitive&&<div className="field"><label>Alan</label><select value={academicTrack} onChange={e=>{setAcademicTrack(e.target.value);setCoachId('')}}>
          <option value="">Alan seçiniz</option>
          <option value="SAYISAL">Sayısal</option>
          <option value="EŞİT AĞIRLIK">Eşit Ağırlık</option>
          <option value="SÖZEL">Sözel</option>
          <option value="DİL">Dil</option>
        </select><small className="muted">Partner Koç eşleştirmesi alan uzmanlığını da kullanır.</small></div>}
        {profile&&<div className="notice"><strong>{profile.curriculumScope}</strong><div className="muted">{profile.subjects.join(' · ')}</div></div>}
      </>}

      {step===2&&<>
        <label>Her gün gerçekten sürdürebileceğin net çalışma süresi</label>
        <div className="keksTimeValue">{dailyMinutes} dk <small>günlük hedef</small></div>
        <input aria-label="Günlük çalışma süresi kaydırıcısı" type="range" min={30} max={profile?.study.maxDailyMinutes||360} step={15} value={dailyMinutes} onChange={e=>setDailyMinutes(Number(e.target.value))}/>
        <input aria-label="Günlük çalışma süresi dakika" type="number" min={30} max={profile?.study.maxDailyMinutes||480} step={15} value={dailyMinutes} onChange={e=>setDailyMinutes(Number(e.target.value))}/>
        <small className="muted">İdealini değil, kötü bir günde bile büyük ölçüde sürdürebileceğin süreyi seç.</small>
      </>}

      {step===3&&<>
        <label>Şu an en çok zorlandığın dersler</label>
        <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))'}}>
          {subjects.map(subject=><button type="button" aria-pressed={weakSubjects.includes(subject)} className={'keksFormChoice '+(weakSubjects.includes(subject)?'selected':'')} key={subject} onClick={()=>toggleWeak(subject)}><span aria-hidden="true">{weakSubjects.includes(subject)?'✓':'+'}</span>{subject}</button>)}
        </div>
        <small className="muted">En fazla 5 ders. İlk 7 günlük plan bu derslere daha fazla ağırlık verecek.</small>
      </>}

      {step===4&&<>
        <label>Kullandığın kaynakları ekle</label>
        <input value={resourceDraft.title} onChange={e=>setResourceDraft(x=>({...x,title:e.target.value}))} placeholder="Kaynak / kitap adı"/>
        <select value={resourceDraft.subject} onChange={e=>setResourceDraft(x=>({...x,subject:e.target.value}))}>
          <option value="">Ders seç</option>{subjects.map(subject=><option key={subject} value={subject}>{subject}</option>)}
        </select>
        <input value={resourceDraft.publisher} onChange={e=>setResourceDraft(x=>({...x,publisher:e.target.value}))} placeholder="Yayınevi (isteğe bağlı)"/>
        <button className="btn" type="button" onClick={addResource}>Kaynağı Ekle</button>
        {resources.map((resource,index)=><div className="notice" key={index}><strong>{resource.title}</strong><div className="muted">{resource.subject}{resource.publisher?' · '+resource.publisher:''}</div></div>)}
        <label className="row" style={{justifyContent:'flex-start',gap:8}}><input type="checkbox" checked={noResources} onChange={e=>{setNoResources(e.target.checked);if(e.target.checked)setResources([])}}/><span>Henüz düzenli kullandığım bir kaynak yok.</span></label>
      </>}

      {step===5&&<>
        <label className="row" style={{justifyContent:'flex-start',gap:8}}><input type="checkbox" checked={hasExam} onChange={e=>setHasExam(e.target.checked)}/><span>Yakın zamanda deneme / tarama sınavı çözdüm.</span></label>
        {hasExam?<>
          <label>Deneme türü</label><input value={examType} onChange={e=>setExamType(e.target.value)} placeholder="TYT / LGS / KPSS / Okul"/>
          <label>Toplam net / puanlanabilir sonuç</label><input type="number" step="0.25" value={totalNet} onChange={e=>setTotalNet(e.target.value)}/>
          <label>Süre (dakika, isteğe bağlı)</label><input type="number" min={1} max={600} value={durationMinutes} onChange={e=>setDurationMinutes(e.target.value)}/>
        </>:<div className="notice"><strong>Deneme verisi olmadan da başlayabiliriz.</strong><div className="muted">İlk haftanın sonunda mini kontrol ile başlangıç verisi üretilecek.</div></div>}
      </>}

      {step===6&&<>
        <label>Genellikle hangi günler çalışabilirsin?</label>
        <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))'}}>
          {DAYS.map(day=><button type="button" aria-pressed={preferredDays.includes(day)} className={'keksFormChoice '+(preferredDays.includes(day)?'selected':'')} key={day} onClick={()=>toggleDay(day)}><span aria-hidden="true">{preferredDays.includes(day)?'✓':'+'}</span>{day}</button>)}
        </div>
        <div className="grid" style={{gridTemplateColumns:'1fr 1fr'}}>
          <div className="field"><label>Başlangıç</label><input type="time" value={studyStart} onChange={e=>setStudyStart(e.target.value)}/></div>
          <div className="field"><label>Bitiş</label><input type="time" value={studyEnd} onChange={e=>setStudyEnd(e.target.value)}/></div>
        </div>
      </>}

      {step===7&&<>
        <label>KEKS Partner Koç eşleşmesi</label>
        {coachLoading&&<div className="notice">Kayıtlı Partner Koçlar güncelleniyor…</div>}
        {!coachLoading&&coachOptions.length===0&&<div className="notice error"><strong>Şu anda yönetici onaylı Partner Koç bulunmuyor.</strong><div className="muted">KEKS ekibi yeni eşleşme açana kadar kayıt tamamlanamaz.</div></div>}
        <div className="row" style={{gap:8}}>
          <button type="button" className={coachView==='all'?'btn primary':'btn'} onClick={()=>setCoachView('all')}>Tüm Partner Koçlar ({coachOptions.length})</button>
          <button type="button" className={coachView==='recommended'?'btn primary':'btn'} onClick={()=>setCoachView('recommended')}>Önerilenler</button>
        </div>
        <div className="stack">
          {(coachView==='recommended'?coachOptions.filter(x=>x.eligible).slice(0,5):coachOptions).map((coach,index)=><button type="button" key={coach.id} className={'card btn keksCoachSelect '+(coachId===coach.id?'selected':'')} style={{textAlign:'left',opacity:coach.eligible?1:0.7}} disabled={!coach.eligible} onClick={()=>setCoachId(coach.id)}>
            <div className="row" style={{justifyContent:'space-between',gap:10,alignItems:'flex-start'}}>
              <div><strong>{index===0&&coachView==='recommended'?'Önerilen · ':''}{coach.name}</strong><div className="muted">{coach.displayTitle||'KEKS Partner Koç'}</div></div>
              <span className="pill">{coach.eligible?coach.availableSlots+' açık kontenjan':coach.availableSlots===0?'Kontenjan dolu':'Öğrenci kabulü kapalı'}</span>
            </div>
            <div className="muted" style={{marginTop:8}}>{coach.specialties.slice(0,3).join(' · ')||'Uzmanlık profili tamamlanıyor'}</div>
            <div className="row" style={{marginTop:8,gap:8,flexWrap:'wrap'}}>
              <span className="pill">Yanıt: {coach.responseHours==null?'veri birikiyor':coach.responseHours+' sa medyan'}</span>
              <span className="pill">Görüşme: {coach.sessionCompletionRate==null?'veri birikiyor':'%'+coach.sessionCompletionRate}</span>
            </div>
            {coach.fitReasons.slice(0,3).map((reason,i)=><small key={i} style={{display:'block',marginTop:5}}>• {reason}</small>)}
          </button>)}
        </div>
        <div className="notice"><strong>Eşleştirme nasıl yapılıyor?</strong><div className="muted">Yönetici tarafından onaylanmış bütün Partner Koçları görebilirsin. Eğitim düzeyi, alan/uzmanlık, kapasite, yanıt süresi ve görüşme disiplini yalnızca öneri sıralamasını belirler; uygun ve açık kontenjanlı koçlardan istediğini seçebilirsin.</div></div>
      </>}

      {error&&<div className="notice error" role="alert">{error}</div>}

      <div className="row" style={{justifyContent:'space-between',gap:12}}>
        <button className="btn" type="button" disabled={step===0||busy} onClick={()=>{setError('');setStep(x=>Math.max(0,x-1))}}>Geri</button>
        {step<STEPS.length-1
          ?<button className="btn primary" type="button" disabled={!draft.ready} onClick={next}>Devam Et</button>
          :<button className="btn primary" type="button" disabled={busy||!draft.ready} onClick={complete}>{busy?'Plan hazırlanıyor…':'İlk 7 Günlük Planımı Oluştur'}</button>}
      </div>
    </div>
  </div>;
}
