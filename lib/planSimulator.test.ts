import {describe,expect,it} from 'vitest';
import {simulatePlanOptions} from './planSimulator';

const topics=[
  {subject:'Kimya',topic:'Mol',status:'RISKY',score:42,accuracy:54,overdueReviews:2},
  {subject:'Matematik',topic:'Problemler',status:'LEARNING',score:58,accuracy:61,overdueReviews:0},
  {subject:'Türkçe',topic:'Paragraf',status:'DURABLE',score:90,accuracy:88,overdueReviews:0}
];

describe('plan simulator',()=>{
  it('calculates capacity without creating a plan object',()=>{
    const result=simulatePlanOptions({dailyMinutes:120,studyDays:5,examsPerWeek:1,topics});
    expect(result.capacity.weeklyMinutes).toBe(600);
    expect(result.capacity.examLoadMinutes).toBe(135);
    expect(result.capacity.studyMinutes).toBe(465);
    expect(result.priorities[0].subject).toBe('Kimya');
    expect(result.note).toContain('bir plan değildir');
  });

  it('shows the cost of increasing exams from one to two',()=>{
    const one=simulatePlanOptions({dailyMinutes:120,studyDays:5,examsPerWeek:1,topics});
    const two=simulatePlanOptions({dailyMinutes:120,studyDays:5,examsPerWeek:2,topics});
    expect(two.capacity.studyMinutes).toBeLessThan(one.capacity.studyMinutes);
    expect(two.capacity.focusBlocks).toBeLessThan(one.capacity.focusBlocks);
  });
});
