'use client';

import { FormEvent, useMemo, useState } from 'react';
import { EXAM_CATALOG, ExamType } from '@/lib/examCatalog';

type Progress = {examType:string;subject:string;topic:string;completed:boolean};
type Practice = {id:string;examType:string;subject:string;topic:string|null;correct:number;wrong:number;blank:number;net:number;date:string;errorReason?:string|null;durationSeconds?:number|null;questionType?:string|null;problemType?:string|null;masteryScore?:number|null;masteryState?:string|null;metricPayload?:unknown};

export function StudentProgressTools({allowedExams,initialProgress,initialPractice,oabtField}:{allowedExams:ExamType[];initialProgress:Progress[];initialPractice:Practice[];oabtField?:string|null}) {
  const [exam,setExam]=useState<ExamType>(allowedExams[0]||'TYT');
  const [subject,setSubject]=useState<string>(Object.keys(EXAM_CATALOG[allowedExams[0]||'TYT'])[0]||'');
  const [progress,setProgress]=useState(initialProgress);
  const [practice,setPractice]=useState(initialPractice);
  const [msg,setMsg]=useState('');
  const [lastSchedule,setLastSchedule]=useState<{subject:string;topic:string;items:{day:number;label:string;date:string}[]} | null>(null);
  const subjects=Object.keys(EXAM_CATALOG[exam]||{});
  const topics=(EXAM_CATALOG[exam] as any)?.[subject]||[];
  const subjectKey=subject.toLocaleUpperCase('tr-TR');
  const isMath=/MATEMATİK|GEOMETRİ|SAYISAL/.test(subjectKey);
  const isTurkish=/TÜRKÇE|SÖZEL/.test(subjectKey);
  const isHistory=/TARİH|İNKILAP/.test(subjectKey);
  const isLiterature=/EDEBİYAT/.test(subjectKey)||(exam==='OABT'&&/EDEBİYAT/.test((oabtField||'').toLocaleUpperCase('tr-TR')));
  const isScience=/FİZİK|KİMYA|BİYOLOJİ|FEN/.test(subjectKey);
  const isLanguage=exam==='YDS'||/İNGİLİZCE|YABANCI DİL/.test(subjectKey);

  function changeExam(v:ExamType){setExam(v);setSubject(Object.keys(EXAM_CATALOG[v])[0]||'');}

  async function toggle(topic:string,completed:boolean){
    const r=await fetch('/api/student/progress',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'topic',examType:exam,subject,topic,completed})});
    const j=await r.json(); if(!r.ok){setMsg('Hata: '+(j.error||'Kaydedilemedi.'));return}
    setProgress(p=>[...p.filter(x=>!(x.examType===exam&&x.subject===subject&&x.topic===topic)),{examType:exam,subject,topic,completed}]);
    if(completed){
      setLastSchedule({subject,topic,items:j.reviewSchedule||[]});
      setMsg('Konu tamamlandı. 0–1–3–7–14–28. Gün Tekrar Sistemi görevleri günlük görevlerine eklendi.');
    }else{
      setLastSchedule(null);
      setMsg('Konu yeniden açıldı; bekleyen otomatik konu tekrar görevleri iptal edildi.');
    }
  }

  async function addPractice(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setMsg('');
    const form=e.currentTarget;
    const fd=new FormData(form);
    const optionalNumber=(name:string)=>{const raw=String(fd.get(name)||'').trim();return raw===''?undefined:Number(raw)};
    const optionalText=(name:string)=>String(fd.get(name)||'').trim()||undefined;
    const body={
      action:'practice',examType:exam,subject,topic:String(fd.get('topic')||''),
      correct:Number(fd.get('correct')||0),wrong:Number(fd.get('wrong')||0),blank:Number(fd.get('blank')||0),
      errorReason:optionalText('errorReason'),
      durationSeconds:optionalNumber('durationSeconds'),
      subTopic:optionalText('subTopic'),
      acquisition:optionalText('acquisition'),
      questionType:optionalText('questionType'),
      problemType:optionalText('problemType'),
      activeRecallScore:optionalNumber('activeRecallScore'),
      reviewSuccessScore:optionalNumber('reviewSuccessScore'),
      connectionScore:optionalNumber('connectionScore'),
      conceptScore:optionalNumber('conceptScore'),
      misconception:optionalText('misconception'),
      difficulty:optionalNumber('difficulty')
    };
    const r=await fetch('/api/student/progress',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
    const j=await r.json(); if(!r.ok){setMsg('Hata: '+(j.error||'Kaydedilemedi.'));return}
    setPractice(p=>[{...j.row,errorReason:j.errorReason??j.row.errorReason,masteryScore:j.learning?.score??null,masteryState:j.learning?.state??null,metricPayload:j.learning??null},...p]);
    const reasonLabel=String(j.errorReason||'').replaceAll('_',' ').toLocaleLowerCase('tr-TR');
    setMsg('Kayıt eklendi. Net: '+j.row.net+' · Bilgi hâkimiyeti: '+(j.learning?.score??'—')+' · '+(j.learning?.state==='DURABLE'?'Kalıcı':j.learning?.state==='RISKY'?'Riskli':j.learning?.state==='REINFORCING'?'Pekiştiriliyor':j.learning?.state==='LEARNING'?'Öğreniliyor':'Yeni')+(j.errorReason?' · Yanlış nedeni: '+reasonLabel+' ('+(j.errorReasonSource==='SYSTEM'?'sistem':'öğrenci')+')':'')+(j.learning?.nextAction?' · Sonraki adım: '+j.learning.nextAction:'')); form.reset();
  }

  const completedCount=useMemo(()=>progress.filter(x=>x.examType===exam&&x.completed).length,[progress,exam]);
  const totalCount=useMemo(()=>Object.values(EXAM_CATALOG[exam]).reduce((a:any,b:any)=>a+b.length,0),[exam]);
  const pct=totalCount?Math.round((completedCount/totalCount)*100):0;
  const topicTrends=useMemo(()=>{
    const now=Date.now();const week=7*86400000;
    const groups=new Map<string,{name:string;oldC:number;oldN:number;newC:number;newN:number}>();
    for(const row of practice){if(!row.topic)continue;const age=now-new Date(row.date).getTime();if(age<0||age>=2*week)continue;const key=row.examType+'|'+row.subject+'|'+row.topic;const item=groups.get(key)||{name:row.subject+' · '+row.topic,oldC:0,oldN:0,newC:0,newN:0};if(age<week){item.newC+=row.correct;item.newN+=row.correct+row.wrong+row.blank}else{item.oldC+=row.correct;item.oldN+=row.correct+row.wrong+row.blank}groups.set(key,item)}
    return [...groups.values()].filter(x=>x.oldN>=5&&x.newN>=5).map(x=>({...x,oldRate:Math.round(x.oldC/x.oldN*100),newRate:Math.round(x.newC/x.newN*100)}));
  },[practice]);

  return <div className="studentProgressLayout">
    {topicTrends.length>0&&<div className="card"><div className="moduleEyebrow">KONU BAZLI GELİŞİM</div><h2>Son iki haftada doğruluk değişimi</h2>{topicTrends.map(x=><p key={x.name}>{x.name}: %{x.oldRate} → %{x.newRate} <small className="muted">(önceki {x.oldN}, son hafta {x.newN} soru)</small></p>)}</div>}
    {msg&&<div className={'notice '+(msg.startsWith('Hata:')?'error':'')}>{msg}</div>}
    {lastSchedule&&<div className="card">
      <div className="moduleEyebrow">KONU TEKRAR TAKVİMİ</div>
      <h3>{lastSchedule.subject} · {lastSchedule.topic}</h3>
      <p className="muted">Konu bitişinden itibaren tekrar günleri otomatik oluşturuldu.</p>
      <div className="row" style={{flexWrap:'wrap'}}>
        {lastSchedule.items.map(item=><span className="pill" key={item.day}>
          {item.label} · {new Date(item.date).toLocaleDateString('tr-TR',{timeZone:'Europe/Istanbul',day:'2-digit',month:'short'})}
        </span>)}
      </div>
    </div>}

    <div className="card topicProgressCard">
      <div className="moduleHeaderRow">
        <div><div className="moduleEyebrow">KONU İLERLEMESİ</div><h2>{exam} · {subject}</h2></div>
        <div className="progressRing"><strong>%{pct}</strong><span>{completedCount}/{totalCount}</span></div>
      </div>
      <div className="row">
        <div className="field" style={{flex:1}}><label>Sınav</label><select value={exam} onChange={e=>changeExam(e.target.value as ExamType)}>{allowedExams.map(x=><option key={x}>{x}</option>)}</select></div>
        <div className="field" style={{flex:2}}><label>Ders</label><select value={subject} onChange={e=>setSubject(e.target.value)}>{subjects.map(x=><option key={x}>{x}</option>)}</select></div>
      </div>
      <div className="topicChecklist">
        {topics.map((topic:string)=>{
          const done=progress.some(x=>x.examType===exam&&x.subject===subject&&x.topic===topic&&x.completed);
          return <label key={topic} className={'topicCheck '+(done?'done':'')}>
            <input type="checkbox" checked={done} onChange={e=>toggle(topic,e.target.checked)}/>
            <span className="topicCheckMark">{done?'✓':'○'}</span>
            <span>{topic}</span>
          </label>
        })}
      </div>
    </div>

    <div className="studentPracticeColumn">
      <div className="card practiceEntryCard">
        <div className="moduleEyebrow">SORU ÇÖZÜMÜ</div>
        <h2>Bugünkü soru kaydını ekle</h2>
        <form className="form" onSubmit={addPractice}>
          <div className="field"><label>Konu</label><select name="topic"><option value="">Genel / Karma</option>{topics.map((x:string)=><option key={x}>{x}</option>)}</select></div>
          <div className="scoreInputs">
            <div className="field"><label>Doğru</label><input name="correct" type="number" min="0" required/></div>
            <div className="field"><label>Yanlış</label><input name="wrong" type="number" min="0" required/></div>
            <div className="field"><label>Boş</label><input name="blank" type="number" min="0" required/></div>
          </div>
          <div className="field"><label>Yanlış nedeni</label><select name="errorReason"><option value="">Sistem belirlesin</option><option value="BILGI_EKSIKLIGI">Bilgi eksikliği</option><option value="ISLEM_HATASI">İşlem hatası</option><option value="DIKKAT">Dikkat</option><option value="SORU_KOKU">Soru kökünü yanlış okuma</option><option value="SURE">Süre</option><option value="YONTEM_BILMEME">Yöntem bilmeme</option><option value="UNUTMA">Unutma</option></select><small className="muted">Yanlış varsa nedeni seçebilirsin. Boş bırakırsan KEKS yalnız yeterli performans kanıtı olduğunda otomatik sınıflandırır.</small></div>
          <div className="field"><label>Alt konu</label><input name="subTopic" placeholder="Örn. Yüzde-Kâr-Zarar"/></div>
          <div className="field"><label>Kazanım / beceri</label><input name="acquisition" placeholder="Örn. Yüzde artış-azalış ilişkisini problem durumlarında uygular."/></div>
          {(isMath||isTurkish||isLanguage)&&<div className="field"><label>Toplam süre (saniye)</label><input name="durationSeconds" type="number" min="0" max="7200" placeholder="Örn. 900"/></div>}
          {(isTurkish||isLanguage)&&<div className="field"><label>Soru türü</label><input name="questionType" placeholder={isLanguage?'Örn. paragraf / çeviri / cloze':'Örn. ana düşünce / çıkarım / dil bilgisi'}/></div>}
          {isMath&&<div className="field"><label>Problem / soru tipi</label><input name="problemType" placeholder="Örn. yüzde problemi / fonksiyon / sayısal mantık"/></div>}
          {(isHistory||exam==='AGS'||exam==='KPSS')&&<div className="scoreInputs">
            <div className="field"><label>Aktif hatırlama %</label><input name="activeRecallScore" type="number" min="0" max="100"/></div>
            <div className="field"><label>Tekrar başarısı %</label><input name="reviewSuccessScore" type="number" min="0" max="100"/></div>
          </div>}
          {isLiterature&&<div className="scoreInputs">
            <div className="field"><label>Dönem–yazar–eser bağlantısı %</label><input name="connectionScore" type="number" min="0" max="100"/></div>
            <div className="field"><label>Aktif hatırlama %</label><input name="activeRecallScore" type="number" min="0" max="100"/></div>
          </div>}
          {exam==='OABT'&&!isLiterature&&<div className="scoreInputs">
            <div className="field"><label>Alan kavram hâkimiyeti %</label><input name="conceptScore" type="number" min="0" max="100"/></div>
            <div className="field"><label>Aktif hatırlama %</label><input name="activeRecallScore" type="number" min="0" max="100"/></div>
          </div>}
          {isScience&&<><div className="field"><label>Kavram hâkimiyeti %</label><input name="conceptScore" type="number" min="0" max="100"/></div><div className="field"><label>Kavram yanılgısı</label><input name="misconception" placeholder="Varsa öğrencinin yanlış kavramsal modelini yaz"/></div></>}
          {(exam==='AYT'||exam==='OABT')&&<div className="field"><label>Soru zorluk düzeyi</label><select name="difficulty"><option value="">Seçiniz</option><option value="1">1 · Temel</option><option value="2">2 · Kolay-Orta</option><option value="3">3 · Orta</option><option value="4">4 · Zor</option><option value="5">5 · Çok zor</option></select></div>}
          <button className="btn primary">Kaydet ve Neti Hesapla</button>
        </form>
      </div>

      <div className="card recentPracticeCard">
        <div className="moduleEyebrow">SON KAYITLAR</div>
        <h2>Son soru çözümlerim</h2>
        {practice.length===0?<p className="muted">Henüz kayıt yok.</p>:practice.slice(0,8).map(p=><div key={p.id} className="practiceRow">
          <div><strong>{p.subject}</strong><span>{p.topic||'Karma'}</span></div>
          <div className="practiceScore"><b>{p.net}</b><span>net</span></div>
          <div className="practiceMeta">D {p.correct} · Y {p.wrong} · B {p.blank}{p.errorReason?' · '+p.errorReason.replaceAll('_',' '):''}{typeof p.masteryScore==='number'?' · Hâkimiyet '+Math.round(p.masteryScore)+'%':''}{p.masteryState?' · '+(p.masteryState==='DURABLE'?'Kalıcı':p.masteryState==='RISKY'?'Riskli':p.masteryState==='REINFORCING'?'Pekiştiriliyor':p.masteryState==='LEARNING'?'Öğreniliyor':'Yeni'):''}</div>
        </div>)}
      </div>
    </div>
  </div>;
}
