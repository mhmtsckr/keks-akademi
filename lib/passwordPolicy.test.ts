import { describe,expect,it } from 'vitest';
import { isStrongPassword,passwordPolicyErrors,passwordPolicyMessage } from './passwordPolicy';

describe('passwordPolicy',()=>{
  it('güçlü bir şifreyi kabul eder',()=>{
    const value='M7!qR2_zK9#t';
    expect(passwordPolicyErrors(value)).toEqual([]);
    expect(isStrongPassword(value)).toBe(true);
    expect(passwordPolicyMessage(value)).toBeNull();
  });

  it('uzunluk ve dört karakter kümesini zorunlu tutar',()=>{
    const errors=passwordPolicyErrors('short');
    expect(errors.join(' ')).toContain('12 karakter');
    expect(errors.join(' ')).toContain('büyük harf');
    expect(errors.join(' ')).toContain('rakam');
    expect(errors.join(' ')).toContain('özel karakter');
    expect(isStrongPassword('short')).toBe(false);
    expect(passwordPolicyMessage('short')).toBe(errors[0]);
  });

  it.each([
    ['boşluk','M7!q R2_zK9#t','boşluk'],
    ['yaygın dizi','Ab!qwerty7_Z9','tahmin edilebilir'],
    ['artan sıra','Xy!5678_Qp9z','Ardışık'],
    ['azalan sıra','Xy!9876_Qp2z','Ardışık'],
    ['harf sırası','Xy!abcd_9Qp2','Ardışık'],
    ['tekrar','Ab1!zzzz_Q7p','art arda dört'],
  ])('%s kuralını uygular',(_ad,value,parca)=>{
    expect(passwordPolicyErrors(value).join(' ')).toContain(parca);
  });

  it('112233 benzeri tekrar eden sayı örüntüsünü reddeder',()=>{
    const errors=passwordPolicyErrors('Aa!77112233_X');
    expect(errors.some(x=>x.includes('tekrar eden sayı')||x.includes('tahmin edilebilir'))).toBe(true);
  });
});
