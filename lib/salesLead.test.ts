import {describe,expect,it} from 'vitest';
import {normalizeLeadPhone,salesLeadTimestampPatch} from './salesLead';

describe('normalizeLeadPhone',()=>{
  it('Türkiye cep telefonunu E.164 benzeri formata çevirir',()=>{
    expect(normalizeLeadPhone('0532 123 45 67')).toBe('905321234567');
    expect(normalizeLeadPhone('5321234567')).toBe('905321234567');
    expect(normalizeLeadPhone('+90 532 123 45 67')).toBe('905321234567');
  });

  it('geçersiz telefonları reddeder',()=>{
    expect(()=>normalizeLeadPhone('123')).toThrow('Telefon numarası geçersiz.');
  });
});

describe('salesLeadTimestampPatch',()=>{
  it('kazanılan lead için temas ve kazanılma zamanını yazar',()=>{
    const now=new Date('2026-10-07T12:00:00Z');
    expect(salesLeadTimestampPatch('WON',now)).toEqual({lastContactedAt:now,wonAt:now,lostAt:null});
  });

  it('kaybedilen lead için kayıp zamanını yazar',()=>{
    const now=new Date('2026-10-07T12:00:00Z');
    expect(salesLeadTimestampPatch('LOST',now)).toEqual({lastContactedAt:now,lostAt:now,wonAt:null});
  });
});
