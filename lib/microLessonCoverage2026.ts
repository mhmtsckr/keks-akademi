/**
 * Editorial backlog, NOT certification of official curriculum coverage.
 * Exam catalog entries are KEKS internal planning indexes until source-checked.
 */
import {ALL_MICRO_LESSONS} from './bankFreeMicroLessons';
import {EXAM_CATALOG} from './examCatalog';
import {resolveEducationLevelProfile} from './educationLevelProfile';
import {getEducationCurriculum} from './educationCurriculumMap';
import {CURRENT_YEAR_GRADE_POLICY,lessonAllowedForContext,resolveLearningCurriculumContext} from './curriculumPolicy2026';
import {VERIFIED_GRADE7_TURKISH_THEMES} from './verifiedGrade7TurkishThemes';
import {VERIFIED_GRADE56_THEMES} from './verifiedGrade56Themes';
import {VERIFIED_ADDITIONAL_TYMM_OUTCOMES} from './verifiedAdditionalTymmOutcomes';
import {VERIFIED_GRADE10_GEOGRAPHY} from './verifiedGrade10GeographyOutcomes';
import {VERIFIED_GRADE9_GEOGRAPHY} from './verifiedGrade9GeographyOutcomes';
import {VERIFIED_GRADE9_11_TDE_THEMES} from './verifiedGrade911LiteratureThemes';
import {VERIFIED_TYMM_MATH_OUTCOMES} from './verifiedTymmMathOutcomes2026';
import {VERIFIED_GRADE7_SCIENCE_OUTCOMES} from './verifiedGrade7ScienceOutcomes';
import {VERIFIED_GRADE911_HISTORY_UNITS,VERIFIED_GRADE911_HISTORY_OUTCOMES} from './verifiedGrade911HistoryOutcomes2026';

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
   const matched=topics.filter((t:string)=>candidates.some(l=>
      topicMatchesInternalIndex(t,l.topicTags)
      ||VERIFIED_GRADE56_THEMES.some(theme=>
        theme.grade===grade&&theme.subject===subject&&theme.title===t&&theme.id===l.sourceThemeId)
      ||VERIFIED_ADDITIONAL_TYMM_OUTCOMES.some(outcome=>
        outcome.grade===grade&&outcome.subject===subject&&
        outcome.code===l.sourceThemeId&&outcome.theme.replace(/^\\d+\\. (Tema|Ünite): /,'')===t)
      ||VERIFIED_GRADE7_SCIENCE_OUTCOMES.some(outcome=>
        grade===7&&subject==='Fen Bilimleri'&&outcome.title===t&&outcome.code===l.sourceThemeId)
      ||VERIFIED_TYMM_MATH_OUTCOMES.some(outcome=>
        outcome.grade===grade&&outcome.subject===subject&&outcome.code===l.sourceThemeId
        &&norm(outcome.theme)===norm(t))
      ||VERIFIED_GRADE911_HISTORY_OUTCOMES.some(outcome=>
        outcome.grade===grade&&subject==='Tarih'&&outcome.code===l.sourceThemeId&&
        norm(VERIFIED_GRADE911_HISTORY_UNITS.find(u=>u.grade===grade&&u.unit===outcome.unit)?.title||'')===norm(t))
      ||VERIFIED_GRADE9_11_TDE_THEMES.some(theme=>
        theme.grade===grade&&theme.subject===subject&&theme.theme===t&&theme.id===l.sourceThemeId)
   ));
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
 const historyProgramRows=[9,10,11].map(grade=>{
  const units=VERIFIED_GRADE911_HISTORY_UNITS.filter(x=>x.grade===grade).map(u=>({
   unit:u.unit,title:u.title,sourceUrl:u.url,
   checkedOn:u.checkedOn,
   outcomes:VERIFIED_GRADE911_HISTORY_OUTCOMES.filter(x=>x.grade===grade&&x.unit===u.unit)
    .map(x=>({code:x.code,skill:x.skill,sourceUrl:x.url,
      linkedPilotLessons:ALL_MICRO_LESSONS.filter(l=>l.sourceThemeId===x.code&&l.subject==='Tarih'&&l.targetGrades?.includes(grade)).length}))
  }));
  return {grade,subject:'Tarih',totalOfficialUnits:units.length,
    checkedOutcomeSubset:units.reduce((n,u)=>n+u.outcomes.length,0),
    linkedPilotLessons:units.reduce((n,u)=>n+u.outcomes.reduce((m,x)=>m+x.linkedPilotLessons,0),0),
    units,disclaimer:'Yalnız ünite başlıklarının tümü, 6 seçili çıktının kodları doğrulandı. Diğer kazanımlar henüz aktarılmamıştır; KEKS özgün alıştırmaları uzman onayı bekler.'};
 });
  const literatureProgramRows=[9,10,11].map(grade=>{
   const themes=VERIFIED_GRADE9_11_TDE_THEMES.filter(x=>x.grade===grade).map(x=>({
     id:x.id,theme:x.theme,sourceUrl:x.sourceUrl,outcomeCode:x.outcomeCode,
     verification:x.verification,skill:x.skill,
     linkedPilotLessons:ALL_MICRO_LESSONS.filter(l=>l.sourceThemeId===x.id
       &&l.targetGrades?.includes(grade)&&l.subject===x.subject).length
   }));
   return {grade,subject:'Türk Dili ve Edebiyatı',
     totalOfficialThemes:themes.length,
     verifiedOutcomeContexts:themes.filter(x=>x.verification==='OUTCOME_CODE').length,
     linkedPilotLessons:themes.reduce((n,x)=>n+x.linkedPilotLessons,0),
     themes,disclaimer:'TDE kodları birden fazla temada yeniden kullanılabilir; resmî çıktı bu kayıtta tema ve sınıfla birlikte tanımlanır. Pilot soru tüm dil becerisini ölçmez.'};
 });
  const grade9GeographyOutcomes=VERIFIED_GRADE9_GEOGRAPHY.map(outcome=>({
   code:outcome.code,theme:outcome.theme,sourceUrl:outcome.url,skill:outcome.skill,
   linkedPilotLessons:ALL_MICRO_LESSONS.filter(l=>l.sourceThemeId===outcome.code
     &&l.subject==='Coğrafya'&&l.targetGrades?.includes(9)).length
 }));
 const geographyOutcomes=VERIFIED_GRADE10_GEOGRAPHY.map(outcome=>({
   code:outcome.code,theme:outcome.theme,sourceUrl:outcome.url,skill:outcome.skill,
   linkedPilotLessons:ALL_MICRO_LESSONS.filter(l=>l.sourceThemeId===outcome.code&&l.subject==='Coğrafya'&&l.targetGrades?.includes(10)).length
 }));
 const verifiedMathOutcomeRows=VERIFIED_TYMM_MATH_OUTCOMES.map(outcome=>({
   code:outcome.code,grade:outcome.grade,subject:outcome.subject,theme:outcome.theme,skill:outcome.skill,sourceUrl:outcome.url,
   linkedPilotLessons:ALL_MICRO_LESSONS.filter(l=>l.sourceThemeId===outcome.code&&l.subject===outcome.subject&&l.targetGrades?.includes(outcome.grade)).length
 }));
 const verifiedAdditionalOutcomeRows=VERIFIED_ADDITIONAL_TYMM_OUTCOMES.map(outcome=>({
   grade:outcome.grade,subject:outcome.subject,theme:outcome.theme,
   code:outcome.code,skill:outcome.skill,sourceUrl:outcome.url,
   linkedPilotLessons:ALL_MICRO_LESSONS.filter(l=>l.sourceThemeId===outcome.code&&
     l.targetGrades?.includes(outcome.grade)&&l.subject===outcome.subject).length
 }));
  const verifiedMiddlePrograms=[5,6].flatMap(grade=>
   ['Türkçe','Fen Bilimleri'].map(subject=>{
     const entries=VERIFIED_GRADE56_THEMES.filter(theme=>theme.grade===grade&&theme.subject===subject);
     const themes=entries.map(theme=>({
       id:theme.id,title:theme.title,sourceUrl:theme.sourceUrl,
       verification:theme.verification,outcomeCode:theme.outcomeCode,
       linkedPilotLessons:ALL_MICRO_LESSONS.filter(l=>l.sourceThemeId===theme.id
         &&l.subject===subject&&l.targetGrades?.includes(grade)).length
     }));
     return {
       grade,subject,totalThemes:themes.length,
       linkedPilotLessons:themes.reduce((n,x)=>n+x.linkedPilotLessons,0),
       outcomesWithVerifiedCodes:themes.filter(x=>x.verification==='OUTCOME_CODE').length,
       themes,
       disclaimer:'Bu kayıt resmî MEB program başlıkları ve doğrulanmış beceri/kod kanıtıdır. Bir pilot ders temanın tüm öğrenme çıktılarını kapsamaz.'
     };
   })
 );
  const verifiedGrade7ScienceRows=VERIFIED_GRADE7_SCIENCE_OUTCOMES.map(outcome=>({
   unit:outcome.unit,title:outcome.title,outcomeCode:outcome.code,
   sourceUrl:outcome.url,skill:outcome.skill,scheduledHours:outcome.hours,
   linkedPilotLessons:ALL_MICRO_LESSONS.filter(l=>l.subject==='Fen Bilimleri'&&
     l.targetGrades?.includes(7)&&l.sourceThemeId===outcome.code).length
 }));
  const verifiedThemeRows=VERIFIED_GRADE7_TURKISH_THEMES.map(theme=>({
   id:theme.id,theme:theme.themeName,skill:theme.skill,
   outcomeCode:theme.outcomeCode,verification:theme.verification,
   sourceUrl:theme.sourceUrl,
   linkedPilotLessons:ALL_MICRO_LESSONS.filter(l=>
      l.sourceThemeId===theme.id&&l.targetGrades?.includes(7)&&l.subject==='Türkçe').length
 }));
 return {
  academicYear:'2026-2027',status:'EDITORIAL_BACKLOG_NOT_OFFICIAL_ALIGNMENT',
  verifiedGrade7Science:{
    grade:7,subject:'Fen Bilimleri',totalOfficialUnits:verifiedGrade7ScienceRows.length,
    verifiedSampleOutcomes:verifiedGrade7ScienceRows.length,
    linkedPilotLessons:verifiedGrade7ScienceRows.reduce((n,x)=>n+x.linkedPilotLessons,0),
    units:verifiedGrade7ScienceRows,
    disclaimer:'7 ünitenin her birinde yalnız bir resmî öğrenme çıktısı doğrulandı. MEB Fen Bilimleri 7. sınıf programındaki diğer çıktılar ve performans becerileri tamamlanmış değildir; KEKS soruları Pilot durumundadır.'
  },
    verifiedMath:{
    totalOfficialOutcomes:verifiedMathOutcomeRows.length,
    grades:[9,10,11],
    linkedPilotLessons:verifiedMathOutcomeRows.reduce((n,x)=>n+x.linkedPilotLessons,0),
    outcomes:verifiedMathOutcomeRows,
    disclaimer:'MEB kazanım kodu ve tema bağlamı doğrulandı; KEKS soruları MEB/ÖSYM tarafından onaylanmadı. Bir beceride dört çoktan seçmeli alıştırma tüm muhakeme ve performans çıktısını ölçmez.'
  },
  verifiedHistoryPrograms:historyProgramRows,
  verifiedLiteraturePrograms:literatureProgramRows,
    verifiedGrade9Geography:{
    grade:9,subject:'Coğrafya',totalOfficialOutcomes:grade9GeographyOutcomes.length,
    distinctThemes:new Set(grade9GeographyOutcomes.map(x=>x.theme)).size,
    linkedPilotLessons:grade9GeographyOutcomes.reduce((n,x)=>n+x.linkedPilotLessons,0),
    outcomes:grade9GeographyOutcomes,
    disclaimer:'Resmî MEB çıktı kaynakları doğrulandı; KEKS pilot alıştırmaları her çıktının tüm harita, analiz veya performans bileşenlerini ölçmez ve alan uzmanı onayı değildir.'
  },
    verifiedGeography:{
    grade:10,subject:'Coğrafya',totalOfficialOutcomes:geographyOutcomes.length,
    distinctThemes:new Set(geographyOutcomes.map(x=>x.theme)).size,
    linkedPilotLessons:geographyOutcomes.reduce((n,x)=>n+x.linkedPilotLessons,0),
    outcomes:geographyOutcomes,
    disclaimer:'MEB öğrenme çıktısı doğrulaması, bu konudaki bütün kazanımların eksiksiz kapsandığı veya özgün KEKS sorularının resmî olarak onaylandığı anlamına gelmez.'
  },
  verifiedAdditionalOutcomes:{
    totalOfficialOutcomes:verifiedAdditionalOutcomeRows.length,
    linkedPilotLessons:verifiedAdditionalOutcomeRows.reduce((n,x)=>n+x.linkedPilotLessons,0),
    outcomes:verifiedAdditionalOutcomeRows,
    note:'Bu yalnız kaynakla doğrulanmış belirli MEB öğrenme çıktılarının alt kümesidir; diğer çıktılar henüz dizine alınmamıştır.'
  },
  verifiedMiddlePrograms,
  verifiedThemeSources:{
    grade:7,subject:'Türkçe',source:'MEB TYMM resmî tema sayfaları',
    totalThemes:verifiedThemeRows.length,
    outcomesWithVerifiedCodes:verifiedThemeRows.filter(x=>x.verification==='KOD_DOGRULANDI').length,
    linkedPilotLessons:verifiedThemeRows.reduce((sum,x)=>sum+x.linkedPilotLessons,0),
    themes:verifiedThemeRows,
    disclaimer:'Resmî tema/kod kaynağı doğrulaması, bağımsız soru ve pedagojik uygunluk onayı değildir.'
  },
  totalLessons:ALL_MICRO_LESSONS.length,
  totalExercises:ALL_MICRO_LESSONS.reduce((sum,x)=>sum+x.exercises.length,0),
  gradeRows,examRows,
  interpretation:'Kapsama yalnız KEKS iç konu dizinini ifade eder. Resmî MEB kazanımları ve ÖSYM sınav kapsamları her sürüm için ayrıca doğrulanmalıdır.'
 };
}
