import {describe,it,expect} from 'vitest';
import {VERIFIED_ADDITIONAL_TYMM_OUTCOMES} from './verifiedAdditionalTymmOutcomes';
import {ADDITIONAL_TYMM_PILOT_LESSONS} from './additionalTymmPilotLessons';
import {lessonSourceEvidence} from './microLessonSourceEvidence';
import {lessonAllowedForContext,resolveLearningCurriculumContext} from './curriculumPolicy2026';
import {getEducationCurriculum} from './educationCurriculumMap';
import {findMicroLesson} from './bankFreeMicroLessons';

const sourceCodes=['BİY.9.2.2','BİY.9.2.4','BİY.10.1.2','BİY.10.2.1'] as const;

describe('9/10 Biyoloji TYMM resmî öğrenme çıktısı pilotları',()=>{
 it('dört çıktı resmî MEB kaynağı, yıl ve gerçek sınıfla eşleşir',()=>{
   for(const code of sourceCodes){
     const outcome=VERIFIED_ADDITIONAL_TYMM_OUTCOMES.find(x=>x.code===code);
     expect(outcome).toBeTruthy();
     expect(outcome?.subject).toBe('Biyoloji');
     expect(outcome?.grade).toBe(Number(code.match(/\\.(9|10)\\./)?.[1]));
     expect(outcome?.url.startsWith('https://tymm.meb.gov.tr/')).toBe(true);
     expect(outcome?.checkedOn).toBe('2026-10-20');
     const lessons=ADDITIONAL_TYMM_PILOT_LESSONS.filter(x=>x.sourceThemeId===code);
     expect(lessons).toHaveLength(1);
     const l=lessons[0];
     expect(l.targetGrades).toEqual([outcome?.grade]);
     expect(l.sourceUrl).toBe(outcome?.url);
     expect(lessonSourceEvidence(l).outcomeCodeVerified).toBe(true);
     expect(lessonSourceEvidence({...l,sourceUrl:'https://wrong.example'}).outcomeCodeVerified).toBe(false);
   }
 });
 it('her çıktıda 4 özgün dört seçenekli soru, kaynak ve adım adım çözüm bulunur',()=>{
   const pilots=ADDITIONAL_TYMM_PILOT_LESSONS.filter(x=>sourceCodes.includes(x.sourceThemeId as typeof sourceCodes[number]));
   expect(pilots).toHaveLength(4);
   const all=pilots.flatMap(x=>x.exercises.map(q=>q.prompt));
   expect(new Set(all).size).toBe(16);
   for(const lesson of pilots){
     expect(lesson.contentStatus).toBe('PILOT');
     expect(lesson.worked.steps).toHaveLength(3);
     expect(lesson.exercises).toHaveLength(4);
     for(const q of lesson.exercises){
       expect(Object.keys(q.options||{})).toEqual(['A','B','C','D']);
       expect(['A','B','C','D']).toContain(q.answer);
       expect(q.options?.[q.answer].length).toBeGreaterThan(10);
       expect(q.explanation.length).toBeGreaterThan(40);
     }
     expect(findMicroLesson({subject:'Biyoloji',topic:lesson.title})?.id).toBe(lesson.id);
   }
 });
 it('sınıf izolasyonu: 9. sınıf sorusu 10. sınıfa, 10. sınıf sorusu 9. sınıfa açılmaz',()=>{
   const nine=resolveLearningCurriculumContext({gradeLevel:'9. sınıf'});
   const ten=resolveLearningCurriculumContext({gradeLevel:'10. sınıf'});
   const twelve=resolveLearningCurriculumContext({gradeLevel:'12. sınıf'});
   for(const lesson of ADDITIONAL_TYMM_PILOT_LESSONS.filter(x=>sourceCodes.includes(x.sourceThemeId as typeof sourceCodes[number]))){
     expect(lessonAllowedForContext(lesson,lesson.targetGrades?.[0]===9?nine:ten)).toBe(true);
     expect(lessonAllowedForContext(lesson,lesson.targetGrades?.[0]===9?ten:nine)).toBe(false);
     expect(lessonAllowedForContext(lesson,twelve)).toBe(false);
   }
   expect(findMicroLesson({subject:'Biyoloji',topic:'Organizasyon'})).toBeNull();
 });
 it('müfredat haritası bu dört kodu gösterir ancak tüm çıktıları tamamlandı saymaz',()=>{
   const codes=(grade:number)=>
    getEducationCurriculum(grade+'. sınıf')?.subjects.find(x=>x.name==='Biyoloji')?.units
    .flatMap(x=>x.topics.flatMap(t=>t.subTopics.flatMap(st=>st.acquisitions.map(a=>a.id))))||[];
   expect(codes(9)).toEqual(expect.arrayContaining(['BİY.9.2.2','BİY.9.2.4']));
   expect(codes(10)).toEqual(expect.arrayContaining(['BİY.10.1.2','BİY.10.2.1']));
 });
});