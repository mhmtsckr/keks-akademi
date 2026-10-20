import {describe,expect,it} from 'vitest';
import {buildRemediationImpactReport,type RemediationEvidenceRow} from './tymmRemediationImpact';

const taskId='perf-g5-moon-model-v1';
const ids=['geometry','light','phases','reasoning'];
const rubric=(geometry:number)=>({
 total:geometry+6,max:8,criterionScores:ids.map(id=>({id,score:id==='geometry'?geometry:2}))
});
const mk=(id:string,createdAt:string,payload:Record<string,unknown>):RemediationEvidenceRow=>({
 id,createdAt:new Date(createdAt),payload
});
const baseline=(score:number=0,id='base1')=>mk(id,'2026-10-01T08:00:00Z',{
 type:'TYMM_PERFORMANCE_REVIEWED',taskId,taskVersion:1,grade:5,
 review:{...rubric(score),reviewedAt:'2026-10-02T10:00:00Z'}
});
const action=(status='VERIFIED',at='2026-10-04T10:00:00Z',reviewSubmissionId='base1')=>mk(
 'act1','2026-10-03T08:00:00Z',{
 type:'TYMM_RUBRIC_ACTION',status,taskId,taskVersion:1,grade:5,
 reviewSubmissionId,criterionId:'geometry',originalRubricScore:0,
 reviewHistory:status==='VERIFIED'?[{attempt:1,decision:'ACCEPT',feedback:'Yeniden çalışma kanıtı yeterli.',
 reviewedAt:at,coachUserId:'coach1',coachProfileId:'profile1'}]:[]
 });
const transfer=(score=2,submittedAt='2026-10-10T10:00:00Z',linkedBase='base1')=>mk(
 'transfer1',submittedAt,{
 type:'TYMM_TRANSFER_REVIEWED',baselineSubmissionId:linkedBase,taskId,taskVersion:1,
 grade:5,review:{...rubric(score),reviewedAt:'2026-10-11T10:00:00Z'}
 });
const first=(rows:RemediationEvidenceRow[])=>buildRemediationImpactReport(rows).impacts[0];

describe('Rubrik telafi → gecikmeli bağımsız tekrar kanıt zinciri',()=>{
 it('yalnız kabul edildikten SONRA gönderilmiş aynı başlangıç ve aynı ölçütlü görevi karşılaştırır',()=>{
  const result=first([action(),transfer(),baseline()]);
  expect(result.status).toBe('OBSERVED_AFTER_ACTION');
  expect(result.originalScore).toBe(0);
  expect(result.independentScore).toBe(2);
  expect(result.change).toBe(2);
  expect(result.comparedSubmissionId).toBe('transfer1');
  expect(result.limitations).toContain('kanıtlamaz');
 });
 it('koç kabul etmediyse puanlama analizi yapmaz',()=>{
  expect(first([action('SUBMITTED_FOR_REVIEW'),transfer(),baseline()]).status)
    .toBe('ACTION_NOT_VERIFIED');
 });
 it('öğrenci bağımsız görevi telafiden ÖNCE gönderdiyse sonradan gelişim saymaz',()=>{
  const result=first([action('VERIFIED','2026-10-12T10:00:00Z'),transfer(),baseline()]);
  expect(result.status).toBe('TRANSFER_BEFORE_ACTION');
  expect(result.change).toBeNull();
 });
 it('farklı başlangıç gönderimine bağlı transferi kaynak eşleşmesi olarak kullanmaz',()=>{
  expect(first([action(),transfer(2,'2026-10-10T10:00:00Z','other-baseline'),baseline()]).status)
    .toBe('AWAITING_INDEPENDENT_MEASUREMENT');
 });
 it('ilk rubriği eksik veya 2 puanlık ölçütten uydurma aksiyon varsa karşılaştırmaz',()=>{
  const bad=action();(bad.payload as Record<string,unknown>).originalRubricScore=2;
  expect(first([bad,transfer(),baseline()]).status).toBe('SOURCE_NOT_VERIFIABLE');
  expect(first([action(),transfer()]).status).toBe('SOURCE_NOT_VERIFIABLE');
 });
 it('ikinci rubrik sonrası verilen telafi için üçüncü bağımsız veri olmadan sonuç iddia etmez',()=>{
  const reviewedTransfer=transfer(0);
  const a=action('VERIFIED','2026-10-14T10:00:00Z');
  a.createdAt=new Date('2026-10-12T08:00:00Z');
  (a.payload as Record<string,unknown>).reviewSubmissionId='transfer1';
  expect(first([a,reviewedTransfer,baseline()]).status).toBe('AWAITING_INDEPENDENT_MEASUREMENT');
 });
 it('sonraki ölçütte puan gerilerse risk sinyalini gösterir; otomatik etki iddia etmez',()=>{
  const b=baseline(1);
  const a=action();(a.payload as Record<string,unknown>).originalRubricScore=1;
  const report=buildRemediationImpactReport([a,transfer(0),b]);
  expect(report.impacts[0].change).toBe(-1);
  expect(report.summary.decreased).toBe(1);
  expect(report.summary.independentlyReassessed).toBe(1);
  expect(report.caveat).toContain('kanıtlamaz');
 });
});
