/**
 * Source-verified official MEB TYMM 7th-grade science units and ONE output per unit.
 * 7 unit index and seven learning output codes are independently sourced;
 * this is NOT a 36-output index, full coverage, teacher review, or MEB endorsement.
 */
export type VerifiedGrade7ScienceOutcome={
 unit:number;title:string;code:string;skill:string;url:string;hours:number;
 grade:7;subject:'Fen Bilimleri';academicYear:'2026-2027';
 checkedOn:string;verification:'OFFICIAL_OUTCOME';scope:string;
};
export const VERIFIED_GRADE7_SCIENCE_OUTCOMES:readonly VerifiedGrade7ScienceOutcome[]=[
  {
    "unit": 1,
    "title": "Uzay Çağı",
    "code": "FB.7.1.1.1",
    "skill": "Uzay araştırmaları için kullanılan teknolojileri özelliklerine göre karşılaştırma",
    "url": "https://tymm.meb.gov.tr/fen-bilimleri-dersi/unite/416",
    "hours": 14,
    "grade": 7,
    "subject": "Fen Bilimleri",
    "academicYear": "2026-2027",
    "checkedOn": "2026-10-20",
    "verification": "OFFICIAL_OUTCOME",
    "scope": "One verified outcome per MEB unit; not full curricular coverage"
  },
  {
    "unit": 2,
    "title": "Kuvvet ve Enerjiyi Keşfedelim",
    "code": "FB.7.2.1.2",
    "skill": "Kinetik ve potansiyel enerjiyi karşılaştırma",
    "url": "https://tymm.meb.gov.tr/fen-bilimleri-dersi/unite/429",
    "hours": 20,
    "grade": 7,
    "subject": "Fen Bilimleri",
    "academicYear": "2026-2027",
    "checkedOn": "2026-10-20",
    "verification": "OFFICIAL_OUTCOME",
    "scope": "One verified outcome per MEB unit; not full curricular coverage"
  },
  {
    "unit": 3,
    "title": "Vücudumuzdaki Sistemler",
    "code": "FB.7.3.1.1",
    "skill": "Sindirim sistemi yapı ve organlarının görevlerini model üzerinden açıklama",
    "url": "https://tymm.meb.gov.tr/fen-bilimleri-dersi/unite/430",
    "hours": 32,
    "grade": 7,
    "subject": "Fen Bilimleri",
    "academicYear": "2026-2027",
    "checkedOn": "2026-10-20",
    "verification": "OFFICIAL_OUTCOME",
    "scope": "One verified outcome per MEB unit; not full curricular coverage"
  },
  {
    "unit": 4,
    "title": "Işığın Kırılması ve Mercekler",
    "code": "FB.7.4.2.2",
    "skill": "Merceklerin günlük yaşam kullanım alanlarını sınıflandırma",
    "url": "https://tymm.meb.gov.tr/fen-bilimleri-dersi/unite/431",
    "hours": 14,
    "grade": 7,
    "subject": "Fen Bilimleri",
    "academicYear": "2026-2027",
    "checkedOn": "2026-10-20",
    "verification": "OFFICIAL_OUTCOME",
    "scope": "One verified outcome per MEB unit; not full curricular coverage"
  },
  {
    "unit": 5,
    "title": "Maddenin Doğasına Yolculuk",
    "code": "FB.7.5.2.1",
    "skill": "Saf maddeleri element ve bileşik olarak sınıflandırma",
    "url": "https://tymm.meb.gov.tr/fen-bilimleri-dersi/unite/432",
    "hours": 34,
    "grade": 7,
    "subject": "Fen Bilimleri",
    "academicYear": "2026-2027",
    "checkedOn": "2026-10-20",
    "verification": "OFFICIAL_OUTCOME",
    "scope": "One verified outcome per MEB unit; not full curricular coverage"
  },
  {
    "unit": 6,
    "title": "Elektriklenme",
    "code": "FB.7.6.1.3",
    "skill": "Cisimleri pozitif, negatif ve nötr elektrik yüküne göre sınıflandırma",
    "url": "https://tymm.meb.gov.tr/fen-bilimleri-dersi/unite/433",
    "hours": 12,
    "grade": 7,
    "subject": "Fen Bilimleri",
    "academicYear": "2026-2027",
    "checkedOn": "2026-10-20",
    "verification": "OFFICIAL_OUTCOME",
    "scope": "One verified outcome per MEB unit; not full curricular coverage"
  },
  {
    "unit": 7,
    "title": "Sürdürülebilir Yaşam ve Geri Dönüşüm",
    "code": "FB.7.7.1.1",
    "skill": "Besin zincirindeki canlılar arasında nedensel ilişkiler kurma",
    "url": "https://tymm.meb.gov.tr/fen-bilimleri-dersi/unite/434",
    "hours": 12,
    "grade": 7,
    "subject": "Fen Bilimleri",
    "academicYear": "2026-2027",
    "checkedOn": "2026-10-20",
    "verification": "OFFICIAL_OUTCOME",
    "scope": "One verified outcome per MEB unit; not full curricular coverage"
  }
];
export function findGrade7ScienceOutcome(code:string){return VERIFIED_GRADE7_SCIENCE_OUTCOMES.find(x=>x.code===code)||null;}
