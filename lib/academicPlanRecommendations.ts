import type {TopicConcordance} from '@/lib/academicEvidenceConsistency';

/** Suggestions are evidence-backed but remain a draft; no student task is created. */
export type AcademicInterventionSuggestion={
  examType:string;subject:string;topic:string;
  status:'CONFLICTING'|'BOTH_NEED_SUPPORT';
  priority:'HIGH'|'MEDIUM';questions:number;minutes:number;
  practiceQuestions:number;practiceDays:number;practiceAccuracy:number;
  examQuestions:number;examDays:number;examAccuracy:number;
  differencePoints:number;rationale:string;instruction:string;
};

const norm=(x:string)=>x.trim().toLocaleLowerCase('tr-TR');
export function academicInterventionKey(x:{examType:string;subject:string;topic:string}){
  return [x.examType,x.subject,x.topic].map(norm).join('|');
}
export function selectAcademicPlanRecommendations(
  topics:TopicConcordance[],limit=6
):AcademicInterventionSuggestion[]{
  const seen=new Set<string>();
  return [...topics].filter(t=>
    (t.status==='CONFLICTING'||t.status==='BOTH_NEED_SUPPORT')
    &&t.practiceQuestions>=20&&t.practiceDays>=2
    &&t.examQuestions>=10&&t.examDays>=2
    &&t.practiceAccuracy!=null&&t.examAccuracy!=null
    &&t.accuracyGapPoints!=null
  ).sort((a,b)=>{
    const tier=(v:TopicConcordance)=>v.status==='CONFLICTING'?0:1;
    return tier(a)-tier(b)||
      Math.abs(b.accuracyGapPoints!)-Math.abs(a.accuracyGapPoints!)||
      a.subject.localeCompare(b.subject,'tr');
  }).flatMap(t=>{
    const id=academicInterventionKey(t);
    if(seen.has(id))return [];
    seen.add(id);
    const contradiction=t.status==='CONFLICTING';
    return [{
      examType:t.examType,subject:t.subject,topic:t.topic,
      status:contradiction?'CONFLICTING' as const:'BOTH_NEED_SUPPORT' as const,
      priority:contradiction?'HIGH':'MEDIUM' as 'HIGH'|'MEDIUM',
      questions:8,minutes:20,
      practiceQuestions:t.practiceQuestions,practiceDays:t.practiceDays,
      practiceAccuracy:t.practiceAccuracy!,examQuestions:t.examQuestions,
      examDays:t.examDays,examAccuracy:t.examAccuracy!,
      differencePoints:t.accuracyGapPoints!,
      rationale:t.explanation,
      instruction:contradiction
        ?'Pratik ve deneme soru türü, süre ve güçlüğünü karşılaştır; iki farklı günde aynı kazanımdan yeni 8 soruluk kontrol uygula.'
        :'Yanlış ve boşların olası nedenlerini incele; iki ayrı günde yeni 8 soruluk kazanım kontrolü öner.'
    }];
  }).slice(0,Math.max(0,Math.min(12,Math.floor(limit))));
}
