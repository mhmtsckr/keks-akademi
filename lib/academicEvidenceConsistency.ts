/**
 * Two complementary, descriptive views of learning evidence.
 *
 * A practice log may be self-reported and an exam analytics record is not
 * necessarily independently proctored. We never blend either source into
 * a mastery probability or claim that a high score proves retention.
 */
export type PracticeEvidenceRow={
  examType:string;subject:string;topic:string|null;date:Date|string;
  total:number;correct:number;wrong:number;blank:number;
  taskSubmissionId?:string|null;
};
export type ExamEvidenceRow={
  examType:string;subject:string;topic:string;examDate:Date|string;
  correct:number;wrong:number;blank:number;
};
export type WeekEvidence={
  start:string;end:string;questions:number;correct:number;wrong:number;blank:number;
  studyDays:number;accuracy:number|null;blankRate:number|null;
  taskReportedQuestions:number;
  evidence:'MULTI_DAY'|'INSUFFICIENT';
};
export type WeeklySeries={examType:string;weeks:WeekEvidence[]};
export type TopicConcordance={
  examType:string;subject:string;topic:string;
  practiceQuestions:number;practiceDays:number;practiceAccuracy:number|null;
  practiceReportedQuestions:number;
  examQuestions:number;examDays:number;examAccuracy:number|null;
  accuracyGapPoints:number|null;
  status:'CONFLICTING'|'BOTH_NEED_SUPPORT'|'BOTH_HIGH'|'MIXED'|'INSUFFICIENT';
  action:string;explanation:string;
};
const key=(date:Date)=>new Intl.DateTimeFormat('en-CA',{
  timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'
}).format(date);
const normal=(x:string)=>x.trim().toLocaleLowerCase('tr-TR');
function dayOrdinal(x:string){return Math.trunc(Date.parse(x+'T00:00:00Z')/86400000);}
function dayFromOrdinal(n:number){return new Date(n*86400000).toISOString().slice(0,10);}
function percent(x:number,q:number){return q>0?Math.round(x/q*100):null;}
function sampleValid(c:number,w:number,b:number,q:number){
  return [c,w,b,q].every(v=>Number.isSafeInteger(v)&&v>=0)
    &&q>0&&c+w+b===q;
}
type Group={examType:string;subject:string;topic:string;practice:{
  q:number;c:number;days:Set<string>;reported:number
};exam:{q:number;c:number;days:Set<string>}};

export function buildAcademicEvidenceConsistency(
  practice:PracticeEvidenceRow[],exams:ExamEvidenceRow[],now=new Date()
){
  const today=key(now),lastDay=dayOrdinal(today);
  const oldestDay=lastDay-34;
  const weeklyBuckets=new Map<string,{examType:string;weeks:WeekEvidence[]}>();
  const sourceGroups=new Map<string,Group>();
  let excludedPractice=0,excludedExams=0;
  function weekEntry(examType:string){
    const id=normal(examType);
    let found=weeklyBuckets.get(id);
    if(!found){
      found={examType:examType.trim(),weeks:Array.from({length:5},(_,i)=>{
        const start=lastDay-(4-i)*7-6,end=lastDay-(4-i)*7;
        return {start:dayFromOrdinal(start),end:dayFromOrdinal(end),
          questions:0,correct:0,wrong:0,blank:0,studyDays:0,
          accuracy:null,blankRate:null,taskReportedQuestions:0,
          evidence:'INSUFFICIENT' as const};
      })};
      weeklyBuckets.set(id,found);
    }
    return found;
  }
  const distinctByWeek=new Map<string,Set<string>>();
  for(const p of practice){
    const d=new Date(p.date),time=d.getTime(),examType=p.examType?.trim(),subject=p.subject?.trim();
    if(!Number.isFinite(time)||time>now.getTime()||!examType||!subject
      ||!sampleValid(p.correct,p.wrong,p.blank,p.total)){
      excludedPractice++;continue;
    }
    const day=key(d),ordinal=dayOrdinal(day);
    if(ordinal<oldestDay||ordinal>lastDay){excludedPractice++;continue;}
    const week=Math.floor((ordinal-oldestDay)/7);
    const weekly=weekEntry(examType);
    const w=weekly.weeks[week];
    w.questions+=p.total;w.correct+=p.correct;w.wrong+=p.wrong;w.blank+=p.blank;
    if(p.taskSubmissionId)w.taskReportedQuestions+=p.total;
    const distinctKey=normal(examType)+'|'+week;
    const distinct=distinctByWeek.get(distinctKey)||new Set<string>();
    distinct.add(day);distinctByWeek.set(distinctKey,distinct);
    const topic=p.topic?.trim();
    if(!topic)continue;
    const groupKey=normal(examType)+'|'+normal(subject)+'|'+normal(topic);
    let group=sourceGroups.get(groupKey);
    if(!group){
      group={examType,subject,topic,practice:{q:0,c:0,days:new Set(),reported:0},
        exam:{q:0,c:0,days:new Set()}};
      sourceGroups.set(groupKey,group);
    }
    group.practice.q+=p.total;group.practice.c+=p.correct;group.practice.days.add(day);
    if(p.taskSubmissionId)group.practice.reported+=p.total;
  }
  const weekly:WeeklySeries[]=[...weeklyBuckets.values()].map(group=>({
    examType:group.examType,
    weeks:group.weeks.map((w,i)=>{
      const days=distinctByWeek.get(normal(group.examType)+'|'+i)?.size||0;
      return {...w,studyDays:days,accuracy:percent(w.correct,w.questions),
        blankRate:percent(w.blank,w.questions),
        evidence:w.questions>=12&&days>=2?'MULTI_DAY' as const:'INSUFFICIENT' as const};
    })
  })).sort((a,b)=>a.examType.localeCompare(b.examType,'tr'));
  for(const e of exams){
    const d=new Date(e.examDate),time=d.getTime(),
      examType=e.examType?.trim(),subject=e.subject?.trim(),topic=e.topic?.trim(),
      q=e.correct+e.wrong+e.blank;
    if(!Number.isFinite(time)||time>now.getTime()||!examType||!subject||!topic
      ||!sampleValid(e.correct,e.wrong,e.blank,q)){
      excludedExams++;continue;
    }
    const day=key(d),ordinal=dayOrdinal(day);
    if(ordinal<oldestDay||ordinal>lastDay){excludedExams++;continue;}
    const groupKey=normal(examType)+'|'+normal(subject)+'|'+normal(topic);
    let group=sourceGroups.get(groupKey);
    if(!group){
      group={examType,subject,topic,practice:{q:0,c:0,days:new Set(),reported:0},
        exam:{q:0,c:0,days:new Set()}};
      sourceGroups.set(groupKey,group);
    }
    group.exam.q+=q;group.exam.c+=e.correct;group.exam.days.add(day);
  }
  const topics:TopicConcordance[]=[...sourceGroups.values()].map(g=>{
    const pq=g.practice.q,eq=g.exam.q;
    const practiceAccuracy=percent(g.practice.c,pq),examAccuracy=percent(g.exam.c,eq);
    // Both data streams need repeated, nontrivial exposure for comparison.
    const comparable=pq>=20&&g.practice.days.size>=2&&eq>=10&&g.exam.days.size>=2;
    const gap=comparable&&practiceAccuracy!=null&&examAccuracy!=null
      ?practiceAccuracy-examAccuracy:null;
    let status:TopicConcordance['status']='INSUFFICIENT';
    if(comparable&&gap!=null&&practiceAccuracy!=null&&examAccuracy!=null){
      if(Math.abs(gap)>=20)status='CONFLICTING';
      else if(practiceAccuracy<65&&examAccuracy<65)status='BOTH_NEED_SUPPORT';
      else if(practiceAccuracy>=80&&examAccuracy>=80)status='BOTH_HIGH';
      else status='MIXED';
    }
    const action:Record<TopicConcordance['status'],string>={
      CONFLICTING:'Koç iki veri kaynağının soru türü ve güçlük farkını incelemeli; iki ayrı günde yeni, karşılaştırılabilir kısa kontrol uygulamalı.',
      BOTH_NEED_SUPPORT:'Yanlış ve boş nedenlerini incele; farklı günlerde kısa yeniden ölçüm uygula.',
      BOTH_HIGH:'Bir hafta sonra farklı soru türleriyle transfer kontrolü yap; kalıcı öğrenme varsayma.',
      MIXED:'Farklı günlerde, aynı kazanımı ölçen yeni sorularla gözlemi sürdür.',
      INSUFFICIENT:'Karşılaştırma için en az 20 pratik sorusu/2 gün ve 10 deneme sorusu/2 farklı gün kaydı gerekli.'
    };
    return {
      examType:g.examType,subject:g.subject,topic:g.topic,
      practiceQuestions:pq,practiceDays:g.practice.days.size,
      practiceAccuracy,practiceReportedQuestions:g.practice.reported,
      examQuestions:eq,examDays:g.exam.days.size,examAccuracy,
      accuracyGapPoints:gap,status,action:action[status],
      explanation:gap==null?'İki kaynak arasında güvenilir karşılaştırma için tekrar ve hacim eşiği tamamlanmadı.'
        :'Pratik doğruluğu %'+practiceAccuracy+', deneme konu analizi doğruluğu %'+examAccuracy+
          '; fark '+(gap>0?'+':'')+gap+' yüzde puan. Bu iki kayıt kaynağının karşılaştırmasıdır; bağımsız gözetim veya kalıcı öğrenme kanıtı değildir.'
    };
  }).sort((a,b)=>{
    const priority:Record<TopicConcordance['status'],number>={
      CONFLICTING:0,BOTH_NEED_SUPPORT:1,MIXED:2,INSUFFICIENT:3,BOTH_HIGH:4
    };
    return priority[a.status]-priority[b.status]
      ||Math.min(b.practiceQuestions,b.examQuestions)-Math.min(a.practiceQuestions,a.examQuestions)
      ||a.subject.localeCompare(b.subject,'tr');
  }).slice(0,30);
  return {
    weekly,topics,
    sourceQuality:{
      excludedPractice,excludedExams,
      comparableTopics:topics.filter(x=>x.status!=='INSUFFICIENT').length,
      contradictoryTopics:topics.filter(x=>x.status==='CONFLICTING').length
    },
    limitations:'Haftalık ritim yalnız pratik kayıtlarından hesaplanır; deneme soruları ikinci kez toplama eklenmez. Pratik verileri ve deneme konu analizleri kullanıcı girişine dayanabilir. İki kaynağın uyuşması bağımsız ölçüm, nedensel etki veya kalıcı öğrenme kanıtı değildir. Soru güçlükleri ve farklı test biçimleri karşılaştırmayı etkileyebilir.'
  };
}
