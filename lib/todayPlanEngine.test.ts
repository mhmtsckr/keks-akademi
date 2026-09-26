import fs from 'node:fs';
import path from 'node:path';
import {describe,expect,it} from 'vitest';
import {dailyPracticeQuestionTarget,todayPlanSequenceRank} from '@/lib/learningEngine';

const ROOT=process.cwd();
const read=(file:string)=>fs.readFileSync(path.join(ROOT,file),'utf8');

describe('Bugünün Planı motoru',()=>{
  it('temel günlük akışı rutin → tekrar → konu → soru şeklinde sıralar',()=>{
    const sequence=[
      {source:'ROUTINE',title:'Paragraf',subject:'Türkçe',metricType:'QUESTIONS'},
      {source:'ROUTINE',title:'Problem',subject:'Matematik',metricType:'QUESTIONS'},
      {source:'REVIEW_BATCH',title:'2 gecikmiş tekrar'},
      {source:'TOPIC',title:'Kimya · Mol kavramı konu tamamlama',subject:'Kimya',metricType:'MINUTES'},
      {source:'PRACTICE',title:'20 soru · Kimya · Mol kavramı',subject:'Kimya',metricType:'QUESTIONS'}
    ].map(x=>({...x,rank:todayPlanSequenceRank(x)})).sort((a,b)=>a.rank-b.rank);

    expect(sequence.map(x=>x.source)).toEqual([
      'ROUTINE','ROUTINE','REVIEW_BATCH','TOPIC','PRACTICE'
    ]);
    expect(sequence.map(x=>x.rank)).toEqual([10,20,30,40,50]);
  });

  it('soru hacmini gözlenen kapasite ve doğruluğa göre sınırlar',()=>{
    expect(dailyPracticeQuestionTarget({questionCapacity:80,accuracy:78})).toBe(20);
    expect(dailyPracticeQuestionTarget({questionCapacity:40,accuracy:78})).toBe(15);
    expect(dailyPracticeQuestionTarget({questionCapacity:20,accuracy:78})).toBe(10);
    expect(dailyPracticeQuestionTarget({questionCapacity:80,accuracy:45})).toBe(10);
  });

  it('öğrenci ekranında algoritmik ayrıntıları göstermez',()=>{
    const ui=read('app/components/StudentTodayPlan.tsx');
    expect(ui).not.toContain('Program neden böyle?');
    expect(ui).not.toContain('KEKS planı hangi veriye göre hazırladı?');
    expect(ui).not.toContain('GERÇEK KAPASİTE');
    expect(ui).not.toContain('Hedef mesafesi');
    expect(ui).toContain('Sırayla ilerle');
  });

  it('student today API yalnız eyleme dönük günlük planı döndürür',()=>{
    const route=read('app/api/student/today/route.ts');
    expect(route).toContain('buildTodayLearningPlan');
    expect(route).toContain('plan:today.plan.map');
    expect(route).not.toContain('mastery,');
    expect(route).not.toContain('subjects,');
    expect(route).not.toContain('examReport,');
    expect(route).not.toContain('examMap');
  });

  it('plan motoru gecikmiş tekrarları tek blokta toplar ve eksik konu ardından soru ekler',()=>{
    const engine=read('lib/learningEngine.ts');
    expect(engine).toContain("source:'REVIEW_BATCH'");
    expect(engine).toContain("title:reviewBatch.length+' gecikmiş tekrar'");
    expect(engine).toContain("source:'TOPIC'");
    expect(engine).toContain("source:'PRACTICE'");
    expect(engine).toContain('db.topicProgress.findMany');
  });
});
