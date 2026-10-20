/** 12th-grade 2026–27: source-checked former MEB 2018 literature program (NOT TYMM).
 * Original KEKS AYT-form questions require independent content review.
 */
export type VerifiedGrade12LiteratureOutcome={
 code:string;grade:12;subject:'Türk Dili ve Edebiyatı';scope:string;title:string;
 programVersion:'MEB_TDE_2018';academicYear:'2026-2027';
 sourceUrl:string;checkedOn:string;verification:'PROGRAM_OUTCOME_VERIFIED';
 assessmentStyle:'YKS_AYT_5_CHOICE';disclaimer:string;sourceNote:string;
};
export const VERIFIED_GRADE12_LITERATURE:readonly VerifiedGrade12LiteratureOutcome[]=[
  {
    "code": "A.1.8",
    "grade": 12,
    "subject": "Türk Dili ve Edebiyatı",
    "scope": "Şiirde edebî/sanatsal anlayışların yansımasını metinden hareketle değerlendirme",
    "title": "Şiirde edebî anlayış",
    "programVersion": "MEB_TDE_2018",
    "academicYear": "2026-2027",
    "sourceUrl": "https://mufredat.meb.gov.tr/Dosyalar/20221229132522794-T%C3%BCrk%20Dili%20ve%20Edebiyat%C4%B1%20Dersi%20%C3%96%C4%9Fretim%20Program%C4%B1.pdf",
    "sourceNote": "MEB Türk Dili ve Edebiyatı Dersi 2018 Öğretim Programı, Şiir kazanımları",
    "checkedOn": "2026-10-20",
    "verification": "PROGRAM_OUTCOME_VERIFIED",
    "assessmentStyle": "YKS_AYT_5_CHOICE",
    "disclaimer": "MEB kazanım kodu kaynak belgedeki 8/12. sınıf yürürlükteki önceki programdır; KEKS sorusu MEB veya ÖSYM tarafından hazırlanmadı ya da onaylanmadı."
  },
  {
    "code": "A.1.9",
    "grade": 12,
    "subject": "Türk Dili ve Edebiyatı",
    "scope": "Şiirde açık/örtük iletiyi metinden kanıtla yorumlama",
    "title": "Şiirde yorum ve ileti",
    "programVersion": "MEB_TDE_2018",
    "academicYear": "2026-2027",
    "sourceUrl": "https://mufredat.meb.gov.tr/Dosyalar/20221229132522794-T%C3%BCrk%20Dili%20ve%20Edebiyat%C4%B1%20Dersi%20%C3%96%C4%9Fretim%20Program%C4%B1.pdf",
    "sourceNote": "MEB Türk Dili ve Edebiyatı Dersi 2018 Öğretim Programı, Şiir kazanımları",
    "checkedOn": "2026-10-20",
    "verification": "PROGRAM_OUTCOME_VERIFIED",
    "assessmentStyle": "YKS_AYT_5_CHOICE",
    "disclaimer": "MEB kazanım kodu kaynak belgedeki 8/12. sınıf yürürlükteki önceki programdır; KEKS sorusu MEB veya ÖSYM tarafından hazırlanmadı ya da onaylanmadı."
  },
  {
    "code": "A.2.9",
    "grade": 12,
    "subject": "Türk Dili ve Edebiyatı",
    "scope": "Öyküleyici metinde anlatım tekniklerinin işlevini yorumlama",
    "title": "Anlatım teknikleri",
    "programVersion": "MEB_TDE_2018",
    "academicYear": "2026-2027",
    "sourceUrl": "https://mufredat.meb.gov.tr/Dosyalar/20221229132522794-T%C3%BCrk%20Dili%20ve%20Edebiyat%C4%B1%20Dersi%20%C3%96%C4%9Fretim%20Program%C4%B1.pdf",
    "sourceNote": "MEB Türk Dili ve Edebiyatı Dersi 2018 Öğretim Programı, Öyküleyici metin kazanımları",
    "checkedOn": "2026-10-20",
    "verification": "PROGRAM_OUTCOME_VERIFIED",
    "assessmentStyle": "YKS_AYT_5_CHOICE",
    "disclaimer": "MEB kazanım kodu kaynak belgedeki 8/12. sınıf yürürlükteki önceki programdır; KEKS sorusu MEB veya ÖSYM tarafından hazırlanmadı ya da onaylanmadı."
  },
  {
    "code": "A.2.12",
    "grade": 12,
    "subject": "Türk Dili ve Edebiyatı",
    "scope": "Öyküleyici metinde edebî anlayışın yansımasını metin kanıtıyla değerlendirme",
    "title": "Edebî akım ve anlayış",
    "programVersion": "MEB_TDE_2018",
    "academicYear": "2026-2027",
    "sourceUrl": "https://mufredat.meb.gov.tr/Dosyalar/20221229132522794-T%C3%BCrk%20Dili%20ve%20Edebiyat%C4%B1%20Dersi%20%C3%96%C4%9Fretim%20Program%C4%B1.pdf",
    "sourceNote": "MEB Türk Dili ve Edebiyatı Dersi 2018 Öğretim Programı, Öyküleyici metin kazanımları",
    "checkedOn": "2026-10-20",
    "verification": "PROGRAM_OUTCOME_VERIFIED",
    "assessmentStyle": "YKS_AYT_5_CHOICE",
    "disclaimer": "MEB kazanım kodu kaynak belgedeki 8/12. sınıf yürürlükteki önceki programdır; KEKS sorusu MEB veya ÖSYM tarafından hazırlanmadı ya da onaylanmadı."
  }
];
export function findGrade12LiteratureOutcome(code:string){return VERIFIED_GRADE12_LITERATURE.find(x=>x.code===code)||null;}
