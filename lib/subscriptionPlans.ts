import {EDUCATION_LEVELS} from '@/lib/educationLevels';
export type Audience='STUDENT'|'COACH';
export type KeksPlan={id:string;name:string;audience:Audience;level:string;price:number|null;capacity?:number;features:string[]};
export type StudentTermPricing={firstMonth:number;monthly:number;threeMonths:number;sixMonths:number;annual:number};

export const STUDENT_PLANS:KeksPlan[]=[
{id:'student-primary-12',name:'KEKS Başlangıç',audience:'STUDENT',level:EDUCATION_LEVELS.PRIMARY_123,price:1499,features:['Eğitim düzeyine uygun Eğilim Taraması','Bugünün Planı ve kısa günlük görevler','Okuma, sorumluluk ve çalışma alışkanlığı takibi','Yaşa uygun mikro öğrenme ve basitleştirilmiş tekrar','Görev tamamlama ve süreklilik takibi','Öğrenci gelişim ekranı ve veli paneli','Aylık KEKS Gelişim Raporu']},
{id:'student-primary-34',name:'KEKS Temel',audience:'STUDENT',level:EDUCATION_LEVELS.PRIMARY_4,price:1699,features:['KEKS Başlangıç özellikleri','Kişisel haftalık çalışma planı','Soru, doğru, yanlış ve boş kayıtları','Yanlış soru arşivi ve kaynak takibi','Yaşa uyarlanmış 0–1–3–7–14–28 tekrar sistemi','Odak çalışma araçları','Aylık gelişim raporu ve veli takibi']},
{id:'student-middle-56',name:'KEKS Gelişim',audience:'STUDENT',level:EDUCATION_LEVELS.MIDDLE_56,price:1899,features:['Eğilim Taraması ve kişisel çalışma stratejisi','Bugünün Planı ve günlük görev yönetimi','Soru/doğru/yanlış/boş performans takibi','Kişisel yanlış soru bankası','Kaynak-konu-sayfa-soru takibi','0–1–3–7–14–28 tekrar ve mikro öğrenme','Bilgi hâkimiyeti, odak/süre takibi ve aylık rapor']},
{id:'student-lgs-prep',name:'KEKS LGS Hazırlık',audience:'STUDENT',level:EDUCATION_LEVELS.MIDDLE_7,price:2199,features:['KEKS Gelişim özellikleri','MEB ders-konu-alt konu-kazanım-soru tipi haritası','Yeni nesil soru ve konu hâkimiyeti','Deneme kayıtları ve net trendleri','Yanlış nedenleri sınıflandırması','Dinamik planlama ve geciken tekrarların dağıtılması','Gerçek çalışma kapasitesi analizi ve MİZA']},
{id:'student-lgs-360',name:'KEKS LGS 360',audience:'STUDENT',level:EDUCATION_LEVELS.MIDDLE_8,price:2599,features:['Eğilim Taraması ve kişisel çalışma stratejisi','MEB/LGS kazanım haritası ve dinamik Bugünün Planı','LGS deneme/net ve kazanım analizi','Yeni nesil soru performansı ve yanlış nedenleri','Kişisel soru bankası, haftalık yanlışlar ve aylık karma tekrar','Kaynak verimliliği, bilgi hâkimiyeti ve kişisel tekrar motoru','MİZA, Morning Brief, görüşme hazırlığı ve koç aksiyonları','Veli paneli ve kapsamlı aylık KEKS Gelişim Raporu']},
{id:'student-high-910',name:'KEKS Lise Gelişim',audience:'STUDENT',level:EDUCATION_LEVELS.HIGH_910,price:2199,features:['Bugünün Planı ve kişisel haftalık program','Okul dersleri konu/kazanım takibi','TYT altyapısı, paragraf ve problem rutinleri','Kaynak takibi ve yanlış soru bankası','Bilgi hâkimiyeti ve tekrar motoru','Mikro öğrenme ve çalışma kapasitesi analizi','MİZA ve aylık gelişim raporu']},
{id:'student-yks-prep',name:'KEKS YKS Hazırlık',audience:'STUDENT',level:EDUCATION_LEVELS.HIGH_11,price:2399,features:['Lise Gelişim özellikleri','TYT + 11. sınıf/AYT dengeli çalışma','Hedef üniversite/bölüm ve hedef-net farkı','TYT net trendleri ve deneme analizi','Ders-konu-kazanım ve kaynak yönetimi','Yanlış nedenleri, kişisel yanlışlar ve bilgi hâkimiyeti','Dinamik plan, kişisel tekrar algoritması ve MİZA']},
{id:'student-yks-360',name:'KEKS YKS 360',audience:'STUDENT',level:EDUCATION_LEVELS.HIGH_12,price:2599,features:['Eğilim Taraması ve kişisel çalışma stratejisi','Hedef üniversite/bölüm ve hedef-net farkı','Dinamik TYT/AYT Bugünün Planı ve kapasite analizi','Deneme/net, konu/kazanım ve yanlış nedenleri analizi','Kişisel soru bankası, kaynak verimliliği ve bilgi hâkimiyeti','Kişisel unutma eğrisi, otomatik tekrar ve mikro öğrenme','MİZA, Morning Brief, koç aksiyonları ve görüşme hazırlığı','Veli paneli ve aylık KEKS Gelişim Raporu']},
{id:'student-mezun-360',name:'KEKS Mezun 360',audience:'STUDENT',level:EDUCATION_LEVELS.GRADUATE_YKS,price:2599,features:['KEKS YKS 360 özellikleri','Mezun kapasitesine göre yoğun çalışma blokları','Yoğun TYT/AYT deneme döngüsü','Konu kapatma takvimi','Planlanan-gerçekleşen süre analizi','Sürdürülebilirlik ve verimli saat analizi','Geciken görevlerin kapasiteye göre yeniden dağıtılması']},
{id:'student-kamu',name:'KEKS Kamu',audience:'STUDENT',level:'KPSS / EKPSS',price:2399,features:['Sınav düzeyine uygun kişisel plan','Genel Yetenek/Genel Kültür konu haritası','Soru, deneme ve net trendleri','Kaynak yönetimi ve yanlış soru bankası','Bilgi hâkimiyeti, aktif hatırlama ve tekrar','Mikro öğrenme ve dinamik program','MİZA ve aylık gelişim raporu']},
{id:'student-dgs',name:'KEKS DGS',audience:'STUDENT',level:'DGS',price:2199,features:['Kişisel günlük/haftalık plan','Sayısal-sözel soru türü performansı','Hız, doğruluk ve soru başına süre','Problem/paragraf rutinleri ve deneme analizi','Yanlış nedenleri ve kişisel soru bankası','Dinamik plan, tekrar ve mikro öğrenme','MİZA ve aylık gelişim raporu']},
{id:'student-ales',name:'KEKS ALES',audience:'STUDENT',level:'ALES',price:2199,features:['Sayısal/sözel çalışma planı','Soru türü bazlı hız ve doğruluk','Süre yönetimi ve deneme performansı','Problem/paragraf rutinleri','Yanlış soru bankası ve yanlış nedenleri','Dinamik tekrar ve mikro öğrenme','MİZA destekli gelişim takibi']},
{id:'student-language',name:'KEKS Dil',audience:'STUDENT',level:'YDS / YÖKDİL',price:2399,features:['Kelime mikro öğrenmesi ve kişisel kelime tekrar sistemi','0–1–3–7–14–28 aralıklı tekrar','Okuma ve soru türü performansı','Yanlış soru bankası ve kaynak takibi','Deneme/net ve süre analizi','Bilgi hâkimiyeti ve dinamik plan','MİZA ve aylık gelişim raporu']},
{id:'student-ags-language',name:'KEKS AGS Dil',audience:'STUDENT',level:'AGS / YDS',price:2599,features:['AGS ve YDS performansının ayrı takibi','AGS konu haritası ve dil/kelime sistemi','Kişisel günlük plan ve dinamik program','Deneme/net, süre ve yanlış nedenleri','Kaynak, bilgi hâkimiyeti ve tekrar motoru','MİZA ve koç aksiyon önerileri','Aylık kapsamlı gelişim raporu']},
{id:'student-teacher-360',name:'KEKS Öğretmen 360',audience:'STUDENT',level:'AGS / ÖABT',price:2599,features:['AGS ve seçilen ÖABT alanının ayrı takibi','Alana özgü ders-konu-alt konu-kazanım haritası','Bugünün Planı ve dinamik program','Deneme/net, kaynak ve yanlış soru analizi','Bilgi hâkimiyeti ve kişisel tekrar algoritması','MİZA, Morning Brief ve koç aksiyonları','Otomatik görüşme hazırlığı ve aylık kapsamlı rapor']}
];

export const STUDENT_TERM_PRICING:Record<string,StudentTermPricing>={
'student-primary-12':{firstMonth:999,monthly:1499,threeMonths:3999,sixMonths:7499,annual:12999},
'student-primary-34':{firstMonth:1199,monthly:1699,threeMonths:4499,sixMonths:8499,annual:14999},
'student-middle-56':{firstMonth:1399,monthly:1899,threeMonths:4999,sixMonths:9499,annual:16999},
'student-lgs-prep':{firstMonth:1499,monthly:2199,threeMonths:5799,sixMonths:10999,annual:18999},
'student-lgs-360':{firstMonth:1799,monthly:2599,threeMonths:6999,sixMonths:12999,annual:21999},
'student-high-910':{firstMonth:1499,monthly:2199,threeMonths:5799,sixMonths:10999,annual:18999},
'student-yks-prep':{firstMonth:1699,monthly:2399,threeMonths:6499,sixMonths:11999,annual:20999},
'student-yks-360':{firstMonth:1799,monthly:2599,threeMonths:6999,sixMonths:12999,annual:21999},
'student-mezun-360':{firstMonth:1799,monthly:2599,threeMonths:6999,sixMonths:12999,annual:21999},
'student-kamu':{firstMonth:1699,monthly:2399,threeMonths:6499,sixMonths:11999,annual:20999},
'student-dgs':{firstMonth:1499,monthly:2199,threeMonths:5799,sixMonths:10999,annual:18999},
'student-ales':{firstMonth:1499,monthly:2199,threeMonths:5799,sixMonths:10999,annual:18999},
'student-language':{firstMonth:1699,monthly:2399,threeMonths:6499,sixMonths:11999,annual:20999},
'student-ags-language':{firstMonth:1799,monthly:2599,threeMonths:6999,sixMonths:12999,annual:21999},
'student-teacher-360':{firstMonth:1799,monthly:2599,threeMonths:6999,sixMonths:12999,annual:21999}
};

export const COACH_PLANS:KeksPlan[]=[
{id:'coach-start',name:'KEKS Partner Koç Start',audience:'COACH',level:'10 aktif öğrenci',capacity:10,price:3999,features:['KEKS Partner Koç hesabı ve marka ağına katılım','Öğrenci profili ve eşleştirme','Program ve görev yönetimi','Soru, deneme ve performans takibi','Tekrar, bilgi hâkimiyeti ve yanlış soru bankası','Görüşme notları ve temel KEKS raporları']},
{id:'coach-pro',name:'KEKS Partner Koç Pro',audience:'COACH',level:'30 aktif öğrenci',capacity:30,price:7999,features:['Partner Koç Start özellikleri','Eğilim Taraması sonuçları','MİZA koç desteği','Morning Brief','Otomatik görüşme hazırlığı','Açıklanabilir koç aksiyon önerileri','Gelişmiş haftalık ve aylık KEKS raporları']},
{id:'coach-expert',name:'KEKS Partner Koç Expert',audience:'COACH',level:'75 aktif öğrenci',capacity:75,price:14999,features:['Partner Koç Pro özellikleri','Toplu öğrenci yönetimi ve segmentasyon','Gelişmiş performans analitiği','Koç aksiyon etkisi','Geciken görev ve tekrarların toplu takibi','Gelişmiş raporlama ve otomasyon','KEKS Partner Koç operasyon görünümü']},
{id:'coach-business',name:'KEKS Partner Koç Business',audience:'COACH',level:'150 aktif öğrenci',capacity:150,price:24999,features:['Partner Koç Expert özellikleri','Yüksek hacimli öğrenci yönetimi','Ekip ve operasyon görünümü','Koç kalite metrikleri','Gelişmiş otomasyon ve kapsamlı raporlama','Öncelikli operasyon desteği','KEKS marka standardı ve partner ağı görünümü']},
{id:'coach-enterprise',name:'KEKS Kurum Partner',audience:'COACH',level:'150+ / çoklu koç',price:null,features:['Çoklu Partner Koç ve yönetici yapısı','Öğrenci-koç dağıtımı','Rol ve yetki yönetimi','Kurum geneli performans analitiği','Koç kalite sistemi','Toplu yönetim ve kurumsal KEKS raporlaması']}
];

export const ALL_PLANS=[...STUDENT_PLANS,...COACH_PLANS];
