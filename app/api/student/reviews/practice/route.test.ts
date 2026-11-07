import {beforeEach,describe,expect,it,vi} from 'vitest';

const mocks=vi.hoisted(()=>({role:vi.fn(),review:vi.fn(),quizzes:vi.fn(),queues:vi.fn()}));
vi.mock('@/lib/auth',()=>({requireRole:mocks.role}));
vi.mock('@/lib/db',()=>({db:{
 reviewQueueItem:{findFirst:mocks.review,findMany:mocks.queues},
 practiceQuiz:{findMany:mocks.quizzes}
}}));

import {POST} from './route';

const request=()=>new Request('http://localhost/api/student/reviews/practice',{
 method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({reviewId:'review-1'})
});
const question=(examType:string,confidence:number)=>({
 id:'origin-1',examType,subject:'Matematik',topic:'Problemler',
 options:{classificationConfidence:confidence,bankReason:'BLANK'},
 sourceKind:'STUDENT_WRONG:student-1'
});
beforeEach(()=>{
 vi.clearAllMocks();
 mocks.role.mockResolvedValue({id:'user-1',role:'STUDENT',student:{
  id:'student-1',gradeLevel:'Mezun | YKS',academicTrack:'Eşit Ağırlık'
 }});
});
describe('graduated/adult practice requires valid exam and confirmed topic',()=>{
 it('does not misreport an unspecified graduate exam as an empty question bank',async()=>{
  mocks.review.mockResolvedValue({id:'review-1',question:question('GENEL',1),sourceAttempt:null});
  const response=await POST(request());
  expect(response.status).toBe(409);
  expect((await response.json()).code).toBe('EXAM_TYPE_UNRESOLVED');
  expect(mocks.quizzes).not.toHaveBeenCalled();
 });
 it('does not route low-confidence auto-classification to unrelated approved items',async()=>{
  mocks.review.mockResolvedValue({id:'review-1',question:question('TYT',0.34),sourceAttempt:null});
  const response=await POST(request());
  expect(response.status).toBe(409);
  expect((await response.json()).code).toBe('TOPIC_CONFIRMATION_REQUIRED');
  expect(mocks.quizzes).not.toHaveBeenCalled();
 });
 it('checks ownership of the review before providing anything',async()=>{
  mocks.review.mockResolvedValue(null);
  const response=await POST(request());
  expect(response.status).toBe(404);
  expect(mocks.review).toHaveBeenCalledWith(expect.objectContaining({
    where:{id:'review-1',studentId:'student-1'}
  }));
  expect(mocks.quizzes).not.toHaveBeenCalled();
 });
});
