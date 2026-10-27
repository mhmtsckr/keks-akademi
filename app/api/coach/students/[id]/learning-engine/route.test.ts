import {beforeEach,describe,expect,it,vi} from 'vitest';
import {detailedQuestions} from '@/lib/paragrafOptik';

const mocks=vi.hoisted(()=>({
 role:vi.fn(),student:vi.fn(),logs:vi.fn(),queues:vi.fn()
}));
vi.mock('@/lib/auth',()=>({requireRole:mocks.role}));
vi.mock('@/lib/db',()=>({db:{
 student:{findFirst:mocks.student},
 dailyLog:{findMany:mocks.logs},
 reviewQueueItem:{findMany:mocks.queues}
}}));
vi.mock('@/lib/learningEngine',()=>{
 const empty=async()=>[];
 return {
  buildCapacityProfile:async()=>({}),buildTopicMastery:empty,
  buildSubjectLearningModels:empty,buildGoalDistance:async()=>null,
  buildInterventionImpact:empty,buildPlanSimulation:async()=>({}),
  buildStudentTimeline:empty,buildExamKnowledgeMap:empty,
  buildCoachStudentAlignmentSignals:empty
 };
});
vi.mock('@/lib/examIntervention',()=>({buildLatestExamInterventionReport:async()=>null}));
vi.mock('@/lib/resourceTracking',()=>({listResourceTracking:async()=>[]}));
vi.mock('@/lib/studentIndicators',()=>({buildStudentIndicators:async()=>({})}));

import {GET} from './route';

const ctx=(id:string)=>({params:Promise.resolve({id})});
const request=new Request('http://localhost/api/coach/students/student1/learning-engine');
const first=new Date('2026-10-20T12:00:00.000Z');
const key=detailedQuestions(1)!.map(q=>q.answer).join('');
const wrong=(key[0]==='A'?'B':'A')+key.slice(1);
beforeEach(()=>{
 vi.clearAllMocks();
 mocks.role.mockResolvedValue({id:'coach-user',role:'COACH',coachProfile:{id:'coach1'}});
 mocks.student.mockResolvedValue({id:'student1',fullName:'A Student',studentCode:'TEST-1'});
 mocks.logs.mockResolvedValue([{date:first,payload:{
  kind:'PARAGRAF_OPTIK_WRONG_RECOVERY',testNo:1,encoded:wrong
 }}]);
 mocks.queues.mockResolvedValue([]);
});

describe('coach student learning evidence authorization',()=>{
 it('enforces coach ownership before reading optical outcomes',async()=>{
  mocks.student.mockResolvedValue(null);
  const r=await GET(request,ctx('otherStudent'));
  expect(r.status).toBe(404);
  expect(mocks.student).toHaveBeenCalledWith({where:{id:'otherStudent',coachId:'coach1'},
   select:{id:true,fullName:true,studentCode:true}});
  expect(mocks.logs).not.toHaveBeenCalled();
  expect(mocks.queues).not.toHaveBeenCalled();
 });
 it('never accesses data without a coach profile',async()=>{
  mocks.role.mockResolvedValue({id:'u',role:'ADMIN',coachProfile:null});
  const r=await GET(request,ctx('student1'));
  expect(r.status).toBe(403);
  expect(mocks.student).not.toHaveBeenCalled();
 });
 it('returns only student-scoped and non-mastered paragraph learning indicators',async()=>{
  const r=await GET(request,ctx('student1'));
  expect(r.status).toBe(200);
  const result=await r.json();
  expect(result.paragrafCoachEvidence.totalOpticalTests).toBe(1);
  expect(result.paragrafCoachEvidence.topics[0]).toMatchObject({
   wrong:1,retentionVerified:false,evidenceLevel:'INITIAL_ONLY'
  });
  expect(mocks.queues).toHaveBeenCalledWith(expect.objectContaining({
   where:{studentId:'student1',questionId:{startsWith:'KEKS_PRINT_A3_V1_Q'}}
  }));
  expect(mocks.logs).toHaveBeenCalledWith(expect.objectContaining({
   where:expect.objectContaining({
    studentId:'student1',date:expect.any(Object),
    OR:expect.arrayContaining([
     {legacyId:{startsWith:'PARAGRAF_OPTIK_FIRST:student1:'}},
     {legacyId:{startsWith:'PARAGRAF_INDEPENDENT_FOLLOWUP:student1:'}}
    ])
   })
  }));
 });
});
