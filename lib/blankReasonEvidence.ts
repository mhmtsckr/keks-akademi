/** Optional learner self-report; never a server diagnosis or verified answer. */
export const BLANK_REASON_CODES={
 BILGI_EKSIKLIGI:'Konuyu henüz bilmiyorum',
 SURE:'Sürem yetmedi',
 SORU_KOKU:'Sorunun ne istediğini anlayamadım',
 KARARSIZLIK:'Seçeneklerden emin olamadım',
 YONTEM_BILMEME:'Nasıl çözeceğimi bilemedim',
 UNUTMA:'Öğrendiğim bilgiyi hatırlayamadım',
 BELIRLENEMEDI:'Nedenini henüz belirleyemedim'
} as const;
export type BlankReasonCode=keyof typeof BLANK_REASON_CODES;
export const QUIZ_RECOVERY_EVIDENCE_TYPE='QUIZ_WRONG_BLANK_EVIDENCE_V3';
export function blankReasonAction(reason:BlankReasonCode|null):string{
 switch(reason){
  case 'BILGI_EKSIKLIGI':return 'Önce kavramı küçük bir çözümlü örnekle öğren.';
  case 'SURE':return 'Önce süresiz çöz, daha sonra farklı soruda süreyi kontrol et.';
  case 'SORU_KOKU':return 'Soru kökünde isteneni kendi cümlenle tekrar et.';
  case 'KARARSIZLIK':return 'İki olası seçeneği kanıtlarıyla karşılaştır.';
  case 'YONTEM_BILMEME':return 'Uygun çözüm yöntemini öğretmen/koç örneğinden incele.';
  case 'UNUTMA':return 'Notlara bakmadan hatırlamayı dene, sonra doğrula.';
  default:return 'Nedenini kesin varsayma; birlikte belirle ve farklı soru dene.';
 }
}
