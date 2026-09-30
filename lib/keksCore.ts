export const KEKS_CORE_SENTENCE='KEKS Akademi öğrenciyi ölçer, kişisel planını oluşturur, uygulatır, çalışmayı kaydeder, doğru zamanda tekrar ettirir, yeniden ölçer ve koça bir sonraki somut aksiyonu önerir.' as const;

export const KEKS_CORE_STEPS=[
  {key:'MEASURE',label:'Ölç',short:'Başlangıç ve güncel durumu ölç.',detail:'Eğitsel eğilim, deneme, görev, süre, konu ve tekrar verilerini ölç.'},
  {key:'PLAN',label:'Planla',short:'Veriye göre uygulanabilir plan oluştur.',detail:'Hedef, eksik konu, gerçek kapasite ve önceliklere göre günlük/haftalık plan oluştur.'},
  {key:'APPLY',label:'Uygulat',short:'Öğrencinin ne yapacağını netleştir.',detail:'Görev, teknik, soru çözümü, odak oturumu ve mikro öğrenmeyi uygulanabilir sıraya koy.'},
  {key:'RECORD',label:'Kaydet',short:'Gerçek uygulamayı kanıt olarak kaydet.',detail:'Süre, soru, doğru-yanlış-boş, tamamlanma, deneme ve çalışma davranışını kaydet.'},
  {key:'REVIEW',label:'Tekrar Ettir',short:'Unutmayı beklemeden doğru zamanda geri getir.',detail:'0–1–3–7–14–28 başlangıç ritmini başarıya ve unutma riskine göre kişiselleştir.'},
  {key:'REMEASURE',label:'Yeniden Ölç',short:'Müdahale sonrası değişimi yeniden ölç.',detail:'Aynı metrikleri yeniden değerlendirerek gelişim, duraklama ve yeni açığı görünür kıl.'},
  {key:'ACTION',label:'Koça Aksiyon Öner',short:'Koça açıklanabilir bir sonraki adımı sun.',detail:'Sinyali tek puana çevirmek yerine nedeni, kanıtı ve önerilen koç aksiyonunu göster.'}
] as const;

export type KeksCoreStepKey=typeof KEKS_CORE_STEPS[number]['key'];
