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
    expect(eightMath?.units.some(x=>x.name==='2. Tema: Cebirsel Düşünme ve Değişimler')).toBe(true);
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

  it('8. sınıf doğrusal fonksiyon kazanımlarını 7. sınıf oran haritasından ayırır',()=>{
    const curriculum=getEducationCurriculum(EDUCATION_LEVELS.MIDDLE_8);
    const path=findCurriculumPath({
      curriculum,
      subject:'Matematik',
      topic:'Doğrusal Fonksiyonlar',
      subTopic:'Doğrusal İlişkiden Doğrusal Fonksiyonlara',
      acquisition:'MAT.8.2.2',
      questionType:'Modelleme'
    });
    expect(path?.acquisitionId).toBe('MAT.8.2.2');
    expect(path?.questionType).toBe('Modelleme');
  });
});
