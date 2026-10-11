import {describe,expect,it} from 'vitest';
import {areEquivalentShortAnswers,parseShortMathAnswer} from './mathAnswerEquivalence';

describe('kısa matematik cevapları',()=>{
  it('ondalık ve kesir olarak yazılan eşit sayıları tanır',()=>{
    expect(areEquivalentShortAnswers('0,75','3/4')).toBe(true);
    expect(areEquivalentShortAnswers('0.5','1/2')).toBe(true);
    expect(areEquivalentShortAnswers('50%','0,5')).toBe(true);
    expect(areEquivalentShortAnswers('198 TL','198')).toBe(true);
    expect(areEquivalentShortAnswers('198','198 ₺')).toBe(true);
  });
  it('farklı sayı ve hatalı ifade eşleşmesini reddeder',()=>{
    expect(areEquivalentShortAnswers('2/3','3/4')).toBe(false);
    expect(areEquivalentShortAnswers('50%','50')).toBe(false);
    expect(parseShortMathAnswer('1/0')).toBeNull();
    expect(parseShortMathAnswer('2+2')).toBeNull();
    expect(parseShortMathAnswer('process.exit()')).toBeNull();
  });
  it('metin cevaplarını normalleştirir ama anahtarı uydurmaz',()=>{
    expect(areEquivalentShortAnswers('  Ankara  ','ankara')).toBe(true);
    expect(areEquivalentShortAnswers('Ankara','İstanbul')).toBe(false);
  });
});
