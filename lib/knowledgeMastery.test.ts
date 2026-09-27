import fs from 'node:fs';
import path from 'node:path';
import {describe,expect,it} from 'vitest';
import {calculateKnowledgeMastery} from '@/lib/learningEngine';

const ROOT=process.cwd();
const read=(file:string)=>fs.readFileSync(path.join(ROOT,file),'utf8');

describe('knowledge mastery model',()=>{
  it('classifies a topic as New when there is not enough test or review evidence',()=>{
    const result=calculateKnowledgeMastery({
      totalQuestions:0,
      attempts:0,
      aggregateAccuracy:null,
      latestTestAccuracy:null,
      reviewTotal:0,
      reviewCorrect:0,
      overdueReviews:0,
      daysSinceLastEvidence:2
    });
    expect(result.status).toBe('NEW');
    expect(result.confidence).toBe('LOW');
  });

  it('classifies a topic as Learning when the student has started but evidence is still thin',()=>{
    const result=calculateKnowledgeMastery({
      totalQuestions:8,
      attempts:1,
      aggregateAccuracy:72,
      latestTestAccuracy:72,
      reviewTotal:0,
      reviewCorrect:0,
      overdueReviews:0,
      daysSinceLastEvidence:2
    });
    expect(result.status).toBe('LEARNING');
  });

  it('classifies a topic as Reinforcing when learning exists but durable retention evidence is incomplete',()=>{
    const result=calculateKnowledgeMastery({
      totalQuestions:22,
      attempts:2,
      aggregateAccuracy:80,
      latestTestAccuracy:78,
      reviewTotal:1,
      reviewCorrect:1,
      overdueReviews:0,
      daysSinceLastEvidence:5
    });
    expect(result.status).toBe('REINFORCING');
  });

  it('requires strong recent test and review evidence for Durable',()=>{
    const result=calculateKnowledgeMastery({
      totalQuestions:36,
      attempts:4,
      aggregateAccuracy:89,
      latestTestAccuracy:92,
      reviewTotal:3,
      reviewCorrect:3,
      overdueReviews:0,
      daysSinceLastEvidence:6
    });
    expect(result.status).toBe('DURABLE');
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.confidence).toBe('HIGH');
  });

  it('returns a strong topic to Risky when evidence becomes stale',()=>{
    const fresh=calculateKnowledgeMastery({
      totalQuestions:36,
      attempts:4,
      aggregateAccuracy:89,
      latestTestAccuracy:92,
      reviewTotal:3,
      reviewCorrect:3,
      overdueReviews:0,
      daysSinceLastEvidence:6
    });
    const stale=calculateKnowledgeMastery({
      totalQuestions:36,
      attempts:4,
      aggregateAccuracy:89,
      latestTestAccuracy:92,
      reviewTotal:3,
      reviewCorrect:3,
      overdueReviews:0,
      daysSinceLastEvidence:35
    });
    expect(fresh.status).toBe('DURABLE');
    expect(stale.status).toBe('RISKY');
    expect(stale.score).toBeLessThan(fresh.score);
  });

  it('marks overdue repetition debt as Risky without using net score',()=>{
    const result=calculateKnowledgeMastery({
      totalQuestions:30,
      attempts:3,
      aggregateAccuracy:84,
      latestTestAccuracy:86,
      reviewTotal:3,
      reviewCorrect:2,
      overdueReviews:2,
      daysSinceLastEvidence:8
    });
    expect(result.status).toBe('RISKY');

    const engine=read('lib/learningEngine.ts');
    const start=engine.indexOf('export function calculateKnowledgeMastery');
    const end=engine.indexOf('export async function buildTopicMastery',start);
    const source=engine.slice(start,end);
    expect(source).not.toMatch(/\bnet\b/i);
  });

  it('includes defined topics even before question evidence exists',()=>{
    const engine=read('lib/learningEngine.ts');
    expect(engine).toContain('db.topicProgress.findMany');
    expect(engine).toContain('for(const row of topics)');
    expect(engine).toContain("status:mastery.status");
  });

  it('feeds mastery state into plan priority and uses latest test before aggregate accuracy',()=>{
    const engine=read('lib/learningEngine.ts');
    expect(engine).toContain("x.status==='RISKY'||x.status==='LEARNING'||x.status==='REINFORCING'");
    expect(engine).toContain('matchingMastery?.latestTestAccuracy??matchingMastery?.accuracy??null');
  });

  it('shows the score factors and reason to the coach',()=>{
    const ui=read('app/components/CoachLearningIntelligence.tsx');
    expect(ui).toContain('BİLGİ HÂKİMİYETİ · NETTEN BAĞIMSIZ');
    expect(ui).toContain('Son test:');
    expect(ui).toContain('Tekrar:');
    expect(ui).toContain('Güncellik');
    expect(ui).toContain('Durum gerekçesi:');
  });
});
