import {describe,it,expect} from 'vitest';
import {MAX_REMEDIATION_ATTEMPTS,actionAttempts,actionReviews,submitActionEvidence,reviewActionEvidence} from './tymmActionEvidenceReview';
const base={type:'TYMM_RUBRIC_ACTION',status:'ASSIGNED',studentId:'student-x',
 taskId:'perf-g5-moon-model-v1',criterionId:'geometry',masteryStatusUnchanged:true};
const proof='Üç cismi ayrı çizdim ve Ay üzerinde görünen aydınlık kısmı kendi cümlelerimle açıkladım.';
const coach={coachUserId:'coach-user',coachProfileId:'coach-profile',reviewedAt:'2026-10-19T12:00:00.000Z'};
describe('telafi çalışmasında öğrenci kanıtı ve koç doğrulaması',()=>{
 it('öğrenci beyanı yalnız inceleme beklemeye geçer; otomatik onay verilmez',()=>{
  const submission=submitActionEvidence(base,proof,'2026-10-19T11:00:00.000Z');
  expect(submission.status).toBe('SUBMITTED_FOR_REVIEW');
  expect(submission.attemptCount).toBe(1);
  expect(submission.masteryStatusUnchanged).toBe(true);
  expect(submission.reviewScheduleUnchanged).toBe(true);
  expect(submission.completedAt).toBeNull();
  expect(actionAttempts(submission)).toHaveLength(1);
  expect(actionReviews(submission)).toHaveLength(0);
  expect(()=>submitActionEvidence(submission,proof,'2026-10-20T11:00:00.000Z')).toThrow();
  expect(()=>submitActionEvidence({...base,status:'DONE'},proof,'2026-10-20T11:00:00.000Z')).toThrow();
 });
 it('yalnız koç kararıyla doğrulama yapılır; rubrik bilgi hâkimiyetini değiştirmez',()=>{
  const first=submitActionEvidence(base,proof,'2026-10-19T11:00:00.000Z');
  expect(()=>reviewActionEvidence(base,{...coach,decision:'ACCEPT',feedback:'Çizim doğru fakat yönünü açıklamalısın.'})).toThrow();
  const accepted=reviewActionEvidence(first,{...coach,decision:'ACCEPT',feedback:'Işığın yönünü doğru ve gerekçeli göstermişsin; açıklama anlaşılır.'});
  expect(accepted.status).toBe('VERIFIED');
  expect(accepted.verifiedByCoach).toBe(true);
  expect(accepted.masteryStatusUnchanged).toBe(true);
  expect(accepted.reviewScheduleUnchanged).toBe(true);
  expect(accepted.completedAt).toBe(coach.reviewedAt);
  expect(actionReviews(accepted)[0].coachProfileId).toBe('coach-profile');
  expect(()=>reviewActionEvidence(accepted,{...coach,decision:'REVISE',feedback:'Açıklama yeniden düzenlenmeli.'})).toThrow();
 });
 it('en fazla üç revizyon; her teslim ve koç geribildirimi tarihle korunur',()=>{
  let state:Record<string,unknown>={...base};
  for(let i=1;i<=MAX_REMEDIATION_ATTEMPTS;i++){
   state=submitActionEvidence(state,proof,'2026-10-19T11:00:00.000Z');
   expect(state.status).toBe('SUBMITTED_FOR_REVIEW');
   state=reviewActionEvidence(state,{...coach,decision:'REVISE',feedback:'Bu denemede gerekçe ve yön açıklaması yetersiz, yeniden değerlendirmelisin.'});
   expect(state.status).toBe(i===MAX_REMEDIATION_ATTEMPTS?'COACH_DISCUSSION_REQUIRED':'REVISION_REQUIRED');
   expect(actionAttempts(state)).toHaveLength(i);
   expect(actionReviews(state)).toHaveLength(i);
  }
  expect(()=>submitActionEvidence(state,proof,'2026-10-20T11:00:00.000Z')).toThrow();
  expect(actionAttempts(state)[0].number).toBe(1);
  expect(actionReviews(state)[0].decision).toBe('REVISE');
 });
 it('kısa/eksik yanıt ve koç gerekçesiyle bilinmeyen statü reddedilir',()=>{
  expect(()=>submitActionEvidence(base,'Kısa','2026-10-19T11:00:00.000Z')).toThrow();
  expect(()=>submitActionEvidence(base,proof,'not-a-date')).toThrow();
  const state=submitActionEvidence(base,proof,'2026-10-19T11:00:00.000Z');
  expect(()=>reviewActionEvidence(state,{...coach,decision:'ACCEPT',feedback:'Kısa'})).toThrow();
  expect(()=>reviewActionEvidence({...state,status:'DONE'},{...coach,decision:'ACCEPT',feedback:'Bu görev koç tarafından doğrulanmıştır.'})).toThrow();
 });
});