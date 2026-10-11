/**
 * Editorial backlog, NOT certification of official curriculum coverage.
 * Exam catalog entries are KEKS internal planning indexes until source-checked.
 */
import {ALL_MICRO_LESSONS} from './bankFreeMicroLessons';
import {EXAM_CATALOG} from './examCatalog';
import {resolveEducationLevelProfile} from './educationLevelProfile';
import {getEducationCurriculum} from './educationCurriculumMap';
import {CURRENT_YEAR_GRADE_POLICY,lessonAllowedForContext,resolveLearningCurriculumContext} from './curriculumPolicy2026';

function norm(text:string){return text.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/\s+/g,' ').trim();}
function overlap(a:string,b:string){return norm(a)===norm(b);}
function lessonSubjectAvailable(lessonSubject:string,subject:string){
 const a=norm(lessonSubject),b=norm(subject);
 return a===b||a==='tarih'&&b.startsWith('tarih-')||a==='cografya'&&b.startsWith('cografya-');
}
function topicMatchesInternalIndex(topic:string,lessonTags:readonly string[]|undefined){
 return Boolean(lessonTags?.some(tag=>overlap(tag,topic)));
}
export type CoverageSubject={
 subject:string;indexedTopics:number|null;matchedIndexTopics:number;
 pilotLessons:number;missingTopicNames:string[];topicIndexSource:'KEKS_INTERNAL'|'UNVERIFIED';
};
export type GradeCoverage={
 grade:number;framework:'TYMM'|'MEB_LEGACY';
 totalPilotLessons:number;totalSubjects:number;subjectsWithLessons:number;
 topicIndexComplete:false;
 subjects:CoverageSubject[];
};
export type ExamCoverage={
 examType:string;topicIndexSource:'KEKS_INTERNAL';totalPilotLessons:number;
 subjects:CoverageSubject[];
};
export function microLessonCoverageSnapshot(){
 const gradeRows:GradeCoverage[]=Object.keys(CURRENT_YEAR_GRADE_POLICY).map(Number).map(grade=>{
  const context=resolveLearningCurriculumContext({gradeLevel:grade+'. sınıf',selectedGrade:grade});
  const profile=resolveEducationLevelProfile(grade+'. sınıf');
  const curriculum=getEducationCurriculum(grade+'. sınıf');
  const subjects:CoverageSubject[]=(profile?.subjects||[]).map(subject=>{
   const candidates=ALL_MICRO_LESSONS.filter(x=>
     lessonAllowedForContext(x,context)&&lessonSubjectAvailable(x.subject,subject));
   const mapped=curriculum?.subjects.find(x=>x.name===subject);
   const topics=mapped?.units.flatMap(x=>x.topics.map(t=>t.name))
      .filter(t=>!t.includes('Düzey Geneli')&&!t.includes('Genel Kazanım Alanı'))||[];
   const matched=topics.filter((t:string)=>candidates.some(l=>topicMatchesInternalIndex(t,l.topicTags)));
   return {
    subject,indexedTopics:topics.length||null,matchedIndexTopics:matched.length,
    pilotLessons:candidates.length,
    missingTopicNames:topics.filter((t:string)=>!matched.includes(t)).slice(0,60),
    topicIndexSource:topics.length?'KEKS_INTERNAL' as const:'UNVERIFIED' as const
   };
  });
  return {
   grade,framework:CURRENT_YEAR_GRADE_POLICY[grade],
   totalPilotLessons:subjects.reduce((v,x)=>v+x.pilotLessons,0),
   totalSubjects:subjects.length,subjectsWithLessons:subjects.filter(x=>x.pilotLessons>0).length,
   topicIndexComplete:false as const,subjects
  };
 });
 const examRows:ExamCoverage[]=Object.entries(EXAM_CATALOG).map(([examType,subjects])=>{
  const ctx=resolveLearningCurriculumContext({gradeLevel:'Yetişkin',examType});
  const rows:CoverageSubject[]=Object.entries(subjects).map(([subject,topics])=>{
    const candidates=ALL_MICRO_LESSONS.filter(l=>lessonAllowedForContext(l,ctx)&&lessonSubjectAvailable(l.subject,subject));
    const matched=topics.filter((t:string)=>candidates.some(l=>topicMatchesInternalIndex(t,l.topicTags)));
    return {
      subject,indexedTopics:topics.length,matchedIndexTopics:matched.length,pilotLessons:candidates.length,
      missingTopicNames:topics.filter((t:string)=>!matched.includes(t)).slice(0,60),
      topicIndexSource:'KEKS_INTERNAL' as const
    };
  });
  return {examType,topicIndexSource:'KEKS_INTERNAL' as const,
   totalPilotLessons:rows.reduce((n,x)=>n+x.pilotLessons,0),subjects:rows};
 });
 return {
  academicYear:'2026-2027',status:'EDITORIAL_BACKLOG_NOT_OFFICIAL_ALIGNMENT',
  totalLessons:ALL_MICRO_LESSONS.length,
  totalExercises:ALL_MICRO_LESSONS.reduce((sum,x)=>sum+x.exercises.length,0),
  gradeRows,examRows,
  interpretation:'Kapsama yalnız KEKS iç konu dizinini ifade eder. Resmî MEB kazanımları ve ÖSYM sınav kapsamları her sürüm için ayrıca doğrulanmalıdır.'
 };
}
