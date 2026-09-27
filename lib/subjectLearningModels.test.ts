import fs from 'node:fs';
import path from 'node:path';
import {describe,expect,it} from 'vitest';
import {aggregateQuestionTypePerformance} from '@/lib/learningEngine';

const ROOT=process.cwd();
const read=(file:string)=>fs.readFileSync(path.join(ROOT,file),'utf8');

describe('subject-specific learning models',()=>{
  it('tracks mathematics problem types with separate speed and accuracy',()=>{
    const rows=[
      {subject:'Matematik',topic:'Problemler',questionType:'Yaş Problemleri',correct:8,wrong:2,blank:0,avgSeconds:72},
      {subject:'Matematik',topic:'Problemler',questionType:'Yaş Problemleri',correct:4,wrong:1,blank:0,avgSeconds:68},
      {subject:'Matematik',topic:'Geometri',questionType:'Üçgen',correct:5,wrong:5,blank:0,avgSeconds:95}
    ];
    const result=aggregateQuestionTypePerformance(rows);
    const age=result.find(x=>x.questionType==='Yaş Problemleri');
    const triangle=result.find(x=>x.questionType==='Üçgen');
    expect(age?.questions).toBe(15);
    expect(age?.accuracy).toBe(80);
    expect(age?.avgSeconds).toBeCloseTo(70.7,1);
    expect(triangle?.accuracy).toBe(50);
    expect(triangle?.avgSeconds).toBe(95);
  });

  it('implements different metric families instead of one generic subject score',()=>{
    const engine=read('lib/learningEngine.ts');
    expect(engine).toContain("metrics:['hız','doğruluk','problem tipi']");
    expect(engine).toContain("metrics:['soru türü','süre','doğruluk']");
    expect(engine).toContain("metrics:['aktif hatırlama','tekrar başarısı','kronoloji/kavram']");
    expect(engine).toContain("metrics:['dönem','yazar/eser bağlantısı','tekrar başarısı']");
    expect(engine).toContain("metrics:['konu','kavram yanılgısı','doğruluk']");
    expect(engine).toContain('scienceMisconceptions');
    expect(engine).toContain('connectionPerformance');
  });

  it('captures question type, topic and timing evidence in coach workspace',()=>{
    const route=read('app/api/coach/students/[id]/workspace/route.ts');
    const form=read('app/components/StudentWorkspaceForms.tsx');
    expect(route).toContain("action:z.literal('subjectEvidence')");
    expect(route).toContain('db.examAnalyticsRecord.create');
    expect(route).toContain('questionType:input.questionType');
    expect(route).toContain('avgSeconds:input.avgSeconds??null');
    expect(form).toContain('Ders Bazlı Öğrenme Kanıtı');
    expect(form).toContain("handle(e,'subjectEvidence')");
    expect(form).toContain('Ortalama süre (sn/soru)');
  });

  it('tags active recall sessions by subject for history/literature evidence',()=>{
    const lab=read('app/components/StudyTechniqueLab.tsx');
    const engine=read('lib/learningEngine.ts');
    expect(lab).toContain("['subject','Ders']");
    expect(engine).toContain("techniqueKey:{in:['ACTIVE_RECALL','FEYNMAN']}");
    expect(engine).toContain("techniqueSubject(x.result)");
    expect(engine).toContain('activeRecallSessions');
  });

  it('renders subject-specific coach evidence and next actions',()=>{
    const ui=read('app/components/CoachLearningIntelligence.tsx');
    expect(ui).toContain("s.family==='MATHEMATICS'");
    expect(ui).toContain("s.family==='HISTORY'");
    expect(ui).toContain('Kavram yanılgısı sinyali');
    expect(ui).toContain('Dönem / akım');
    expect(ui).toContain('Önerilen sonraki adım');
  });

  it('makes the weekly plan use subject-aware task types',()=>{
    const coach=read('lib/smartCoach.ts');
    expect(coach).toContain('buildSubjectLearningModels(studentId)');
    expect(coach).toContain("type:'MATH_SPEED_ACCURACY'");
    expect(coach).toContain("type:'TURKISH_TIMED_SET'");
    expect(coach).toContain("type:'HISTORY_ACTIVE_RECALL'");
    expect(coach).toContain("type:'LITERATURE_CONNECTION'");
    expect(coach).toContain("type:'SCIENCE_CONCEPT_CHECK'");
  });
});
