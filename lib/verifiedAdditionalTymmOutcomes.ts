/** MEB 2026-27 TYMM primary evidence; source code verification is NOT KEKS instructional approval. */
export type VerifiedTymmOutcome={grade:number;subject:string;theme:string;code:string;skill:string;url:string;checkedOn:string;scope:'OFFICIAL_OUTCOME';};
export const VERIFIED_ADDITIONAL_TYMM_OUTCOMES:readonly VerifiedTymmOutcome[]=[
  {
    "grade": 5,
    "subject": "Fen Bilimleri",
    "theme": "3. Ünite: Canlıların Yapısına Yolculuk",
    "code": "FB.5.3.1",
    "skill": "Bitki ve hayvan hücrelerinin benzerlik ve farklılıklarını karşılaştırma",
    "url": "https://tymm.meb.gov.tr/fen-bilimleri-dersi/unite/388",
    "checkedOn": "2026-10-12",
    "scope": "OFFICIAL_OUTCOME"
  },
  {
    "grade": 5,
    "subject": "Fen Bilimleri",
    "theme": "3. Ünite: Canlıların Yapısına Yolculuk",
    "code": "FB.5.3.2",
    "skill": "Hücre, doku, organ, sistem ve organizma hiyerarşisini açıklama",
    "url": "https://tymm.meb.gov.tr/fen-bilimleri-dersi/unite/388",
    "checkedOn": "2026-10-12",
    "scope": "OFFICIAL_OUTCOME"
  },
  {
    "grade": 6,
    "subject": "Fen Bilimleri",
    "theme": "4. Ünite: Işığın Yansıması ve Renkler",
    "code": "FB.6.4.1",
    "skill": "Düzgün ve dağınık yansımayı yüzey ve gözlem verilerine göre ayırt etme",
    "url": "https://tymm.meb.gov.tr/fen-bilimleri-dersi/unite/412",
    "checkedOn": "2026-10-12",
    "scope": "OFFICIAL_OUTCOME"
  },
  {
    "grade": 6,
    "subject": "Fen Bilimleri",
    "theme": "4. Ünite: Işığın Yansıması ve Renkler",
    "code": "FB.6.4.3",
    "skill": "Düz, çukur ve tümsek aynaları nitelikleriyle karşılaştırma",
    "url": "https://tymm.meb.gov.tr/fen-bilimleri-dersi/unite/412",
    "checkedOn": "2026-10-12",
    "scope": "OFFICIAL_OUTCOME"
  },
  {
    "grade": 9,
    "subject": "Fizik",
    "theme": "2. Ünite: Kuvvet ve Hareket",
    "code": "FİZ.9.2.2",
    "skill": "Skaler ve vektörel fiziksel nicelikleri karşılaştırma",
    "url": "https://tymm.meb.gov.tr/fizik-dersi/unite/57",
    "checkedOn": "2026-10-12",
    "scope": "OFFICIAL_OUTCOME"
  },
  {
    "grade": 10,
    "subject": "Kimya",
    "theme": "1. Tema: Etkileşim",
    "code": "KİM.10.1.1",
    "skill": "Kimyasal değişimi düşündüren gözlem kanıtlarını değerlendirme",
    "url": "https://tymm.meb.gov.tr/kimya-dersi/unite/138",
    "checkedOn": "2026-10-12",
    "scope": "OFFICIAL_OUTCOME"
  },
  {
    "grade": 10,
    "subject": "Kimya",
    "theme": "1. Tema: Etkileşim",
    "code": "KİM.10.1.6",
    "skill": "Kimyasal tepkime denklemlerini atom korunumu ile denkleştirme",
    "url": "https://tymm.meb.gov.tr/kimya-dersi/unite/138",
    "checkedOn": "2026-10-12",
    "scope": "OFFICIAL_OUTCOME"
  },
  {
    "grade": 11,
    "subject": "Biyoloji",
    "theme": "1. Tema: Tepki",
    "code": "BİY.11.1.3",
    "skill": "Bitkilerde tropizma ve nasti hareketlerini uyaranın yönüne göre sınıflandırma",
    "url": "https://tymm.meb.gov.tr/biyoloji-dersi/unite/13",
    "checkedOn": "2026-10-12",
    "scope": "OFFICIAL_OUTCOME"
  },
  {
    "grade": 9,
    "subject": "Biyoloji",
    "theme": "2. Tema: Organizasyon",
    "code": "BİY.9.2.2",
    "skill": "Hücre zarından madde geçişlerini enerji gereksinimi, yön ve molekül özelliklerine göre sınıflandırma",
    "url": "https://tymm.meb.gov.tr/21/unite/3",
    "checkedOn": "2026-10-20",
    "scope": "OFFICIAL_OUTCOME"
  },
  {
    "grade": 9,
    "subject": "Biyoloji",
    "theme": "2. Tema: Organizasyon",
    "code": "BİY.9.2.4",
    "skill": "Verilen ayırt edici özelliklerle canlıları sınıflandırma ve bilimsel gruplamayı yorumlama",
    "url": "https://tymm.meb.gov.tr/21/unite/3",
    "checkedOn": "2026-10-20",
    "scope": "OFFICIAL_OUTCOME"
  },
  {
    "grade": 10,
    "subject": "Biyoloji",
    "theme": "1. Tema: Enerji",
    "code": "BİY.10.1.2",
    "skill": "Fotosentezde madde giriş ve çıkışlarını gösteren bilimsel modeli yorumlama ve eksiklerini iyileştirme",
    "url": "https://tymm.meb.gov.tr/biyoloji-dersi/unite/8",
    "checkedOn": "2026-10-20",
    "scope": "OFFICIAL_OUTCOME"
  },
  {
    "grade": 10,
    "subject": "Biyoloji",
    "theme": "2. Tema: Ekoloji",
    "code": "BİY.10.2.1",
    "skill": "Ekosistemin canlı-cansız bileşenleri ve aralarındaki etkileri çözümleme",
    "url": "https://tymm.meb.gov.tr/biyoloji-dersi/unite/10",
    "checkedOn": "2026-10-20",
    "scope": "OFFICIAL_OUTCOME"
  }
];
export function findAdditionalTymmOutcome(code:string){return VERIFIED_ADDITIONAL_TYMM_OUTCOMES.find(x=>x.code===code)||null;}
