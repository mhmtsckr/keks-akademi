import fs from 'node:fs';
import path from 'node:path';
import {describe,expect,it} from 'vitest';

const ROOT=process.cwd();
const read=(file:string)=>fs.readFileSync(path.join(ROOT,file),'utf8');

describe('subject-specific learning models',()=>{
  it('tracks mathematics with speed, accuracy and problem type',()=>{
    const engine=read('lib/learningEngine.ts');
    const coach=read('lib/smartCoach.ts');
    expect(engine).toContain("family==='MATHEMATICS'?['hız','doğruluk','problem tipi']");
    expect(engine).toContain('weakestQuestionType');
    expect(engine).toContain('slowestQuestionType');
    expect(coach).toContain("type:'MATH_SPEED_ACCURACY'");
    expect(coach).toContain('süreli problem seti');
  });

  it('tracks Turkish by question type and time',()=>{
    const engine=read('lib/learningEngine.ts');
    const coach=read('lib/smartCoach.ts');
    expect(engine).toContain("family==='TURKISH'?['soru türü','süre','doğruluk']");
    expect(engine).toContain('questionTypeBreakdown');
    expect(coach).toContain("type:'TURKISH_TIMED_TYPE'");
    expect(coach).toContain('süreli mini set');
  });

  it('tracks history with active recall and review success',()=>{
    const engine=read('lib/learningEngine.ts');
    const coach=read('lib/smartCoach.ts');
    expect(engine).toContain("techniqueKey:'ACTIVE_RECALL'");
    expect(engine).toContain("family==='HISTORY'?['aktif hatırlama','tekrar başarısı','kronoloji/kavram']");
    expect(engine).toContain('activeRecallMinutes');
    expect(coach).toContain("type:'HISTORY_ACTIVE_RECALL'");
  });

  it('tracks literature period-author-work connections',()=>{
    const engine=read('lib/learningEngine.ts');
    const coach=read('lib/smartCoach.ts');
    expect(engine).toContain('literatureConnectionDimension');
    expect(engine).toContain("(['DÖNEM','YAZAR','ESER'] as const)");
    expect(engine).toContain('literatureConnections:literatureDimensions');
    expect(coach).toContain("type:'LITERATURE_CONNECTIONS'");
    expect(coach).toContain('dönem–yazar–eser');
  });

  it('tracks science by topic and cautious misconception candidates',()=>{
    const engine=read('lib/learningEngine.ts');
    const coach=read('lib/smartCoach.ts');
    expect(engine).toContain("family==='SCIENCE'?['konu','kavram yanılgısı','doğruluk']");
    expect(engine).toContain('misconceptionCandidates');
    expect(engine).toContain('kavram yanılgısı olasılığı koç tarafından soru çözümüyle doğrulanmalıdır');
    expect(engine).not.toContain('kesin kavram yanılgısı');
    expect(coach).toContain("type:'SCIENCE_CONCEPT_CHECK'");
  });

  it('shows explainable subject signals and coach actions',()=>{
    const engine=read('lib/learningEngine.ts');
    const ui=read('app/components/CoachLearningIntelligence.tsx');
    expect(engine).toContain('primarySignal');
    expect(engine).toContain('recommendedAction');
    expect(ui).toContain('Temel sinyal');
    expect(ui).toContain('Önerilen koç aksiyonu');
    expect(ui).toContain('Kavram yanılgısı adayı');
  });

  it('feeds subject models into weekly planning instead of one generic test',()=>{
    const coach=read('lib/smartCoach.ts');
    expect(coach).toContain('buildSubjectLearningModels(studentId)');
    expect(coach).toContain('subjectModelMap');
    expect(coach).toContain("family==='MATHEMATICS'");
    expect(coach).toContain("family==='TURKISH'");
    expect(coach).toContain("family==='HISTORY'");
    expect(coach).toContain("family==='LITERATURE'");
    expect(coach).toContain("family==='SCIENCE'");
  });
});
