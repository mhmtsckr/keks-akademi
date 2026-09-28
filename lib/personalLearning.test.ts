import {describe,expect,it} from 'vitest';
import {buildMicroLearningTasks,buildPersonalQuestionSets,personalBankReason} from './personalLearning';

describe('kişisel soru bankası ve mikro öğrenme',()=>{
  const now=new Date('2026-09-28T04:00:00Z');
  const item=(id:string,days:number,subject:string,reason:'WRONG'|'MARKED'='WRONG')=>({
    id,examType:'TYT',subject,topic:'Konu '+id,prompt:'Soru '+id,
    createdAt:new Date(now.getTime()-days*86400000),options:{bankReason:reason}
  });

  it('son 7 gündeki yanlışlardan haftalık test üretir',()=>{
    const sets=buildPersonalQuestionSets([
      item('1',1,'Matematik','WRONG'),
      item('2',2,'Türkçe','WRONG'),
      item('3',3,'Tarih','MARKED'),
      item('4',10,'Fen','WRONG')
    ],now);
    expect(sets.weekly.count).toBe(2);
    expect(sets.weekly.items.every(x=>['1','2'].includes(x.id))).toBe(true);
  });

  it('son 30 gündeki yanlış ve işaretlileri aylık karma tekrara alır',()=>{
    const sets=buildPersonalQuestionSets([
      item('1',1,'Matematik','WRONG'),
      item('2',8,'Türkçe','MARKED'),
      item('3',31,'Tarih','WRONG')
    ],now);
    expect(sets.monthly.count).toBe(2);
    expect(sets.monthly.items.find(x=>x.id==='2')?.reason).toBe('MARKED');
  });

  it('işaretli soru nedenini tanır',()=>{
    expect(personalBankReason(item('1',0,'Matematik','MARKED'))).toBe('MARKED');
  });

  it('öğrenci profiline göre 3-5 dakikalık mikro görevler üretir',()=>{
    const tasks=buildMicroLearningTasks({
      examGroup:'YKS',
      weakSubject:'Biyoloji',
      weakTopic:'Hücre',
      dueWrongCount:2,
      hasLiterature:true,
      hasHistory:true,
      hasLanguage:false,
      hasMath:true
    });
    expect(tasks.some(x=>x.title==='3 edebiyat eşleştirmesi')).toBe(true);
    expect(tasks.some(x=>x.title==='5 tarih kronolojisi')).toBe(true);
    expect(tasks.some(x=>x.title==='3 problem')).toBe(true);
    expect(tasks.some(x=>x.title==='1 yanlış soru tekrar')).toBe(true);
    expect(tasks.every(x=>x.durationMinutes>=3&&x.durationMinutes<=5)).toBe(true);
  });

  it('YDS profiline 5 kelime görevi ekler',()=>{
    const tasks=buildMicroLearningTasks({
      examGroup:'YDS',weakSubject:null,weakTopic:null,dueWrongCount:0,
      hasLiterature:false,hasHistory:false,hasLanguage:true,hasMath:false
    });
    expect(tasks[0].title).toBe('5 kelime');
  });
});
