import {describe,expect,it} from 'vitest';
import {evaluateLearningContent,generateApprovedLearningContent,studentLevelBand} from './approvedContentEngine';

const SOURCE=[
  'Fotosentez, bitkilerin ışık enerjisini kimyasal enerjiye dönüştürdüğü süreçtir.',
  'Klorofil ışığı soğurur ve süreç kloroplastlarda gerçekleşir.',
  'Fotosentez sırasında karbondioksit ve su kullanılır, glikoz ve oksijen oluşur.',
  'Işık şiddeti, sıcaklık ve karbondioksit miktarı fotosentez hızını etkiler.',
  'Stomalar gaz alışverişinde görev alır ve yaprak dokusu sürece katkı sağlar.',
  'Üretilen glikoz bitkinin enerji ihtiyacında ve madde yapımında kullanılır.',
  'Oksijen süreç sonunda atmosfere verilebilir.',
  'Fotosentez ekosistemlerde enerji akışının temel basamaklarından biridir.'
].join(' ');

describe('approved content engine',()=>{
  it('öğrenci düzeyini eğitim bandına çevirir',()=>{
    expect(studentLevelBand('3. Sınıf')).toBe('FOUNDATION');
    expect(studentLevelBand('7. Sınıf')).toBe('MIDDLE');
    expect(studentLevelBand('11. Sınıf')).toBe('HIGH');
    expect(studentLevelBand('YKS / Mezun')).toBe('ADULT');
  });

  it.each(['MINI_TEST','FLASHCARDS','MATCHING','FILL_BLANK','ACTIVE_RECALL','MICRO_GAME'] as const)(
    '%s türünü kalite bilgisiyle üretir',
    type=>{
      const out=generateApprovedLearningContent(type,SOURCE,'7. Sınıf');
      expect(out.payload.levelBand).toBe('MIDDLE');
      expect(out.payload.items.length).toBeGreaterThanOrEqual(4);
      expect(out.qualityScore).toBeGreaterThanOrEqual(70);
      expect(out.quality.passed).toBe(true);
    }
  );

  it('eksik içeriğin kalite filtresini geçmesine izin vermez',()=>{
    const quality=evaluateLearningContent('FLASHCARDS',{items:[{front:'Soru',back:''}]},90);
    expect(quality.passed).toBe(false);
    expect(quality.issues.length).toBeGreaterThan(0);
  });
});
