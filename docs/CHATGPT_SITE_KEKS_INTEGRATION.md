# ChatGPT Site → KEKS Eğilim Taraması Entegrasyonu

KEKS öğrenci paneli ChatGPT Site'ı açarken aşağıdaki query parametrelerini otomatik ekler:

- `keks_session`: Öğrenciyi ve aktif test erişimini temsil eden 2 saatlik imzalı token.
- `keks_callback`: Sonucun POST edileceği KEKS endpoint'i.
- `keks_return`: Tamamlanınca dönülecek öğrenci paneli.
- `keks_embed=1`: Uygulamanın KEKS içinde açıldığını belirtir.

ChatGPT Site, tarama tamamlandığında mevcut cevap, skor ve rapor nesnelerini aşağıdaki işlevle KEKS'e göndermelidir:

```ts
async function submitResultToKeks(input: {
  answers: unknown;
  scores: Record<string, number>;
  report?: Record<string, unknown>;
  formVersion?: string;
  externalSubmissionId?: string;
}) {
  const qs = new URLSearchParams(window.location.search);
  const token = qs.get('keks_session');
  const callback = qs.get('keks_callback');
  const returnUrl = qs.get('keks_return');

  if (!token || !callback) return { skipped: true };

  const callbackUrl = new URL(callback);
  if (callbackUrl.origin !== 'https://keksakademi.vercel.app') {
    throw new Error('Geçersiz KEKS callback adresi.');
  }

  const response = await fetch(callbackUrl.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      formVersion: input.formVersion || 'CHATGPT_SITE_V1',
      answers: input.answers,
      scores: input.scores,
      report: input.report || {},
      externalSubmissionId: input.externalSubmissionId || crypto.randomUUID(),
      completedAt: new Date().toISOString()
    })
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'KEKS aktarımı başarısız.');

  const parentOrigin = returnUrl ? new URL(returnUrl).origin : 'https://keksakademi.vercel.app';
  window.parent?.postMessage(
    { type: 'KEKS_ASSESSMENT_COMPLETED', assessmentId: result.assessmentId },
    parentOrigin
  );

  return result;
}
```

Bu işlev sonuç hesaplandıktan ve son rapor oluşturulduktan hemen sonra çağrılmalıdır. Başarılı callback sonrasında KEKS:

1. `Assessment` kaydı oluşturur.
2. Test erişimini `USED` yapar.
3. Ayrıntılı sonucu yalnız öğrencinin koç çalışma alanında gösterir.
4. Koça uyarı üretir.
5. Öğrencinin eğitim düzeyine uygun aktif ön görüşme formu varsa otomatik atar.
6. Öğrenci paneli sonucu polling veya `postMessage` ile algılayıp günceller.
