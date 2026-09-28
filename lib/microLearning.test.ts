import {describe,it,expect} from 'vitest';
import {buildMicroPack,eligibleMicroKinds,gradeMicroPack,istanbulDay,microDayStart,microLevel,microSummary,publicMicroPack} from './microLearning';
describe('micro learning exercises',()=>{
  it('supports new students without practice history and respects exam and age groups',()=>{
    expect(eligibleMicroKinds({gradeLevel:'YDS'})).toEqual(['WORDS_5']);
    expect(eligibleMicroKinds({gradeLevel:'AGS/YDS'})).toEqual(['WORDS_5']);
    expect(eligibleMicroKinds({gradeLevel:'İlkokul 1'})).toEqual(['PROBLEM_3']);
    expect(eligibleMicroKinds({gradeLevel:'5. sınıf'})).not.toContain('LIT_MATCH_3');
    expect(eligibleMicroKinds({gradeLevel:'Lise 11–12',academicTrack:'EA'})).toContain('LIT_MATCH_3');
    expect(eligibleMicroKinds({gradeLevel:'YKS',academicTrack:'Sayısal'})).not.toContain('LIT_MATCH_3');
    expect(eligibleMicroKinds({gradeLevel:'AGS/ÖABT',academicTrack:'Türk Dili ve Edebiyatı'})).toContain('LIT_MATCH_3');
    expect(eligibleMicroKinds({gradeLevel:'ALES'})).toEqual(['PROBLEM_3']);
    expect(eligibleMicroKinds({})).toEqual([]);
    expect(microLevel({gradeLevel:'Lise 11–12'})).toBe('upper');
  });
  it('never ships correct answers or explanations before submission',()=>{
    const pack=publicMicroPack(buildMicroPack('WORDS_5','upper',7));
    expect(pack.items).toHaveLength(5);
    pack.items.forEach(item=>{expect(item).not.toHaveProperty('answer');expect(item).not.toHaveProperty('explanation')});
  });
  it('grades correct, wrong and blank independently without accepting a client score',()=>{
    const pack=buildMicroPack('PROBLEM_3','upper',42);
    const result=gradeMicroPack(pack,{'0':pack.items[0].answer,'1':'-999'});
    expect(result).toMatchObject({correct:1,wrong:1,blank:1,total:3});
    expect(result.items[1].explanation).toBeTruthy();
  });
  it('uses five chronological events, shuffled away from their correct order',()=>{
    for(let v=0;v<12;v++){
      const pack=buildMicroPack('HISTORY_5','upper',v);
      expect(pack.items).toHaveLength(5);
      expect(pack.items.map(x=>x.answer)).not.toEqual(['1','2','3','4','5']);
      expect(gradeMicroPack(pack,Object.fromEntries(pack.items.map(x=>[x.id,x.answer]))).correct).toBe(5);
    }
  });
  it('rotates content and produces exactly the requested counts',()=>{
    for(const [kind,count] of [['WORDS_5',5],['LIT_MATCH_3',3],['PROBLEM_3',3]] as const){
      const a=buildMicroPack(kind,'upper',1),b=buildMicroPack(kind,'upper',2);
      expect(a.items).toHaveLength(count);expect(a.items).not.toEqual(b.items);
    }
  });
  it('counts only completed work, with days changing at midnight in Turkey',()=>{
    const now=new Date('2026-09-28T21:05:00Z');
    expect(istanbulDay(now)).toBe('2026-09-29');
    expect(microDayStart(now).toISOString()).toBe('2026-09-28T21:00:00.000Z');
    const s=microSummary([
      {date:now,payload:{type:'MICRO_STARTED'}},
      {date:now,payload:{type:'MICRO_RESULT',title:'5 kelime',correct:4,wrong:1,blank:0,total:5,durationSeconds:180}},
      {date:'2026-09-28T20:59:00Z',payload:{type:'MICRO_RESULT',title:'3 problem',correct:1,wrong:1,blank:1,total:3,durationSeconds:300}}
    ],now);
    expect(s).toMatchObject({sessions:2,today:1,minutes:8,correct:5,wrong:2,blank:1});
  });
});
