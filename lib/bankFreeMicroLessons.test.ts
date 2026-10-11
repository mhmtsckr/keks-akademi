import {describe,it,expect} from 'vitest';
import {MICRO_LESSONS,findMicroLesson,microLessonById} from './bankFreeMicroLessons';
import {areEquivalentShortAnswers,parseShortMathAnswer} from './mathAnswerEquivalence';

describe('soru bankası olmadan çözümlü mikro örnekler',()=>{
  it('yüzde, kesir, üslü konularını kanıta göre eşleştirir',()=>{
    expect(findMicroLesson({subject:'Matematik',topic:'Problemler',prompt:'Yüzde 20 zam, sonra indirim.'})?.id).toBe('math-percent-changes-v1');
    expect(findMicroLesson({subject:'Matematik',topic:'Rasyonel Sayılar',prompt:'1/2 + 1/3 işlemi'})?.id).toBe('math-fraction-ops-v1');
    expect(findMicroLesson({subject:'Matematik',topic:'Üslü ve Köklü Sayılar',prompt:'2 üzeri 4'})?.id).toBe('math-exponent-rules-v1');
  });
  it('geniş etiketleri ve fotoğrafı kanıt olarak görüp rastgele anlatım eşleştirmez',()=>{
    expect(findMicroLesson({subject:'Matematik',topic:'Problemler',prompt:'Yaş problemi'})).toBeNull();
    expect(findMicroLesson({subject:'Matematik',topic:'Rasyonel Sayılar',prompt:'Görsel yanlış soru'})).toBeNull();
    expect(findMicroLesson({subject:'Tarih',topic:'Problemler',prompt:'Yüzde'})).toBeNull();
  });
  it('öğrencinin seçtiği beceriyle fotoğraflı soru için güvenli örnek bulur',()=>{
    expect(findMicroLesson({subject:'Matematik',topic:'Genel',prompt:'Görsel yanlış soru',selectedLessonId:'math-fraction-ops-v1'})?.id).toBe('math-fraction-ops-v1');
    expect(findMicroLesson({subject:'Tarih',topic:'Genel',selectedLessonId:'math-fraction-ops-v1'})).toBeNull();
    expect(findMicroLesson({subject:'Matematik',topic:'Genel',selectedLessonId:'invalid'})).toBeNull();
  });
  it('örnekler ayrı ayrı hazırlanmış ve her biri sonradan tekrar üretilebilir',()=>{
    for(const lesson of MICRO_LESSONS){
      expect(lesson.exercises.length).toBeGreaterThanOrEqual(3);
      expect(lesson.worked.steps.length).toBeGreaterThanOrEqual(3);
      expect(microLessonById(lesson.id,lesson.version)).toBe(lesson);
      expect(microLessonById(lesson.id,lesson.version+1)).toBeNull();
      for(const question of lesson.exercises){
        expect(question.prompt).toBeTruthy();
        expect(question.explanation).toBeTruthy();
        expect(question.answer).toBeTruthy();
        if(question.verify){
          const actual=question.verify.base*question.verify.firstMultiplier*question.verify.secondMultiplier;
          expect(areEquivalentShortAnswers(String(actual),question.answer)).toBe(true);
        }
        expect(parseShortMathAnswer(question.answer)).not.toBeNull();
      }
    }
  });
});
