/** 2026–27 Türkiye Yüzyılı Maarif Modeli history outcome codes, individually verified on official MEB pages.
 * This is a partial audited index; it is NOT a complete history syllabus or approval of KEKS content.
 */
export type VerifiedHistoryOutcome={
 code:string;grade:9|10|11;subject:'Tarih';theme:string;skill:string;
 sourceUrl:string;checkedOn:'2026-10-20';verification:'OFFICIAL_OUTCOME';
};
export const VERIFIED_HISTORY_OUTCOMES:readonly VerifiedHistoryOutcome[]=[
  {
    "code": "TAR.9.1.2",
    "grade": 9,
    "theme": "Geçmişin İnşa Sürecinde Tarih",
    "skill": "Tarihin doğasını farklı kaynaklardan inceleyebilme",
    "sourceUrl": "https://tymm.meb.gov.tr/tarih-dersi/unite/26",
    "subject": "Tarih",
    "checkedOn": "2026-10-20",
    "verification": "OFFICIAL_OUTCOME"
  },
  {
    "code": "TAR.9.1.3",
    "grade": 9,
    "theme": "Geçmişin İnşa Sürecinde Tarih",
    "skill": "Tarihsel bilginin üretim sürecini çözümleyebilme",
    "sourceUrl": "https://tymm.meb.gov.tr/tarih-dersi/unite/26",
    "subject": "Tarih",
    "checkedOn": "2026-10-20",
    "verification": "OFFICIAL_OUTCOME"
  },
  {
    "code": "TAR.10.1.1",
    "grade": 10,
    "theme": "Türkistan'dan Türkiye'ye (1040–1299)",
    "skill": "1040–1299 askerî mücadelelerinin Türk tarihindeki etkilerini karşılaştırabilme",
    "sourceUrl": "https://tymm.meb.gov.tr/tarih-dersi/unite/36",
    "subject": "Tarih",
    "checkedOn": "2026-10-20",
    "verification": "OFFICIAL_OUTCOME"
  },
  {
    "code": "TAR.10.1.2",
    "grade": 10,
    "theme": "Türkistan'dan Türkiye'ye (1040–1299)",
    "skill": "Devlet ve ordu teşkilatında değişim ve sürekliliği yorumlayabilme",
    "sourceUrl": "https://tymm.meb.gov.tr/tarih-dersi/unite/36",
    "subject": "Tarih",
    "checkedOn": "2026-10-20",
    "verification": "OFFICIAL_OUTCOME"
  },
  {
    "code": "TAR.11.1.3",
    "grade": 11,
    "theme": "Değişen Dünyada Osmanlı Devleti (1683–1789)",
    "skill": "1755 Lizbon ve 1766 İstanbul depremlerini etkileri bakımından karşılaştırabilme",
    "sourceUrl": "https://tymm.meb.gov.tr/tarih-dersi/unite/68",
    "subject": "Tarih",
    "checkedOn": "2026-10-20",
    "verification": "OFFICIAL_OUTCOME"
  },
  {
    "code": "TAR.11.1.4",
    "grade": 11,
    "theme": "Değişen Dünyada Osmanlı Devleti (1683–1789)",
    "skill": "Sanayi Devrimi'nin siyasi, sosyal ve ekonomik neden–sonuçlarını değerlendirebilme",
    "sourceUrl": "https://tymm.meb.gov.tr/tarih-dersi/unite/68",
    "subject": "Tarih",
    "checkedOn": "2026-10-20",
    "verification": "OFFICIAL_OUTCOME"
  }
];
export function findVerifiedHistoryOutcome(code:string):VerifiedHistoryOutcome|null{
 return VERIFIED_HISTORY_OUTCOMES.find(e=>e.code===code)||null;
}
