import {beforeEach,describe,expect,it,vi} from 'vitest';
const mocked=vi.hoisted(()=>({requireRole:vi.fn()}));
vi.mock('@/lib/auth',()=>({requireRole:mocked.requireRole}));
import {db,resetDb} from './db';
import {GET as STUDENT_GET} from '@/app/api/student/academic-performance/route';
import {GET as COACH_GET} from '@/app/api/coach/students/[id]/academic-performance/route';

const url='http://localhost/api/coach/students/id/academic-performance';
const params=(id:string)=>({params:Promise.resolve({id})});
let studentId:string,coachUserId:string,coachProfileId:string,studentUserId:string;
beforeEach(async()=>{
  await resetDb();vi.clearAllMocks();
  const coach=await db.user.create({data:{name:'Atanmış koç',role:'COACH',status:'ACTIVE'}});
  coachUserId=coach.id;
  const profile=await db.coachProfile.create({data:{userId:coach.id}});
  coachProfileId=profile.id;
  const user=await db.user.create({data:{name:'Öğrenci',role:'STUDENT',status:'ACTIVE'}});
  studentUserId=user.id;
  const student=await db.student.create({
    data:{userId:user.id,coachId:profile.id,fullName:'Öğrenci',studentCode:'ACADEMIC_TEST'}
  });
  studentId=student.id;
  await db.practiceLog.create({data:{
    studentId,examType:'TYT',subject:'Türkçe',topic:'Ana düşünce',
    total:10,correct:7,wrong:2,blank:1,net:6.5,errorReason:'DIKKAT'
  }});
});
describe('Akademik Performans Merkezi / rol ve gizlilik',()=>{
  it('öğrenci yalnız kendi kaydını görür',async()=>{
    mocked.requireRole.mockResolvedValue({role:'STUDENT',id:studentUserId,student:{id:studentId}});
    const response=await STUDENT_GET();
    expect(response.status).toBe(200);
    const data=await response.json();
    expect(data.report.overview.questions).toBe(10);
    expect(data.report.subjects[0].subject).toBe('Türkçe');
    expect(response.headers.get('Cache-Control')).toContain('no-store');
  });
  it('öğrencinin atanmış koçu aynı veriyi inceleyebilir',async()=>{
    mocked.requireRole.mockResolvedValue({
      role:'COACH',id:coachUserId,coachProfile:{id:coachProfileId}
    });
    const response=await COACH_GET(new Request(url),params(studentId));
    expect(response.status).toBe(200);
    expect((await response.json()).report.overview.questions).toBe(10);
  });
  it('başka koçun öğrenci raporuna erişimi reddedilir',async()=>{
    const outsider=await db.user.create({data:{name:'Başka koç',role:'COACH',status:'ACTIVE'}});
    const profile=await db.coachProfile.create({data:{userId:outsider.id}});
    mocked.requireRole.mockResolvedValue({
      role:'COACH',id:outsider.id,coachProfile:{id:profile.id}
    });
    const response=await COACH_GET(new Request(url),params(studentId));
    expect(response.status).toBe(404);
  });
});
