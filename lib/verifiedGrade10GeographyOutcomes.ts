/** 2026-27 10th grade Geography verified from primary MEB TYMM theme pages; this is NOT ministry approval of KEKS questions. */
export type GeographyOutcome={grade:10;subject:'Coğrafya';theme:string;code:string;skill:string;url:string;checkedOn:string;scope:'OFFICIAL_OUTCOME'};
export const VERIFIED_GRADE10_GEOGRAPHY:readonly GeographyOutcome[]=[
  {
    "grade": 10,
    "subject": "Coğrafya",
    "theme": "1. Tema: Coğrafyanın Doğası",
    "code": "COĞ.10.1.1",
    "skill": "Coğrafi olayın konumunu ve çevresel ilişkilerini açıklama",
    "url": "https://tymm.meb.gov.tr/cografya-dersi/unite/56",
    "checkedOn": "2026-10-12",
    "scope": "OFFICIAL_OUTCOME"
  },
  {
    "grade": 10,
    "subject": "Coğrafya",
    "theme": "2. Tema: Mekânsal Bilgi Teknolojileri",
    "code": "COĞ.10.2.1",
    "skill": "CBS ve uzaktan algılama uygulamalarını kullanımlarına göre çözümleme",
    "url": "https://tymm.meb.gov.tr/cografya-dersi/unite/58",
    "checkedOn": "2026-10-12",
    "scope": "OFFICIAL_OUTCOME"
  },
  {
    "grade": 10,
    "subject": "Coğrafya",
    "theme": "2. Tema: Mekânsal Bilgi Teknolojileri",
    "code": "COĞ.10.2.2",
    "skill": "Nokta, çizgi ve alan veri türlerini uygun harita nesnesinde kullanma",
    "url": "https://tymm.meb.gov.tr/cografya-dersi/unite/58",
    "checkedOn": "2026-10-12",
    "scope": "OFFICIAL_OUTCOME"
  },
  {
    "grade": 10,
    "subject": "Coğrafya",
    "theme": "3. Tema: Doğal Sistemler ve Süreçler",
    "code": "COĞ.10.3.1",
    "skill": "Levha hareketlerini depremler ve dağ oluşumu ile ilişkilendirme",
    "url": "https://tymm.meb.gov.tr/cografya-dersi/unite/63",
    "checkedOn": "2026-10-12",
    "scope": "OFFICIAL_OUTCOME"
  },
  {
    "grade": 10,
    "subject": "Coğrafya",
    "theme": "4. Tema: Beşerî Sistemler ve Süreçler",
    "code": "COĞ.10.4.2",
    "skill": "Yerleşme işlevlerini ekonomik ve beşerî göstergelere göre sınıflandırma",
    "url": "https://tymm.meb.gov.tr/cografya-dersi/unite/81",
    "checkedOn": "2026-10-12",
    "scope": "OFFICIAL_OUTCOME"
  },
  {
    "grade": 10,
    "subject": "Coğrafya",
    "theme": "5. Tema: Ekonomik Faaliyetler ve Etkileri",
    "code": "COĞ.10.5.1",
    "skill": "Ekonomik faaliyetleri birincil, ikincil, üçüncül ve dördüncül sektörlere ayırma",
    "url": "https://tymm.meb.gov.tr/cografya-dersi/unite/89",
    "checkedOn": "2026-10-12",
    "scope": "OFFICIAL_OUTCOME"
  },
  {
    "grade": 10,
    "subject": "Coğrafya",
    "theme": "6. Tema: Afetler ve Sürdürülebilir Çevre",
    "code": "COĞ.10.6.1",
    "skill": "Afet riskini azaltan uygulamaların kanıtını ve uygulanabilirliğini sorgulama",
    "url": "https://tymm.meb.gov.tr/cografya-dersi/unite/94",
    "checkedOn": "2026-10-12",
    "scope": "OFFICIAL_OUTCOME"
  },
  {
    "grade": 10,
    "subject": "Coğrafya",
    "theme": "7. Tema: Bölgeler, Ülkeler ve Küresel Bağlantılar",
    "code": "COĞ.10.7.1",
    "skill": "Türk dünyasının ortak kültürel özelliklerinden temkinli analojik çıkarım yapma",
    "url": "https://tymm.meb.gov.tr/cografya-dersi/unite/98",
    "checkedOn": "2026-10-12",
    "scope": "OFFICIAL_OUTCOME"
  }
];
export function findVerifiedGeographyOutcome(code:string){return VERIFIED_GRADE10_GEOGRAPHY.find(o=>o.code===code)||null;}
