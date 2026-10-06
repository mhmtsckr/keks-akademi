import {describe,expect,it} from 'vitest';
import {EDUCATION_LEVEL_OPTIONS,EDUCATION_LEVELS,normalizeLegacyEducationLevel} from './educationLevels';
import {detectEducationBand,normalizeEducationLevelLabel} from './taskEvaluation';

describe('KEKS eğitim düzeyi standardı',()=>{
  it('dokuz güncel eğitim düzeyini doğru sırada sunar',()=>{
    expect(EDUCATION_LEVEL_OPTIONS).toEqual([
      'İlkokul 1-2-3',
      'İlkokul 4 | Proje Ortaokuluna Hazırlık',
      'Ortaokul 5-6 | Maarif Model',
      'Ortaokul 7 | Maarif Model',
      'Ortaokul 8 | Maarif Model',
      'Lise 9-10 | Maarif Model (1.Aşama)',
      'Lise 11 | Maarif Model (Alan)',
      'Lise 12 | YKS',
      'Mezun | YKS'
    ]);
  });

  it('yeni sınıf gruplamasını test motoru bantlarına doğru eşler',()=>{
    expect(detectEducationBand(EDUCATION_LEVELS.PRIMARY_123)).toBe('ILKOKUL_1_2');
    expect(detectEducationBand(EDUCATION_LEVELS.PRIMARY_4)).toBe('ILKOKUL_3_4');
    expect(detectEducationBand(EDUCATION_LEVELS.MIDDLE_56)).toBe('ORTAOKUL_5_6');
    expect(detectEducationBand(EDUCATION_LEVELS.MIDDLE_7)).toBe('ORTAOKUL_7_8');
    expect(detectEducationBand(EDUCATION_LEVELS.MIDDLE_8)).toBe('ORTAOKUL_7_8');
    expect(detectEducationBand(EDUCATION_LEVELS.HIGH_910)).toBe('LISE_9_10');
    expect(detectEducationBand(EDUCATION_LEVELS.HIGH_11)).toBe('LISE_11_12');
    expect(detectEducationBand(EDUCATION_LEVELS.HIGH_12)).toBe('LISE_11_12');
    expect(detectEducationBand(EDUCATION_LEVELS.GRADUATE_YKS)).toBe('LISE_11_12');
  });

  it('3. sınıfı ilk gruba, 4. sınıfı ikinci gruba ayırır',()=>{
    expect(detectEducationBand('3. sınıf')).toBe('ILKOKUL_1_2');
    expect(detectEducationBand('4. sınıf')).toBe('ILKOKUL_3_4');
  });

  it('eski birleşik etiketleri yeni terminolojiyle uyumlu gösterir',()=>{
    expect(normalizeLegacyEducationLevel('İlkokul 1-2')).toBe('İlkokul 1-2-3');
    expect(normalizeLegacyEducationLevel('İlkokul 3-4')).toContain('İlkokul 1-2-3');
    expect(normalizeLegacyEducationLevel('İlkokul 3-4')).toContain('İlkokul 4 | Proje Ortaokuluna Hazırlık');
    expect(normalizeLegacyEducationLevel('Ortaokul 7-8 / LGS')).toContain('Ortaokul 7 | Maarif Model');
    expect(normalizeLegacyEducationLevel('Ortaokul 7-8 / LGS')).toContain('Ortaokul 8 | Maarif Model');
    expect(normalizeLegacyEducationLevel('Lise 11-12 / YKS')).toContain('Lise 11 | Maarif Model (Alan)');
    expect(normalizeLegacyEducationLevel('Lise 11-12 / YKS')).toContain('Lise 12 | YKS');
  });

  it('normalizeEducationLevelLabel yeni etiketleri korur',()=>{
    for(const level of EDUCATION_LEVEL_OPTIONS){
      expect(normalizeEducationLevelLabel(level)).toBe(level);
    }
  });
});
