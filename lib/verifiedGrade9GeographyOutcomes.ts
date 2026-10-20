/** 2026–27 MEB TYMM 9. sınıf Coğrafya: manually checked official outcome *codes and scopes*.
 * These links do NOT constitute Ministry approval of KEKS-authored questions.
 */
export type Grade9GeographyOutcome={grade:9;subject:'Coğrafya';code:string;theme:string;skill:string;url:string;checkedOn:string;status:'OFFICIAL_OUTCOME_SOURCE_CHECKED'};
export const VERIFIED_GRADE9_GEOGRAPHY:readonly Grade9GeographyOutcome[]=[
  {
    "code": "COĞ.9.2.1",
    "theme": "2. Tema: Mekânsal Bilgi Teknolojileri",
    "skill": "Harita öğelerini okuyup ölçek, lejant ve konum bilgilerini yorumlama",
    "url": "https://tymm.meb.gov.tr/cografya-dersi/unite/31",
    "grade": 9,
    "subject": "Coğrafya",
    "checkedOn": "2026-10-20",
    "status": "OFFICIAL_OUTCOME_SOURCE_CHECKED"
  },
  {
    "code": "COĞ.9.2.2",
    "theme": "2. Tema: Mekânsal Bilgi Teknolojileri",
    "skill": "Türkiye'nin mutlak ve göreceli konum özelliklerini ayırt etme",
    "url": "https://tymm.meb.gov.tr/cografya-dersi/unite/31",
    "grade": 9,
    "subject": "Coğrafya",
    "checkedOn": "2026-10-20",
    "status": "OFFICIAL_OUTCOME_SOURCE_CHECKED"
  },
  {
    "code": "COĞ.9.3.2",
    "theme": "3. Tema: Doğal Sistemler ve Süreçler",
    "skill": "İklim sisteminin bileşenleri ve değişkenleri arasındaki ilişkileri açıklama",
    "url": "https://tymm.meb.gov.tr/cografya-dersi/unite/34",
    "grade": 9,
    "subject": "Coğrafya",
    "checkedOn": "2026-10-20",
    "status": "OFFICIAL_OUTCOME_SOURCE_CHECKED"
  },
  {
    "code": "COĞ.9.4.1",
    "theme": "4. Tema: Beşerî Sistemler ve Süreçler",
    "skill": "Nüfus zaman serisi tablosunu doğru okuyup değişimi yorumlama",
    "url": "https://tymm.meb.gov.tr/cografya-dersi/unite/37",
    "grade": 9,
    "subject": "Coğrafya",
    "checkedOn": "2026-10-20",
    "status": "OFFICIAL_OUTCOME_SOURCE_CHECKED"
  },
  {
    "code": "COĞ.9.7.1",
    "theme": "7. Tema: Bölgeler, Ülkeler ve Küresel Bağlantılar",
    "skill": "Bölge sınırlarının seçilen ölçüte göre değişebileceğini yorumlama",
    "url": "https://tymm.meb.gov.tr/cografya-dersi/unite/47",
    "grade": 9,
    "subject": "Coğrafya",
    "checkedOn": "2026-10-20",
    "status": "OFFICIAL_OUTCOME_SOURCE_CHECKED"
  }
];
export function findGrade9GeographyOutcome(code:string){
 return VERIFIED_GRADE9_GEOGRAPHY.find(x=>x.code===code)||null;
}
