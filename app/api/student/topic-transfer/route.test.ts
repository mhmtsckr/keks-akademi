import {beforeEach,describe,expect,it,vi} from 'vitest';

const mocks=vi.hoisted(()=>({role:vi.fn(),load:vi.fn()}));
vi.mock('@/lib/auth',()=>({requireRole:mocks.role}));
vi.mock('@/lib/topicTransferService',()=>({loadTopicTransferEvidence:mocks.load}));
import {GET} from './route';

beforeEach(()=>{
 vi.clearAllMocks();
 mocks.role.mockResolvedValue({id:'student-user',role:'STUDENT',student:{id:'owned-student'}});
 mocks.load.mockResolvedValue({
  windowDays:90,topics:[],summary:{topics:0,needsSupport:0,awaitingEvidence:0,progressing:0,strongSignals:0},
  verifiedMastery:false
 });
});
describe('student topic-transfer access isolation',()=>{
 it('loads only the authenticated student’s evidence',async()=>{
  const res=await GET();
  expect(res.status).toBe(200);
  expect(mocks.load).toHaveBeenCalledWith('owned-student');
  expect((await res.json()).verifiedMastery).toBe(false);
 });
 it('blocks users without a student profile',async()=>{
  mocks.role.mockResolvedValue({role:'STUDENT',student:null});
  const res=await GET();
  expect(res.status).toBe(403);
  expect(mocks.load).not.toHaveBeenCalled();
 });
 it('does not accept a query string to select another student',async()=>{
  const res=await GET();
  expect(res.status).toBe(200);
  expect(mocks.load).toHaveBeenCalledTimes(1);
  expect(mocks.load).toHaveBeenCalledWith('owned-student');
 });
});
