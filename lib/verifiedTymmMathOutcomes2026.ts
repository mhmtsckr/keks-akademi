/** MEB TYMM: exact 2026-2027 output codes; independently verified title and URL, NOT MEB approval of KEKS questions. */
export type VerifiedTymmMathOutcome={code:string;grade:9|10|11;subject:'Matematik';theme:string;skill:string;url:string;checkedOn:'2026-10-20';verification:'OFFICIAL_OUTCOME'};
export const VERIFIED_TYMM_MATH_OUTCOMES:readonly VerifiedTymmMathOutcome[]=[
  {
    "code": "MAT.9.7.1",
    "grade": 9,
    "theme": "7. Tema: Veriden Olasılığa",
    "skill": "Deneysel olasılığı göreli sıklıktan tahmin etme",
    "url": "https://tymm.meb.gov.tr/matematik-dersi/unite/97",
    "subject": "Matematik",
    "checkedOn": "2026-10-20",
    "verification": "OFFICIAL_OUTCOME"
  },
  {
    "code": "MAT.9.7.2",
    "grade": 9,
    "theme": "7. Tema: Veriden Olasılığa",
    "skill": "Eş olasılıklı tüm durumları sistematik listeleyerek teorik olasılığa ulaşma",
    "url": "https://tymm.meb.gov.tr/matematik-dersi/unite/97",
    "subject": "Matematik",
    "checkedOn": "2026-10-20",
    "verification": "OFFICIAL_OUTCOME"
  },
  {
    "code": "MAT.10.3.1",
    "grade": 10,
    "theme": "3. Tema: Sayılar",
    "skill": "Asal çarpan ayrışımından pozitif bölen sayısına dair çıkarım yapma",
    "url": "https://tymm.meb.gov.tr/matematik-dersi/unite/244",
    "subject": "Matematik",
    "checkedOn": "2026-10-20",
    "verification": "OFFICIAL_OUTCOME"
  },
  {
    "code": "MAT.10.6.1",
    "grade": 10,
    "theme": "6. Tema: Analitik İnceleme",
    "skill": "Dik koordinat sisteminde iki noktanın uzaklığını ve orta noktasını belirleme",
    "url": "https://tymm.meb.gov.tr/matematik-dersi/unite/263",
    "subject": "Matematik",
    "checkedOn": "2026-10-20",
    "verification": "OFFICIAL_OUTCOME"
  },
  {
    "code": "MAT.11.3.1",
    "grade": 11,
    "theme": "3. Tema: Nicelikler ve Değişimler (1)",
    "skill": "Trigonometrik fonksiyonun periyodu ve değer aralığını grafiksel/cebirsel yorumlama",
    "url": "https://tymm.meb.gov.tr/matematik-dersi/unite/281",
    "subject": "Matematik",
    "checkedOn": "2026-10-20",
    "verification": "OFFICIAL_OUTCOME"
  },
  {
    "code": "MAT.11.3.3",
    "grade": 11,
    "theme": "3. Tema: Nicelikler ve Değişimler (2)",
    "skill": "Üstel referans fonksiyonların tanım/görüntü kümesini ve dönüşümlerini yorumlama",
    "url": "https://tymm.meb.gov.tr/matematik-dersi/unite/295",
    "subject": "Matematik",
    "checkedOn": "2026-10-20",
    "verification": "OFFICIAL_OUTCOME"
  }
];
export function findVerifiedTymmMathOutcome(code:string){return VERIFIED_TYMM_MATH_OUTCOMES.find(x=>x.code===code)||null;}
