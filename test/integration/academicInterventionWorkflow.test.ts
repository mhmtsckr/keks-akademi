import {beforeEach,describe,expect,it,vi} from 'vitest';
const mocked=vi.hoisted(()=>({requireRole:vi.fn()}));
vi.mock('@/lib/auth',()=>({requireRole:mocked.requireRole}));
import {db,resetDb} from './db';
import {GET,POST} from '@/app/api/coach/students/[id]/academic-interventions/route';

const url='http://localhost/api/coach/students/student/academic-interventions';
const params=(id:string)=>({params:Promise.resolve({id})});
const reason='Deneme ile günlük soru sonuçlarının farklılığı nedeniyle soru güçlüğü ve süre koşullarını karşılaştıracağım.';
let studentId:string,coachId:string,userId:string;
const input=(extra:Record<string,unknown>={})=>new Request(url,{
  method:'POST',headers:{'content-type':'application/json'},
  body:JSON.stringify({action:'REQUEST_RECHECK',
    examType:'TYT',subject:'Türkçe',topic:'Ana düşünce',
    decisionReason:reason,...extra})
});
beforeEach(async()=>{
  await resetDb();
  vi.clearAllMocks();
  const coach=await db.user.create({data:{name:'Yetkili Koç',role:'COACH',status:'ACTIVE'}});
  userId=coach.id;
  const profile=await db.coachProfile.create({data:{userId:coach.id}});
  coachId=profile.id;
  const user=await db.user.create({data:{name:'Öğrenci',role:'STUDENT',status:'ACTIVE'}});
  studentId=(await db.student.create({data:{
    userId:user.id,coachId:profile.id,fullName:'Öğrenci',studentCode:'ACADEMIC_FOLLOWUP'
  }})).id;
  mocked.requireRole.mockResolvedValue({id:coach.id,role:'COACH',
    coachProfile:{id:profile.id}});
  const day1=new Date(Date.now()-48*3600000),day2=new Date(Date.now()-24*3600000);
  await db.practiceLog.createMany({data:[day1,day2].map(date=>({
    studentId,examType:'TYT',subject:'Türkçe',topic:'Ana düşünce',
    date,total:12,correct:11,wrong:1,blank:0,net:10.75
  }))});
  await db.examAnalyticsRecord.createMany({data:[day1,day2].map(examDate=>({
    studentId,examType:'TYT',subject:'Türkçe',topic:'Ana düşünce',
    examDate,correct:1,wrong:5,blank:0
  }))});
});
describe('Akademik Performans Merkezi / koç inceleme işlemleri',()=>{
  it('kanıta bağlı koç takibi açar, öğrencinin planına dokunmaz ve denetim kaydı yazar',async()=>{
    const response=await POST(input(),params(studentId));
    expect(response.status).toBe(200);
    const payload=await response.json();
    expect(payload.alreadyOpen).toBe(false);
    expect(await db.studyPlan.count({where:{studentId}})).toBe(0);
    expect(await db.coachingAction.count({where:{studentId}})).toBe(0);
    const task=await db.coachTask.findUnique({where:{id:payload.coachTaskId}});
    expect(task?.sourceType).toBe('ACADEMIC_CROSS_SOURCE_RECHECK');
    expect(task?.priority).toBe('HIGH');
    const audit=await db.auditLog.findFirst({where:{
      actorUserId:userId,entityId:task!.id,action:'ACADEMIC_CROSS_SOURCE_RECHECK_REQUESTED'
    }});
    expect((audit?.metadata as Record<string,unknown>)?.examType).toBe('TYT');
    const follow=await GET(new Request(url),params(studentId));
    expect(follow.status).toBe(200);
    const j=await follow.json();
    expect(j.items[0]).toMatchObject({
      taskId:task?.id,examType:'TYT',subject:'Türkçe',
      state:'WAITING_FOR_DATA'
    });
    expect(j.items[0].followUp.practice.questions).toBe(0);
  });
  it('aynı konuya çift tıklanınca tek açık kayıt ve tek audit bırakır',async()=>{
    const first=await POST(input(),params(studentId));
    const second=await POST(input(),params(studentId));
    expect(first.status).toBe(200);expect(second.status).toBe(200);
    const firstData=await first.json(),secondData=await second.json();
    expect(secondData.alreadyOpen).toBe(true);
    expect(secondData.coachTaskId).toBe(firstData.coachTaskId);
    expect(await db.coachTask.count({where:{studentId,
      sourceType:'ACADEMIC_CROSS_SOURCE_RECHECK',status:'OPEN'}})).toBe(1);
    expect(await db.auditLog.count({where:{
      action:'ACADEMIC_CROSS_SOURCE_RECHECK_REQUESTED'
    }})).toBe(1);
  });
  it('gerekçesiz veya verisiz konu için görev açmaz',async()=>{
    expect((await POST(input({decisionReason:'kısa'}),params(studentId))).status).toBe(400);
    expect((await POST(input({topic:'Kesinlikle başka konu'}),params(studentId))).status).toBe(409);
    expect(await db.coachTask.count({where:{studentId}})).toBe(0);
  });
  it('başka koç öğrenci kaydını göremez ve değiştiremez',async()=>{
    const outsider=await db.user.create({data:{name:'Başka Koç',role:'COACH',status:'ACTIVE'}});
    const profile=await db.coachProfile.create({data:{userId:outsider.id}});
    mocked.requireRole.mockResolvedValue({
      id:outsider.id,role:'COACH',coachProfile:{id:profile.id}
    });
    expect((await GET(new Request(url),params(studentId))).status).toBe(404);
    expect((await POST(input(),params(studentId))).status).toBe(404);
  });
});
