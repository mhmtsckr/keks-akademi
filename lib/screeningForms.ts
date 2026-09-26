import type { EducationBand } from '@/lib/taskEvaluation';
import { PROFESSIONAL_BASELINE_FORMS } from '@/lib/professionalScreeningData';

export type ScreeningQuestion={id:string;orderNo:number;dimension:string;tendencyKey?:string;habitKey?:string;prompt:string;reverse:boolean;kind:'TENDENCY'|'HABIT'};
export type ScreeningForm={title:string;version:string;educationBand:EducationBand;questions:ScreeningQuestion[];disclaimer:string;instruction:string;scale:readonly string[]};

export const SCREENING_DISCLAIMER='Bu uygulama öğrencinin çalışma, motivasyon ve öz-düzenleme eğilimlerini belirlemek amacıyla hazırlanmış bir tarama aracıdır; psikolojik tanı koymaz ve kesin kişilik tipi belirlemez. Sonuçlar; öğrenci görüşmesi, gözlem ve akademik performans verileriyle birlikte değerlendirilmelidir.';

export const SCREENING_INSTRUCTION='Ders, ödev, arkadaşlık ve günlük sorumluluklarında son iki ayı düşün. Sana en çok uyan seçeneği işaretle. Doğru ya da yanlış cevap yoktur; seni en iyi anlatan seçeneği işaretle.';
export const SCREENING_SCALE=['Hiç katılmıyorum','Katılmıyorum','Bazen / Kararsızım','Katılıyorum','Tamamen katılıyorum'] as const;

export const TENDENCY_LABELS:Record<string,string>={"1":"Düzen ve Sorumluluk","2":"Destek ve İlişki","3":"Hedef ve Başarı Yönelimi","4":"Bireysellik ve Duygusal Farkındalık","5":"Merak ve Analiz","6":"Güven ve Hazırlık","7":"Yenilik ve Esneklik","8":"Kararlılık ve Kendini Ortaya Koyma","9":"Uyum ve Sakinlik"};
export const TENDENCY_DIMENSION_KEYS:Record<string,string>=Object.fromEntries(Object.entries(TENDENCY_LABELS).map(([key,label])=>[label,key]));
export const TENDENCY_PROFILES:Record<string,{name:string;motivation:string;strengths:string;risks:string;tasks:string;plan:string}>={"1":{"name":"Düzen ve Standart Odaklı","motivation":"Net ölçütler, kontrol listeleri, kalite hedefi, hata azaltma ve 'bugün dünden daha doğru' yaklaşımı.","strengths":"Disiplin, sorumluluk, hata fark etme, düzen, yüksek standart.","risks":"Mükemmeliyetçilik, hata korkusu, gereğinden fazla ayrıntıda kalma.","tasks":"Kural ve yapı içeren görevler; hata analizi, dil bilgisi, matematiksel işlem, planlama ve kalite kontrol türü çalışmalar.","plan":"Her blok için 1 net hedef yaz. Blok sonunda 3 dakikalık kontrol yap. Haftada iki kez yanlış defterini gözden geçir. 'Yeterince iyi' bitirme ölçütü koy."},"2":{"name":"İlişki ve Destek Odaklı","motivation":"Görülmek, katkı sağlamak, düzenli geri bildirim, birine anlatarak öğrenmek ve hesap verebilirlik.","strengths":"İletişim, empati, iş birliği, anlatma, sosyal destek oluşturma.","risks":"Başkalarını memnun etmeye fazla odaklanma, kendi hedefini geri plana atma.","tasks":"Anlatma, sunum, grup görevi, öğretme-öğrenme, sözel ifade ve iş birliği gerektiren çalışmalar.","plan":"Her gün bir konuyu 5 dakika birine anlat. Haftada 1 koç/veli kontrolü kullan. Çalışma hedefini başkasının beklentisinden değil kendi hedefinden türet."},"3":{"name":"Başarı ve Sonuç Odaklı","motivation":"Somut hedef, puan/net, süre, tamamlanan görevler, görünür ilerleme ve performans göstergeleri.","strengths":"Hedefe yönelme, hız, verimlilik, rekabet gücü, sonuç üretme.","risks":"Sadece puana odaklanma, yüzeysel öğrenme, başarısızlıkta motivasyon düşüşü.","tasks":"Zamanlı görevler, sınav performansı, sunum, yarışma, hedefli proje ve sonuç ölçümü olan çalışmalar.","plan":"Haftalık 3 ölçü belirle: doğru oranı, net/soru sayısı, tamamlanan konu. Hız kadar kavram kontrolü de yap. Her denemeden sonra tek bir gelişim hedefi seç."},"4":{"name":"Özgünlük ve Anlam Odaklı","motivation":"Kişisel anlam, özgün ifade, seçme hakkı, estetik/yaratıcı araçlar ve konunun hayatla bağlantısı.","strengths":"Yaratıcılık, özgün bakış, güçlü ifade, anlam kurma, estetik duyarlılık.","risks":"Ruh hâline bağlı çalışma, rutinden kopma, kendini başkalarıyla kıyaslama.","tasks":"Yaratıcı yazma, yorumlama, tasarım, edebiyat, sanat, proje üretimi ve açık uçlu problem görevleri.","plan":"Konuyu kişisel örnekle ilişkilendir. Renk/kavram haritası kullan ama süre sınırı koy. Ruh hâli beklemeden 5 dakikalık başlama kuralı uygula."},"5":{"name":"Analiz ve Bilgi Odaklı","motivation":"Merak, derinlik, bağımsız çalışma, sistemi çözme, uzmanlaşma ve zihinsel meydan okuma.","strengths":"Analiz, araştırma, kavramsal düşünme, problem çözme, bağımsız öğrenme.","risks":"Aşırı hazırlık, uygulamayı erteleme, sosyal geri bildirimden uzak kalma.","tasks":"Fen, matematik, kodlama, araştırma, veri analizi, strateji ve derin kavramsal çalışma türleri.","plan":"Önce 15–20 dakika öğren, sonra mutlaka uygulama sorusu çöz. 'Bilgi toplama' ile 'üretme' sürelerini eşitle. Her blok sonunda öğrendiğini 3 cümlede özetle."},"6":{"name":"Güven ve Plan Odaklı","motivation":"Öngörülebilir plan, net beklenti, prova, güvenilir rehber, kontrol listesi ve alternatif senaryo.","strengths":"Hazırlık, sadakat, risk fark etme, ayrıntı, planlı ilerleme.","risks":"Aşırı endişe, karar verememe, güvence arama, olumsuz senaryoya takılma.","tasks":"Planlama, düzenli sınav hazırlığı, ekip sorumluluğu, süreç takibi ve ayrıntı kontrolü gerektiren çalışmalar.","plan":"Haftalık sabit ders saatleri oluştur. Her sınav için 'hazırlık listesi' kullan. Kaygı yükselirse yeni kaynak aramak yerine mevcut plana dön. Her gün küçük tamamlanabilir hedef seç."},"7":{"name":"Çeşitlilik ve Keşif Odaklı","motivation":"Yenilik, kısa hedefler, çeşitlilik, oyunlaştırma, seçim hakkı ve hızlı geri bildirim.","strengths":"Fikir üretme, merak, esneklik, enerji, bağlantılar kurma.","risks":"Çabuk sıkılma, başladığını bitirmeme, zor kısımda başka işe geçme.","tasks":"Beyin fırtınası, dil pratiği, proje, sunum, keşif, girişimcilik ve farklı kaynakları birleştirme görevleri.","plan":"2–3 farklı dersi dönüşümlü çalış. Her blok bitmeden konu değiştirme. 'Başla-bitir-ödül' döngüsü kullan. Günün sonunda yalnızca biten işleri puanla."},"8":{"name":"Özerklik ve Meydan Okuma Odaklı","motivation":"Kontrol alanı, net meydan okuma, doğrudan geri bildirim, zor hedef ve seçim özgürlüğü.","strengths":"Kararlılık, liderlik, cesaret, hızlı karar, baskıda hareket.","risks":"Sabırsızlık, yardımı reddetme, gereksiz çatışma, ayrıntıyı atlama.","tasks":"Tartışma, liderlik, spor/rekabet, zor problem, proje yönetimi ve karar gerektiren görevler.","plan":"Her gün 'en zor görev' ile başla. Hedefi kendin seç ama ölçütü önceden belirle. Blok sonunda ayrıntı kontrolü yap. Haftada bir dış geri bildirim al."},"9":{"name":"Sakinlik ve İstikrar Odaklı","motivation":"Düşük çatışma, sakin başlangıç, küçük adımlar, düzenli rutin ve destekleyici çevre.","strengths":"Sabır, uyum, istikrar, dinleme, uzun vadede sürdürülebilirlik.","risks":"Erteleme, öncelikleri karıştırma, pasif kalma, kolay işe sığınma.","tasks":"Düzenli tekrar, uzun soluklu proje, arabuluculuk, ekip uyumu ve sakin konsantrasyon gerektiren çalışmalar.","plan":"5 dakikalık başlama ritüeli kullan. İlk blokta en önemli tek işi yap. Telefonu başka odada tut. Gün sonunda 'yarına ilk adım' notu bırak."}};


const FORM_DATA_KEYS:Record<EducationBand,string>={
  ILKOKUL_1_2:'ILKOKUL_1_2',
  ILKOKUL_3_4:'ILKOKUL_3_4',
  ORTAOKUL_5_6:'ORTAOKUL_5_6',
  ORTAOKUL_7_8:'ORTAOKUL_7_8',
  LISE_9_10:'LISE_9_10',
  LISE_11_12:'LISE_11_12',
  YETISKIN_MEZUN:'LISE_11_12',
  YETISKIN_SINAV:'YETISKIN_MEZUN',
  GENERAL:'LISE_9_10'
};

export const SCREENING_FORM_LABELS:Record<EducationBand,string>={
  ILKOKUL_1_2:'İlkokul 1-2',
  ILKOKUL_3_4:'İlkokul 3-4',
  ORTAOKUL_5_6:'Ortaokul 5-6',
  ORTAOKUL_7_8:'Ortaokul 7-8 / LGS',
  LISE_9_10:'Lise 9-10',
  LISE_11_12:'Lise 11-12 / YKS / Lise Mezunu',
  YETISKIN_MEZUN:'Lise 11-12 / YKS / Lise Mezunu',
  YETISKIN_SINAV:'Yetişkin Sınav Grubu',
  GENERAL:'Genel'
};

export function getScreeningForm(band:EducationBand):ScreeningForm{
  const dataKey=FORM_DATA_KEYS[band]||'LISE_9_10';
  const source=PROFESSIONAL_BASELINE_FORMS[dataKey];
  if(!source)throw new Error('SCREENING_FORM_NOT_FOUND:'+band);

  const questions:ScreeningQuestion[]=source.questions.map(row=>{
    const kind=row.section==='Kişilik/Eğilim'?'TENDENCY' as const:'HABIT' as const;
    return {
      id:`KEKS-PRO-V1-${band}-${row.orderNo}`,
      orderNo:row.orderNo,
      dimension:row.dimension,
      tendencyKey:kind==='TENDENCY'?TENDENCY_DIMENSION_KEYS[row.dimension]:undefined,
      habitKey:kind==='HABIT'?row.dimension:undefined,
      prompt:row.prompt,
      reverse:row.reverse,
      kind
    };
  });

  return {
    title:'KEKS – Eğitsel Çalışma ve Öz-Düzenleme Eğilimleri Taraması',
    version:`KEKS_PRO_SERIES_V1_BASELINE_${band}`,
    educationBand:band,
    questions,
    disclaimer:SCREENING_DISCLAIMER,
    instruction:SCREENING_INSTRUCTION,
    scale:SCREENING_SCALE
  };
}

export function isScreeningWorkflowStatus(v:unknown):v is string{
  return typeof v==='string'&&['ADMIN_REVIEW','SCREENING_RETAKE_REQUIRED','PRE_INTERVIEW_ASSIGNED','PLAN_ADMIN_REVIEW','PLAN_ADMIN_APPROVED','COMPLETED'].includes(v);
}
