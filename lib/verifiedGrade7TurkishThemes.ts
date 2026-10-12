/**
 * Editorially sourced TYMM 7th grade Turkish theme-level index.
 * Never assert a code unless its exact meaning was verified on the linked MEB page.
 * Theme verification is distinct from lesson or question pedagogical approval.
 */
export type VerifiedTheme={
  id:string;year:'2026-2027';grade:7;subject:'Türkçe';
  theme:string;themeName:string;skill:string;
  outcomeCode:string|null;verification:'KOD_DOGRULANDI'|'TEMA_KAPSAMI';
  sourceUrl:string;publisher:'MEB';checkedOn:string;notes:string;
};
export const VERIFIED_GRADE7_TURKISH_THEMES:readonly VerifiedTheme[]=[
  {
    "id": "TYMM.TR.7.T1",
    "year": "2026-2027",
    "grade": 7,
    "subject": "Türkçe",
    "theme": "1. Tema: Hayat Boyu Gelişim",
    "themeName": "Hayat Boyu Gelişim",
    "skill": "Metnin yüzey anlamını belirleme",
    "outcomeCode": null,
    "verification": "TEMA_KAPSAMI",
    "sourceUrl": "https://tymm.meb.gov.tr/ortaokul-turkce-dersi/unite/287",
    "publisher": "MEB",
    "checkedOn": "2026-10-12",
    "notes": "Resmî tema sayfasında beceri amacı doğrulandı, ancak kesin öğrenme çıktısı kodu bu kayıt için doğrulanmadı."
  },
  {
    "id": "TYMM.TR.7.T2",
    "year": "2026-2027",
    "grade": 7,
    "subject": "Türkçe",
    "theme": "2. Tema: Bir Hilal Uğruna",
    "themeName": "Bir Hilal Uğruna",
    "skill": "Medya içeriklerinde ikna etme tekniklerini fark etme",
    "outcomeCode": null,
    "verification": "TEMA_KAPSAMI",
    "sourceUrl": "https://tymm.meb.gov.tr/ortaokul-turkce-dersi/unite/290",
    "publisher": "MEB",
    "checkedOn": "2026-10-12",
    "notes": "Resmî tema sayfasında beceri amacı doğrulandı, ancak kesin öğrenme çıktısı kodu bu kayıt için doğrulanmadı."
  },
  {
    "id": "TYMM.TR.7.T3",
    "year": "2026-2027",
    "grade": 7,
    "subject": "Türkçe",
    "theme": "3. Tema: İletişim ve Sosyal İlişkiler",
    "themeName": "İletişim ve Sosyal İlişkiler",
    "skill": "Bilgilendirici metinde düşünceyi geliştirme yollarını belirleme",
    "outcomeCode": "T.O.7.18",
    "verification": "KOD_DOGRULANDI",
    "sourceUrl": "https://tymm.meb.gov.tr/ortaokul-turkce-dersi/unite/291",
    "publisher": "MEB",
    "checkedOn": "2026-10-12",
    "notes": "Resmî sayfadaki öğrenme çıktısı kodu ve açıklaması kontrol edildi; KEKS'in kendi örnek sorularının uzman onayı ayrıca gerekir."
  },
  {
    "id": "TYMM.TR.7.T4",
    "year": "2026-2027",
    "grade": 7,
    "subject": "Türkçe",
    "theme": "4. Tema: Türk Sanatı",
    "themeName": "Türk Sanatı",
    "skill": "Metin içi karşılaştırma yapma",
    "outcomeCode": "T.O.7.9",
    "verification": "KOD_DOGRULANDI",
    "sourceUrl": "https://tymm.meb.gov.tr/ortaokul-turkce-dersi/unite/293",
    "publisher": "MEB",
    "checkedOn": "2026-10-12",
    "notes": "Resmî sayfadaki öğrenme çıktısı kodu ve açıklaması kontrol edildi; KEKS'in kendi örnek sorularının uzman onayı ayrıca gerekir."
  },
  {
    "id": "TYMM.TR.7.T5",
    "year": "2026-2027",
    "grade": 7,
    "subject": "Türkçe",
    "theme": "5. Tema: Okuma Kültürü",
    "themeName": "Okuma Kültürü",
    "skill": "Bilgilendirici metinde anahtar kelimeleri belirleme",
    "outcomeCode": null,
    "verification": "TEMA_KAPSAMI",
    "sourceUrl": "https://tymm.meb.gov.tr/ortaokul-turkce-dersi/unite/309",
    "publisher": "MEB",
    "checkedOn": "2026-10-12",
    "notes": "Resmî tema sayfasında beceri amacı doğrulandı, ancak kesin öğrenme çıktısı kodu bu kayıt için doğrulanmadı."
  },
  {
    "id": "TYMM.TR.7.T6",
    "year": "2026-2027",
    "grade": 7,
    "subject": "Türkçe",
    "theme": "6. Tema: Hak ve Sorumluluklar",
    "themeName": "Hak ve Sorumluluklar",
    "skill": "Basılı ve dijital medya metinlerini değerlendirme",
    "outcomeCode": null,
    "verification": "TEMA_KAPSAMI",
    "sourceUrl": "https://tymm.meb.gov.tr/ortaokul-turkce-dersi/unite/312",
    "publisher": "MEB",
    "checkedOn": "2026-10-12",
    "notes": "Resmî tema sayfasında beceri amacı doğrulandı, ancak kesin öğrenme çıktısı kodu bu kayıt için doğrulanmadı."
  }
];
export function findVerifiedThemeById(id:string):VerifiedTheme|null{
 return VERIFIED_GRADE7_TURKISH_THEMES.find(x=>x.id===id)||null;
}
