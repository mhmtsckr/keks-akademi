/** 2026-27 eighth graders use the pre-TYMM MEB curriculum; never map them to a 2026 future TYMM theme. */
export type VerifiedLgs8Outcome={code:string;grade:8;subject:'Türkçe'|'Fen Bilimleri';unit:string;skill:string;sourceUrl:string;checkedOn:string;framework:'MEB_LEGACY_8';verification:'MEB_DOCUMENT_CODE_MATCHED';sourcePurpose:string};
export const VERIFIED_LGS8_OUTCOMES:readonly VerifiedLgs8Outcome[]=[
  {
    "code": "T.8.3.17",
    "grade": 8,
    "subject": "Türkçe",
    "unit": "Okuma — Metnin Anlamı",
    "skill": "Metnin ana düşüncesini olay örneklerinden ayırarak belirleme",
    "sourceUrl": "https://ttkb.meb.gov.tr/meb_iys_dosyalar/2026_02/6984cc98eae0b504720995_7_8_11_bursluluk_2026.pdf",
    "checkedOn": "2026-10-20",
    "framework": "MEB_LEGACY_8",
    "verification": "MEB_DOCUMENT_CODE_MATCHED",
    "sourcePurpose": "Resmî MEB 8. sınıf program kazanım kodunun belgesi; KEKS sorularının editör onayı değildir."
  },
  {
    "code": "T.8.3.25",
    "grade": 8,
    "subject": "Türkçe",
    "unit": "Okuma — Çıkarım",
    "skill": "Metindeki açık bilgilerden desteklenen, fakat yazılmamış sonucu çıkarma",
    "sourceUrl": "https://ttkb.meb.gov.tr/meb_iys_dosyalar/2026_02/6984cc98eae0b504720995_7_8_11_bursluluk_2026.pdf",
    "checkedOn": "2026-10-20",
    "framework": "MEB_LEGACY_8",
    "verification": "MEB_DOCUMENT_CODE_MATCHED",
    "sourcePurpose": "Resmî MEB 8. sınıf program kazanım kodunun belgesi; KEKS sorularının editör onayı değildir."
  },
  {
    "code": "T.8.3.32",
    "grade": 8,
    "subject": "Türkçe",
    "unit": "Okuma — Grafik ve Tablo",
    "skill": "Tablodaki sayısal verilerden doğru ve sınırlandırılmış yorum yapma",
    "sourceUrl": "https://ttkb.meb.gov.tr/meb_iys_dosyalar/2026_02/6984cc98eae0b504720995_7_8_11_bursluluk_2026.pdf",
    "checkedOn": "2026-10-20",
    "framework": "MEB_LEGACY_8",
    "verification": "MEB_DOCUMENT_CODE_MATCHED",
    "sourcePurpose": "Resmî MEB 8. sınıf program kazanım kodunun belgesi; KEKS sorularının editör onayı değildir."
  },
  {
    "code": "F.8.1.1.1",
    "grade": 8,
    "subject": "Fen Bilimleri",
    "unit": "Mevsimler ve İklim",
    "skill": "Dünya'nın eksen eğikliği ve dolanma hareketini mevsim oluşumuyla ilişkilendirme",
    "sourceUrl": "https://ttkb.meb.gov.tr/meb_iys_dosyalar/2026_04/69d3bc9ea1198779272764_Ders_Kitaplar%C4%B1_Elektronik_E%C4%9Fitim_%C4%B0%C3%A7erikleri_Tablosu.pdf",
    "checkedOn": "2026-10-20",
    "framework": "MEB_LEGACY_8",
    "verification": "MEB_DOCUMENT_CODE_MATCHED",
    "sourcePurpose": "Resmî MEB 8. sınıf program kazanım kodunun belgesi; KEKS sorularının editör onayı değildir."
  },
  {
    "code": "F.8.1.2.1",
    "grade": 8,
    "subject": "Fen Bilimleri",
    "unit": "Mevsimler ve İklim",
    "skill": "Kısa süreli hava olaylarını uzun dönemli iklim özelliklerinden ayırt etme",
    "sourceUrl": "https://ttkb.meb.gov.tr/meb_iys_dosyalar/2026_04/69d3bc9ea1198779272764_Ders_Kitaplar%C4%B1_Elektronik_E%C4%9Fitim_%C4%B0%C3%A7erikleri_Tablosu.pdf",
    "checkedOn": "2026-10-20",
    "framework": "MEB_LEGACY_8",
    "verification": "MEB_DOCUMENT_CODE_MATCHED",
    "sourcePurpose": "Resmî MEB 8. sınıf program kazanım kodunun belgesi; KEKS sorularının editör onayı değildir."
  },
  {
    "code": "F.8.2.1.3",
    "grade": 8,
    "subject": "Fen Bilimleri",
    "unit": "DNA ve Genetik Kod",
    "skill": "DNA eşlenmesinin birbirini tamamlayan zincirler üzerinden gerçekleşmesini açıklama",
    "sourceUrl": "https://ttkb.meb.gov.tr/meb_iys_dosyalar/2026_04/69d3bc9ea1198779272764_Ders_Kitaplar%C4%B1_Elektronik_E%C4%9Fitim_%C4%B0%C3%A7erikleri_Tablosu.pdf",
    "checkedOn": "2026-10-20",
    "framework": "MEB_LEGACY_8",
    "verification": "MEB_DOCUMENT_CODE_MATCHED",
    "sourcePurpose": "Resmî MEB 8. sınıf program kazanım kodunun belgesi; KEKS sorularının editör onayı değildir."
  }
];
export function findLgs8Outcome(code:string){return VERIFIED_LGS8_OUTCOMES.find(x=>x.code===code)||null;}
