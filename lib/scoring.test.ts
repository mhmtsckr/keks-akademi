import { describe, expect, it } from 'vitest';
import { buildReport, scoreAssessment, type Answer, type Question } from './scoring';

const q = (id: string, dimension: string, reverse = false): Question => ({ id, dimension, reverse });
const a = (questionId: string, value: number): Answer => ({ questionId, value });

describe('scoreAssessment', () => {
  it('bir boyutun cevaplarının ortalamasını alır', () => {
    const questions = [q('s1', 'planlama'), q('s2', 'planlama')];
    expect(scoreAssessment(questions, [a('s1', 4), a('s2', 2)])).toEqual({ planlama: 3 });
  });

  it('ters maddeleri 6 - ham puan olarak çevirir', () => {
    expect(scoreAssessment([q('s1', 'erteleme', true)], [a('s1', 1)])).toEqual({ erteleme: 5 });
    expect(scoreAssessment([q('s1', 'erteleme', true)], [a('s1', 5)])).toEqual({ erteleme: 1 });
    expect(scoreAssessment([q('s1', 'erteleme', true)], [a('s1', 3)])).toEqual({ erteleme: 3 });
  });

  it('aynı boyutta düz ve ters maddeleri birlikte işler', () => {
    const questions = [q('s1', 'odak'), q('s2', 'odak', true)];
    // (5 + (6-2)) / 2 = 4.5
    expect(scoreAssessment(questions, [a('s1', 5), a('s2', 2)])).toEqual({ odak: 4.5 });
  });

  it('birden fazla boyutu ayrı ayrı toplar', () => {
    const questions = [q('s1', 'planlama'), q('s2', 'odak'), q('s3', 'planlama')];
    expect(scoreAssessment(questions, [a('s1', 4), a('s2', 1), a('s3', 2)])).toEqual({
      planlama: 3,
      odak: 1,
    });
  });

  it('iki basamağa yuvarlar', () => {
    const questions = [q('s1', 'd'), q('s2', 'd'), q('s3', 'd')];
    expect(scoreAssessment(questions, [a('s1', 1), a('s2', 2), a('s3', 2)])).toEqual({ d: 1.67 });
  });

  it('cevaplanmamış soruları ortalamaya katmaz', () => {
    const questions = [q('s1', 'planlama'), q('s2', 'planlama')];
    // s2 cevapsız: ortalama yalnızca s1 üzerinden
    expect(scoreAssessment(questions, [a('s1', 4)])).toEqual({ planlama: 4 });
  });

  // Hiç cevabı olmayan bir boyut için kova hiç oluşturulmaz; sonuçta NaN değil,
  // o anahtarın kendisi bulunmaz. Raporlama bu davranışa güveniyor.
  it('hiç cevaplanmamış bir boyutu sonuca hiç eklemez (NaN üretmez)', () => {
    const questions = [q('s1', 'planlama'), q('s2', 'bos-boyut')];
    const result = scoreAssessment(questions, [a('s1', 4)]);
    expect(result).toEqual({ planlama: 4 });
    expect(result).not.toHaveProperty('bos-boyut');
    expect(Object.values(result).every(Number.isFinite)).toBe(true);
  });

  it('tanımlı olmayan soru kimliklerine gelen cevapları yok sayar', () => {
    expect(scoreAssessment([q('s1', 'd')], [a('s1', 3), a('hayalet', 5)])).toEqual({ d: 3 });
  });

  // `raw == null` gevşek karşılaştırma olduğundan 0 elenmez. Likert ölçeği 1-5
  // olsa da fonksiyon doğrulama yapmıyor; mevcut davranış sabitleniyor.
  it('0 değerini geçerli cevap olarak işler', () => {
    expect(scoreAssessment([q('s1', 'd')], [a('s1', 0)])).toEqual({ d: 0 });
    expect(scoreAssessment([q('s1', 'd', true)], [a('s1', 0)])).toEqual({ d: 6 });
  });

  it('soru veya cevap yoksa boş nesne döner', () => {
    expect(scoreAssessment([], [])).toEqual({});
    expect(scoreAssessment([q('s1', 'd')], [])).toEqual({});
  });
});

describe('buildReport', () => {
  const scores = { planlama: 4.5, odak: 3.2, erteleme: 2.1, kaygi: 1.4 };

  it('KEKS rapor başlığını taşır', () => {
    expect(buildReport(scores).title).toBe(
      'KEKS – Eğitsel Çalışma ve Öz-Düzenleme Eğilimleri Taraması',
    );
  });

  // README'nin açık kuralı: rapor psikolojik tanı veya kesin kişilik tipi
  // iddiasında bulunmaz. Bu metnin sessizce kaybolmaması gerekir.
  it('tanı koymadığına dair uyarı metnini her zaman içerir', () => {
    const { disclaimer } = buildReport(scores);
    expect(disclaimer).toContain('psikolojik tanı koymaz');
    expect(disclaimer).toContain('kesin kişilik tipi belirlemez');
  });

  it('puanları olduğu gibi aktarır', () => {
    expect(buildReport(scores).scores).toEqual(scores);
  });

  it('en yüksek üç boyutu azalan sırada verir', () => {
    expect(buildReport(scores).leadingDimensions.map(x=>({name:x.name,score:x.score}))).toEqual([
      { name: 'planlama', score: 4.5 },
      { name: 'odak', score: 3.2 },
      { name: 'erteleme', score: 2.1 },
    ]);
  });

  it('üçten az boyut varsa hepsini verir', () => {
    expect(buildReport({ tek: 3 }).leadingDimensions.map(x=>({name:x.name,score:x.score}))).toEqual([{ name: 'tek', score: 3 }]);
  });

  it('boş puan kümesinde çökmez', () => {
    const report = buildReport({});
    expect(report.leadingDimensions).toEqual([]);
    expect(report.scores).toEqual({});
  });

  it('geçerli bir ISO zaman damgası üretir', () => {
    const { generatedAt } = buildReport(scores);
    expect(generatedAt).toBe(new Date(generatedAt).toISOString());
  });
});
