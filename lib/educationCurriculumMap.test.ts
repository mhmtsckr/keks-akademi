import {describe,expect,it} from 'vitest';
import {findCurriculumPath,getEducationCurriculum} from './educationCurriculumMap';
import {EDUCATION_LEVELS} from './educationLevels';

describe('eğitim düzeyine bağlı müfredat haritası',()=>{
  it('7. sınıf ile 8. sınıf için ayrı matematik haritaları üretir',()=>{
    const seven=getEducationCurriculum(EDUCATION_LEVELS.MIDDLE_7);
    const eight=getEducationCurriculum(EDUCATION_LEVELS.MIDDLE_8);
    expect(seven?.examType).toBe('ORTAOKUL_7');
    expect(eight?.examType).toBe('ORTAOKUL_8');
    const sevenMath=seven?.subjects.find(x=>x.name==='Matematik');
    const eightMath=eight?.subjects.find(x=>x.name==='Matematik');
    expect(sevenMath?.units.some(x=>x.name.includes('Sayılar ve Nicelikler (2)'))).toBe(true);
    expect(eight?.framework).toBe('EXAM');
    expect(eight?.sourceLabel).toContain('Önceki MEB');
    expect(eightMath?.units.some(x=>x.name.includes('LGS hazırlık konu dizini'))).toBe(true);
  });

  it('7. sınıf oran-orantı problem kurma yolunu kazanıma kadar çözer',()=>{
    const curriculum=getEducationCurriculum(EDUCATION_LEVELS.MIDDLE_7);
    const path=findCurriculumPath({
      curriculum,
      subject:'Matematik',
      unit:'1. Tema: Sayılar ve Nicelikler (2)',
      topic:'Oran ve Orantı',
      subTopic:'Doğru Orantılı Problem Çözme',
      acquisition:'MAT.7.1.7',
      questionType:'Problem kurma'
    });
    expect(path).toEqual(expect.objectContaining({
      acquisitionId:'MAT.7.1.7',
      questionType:'Problem kurma',
      topic:'Oran ve Orantı',
      subTopic:'Doğru Orantılı Problem Çözme'
    }));
  });

  it('8. sınıfın henüz yürürlükte olmayan TYMM kazanım kodunu resmîymiş gibi kullanmaz',()=>{
    const curriculum=getEducationCurriculum(EDUCATION_LEVELS.MIDDLE_8);
    const path=findCurriculumPath({
      curriculum,
      subject:'Matematik',
      topic:'Doğrusal Denklemler',
      questionType:'Muhakeme'
    });
    expect(path?.acquisitionId).toMatch(/^KEKS\.LGS8\./);
    expect(path?.questionType).toBe('Muhakeme');
  });
});
