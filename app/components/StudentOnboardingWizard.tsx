'use client';

import {useMemo,useState} from 'react';
import {ADULT_EXAM_GROUPS} from '@/lib/agsExamOptions';
import {EDUCATION_LEVEL_OPTIONS} from '@/lib/educationLevels';
import {defaultExamTypeForOnboarding,subjectsForOnboarding} from '@/lib/studentOnboarding';
import {resolveEducationLevelProfile} from '@/lib/educationLevelProfile';

type Coach={id:string;name:string;studentCount:number};
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
  initialCoachId,
  coaches
}:{
  initialGradeLevel:string;
  initialGoal:string;
  initialCoachId:string;
  coaches:Coach[];
}){
  const [step,setStep]=useState(0);
  const [goal,setGoal]=useState(initialGoal||'');
  const [gradeLevel,setGradeLevel]=useState(initialGradeLevel||'');
  const profile=useMemo(()=>resolveEducationLevelProfile(gradeLevel),[gradeLevel]);
  const subjects=useMemo(()=>subjectsForOnboarding(gradeLevel),[gradeLevel]);
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
    if(step===2&&(dailyMinutes<30||dailyMinutes>(profile?.study.maxDailyMinutes||480)))return 'Bu düzey için gerçekçi bir günlük süre seç.';
    if(step===3&&!weakSubjects.length)return 'En az bir zayıf ders seç.';
    if(step===4&&!noResources&&!resources.length)return 'En az bir kaynak ekle veya “Henüz kaynak kullanmıyorum” seçeneğini işaretle.';
    if(step===5&&hasExam&&(!examType||totalNet===''))return 'Deneme türü ve net bilgisi gerekli.';
    if(step===6&&!preferredDays.length)return 'En az bir çalışma günü seç.';
    if(step===6&&studyEnd<=studyStart)return 'Bitiş saati başlangıç saatinden sonra olmalı.';
    if(step===7&&!coachId)return 'Bir koç seç.';
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
      setResult(json);
    }catch{
      setError('Bağlantı hatası oluştu. Bilgileriniz kaydedilemedi.');
    }finally{setBusy(false)}
  }

  if(result?.plan){
    return <div className="stack">
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

  return <div className="stack">
    <div className="card">
      <div className="row" style={{justifyContent:'space-between',gap:16,alignItems:'center'}}>
        <div>
          <span className="portalEyebrow">İLK GİRİŞ SİHİRBAZI</span>
          <h2>{step+1}/8 · {STEPS[step]}</h2>
        </div>
        <strong>%{Math.round((step+1)/STEPS.length*100)}</strong>
      </div>
      <div style={{height:8,borderRadius:999,overflow:'hidden',background:'rgba(255,255,255,.08)'}}>
        <div style={{height:'100%',width:((step+1)/STEPS.length*100)+'%',background:'currentColor'}}/>
      </div>
    </div>

    <div className="card form">
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
        {profile&&<div className="notice"><strong>{profile.curriculumScope}</strong><div className="muted">{profile.subjects.join(' · ')}</div></div>}
      </>}

      {step===2&&<>
        <label>Her gün gerçekten sürdürebileceğin net çalışma süresi</label>
        <div className="kpi">{dailyMinutes} dk</div>
        <input type="range" min={30} max={profile?.study.maxDailyMinutes||360} step={15} value={dailyMinutes} onChange={e=>setDailyMinutes(Number(e.target.value))}/>
        <input type="number" min={30} max={profile?.study.maxDailyMinutes||480} step={15} value={dailyMinutes} onChange={e=>setDailyMinutes(Number(e.target.value))}/>
        <small className="muted">İdealini değil, kötü bir günde bile büyük ölçüde sürdürebileceğin süreyi seç.</small>
      </>}

      {step===3&&<>
        <label>Şu an en çok zorlandığın dersler</label>
        <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))'}}>
          {subjects.map(subject=><button type="button" className={weakSubjects.includes(subject)?'btn primary':'btn'} key={subject} onClick={()=>toggleWeak(subject)}>{subject}</button>)}
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
          {DAYS.map(day=><button type="button" className={preferredDays.includes(day)?'btn primary':'btn'} key={day} onClick={()=>toggleDay(day)}>{day}</button>)}
        </div>
        <div className="grid" style={{gridTemplateColumns:'1fr 1fr'}}>
          <div className="field"><label>Başlangıç</label><input type="time" value={studyStart} onChange={e=>setStudyStart(e.target.value)}/></div>
          <div className="field"><label>Bitiş</label><input type="time" value={studyEnd} onChange={e=>setStudyEnd(e.target.value)}/></div>
        </div>
      </>}

      {step===7&&<>
        <label>KEKS Partner Koçunu seç / doğrula</label>
        <select value={coachId} onChange={e=>setCoachId(e.target.value)}>
          <option value="">Koç seçiniz</option>
          {coaches.map(coach=><option key={coach.id} value={coach.id}>{coach.name} · {coach.studentCount} öğrenci</option>)}
        </select>
        <div className="notice"><strong>Bu son adım.</strong><div className="muted">Tamamladığında KEKS bilgilerini tek profile bağlayacak ve ilk 7 günlük planını anında oluşturacak.</div></div>
      </>}

      {error&&<div className="notice error" role="alert">{error}</div>}

      <div className="row" style={{justifyContent:'space-between',gap:12}}>
        <button className="btn" type="button" disabled={step===0||busy} onClick={()=>{setError('');setStep(x=>Math.max(0,x-1))}}>Geri</button>
        {step<STEPS.length-1
          ?<button className="btn primary" type="button" onClick={next}>Devam Et</button>
          :<button className="btn primary" type="button" disabled={busy} onClick={complete}>{busy?'Plan hazırlanıyor…':'İlk 7 Günlük Planımı Oluştur'}</button>}
      </div>
    </div>
  </div>;
}
