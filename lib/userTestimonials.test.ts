import {describe,expect,it} from 'vitest';
import {
  sanitizeTestimonial,
  testimonialAudienceLabel,
  testimonialContextLabel,
  testimonialEligible,
  testimonialSubmissionStatus
} from './userTestimonials';

describe('gerçek kullanıcı yorumu motoru',()=>{
  it('30 gün dolmadan yorum istemez, 30. günde uygun olur',()=>{
    const start=new Date('2026-09-01T00:00:00Z');
    expect(testimonialEligible(start,new Date('2026-09-30T23:59:59Z'))).toBe(false);
    expect(testimonialEligible(start,new Date('2026-10-01T00:00:00Z'))).toBe(true);
  });

  it('öğrenci ve veli için anonim bağlam üretir',()=>{
    expect(testimonialAudienceLabel('STUDENT','Lise 12 | YKS','EŞİT AĞIRLIK')).toBe('12. sınıf YKS öğrencisi');
    expect(testimonialAudienceLabel('PARENT','Ortaokul 8 | Maarif Model',null)).toBe('8. sınıf LGS velisi');
    expect(testimonialContextLabel({
      role:'COACH',
      usageStartedAt:new Date('2026-07-01T00:00:00Z'),
      now:new Date('2026-10-02T00:00:00Z')
    })).toBe('KEKS Partner Koç · 3 ay KEKS kullanıcısı');
  });

  it('doğrudan kimlik verilerini temizler ve incelemeye işaretler',()=>{
    const result=sanitizeTestimonial(
      'Ben Mehmet Sait, 0555 111 22 33 numaramla kayıt oldum. mehmet@example.com üzerinden ulaştım.',
      ['Mehmet Sait']
    );
    expect(result.piiFlagged).toBe(true);
    expect(result.sanitized).not.toContain('Mehmet Sait');
    expect(result.sanitized).not.toContain('0555');
    expect(result.sanitized).not.toContain('mehmet@example.com');
  });

  it('kişisel bilgi içermeyen izinli yorumu otomatik yayına alır',()=>{
    const result=sanitizeTestimonial('Programı daha düzenli uygulamaya başladım ve tekrarları kaçırmıyorum.');
    expect(result.piiFlagged).toBe(false);
    expect(testimonialSubmissionStatus(true,result.piiFlagged)).toBe('PUBLISHED');
    expect(testimonialSubmissionStatus(false,result.piiFlagged)).toBe('PRIVATE');
  });

  it('okul adı gibi dolaylı kimlik işaretini otomatik yayınlamaz',()=>{
    const result=sanitizeTestimonial('Atatürk Anadolu Lisesi öğrencisiyim ve plan sistemi işime yaradı.');
    expect(result.piiFlagged).toBe(true);
    expect(testimonialSubmissionStatus(true,result.piiFlagged)).toBe('REVIEW');
  });

  it('kurum, adres, sosyal medya ve sabit hat bilgisini yayın metninden çıkarır',()=>{
    const result=sanitizeTestimonial(
      'Atatürk Anadolu Lisesi öğrencisiyim. Dicle Mah. 12. Sokak 4 numarada oturuyorum. @ornekhesap ve 0412 123 45 67 üzerinden ulaşabilirsiniz.'
    );
    expect(result.piiFlagged).toBe(true);
    expect(result.sanitized).not.toContain('Atatürk Anadolu Lisesi');
    expect(result.sanitized).not.toContain('@ornekhesap');
    expect(result.sanitized).not.toContain('0412 123 45 67');
    expect(result.sanitized).toContain('[kurum bilgisi kaldırıldı]');
    expect(result.sanitized).toContain('[adres bilgisi kaldırıldı]');
    expect(result.sanitized).toContain('[sosyal medya kullanıcı adı kaldırıldı]');
    expect(result.sanitized).toContain('[telefon kaldırıldı]');
  });

});
