import {beforeEach,describe,expect,it,vi} from 'vitest';
const mocked=vi.hoisted(()=>({
  role:vi.fn(),enabled:vi.fn(),plan:vi.fn()
}));
vi.mock('@/lib/auth',()=>({requireRole:mocked.role}));
vi.mock('@/lib/systemConfig',()=>({isFeatureEnabled:mocked.enabled}));
vi.mock('@/lib/smartCoach',()=>({buildWeeklyPlan:mocked.plan}));
import {db,resetDb} from './db';
import {GET,POST} from '@/app/api/coach/students/[id]/smart-plan/route';

const url='http://localhost/api/coach/students/test/smart-plan';
const params=(id:string)=>({params:Promise.resolve({id})});
const request=(body?:unknown)=>new Request(url,{
  method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body||{})
});
const plan=(title:string)=>({
  days:[{date:'2026-11-11T12:00:00Z',plannedMinutes:80,
    capacityMinutes:100,tasks:[{type:'TOPIC',title,duration:80}]}],
  prioritySummary:{coachTasksNeedingDecision:[],pendingReviewCount:0},
  explanation:'Öğrenci davranışına dayalı yedi günlük taslak.'
});
let ownerId:string,studentId:string,coachId:string;
beforeEach(async()=>{
  await resetDb();vi.clearAllMocks();
  const coach=await db.user.create({data:{name:'Koç',role:'COACH',status:'ACTIVE'}});
  ownerId=coach.id;
  const profile=await db.coachProfile.create({data:{userId:coach.id}});
  coachId=profile.id;
  const user=await db.user.create({data:{name:'Öğrenci',role:'STUDENT',status:'ACTIVE'}});
  const student=await db.student.create({data:{
    userId:user.id,coachId:profile.id,fullName:'Öğrenci',
    studentCode:'SMART_APPROVAL_STUDENT'
  }});
  studentId=student.id;
  mocked.role.mockResolvedValue({id:coach.id,role:'COACH',coachProfile:profile});
  mocked.enabled.mockResolvedValue(true);
  mocked.plan.mockResolvedValue(plan('Yeni konu'));
});
describe('Koç haftalık plan onayı / PostgreSQL',()=>{
  it('GET önizleme mevcut planı değiştirmez, farkları gösterir',async()=>{
    const old=await db.studyPlan.create({data:{
      studentId,title:'Önceki plan',payload:plan('Eski konu'),active:true
    }});
    const r=await GET(new Request(url),params(studentId));
    expect(r.status).toBe(200);
    const j=await r.json();
    expect(j.previewOnly).toBe(true);
    expect(j.currentPlan.id).toBe(old.id);
    expect(j.comparison.addedTasks).toContain('Yeni konu');
    expect(j.comparison.removedTasks).toContain('Eski konu');
    expect(j.previewDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(await db.studyPlan.count({where:{studentId,active:true}})).toBe(1);
    expect((await db.studyPlan.findUnique({where:{id:old.id}}))?.active).toBe(true);
  });
  it('açık onay olmadan herhangi bir plan etkinleşmez',async()=>{
    const preview=await (await GET(new Request(url),params(studentId))).json();
    const r=await POST(request({action:'ACTIVATE',previewDigest:preview.previewDigest}),params(studentId));
    expect(r.status).toBe(400);
    expect(await db.studyPlan.count({where:{studentId}})).toBe(0);
  });
  it('koç onayında eski plan korunur, yenisi etkinleşir ve audit kaydı eklenir',async()=>{
    const old=await db.studyPlan.create({data:{
      studentId,title:'Önceki plan',payload:plan('Eski konu'),active:true
    }});
    const preview=await (await GET(new Request(url),params(studentId))).json();
    const r=await POST(request({
      action:'ACTIVATE',confirm:true,previewDigest:preview.previewDigest
    }),params(studentId));
    expect(r.status).toBe(200);
    const j=await r.json();
    expect(j.activated).toBe(true);
    expect(j.previousPlanIds).toContain(old.id);
    expect(await db.studyPlan.count({where:{studentId,active:true}})).toBe(1);
    expect((await db.studyPlan.findUnique({where:{id:old.id}}))?.active).toBe(false);
    expect((await db.studyPlan.findUnique({where:{id:j.planId}}))?.active).toBe(true);
    expect(await db.auditLog.count({where:{
      actorUserId:ownerId,entityId:j.planId,action:'SMART_WEEKLY_PLAN_ACTIVATED'
    }})).toBe(1);
  });
  it('değişmiş bir önceki planı veya yeni taslağı eski önizlemeyle onaylatmaz',async()=>{
    const old=await db.studyPlan.create({data:{
      studentId,title:'Önceki plan',payload:plan('Eski konu'),active:true
    }});
    const preview=await (await GET(new Request(url),params(studentId))).json();
    await db.studyPlan.update({where:{id:old.id},data:{title:'Değişen aktif plan'}});
    const response=await POST(request({
      action:'ACTIVATE',confirm:true,previewDigest:preview.previewDigest
    }),params(studentId));
    expect(response.status).toBe(409);
    expect(await db.studyPlan.count({where:{studentId,active:true}})).toBe(1);
    expect(await db.studyPlan.count({where:{studentId}})).toBe(1);
    const fresh=await (await GET(new Request(url),params(studentId))).json();
    mocked.plan.mockResolvedValue(plan('Sonradan farklı konu'));
    const changed=await POST(request({
      action:'ACTIVATE',confirm:true,previewDigest:fresh.previewDigest
    }),params(studentId));
    expect(changed.status).toBe(409);
  });
  it('başka koçun öğrencisine erişemez',async()=>{
    const outsider=await db.user.create({data:{name:'Yetkisiz',role:'COACH',status:'ACTIVE'}});
    const profile=await db.coachProfile.create({data:{userId:outsider.id}});
    mocked.role.mockResolvedValue({id:outsider.id,role:'COACH',coachProfile:profile});
    expect((await GET(new Request(url),params(studentId))).status).toBe(404);
    expect((await POST(request({
      action:'ACTIVATE',confirm:true,previewDigest:'a'.repeat(64)
    }),params(studentId))).status).toBe(404);
    expect(await db.studyPlan.count({where:{studentId}})).toBe(0);
  });
  it('kullanım kapalıysa önizleme ve onay engellenir',async()=>{
    mocked.enabled.mockResolvedValue(false);
    expect((await GET(new Request(url),params(studentId))).status).toBe(403);
    expect((await POST(request({
      action:'ACTIVATE',confirm:true,previewDigest:'a'.repeat(64)
    }),params(studentId))).status).toBe(403);
  });
});
