import {describe,expect,it} from 'vitest';
import {buildLearningDiagnostics} from './learningDiagnostics';
import {buildLearningFollowUp,buildLearningFollowUps} from './learningFollowUp';

const now=new Date('2026-11-11T14:00:00Z');
function topic(){
  return buildLearningDiagnostics([
    {subject:'Türkçe',topic:'Ana düşünce',date:'2026-11-02T12:00:00Z',total:10,correct:9,wrong:1,blank:0,taskSubmissionId:'s1'},
    {subject:'Türkçe',topic:'Ana düşünce',date:'2026-11-04T12:00:00Z',total:10,correct:9,wrong:1,blank:0,taskSubmissionId:'s2'},
    {subject:'Türkçe',topic:'Ana düşünce',date:'2026-11-08T12:00:00Z',total:10,correct:5,wrong:5,blank:0,taskSubmissionId:'s3'},
    {subject:'Türkçe',topic:'Ana düşünce',date:'2026-11-10T12:00:00Z',total:10,correct:5,wrong:5,blank:0,taskSubmissionId:'s4'}
  ],now,6)[0];
}

describe('MİZA konu yeniden ölçüm önerileri',()=>{
  it('gerilemeyi yeni sorularla 8 soru ve koç onayına bağlar',()=>{
    const proposal=buildLearningFollowUp(topic(),now);
    expect(proposal.signal).toBe('REGRESSING');
    expect(proposal.questionCount).toBe(8);
    expect(proposal.coachApprovalRequired).toBe(true);
    expect(proposal.dueDate).toBe('2026-11-11');
    expect(proposal.dueAt).toBe('2026-11-11T20:00:00.000Z');
    expect(proposal.sourceNote).toContain('öğrenci görev beyanından');
  });
  it('eski takip tarihini geçmişe atama yerine güncel tutar',()=>{
    const t=topic();
    const proposal=buildLearningFollowUp({...t,lastEvidenceDay:'2026-11-04'},now);
    expect(proposal.dueDate).toBe('2026-11-11');
    expect(proposal.delayedDays).toBe(6);
  });
  it('istanbul gün değişiminde talebi doğru gün belirler',()=>{
    const t=topic();
    const proposal=buildLearningFollowUp({...t,lastEvidenceDay:'2026-11-11'},new Date('2026-11-10T21:30:00Z'));
    expect(proposal.dueDate).toBe('2026-11-12');
  });
  it('kanıt yetersizse yeniden ölçüm talep eder, öğrenildi demez',()=>{
    const t=topic();
    const proposal=buildLearningFollowUp({...t,signal:'MEASURE_MORE',studyDays:1,totalQuestions:4,studentReportedQuestions:0,otherPracticeQuestions:4},now);
    expect(proposal.questionCount).toBe(8);
    expect(proposal.instruction).toContain('iki ayrı günde');
    expect(proposal.sourceNote).toContain('doğrulanmadı');
  });
  it('çok sayıda konuyu sınırlı sayıda öneriye dönüştürür',()=>{
    expect(buildLearningFollowUps([topic(),topic(),topic()],now,2)).toHaveLength(2);
    expect(buildLearningFollowUps([topic()],now,0)).toHaveLength(0);
  });
});
