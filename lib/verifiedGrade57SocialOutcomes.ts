/** Verified official MEB TYMM code/scope for six 5–7 Social Studies skills. MEB does not approve KEKS exercises. */
export type Grade57SocialOutcome={code:string;grade:number;subject:'Sosyal Bilgiler';theme:string;skill:string;url:string;checkedOn:string;verification:'MEB_OUTCOME_SOURCE_CHECKED'};
export const VERIFIED_GRADE57_SOCIAL:readonly Grade57SocialOutcome[]=[
  {
    "code": "SB.5.1.1",
    "grade": 5,
    "subject": "Sosyal Bilgiler",
    "theme": "Birlikte Yaşamak",
    "skill": "Grup üyeliği ile roller ve sorumluluklar arasındaki ilişkileri çözümleme",
    "url": "https://tymm.meb.gov.tr/sosyal-bilgiler-dersi/unite/379",
    "checkedOn": "2026-10-20",
    "verification": "MEB_OUTCOME_SOURCE_CHECKED"
  },
  {
    "code": "SB.5.6.1",
    "grade": 5,
    "subject": "Sosyal Bilgiler",
    "theme": "Teknoloji ve Sosyal Bilimler",
    "skill": "Teknolojik gelişmelerin toplumsal etkilerini kanıtla tartışma",
    "url": "https://tymm.meb.gov.tr/sosyal-bilgiler-dersi/unite/405",
    "checkedOn": "2026-10-20",
    "verification": "MEB_OUTCOME_SOURCE_CHECKED"
  },
  {
    "code": "SB.6.2.1",
    "grade": 6,
    "subject": "Sosyal Bilgiler",
    "theme": "Evimiz Dünya",
    "skill": "Türkiye'nin mutlak ve göreceli konumunu kanıta dayalı ayırt etme",
    "url": "https://tymm.meb.gov.tr/sosyal-bilgiler-dersi/unite/418",
    "checkedOn": "2026-10-20",
    "verification": "MEB_OUTCOME_SOURCE_CHECKED"
  },
  {
    "code": "SB.6.2.2",
    "grade": 6,
    "subject": "Sosyal Bilgiler",
    "theme": "Evimiz Dünya",
    "skill": "Doğal çevre ve beşerî çevre arasındaki ilişkiyi çözümleme",
    "url": "https://tymm.meb.gov.tr/sosyal-bilgiler-dersi/unite/418",
    "checkedOn": "2026-10-20",
    "verification": "MEB_OUTCOME_SOURCE_CHECKED"
  },
  {
    "code": "SB.7.5.2",
    "grade": 7,
    "subject": "Sosyal Bilgiler",
    "theme": "Hayatımızdaki Ekonomi",
    "skill": "Üretim, dağıtım ve tüketim döngüsünü neden sonuçla yorumlama",
    "url": "https://tymm.meb.gov.tr/sosyal-bilgiler-dersi/unite/427",
    "checkedOn": "2026-10-20",
    "verification": "MEB_OUTCOME_SOURCE_CHECKED"
  },
  {
    "code": "SB.7.6.1",
    "grade": 7,
    "subject": "Sosyal Bilgiler",
    "theme": "Teknoloji ve Sosyal Bilimler",
    "skill": "Teknolojik gelişmelerin toplumsal etkileri hakkında koşullu öngörüde bulunma",
    "url": "https://tymm.meb.gov.tr/sosyal-bilgiler-dersi/unite/428",
    "checkedOn": "2026-10-20",
    "verification": "MEB_OUTCOME_SOURCE_CHECKED"
  }
];
export function findGrade57SocialOutcome(code:string){return VERIFIED_GRADE57_SOCIAL.find(x=>x.code===code)||null;}
