import {describe,expect,it} from 'vitest';
import {evaluateLearningInterventionOutcome,type OutcomePractice} from './learningInterventionOutcome';

const opened='2026-11-05T10:00:00Z';
const task={id:'recheck1',subject:'Türkçe',topic:'Ana düşünce',createdAt:opened,dueAt:'2026-11-08T20:00:00Z',status:'OPEN'};
const now=new Date('2026-11-11T12:00:00Z');
const row=(date:string,correct:number,total=10,taskSubmissionId:string|null=null):OutcomePractice=>({
  subject:'Türkçe',topic:'Ana düşünce',date,total,correct,wrong:total-correct,blank:0,taskSubmissionId
});
const before=[
  row('2026-11-01T12:00:00Z',4),row('2026-11-03T12:00:00Z',5)
];
const after=[
  row('2026-11-07T12:00:00Z',9),row('2026-11-09T12:00:00Z',8)
];
describe('MİZA müdahale sonrası gözlemsel karşılaştırma',()=>{
  it('görev açılmış olması, sonucu kanıtlamaz',()=>{
    const r=evaluateLearningInterventionOutcome(task,before,new Date('2026-11-06T12:00:00Z'));
    expect(r.state).toBe('WAITING_FOR_RECHECK');
    expect(r.accuracyDelta).toBeNull();
    expect(r.followUp.questions).toBe(0);
  });
  it('iki ayrı günde veri ve yeterli soru olmadan gelişme demez',()=>{
    const r=evaluateLearningInterventionOutcome({...task,status:'COMPLETED'},[
      ...before,row('2026-11-07T12:00:00Z',10)
    ],now);
    expect(r.state).toBe('INSUFFICIENT_DATA');
    expect(r.accuracyDelta).toBeNull();
    expect(r.taskStatus).toBe('COMPLETED');
  });
  it('karşılaştırılabilir kayıtlarla olumlu sinyali hesaplar, nedensellik iddiasında bulunmaz',()=>{
    const r=evaluateLearningInterventionOutcome(task,[
      ...before,...after
    ],now);
    expect(r.state).toBe('IMPROVED_SIGNAL');
    expect(r.baseline.accuracy).toBe(45);
    expect(r.followUp.accuracy).toBe(85);
    expect(r.accuracyDelta).toBe(40);
    expect(r.note).toContain('nedensel etkisini kanıtlamaz');
    expect(r.nextAction).toContain('7 gün sonra');
  });
  it('gerileme ve sabit sonuçları ayrı sınıflandırır',()=>{
    const previous=[row('2026-11-01T12:00:00Z',9),row('2026-11-03T12:00:00Z',9)];
    expect(evaluateLearningInterventionOutcome(task,[
      ...previous,row('2026-11-07T12:00:00Z',4),row('2026-11-09T12:00:00Z',5)
    ],now).state).toBe('DECLINED_SIGNAL');
    expect(evaluateLearningInterventionOutcome(task,[
      ...before,row('2026-11-07T12:00:00Z',5),row('2026-11-09T12:00:00Z',5)
    ],now).state).toBe('NO_CLEAR_CHANGE');
  });
  it('farklı konu, bozuk sayım, gelecekteki ve 21 gün sonrası kayıtları dışlar',()=>{
    const r=evaluateLearningInterventionOutcome(task,[
      ...before,...after,
      row('2026-12-01T12:00:00Z',10),
      {...row('2026-11-08T12:00:00Z',10),topic:'Dil bilgisi'},
      {...row('2026-11-08T12:00:00Z',10),wrong:5}
    ],new Date('2026-12-06T12:00:00Z'));
    expect(r.followUp.questions).toBe(20);
  });
  it('öğrenci beyanı kaynağını ayrı açıklar',()=>{
    const r=evaluateLearningInterventionOutcome(task,[
      row('2026-11-01T12:00:00Z',4,10,'a'),row('2026-11-03T12:00:00Z',4,10,'b'),
      row('2026-11-07T12:00:00Z',8,10,'c'),row('2026-11-09T12:00:00Z',8,10,'d')
    ],now);
    expect(r.followUp.studentReportedQuestions).toBe(20);
    expect(r.note).toContain('40 soru öğrenci beyanından');
    expect(r.confidence).toBe('DESCRIPTIVE_ONLY');
  });
});
