import {describe,expect,it} from 'vitest';
import {buildWhatsAppPlanReply,detectStudentPlanFromWhatsAppMessage,looksLikeKeksPlanInquiry} from '@/lib/whatsappPlanReply';

describe('WhatsApp eğitim düzeyi paket eşleştirmesi',()=>{
  it.each([
    ['1. Sınıf','student-primary-12'],
    ['4. sınıf','student-primary-34'],
    ['6. sınıf','student-middle-56'],
    ['7. Sınıf','student-lgs-prep'],
    ['8. Sınıf / LGS','student-lgs-360'],
    ['10. sınıf','student-high-910'],
    ['11. sınıf','student-yks-prep'],
    ['12. sınıf / YKS','student-yks-360'],
    ['YKS Mezun','student-mezun-360'],
    ['KPSS','student-kamu'],
    ['EKPSS','student-kamu'],
    ['DGS','student-dgs'],
    ['ALES','student-ales'],
    ['YDS / YÖKDİL','student-language'],
    ['AGS / YDS','student-ags-language'],
    ['AGS / ÖABT','student-teacher-360']
  ])('%s için doğru paketi bulur',(level,expected)=>{
    const message=`Merhaba KEKS Akademi! Veliyim. Sınıf / hazırlanılan sınav: ${level}. Bana uygun abonelik planları ve ücretleri hakkında bilgi almak istiyorum.`;
    expect(detectStudentPlanFromWhatsAppMessage(message)?.plan.id).toBe(expected);
  });

  it('yanıtta merkezi fiyat ve paket özelliklerini kullanır',()=>{
    const reply=buildWhatsAppPlanReply('Merhaba KEKS Akademi! Veliyim. Sınıf / hazırlanılan sınav: 8. Sınıf / LGS');
    expect(reply).toContain('KEKS LGS 360');
    expect(reply).toContain('1.799 TL');
    expect(reply).toContain('2.599 TL');
    expect(reply).toContain('6.999 TL');
    expect(reply).toContain('MEB/LGS kazanım haritası');
  });

  it('eğitim düzeyi yoksa paket uydurmaz',()=>{
    expect(buildWhatsAppPlanReply('Merhaba KEKS Akademi, paket fiyatı nedir?')).toBeNull();
    expect(looksLikeKeksPlanInquiry('Merhaba KEKS Akademi, paket fiyatı nedir?')).toBe(true);
  });
});
