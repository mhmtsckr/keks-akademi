/**
 * 2026–2027 MEB curricular rollout and exam-context routing.
 *
 * Sources:
 * https://tymm.meb.gov.tr/taslak-cerceve-planlari/temel-egitim
 * https://tymm.meb.gov.tr/taslak-cerceve-planlari/ortaogretim
 * https://www.osym.gov.tr/
 *
 * A curriculum mode determines the TARGET STYLE, NOT that a micro lesson has
 * been individually validated against a formal MEB outcome or ÖSYM blueprint.
 */
import {educationLevelKey,type EducationLevelKey} from './educationLevelProfile';

export const ACADEMIC_YEAR='2026-2027' as const;
export type CurriculumMode='TYMM'|'MEB_LEGACY'|'OSYM'|'UNRESOLVED';

export const CURRENT_YEAR_GRADE_POLICY:Readonly<Record<number,'TYMM'|'MEB_LEGACY'>>={
  1:'TYMM',2:'TYMM',3:'TYMM',4:'MEB_LEGACY',
  5:'TYMM',6:'TYMM',7:'TYMM',8:'MEB_LEGACY',
  9:'TYMM',10:'TYMM',11:'TYMM',12:'MEB_LEGACY'
};

const BY_LEVEL:Readonly<Record<EducationLevelKey,readonly number[]>>={
  PRIMARY_123:[1,2,3],PRIMARY_4:[4],MIDDLE_56:[5,6],
  MIDDLE_7:[7],MIDDLE_8:[8],HIGH_910:[9,10],
  HIGH_11:[11],HIGH_12:[12],GRADUATE_YKS:[]
};

const osymPrefixes=['TYT','AYT','YDT','YKS','LGS_EXAM','AGS','ÖABT','OABT','DGS','KPSS','EKPSS','ALES','YDS','YÖKDİL','YOKDIL'] as const;
export function canonicalExamType(value?:string|null):string|null{
  const v=(value||'').toLocaleUpperCase('tr-TR')
    .replace(/Ö/g,'O').replace(/İ/g,'I').replace(/Ğ/g,'G')
    .replace(/[–—]/g,'-').trim();
  if(!v||v==='GENEL'||v==='OKUL')return null;
  const match=osymPrefixes.find(k=>v.includes(k.toLocaleUpperCase('tr-TR').replace(/Ö/g,'O').replace(/İ/g,'I')));
  return match?match==='OABT'?'ÖABT':match==='YOKDIL'?'YÖKDİL':match:null;
}

function gradesFromLabel(value?:string|null):number[]{
  const raw=(value||'').trim();
  if(!raw)return [];
  // Do not interpret 1-2-3, 5-6 or 9-10 as a definite single grade.
  const trimmed=raw.replace(/\b\d{4}\s*[-/]\s*\d{4}\b/g,'');
  const candidates=[...trimmed.matchAll(/(?<![\d])(1[012]|[1-9])(?![\d])/g)]
    .map(x=>Number(x[1])).filter(n=>n>=1&&n<=12);
  return [...new Set(candidates)];
}

export type LearningCurriculumContext={
  academicYear:typeof ACADEMIC_YEAR;
  educationLevelKey:EducationLevelKey|null;
  grade:number|null;
  availableGrades:readonly number[];
  framework:CurriculumMode;
  examType:string|null;
  canSelectGrade:boolean;
  sourceUrl:string;
  curriculumVerified:boolean;
  note:string;
};
export function resolveLearningCurriculumContext(input:{
  gradeLevel?:string|null;
  selectedGrade?:number|null;
  examType?:string|null;
}):LearningCurriculumContext{
  const level=educationLevelKey(input.gradeLevel);
  const availableGrades=level?BY_LEVEL[level]:[];
  const exam=canonicalExamType(input.examType);
  const gradeCandidates=gradesFromLabel(input.gradeLevel).filter(g=>availableGrades.includes(g));
  const auto=availableGrades.length===1?availableGrades[0]
    :gradeCandidates.length===1?gradeCandidates[0]:null;
  const selected=input.selectedGrade;
  const grade=selected!==undefined&&selected!==null
    ?availableGrades.includes(selected)?selected:null
    :auto;
  // Graduate/candidate workflows are explicitly mapped to exam blueprints.
  if(level==='GRADUATE_YKS'||(!level&&exam&&exam!=='LGS_EXAM')){
    return {
      academicYear:ACADEMIC_YEAR,educationLevelKey:level,grade:null,
      availableGrades,framework:'OSYM',examType:exam||'YKS',canSelectGrade:false,
      sourceUrl:'https://www.osym.gov.tr/',curriculumVerified:false,
      note:'ÖSYM kapsamı ayrıca sınav/yıl kılavuzundan doğrulanmalıdır; bu bir KEKS tasarım yönlendirmesidir.'
    };
  }
  if(grade===null){
    return {
      academicYear:ACADEMIC_YEAR,educationLevelKey:level,grade:null,
      availableGrades,framework:'UNRESOLVED',examType:exam,
      canSelectGrade:availableGrades.length>1,
      sourceUrl:'https://tymm.meb.gov.tr/ogretim-programlari/',
      curriculumVerified:false,
      note:availableGrades.length>1
        ?'Bu öğrenci kaydı birden fazla sınıfı temsil ediyor. Mikro dersi seçmeden önce öğrencinin gerçek sınıfı belirlenmelidir.'
        :'Eğitim düzeyi belirlenmeden sınıf kazanımı atanmamalıdır.'
    };
  }
  const framework=CURRENT_YEAR_GRADE_POLICY[grade];
  return {
    academicYear:ACADEMIC_YEAR,educationLevelKey:level,grade,availableGrades,
    framework,examType:exam,canSelectGrade:availableGrades.length>1,
    sourceUrl:framework==='TYMM'
      ?grade<=8
        ?'https://tymm.meb.gov.tr/taslak-cerceve-planlari/temel-egitim'
        :'https://tymm.meb.gov.tr/taslak-cerceve-planlari/ortaogretim'
      :'https://www.meb.gov.tr/',
    curriculumVerified:false,
    note:framework==='TYMM'
      ?'Bu sınıfta TYMM uygulanır. Belirli bir kazanımla eşleşme ayrıca doğrulanmalıdır.'
      :'Bu sınıfta önceki MEB programı uygulanır. İlgili sınav için ÖSYM/MEB sınav bilgisi ayrıca kontrol edilmelidir.'
  };
}
export function lessonAllowedForContext(lesson:{
  targetGrades?:readonly number[];targetExams?:readonly string[];
},ctx:LearningCurriculumContext):boolean{
 if(ctx.framework==='UNRESOLVED')return false;
 if(ctx.grade!==null)return Boolean(lesson.targetGrades?.includes(ctx.grade));
 if(ctx.framework==='OSYM'){
   if(!ctx.examType)return false;
   return Boolean(lesson.targetExams?.some(k=>{
     const normalized=canonicalExamType(k)||k;
     return normalized===ctx.examType
       || (normalized==='YKS'&&['TYT','AYT','YDT','YKS'].includes(ctx.examType||''))
       || (normalized==='AGS'&&['AGS','ÖABT'].includes(ctx.examType||''));
   }));
 }
 return false;
}

export const EXAM_SOURCE_LINKS={
  MEB_TYMM:'https://tymm.meb.gov.tr/ogretim-programlari/',
  MEB_2026_2027_PRIMARY:'https://tymm.meb.gov.tr/taslak-cerceve-planlari/temel-egitim',
  MEB_2026_2027_HIGH:'https://tymm.meb.gov.tr/taslak-cerceve-planlari/ortaogretim',
  OSYM:'https://www.osym.gov.tr/'
} as const;
