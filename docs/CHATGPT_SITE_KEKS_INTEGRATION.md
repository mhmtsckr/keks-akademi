# ChatGPT Site → KEKS Eğilim Taraması Entegrasyonu

KEKS öğrenci paneli ChatGPT Site'ı açarken aşağıdaki query parametrelerini otomatik ekler:

- `keks_session`: Öğrenciyi ve aktif test erişimini temsil eden 2 saatlik imzalı token.
- `keks_callback`: Sonucun POST edileceği KEKS endpoint'i.
- `keks_return`: Tamamlanınca dönülecek öğrenci paneli.
- `keks_bridge`: KEKS'in yayınladığı entegrasyon köprüsü JavaScript dosyası.
- `keks_embed=1`: Uygulamanın KEKS içinde açıldığını belirtir.

## ChatGPT Site tarafında uygulanacak minimum kod

Sayfa açılırken `keks_bridge` parametresindeki script yüklenmelidir:

```ts
const qs = new URLSearchParams(window.location.search);
const bridgeUrl = qs.get('keks_bridge');

if (bridgeUrl) {
  const parsed = new URL(bridgeUrl);
  if (parsed.origin !== 'https://keksakademi.vercel.app') {
    throw new Error('Geçersiz KEKS bridge adresi.');
  }

  const script = document.createElement('script');
  script.src = parsed.toString();
  script.async = true;
  document.head.appendChild(script);
}
```

Tarama tamamlanıp nihai cevaplar, skorlar ve rapor hazırlandıktan sonra:

```ts
await window.KEKSAssessmentBridge?.submit({
  answers,
  scores,
  report,
  formVersion: 'CHATGPT_SITE_V1'
});
```

İsteğe bağlı olarak aktarım sonrası KEKS öğrenci paneline dönülebilir:

```ts
window.KEKSAssessmentBridge?.returnToKeks();
```

## Köprünün yaptığı işlemler

Köprü `keks_session`, `keks_callback` ve `keks_return` değerlerini URL'den kendisi okur. Sonucu KEKS'e POST eder ve başarılı aktarımın ardından parent pencereye `KEKS_ASSESSMENT_COMPLETED` mesajı gönderir.

Başarılı callback sonrasında KEKS:

1. İmzalı token ile öğrenci ve aktif test erişimini doğrular.
2. `Assessment` kaydı oluşturur.
3. Test erişimini `USED` yapar.
4. Ayrıntılı cevap, skor ve raporu yalnız öğrencinin koç çalışma alanında gösterir.
5. Koça uyarı üretir.
6. Öğrencinin eğitim düzeyine uygun aktif ön görüşme formu varsa otomatik atar.
7. Öğrenci paneli sonucu polling veya `postMessage` ile algılar ve günceller.

## Güvenlik

- Callback yalnız `https://kazandiran-egitim-kocluk.mhmtsckr029.chatgpt.site` origin'inden CORS ile kabul edilir.
- Oturum tokeni 2 saat geçerlidir ve öğrenci + tek test erişimiyle eşleştirilmiştir.
- Aynı test erişimi ikinci kez tüketilemez.
- Öğrenci ham sonuçları kendi panelinde görmez; ayrıntılar koça özeldir.
