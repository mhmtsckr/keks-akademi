/** Submission integrity for human-reviewed TYMM baseline assignments. */
export const BASELINE_MAX_SUBMISSIONS_IN_SEVEN_DAYS=3;
export type BaselineSubmissionDecision='ALLOW'|'WAITING_FOR_COACH'|'WEEKLY_LIMIT';

export function baselineSubmissionDecision(recentCount:number,hasPending:boolean):BaselineSubmissionDecision{
 if(!Number.isInteger(recentCount)||recentCount<0)throw new Error('Invalid count');
 if(hasPending)return 'WAITING_FOR_COACH';
 if(recentCount>=BASELINE_MAX_SUBMISSIONS_IN_SEVEN_DAYS)return 'WEEKLY_LIMIT';
 return 'ALLOW';
}
export function baselineSubmissionMessage(decision:BaselineSubmissionDecision){
 switch(decision){
  case 'WAITING_FOR_COACH':return 'Bu görev için önceki yanıtının koç değerlendirmesi bekleniyor. Önce geri bildirimi al; aynı görevi tekrar göndermen gerekmiyor.';
  case 'WEEKLY_LIMIT':return 'Bu görev için son yedi günde en fazla üç teslim yapılabilir. Koçunla geri bildirimleri inceleyip daha sonra yeniden dene.';
  default:return 'Gönderim yapılabilir.';
 }
}
