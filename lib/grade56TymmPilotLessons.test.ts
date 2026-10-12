import {describe,expect,it} from 'vitest';
import {VERIFIED_GRADE56_THEMES,grade56ThemesFor} from './verifiedGrade56Themes';
import {GRADE56_TYMM_PILOT_LESSONS} from './grade56TymmPilotLessons';
import {ALL_MICRO_LESSONS,findMicroLesson} from './bankFreeMicroLessons';
import {lessonSourceEvidence} from './microLessonSourceEvidence';
import {resolveLearningCurriculumContext,lessonAllowedForContext} from './curriculumPolicy2026';
import {getEducationCurriculum} from './educationCurriculumMap';
import {microLessonCoverageSnapshot} from './microLessonCoverage2026';

describe('2026–27 5 ve 6. sınıf resmî Türkçe/Fen dizini',()=>{
  it('26 MEB tema/ünitesini, kaynak kanıtını ve 4 çıktı kodunu ayrı tutar',()=>{
    expect(VERIFIED_GRADE56_THEMES).toHaveLength(26);
    expect(grade56ThemesFor(5,'Türkçe')).toHaveLength(6);
    expect(grade56ThemesFor(6,'Türkçe')).toHaveLength(6);
    expect(grade56ThemesFor(5,'Fen Bilimleri')).toHaveLength(7);
    expect(grade56ThemesFor(6,'Fen Bilimleri')).toHaveLength(7);
    expect(new Set(VERIFIED_GRADE56_THEMES.map(t=>t.id)).size).toBe(26);
    expect(VERIFIED_GRADE56_THEMES.filter(t=>t.verification==='OUTCOME_CODE').map(t=>t.outcomeCode).sort())
      .toEqual(['FB.5.1.3','FB.5.2.1','FB.6.1.1','FB.6.6.1'].sort());
    for(const x of VERIFIED_GRADE56_THEMES){
      expect(x.sourceUrl.startsWith('https://tymm.meb.gov.tr/')).toBe(true);
      expect([5,6]).toContain(x.grade);
      if(x.verification==='PROGRAM_INDEX'){
        expect(x.outcomeCode).toBeNull();
        expect(x.skill).toBeNull();
      }else expect(x.skill).toBeTruthy();
    }
  });
  it('8 özgün mikro derste 32 farklı soru ve tek doğru seçenek bulunur',()=>{
    expect(GRADE56_TYMM_PILOT_LESSONS).toHaveLength(8);
    const prompts:string[]=[];
    for(const x of GRADE56_TYMM_PILOT_LESSONS){
      expect(x.contentStatus).toBe('PILOT');
      expect(x.targetGrades).toHaveLength(1);
      expect(x.worked.steps).toHaveLength(3);
      expect(x.exercises).toHaveLength(4);
      for(const q of x.exercises){
        expect(Object.keys(q.options||{})).toEqual(['A','B','C','D']);
        expect(q.options?.[q.answer]).toBeTruthy();
        expect(q.explanation.length).toBeGreaterThan(20);
        prompts.push(q.prompt);
      }
      const source=lessonSourceEvidence(x);
      expect(source.themeVerified).toBe(true);
      expect(source.sourceUrl).toBe(x.sourceUrl);
      const theme=VERIFIED_GRADE56_THEMES.find(t=>t.id===x.sourceThemeId);
      expect(source.outcomeCodeVerified).toBe(theme?.verification==='OUTCOME_CODE');
      expect(lessonSourceEvidence({...x,sourceUrl:'https://example.org'}).themeVerified).toBe(false);
    }
    expect(new Set(prompts).size).toBe(32);
    expect(new Set(ALL_MICRO_LESSONS.map(l=>l.id)).size).toBe(ALL_MICRO_LESSONS.length);
  });
  it('5 ve 6. sınıf dersini farklı sınıf için önermez',()=>{
    const five=resolveLearningCurriculumContext({gradeLevel:'Ortaokul 5-6 | Maarif Model',selectedGrade:5});
    const six=resolveLearningCurriculumContext({gradeLevel:'Ortaokul 5-6 | Maarif Model',selectedGrade:6});
    for(const lesson of GRADE56_TYMM_PILOT_LESSONS){
      expect(lessonAllowedForContext(lesson,lesson.targetGrades?.[0]===5?five:six)).toBe(true);
      expect(lessonAllowedForContext(lesson,lesson.targetGrades?.[0]===5?six:five)).toBe(false);
      expect(findMicroLesson({subject:lesson.subject,topic:lesson.title})?.id).toBe(lesson.id);
    }
    expect(findMicroLesson({subject:'Türkçe',topic:'Oyun Dünyası',prompt:'Görsel yanlış soru'})).toBeNull();
  });
  it('gerçek sınıf resmî haritasını gruplu 5–6 etiketinden ayırır',()=>{
    const five=getEducationCurriculum('5. sınıf');
    const six=getEducationCurriculum('6. sınıf');
    const group=getEducationCurriculum('Ortaokul 5-6 | Maarif Model');
    expect(five?.subjects.find(s=>s.name==='Türkçe')?.units).toHaveLength(6);
    expect(six?.subjects.find(s=>s.name==='Türkçe')?.units).toHaveLength(6);
    expect(five?.subjects.find(s=>s.name==='Fen Bilimleri')?.units).toHaveLength(7);
    expect(six?.subjects.find(s=>s.name==='Fen Bilimleri')?.units).toHaveLength(7);
    expect(five?.subjects.find(s=>s.name==='Fen Bilimleri')?.units[0].topics[0].subTopics[0].acquisitions[0].id).toBe('FB.5.1.3');
    expect(six?.subjects.find(s=>s.name==='Fen Bilimleri')?.units[0].topics[0].subTopics[0].acquisitions[0].id).toBe('FB.6.1.1');
    expect(group?.subjects.find(s=>s.name==='Türkçe')?.units).toHaveLength(1);
  });
  it('kapsama raporu tam öğrenme kanıtı gibi davranmaz',()=>{
    const c=microLessonCoverageSnapshot();
    expect(c.totalLessons).toBe(38);
    expect(c.totalExercises).toBe(152);
    expect(c.verifiedMiddlePrograms).toHaveLength(4);
    expect(c.verifiedMiddlePrograms.reduce((n,x)=>n+x.totalThemes,0)).toBe(26);
    expect(c.verifiedMiddlePrograms.reduce((n,x)=>n+x.linkedPilotLessons,0)).toBe(8);
    expect(c.gradeRows.every(x=>x.topicIndexComplete===false)).toBe(true);
  });
});