import {describe,expect,it} from 'vitest';
import {MISSING_SUBJECT_PILOT_LESSONS} from './missingSubjectPilotLessons2026';
import {ALL_MICRO_LESSONS,findMicroLesson} from './bankFreeMicroLessons';
import {lessonAllowedForContext,resolveLearningCurriculumContext} from './curriculumPolicy2026';

describe('boş sorudan öğrenme için eksik beş ders pilot kataloğu',()=>{
 it('5 farklı alanda 20 özgün cevap anahtarlı alıştırma sunar',()=>{
  expect(MISSING_SUBJECT_PILOT_LESSONS).toHaveLength(5);
  expect(new Set(MISSING_SUBJECT_PILOT_LESSONS.map(x=>x.subject)).size).toBe(5);
  expect(new Set(ALL_MICRO_LESSONS.map(x=>x.id)).size).toBe(ALL_MICRO_LESSONS.length);
  expect(MISSING_SUBJECT_PILOT_LESSONS.flatMap(x=>x.exercises)).toHaveLength(20);
  for(const lesson of MISSING_SUBJECT_PILOT_LESSONS){
   expect(lesson.contentStatus).toBe('PILOT');
   expect(lesson.sourceThemeId).toBeUndefined();
   expect(lesson.version).toBe(1);
   expect(lesson.worked.steps.length).toBeGreaterThanOrEqual(3);
   expect(lesson.worked.answer.length).toBeGreaterThan(4);
   expect(lesson.exercises).toHaveLength(4);
   expect(lesson.topicTags?.length).toBeGreaterThanOrEqual(1);
   for(const q of lesson.exercises){
    expect(Object.keys(q.options||{})).toEqual(['A','B','C','D']);
    expect(Object.keys(q.options||{})).toContain(q.answer);
    expect(q.explanation.length).toBeGreaterThan(20);
   }
  }
 });
 it('dar alt beceride doğru dersi bulur; sadece genel başlıktan rastgele örnek seçmez',()=>{
  const expected=[
   ['Geometri','Üçgende İç Açılar','geometry-triangle-interior-2026-v1'],
   ['İngilizce','İngilizce zamanlar','english-present-simple-continuous-2026-v1'],
   ['Felsefe','Öncül ve Sonuç','philosophy-premise-conclusion-2026-v1'],
   ['Din Kültürü','Ahlaki Sorumluluk','religion-ethical-reasoning-2026-v1'],
   ['Mevzuat','Mevzuat Okuryazarlığı','legislation-source-scope-2026-v1']
  ] as const;
  for(const [subject,topic,id] of expected)
   expect(findMicroLesson({subject,topic,prompt:'Görsel soru'})?.id).toBe(id);
  for(const [subject] of expected)
   expect(findMicroLesson({subject,topic:'Genel / Karma',prompt:'Görsel soru'})).toBeNull();
 });
 it('sınıf veya sınav uyumsuzsa pilot ders için uygunluk onayı vermez',()=>{
  const geometry=MISSING_SUBJECT_PILOT_LESSONS[0],law=MISSING_SUBJECT_PILOT_LESSONS[4];
  expect(lessonAllowedForContext(geometry,resolveLearningCurriculumContext({gradeLevel:'7. sınıf',selectedGrade:7}))).toBe(true);
  expect(lessonAllowedForContext(geometry,resolveLearningCurriculumContext({gradeLevel:'5. sınıf',selectedGrade:5}))).toBe(false);
  expect(lessonAllowedForContext(law,resolveLearningCurriculumContext({gradeLevel:'Yetişkin',examType:'AGS'}))).toBe(true);
  expect(lessonAllowedForContext(law,resolveLearningCurriculumContext({gradeLevel:'9. sınıf',selectedGrade:9}))).toBe(false);
 });
 it('mevzuatın kurgusal örnek olduğu ve güncelliğin doğrulanması gerektiği açıktır',()=>{
  const law=MISSING_SUBJECT_PILOT_LESSONS.find(x=>x.subject==='Mevzuat')!;
  expect(law.explanation).toContain('kurgusal');
  expect(law.explanation).toContain('güncel resmî');
 });
});
