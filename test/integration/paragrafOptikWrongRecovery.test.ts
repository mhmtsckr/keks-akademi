import {beforeEach,describe,expect,it,vi} from 'vitest';

const mocks=vi.hoisted(()=>({requireRole:vi.fn()}));
vi.mock('@/lib/auth',()=>({requireRole:mocks.requireRole}));

import {db,resetDb} from './db';
import {POST as recoverPOST} from '@/app/api/student/paragraf/optik/recover/route';
import {GET as reviewsGET,POST as reviewPOST} from '@/app/api/student/reviews/route';
import {getParagrafDetailedSolution} from '@/lib/paragrafDetailedSolutions';

const key=Array.from({length:30},(_,i)=>getParagrafDetailedSolution(String(i+1).padStart(5,'0'))!.answer).join('');
const alternative=key[0]==='A'?'B':'A';
const mistake=alternative+'X'+key.slice(2);
const url='http://localhost/api/student/paragraf/optik/recover';
function req(marks=mistake,reasons:Record<string,string>={'1':'SORU_KOKU'},
 selfChecks:Record<string,{answer:string;evidence?:string}>={}){
 return new Request(url,{method:'POST',headers:{'content-type':'application/json'},
  body:JSON.stringify({testNo:1,encoded:marks,reasons,selfChecks})});
}
let student1:string,student2:string;
async function student(label:string){
 const user=await db.user.create({data:{name:label,role:'STUDENT',status:'ACTIVE'}});
 return db.student.create({data:{userId:user.id,studentCode:'OPTIK_RECOVERY_'+label,
  fullName:label,gradeLevel:'12'}});
}
function as(id:string){
 mocks.requireRole.mockResolvedValue({id:'user-'+id,role:'STUDENT',student:{id,gradeLevel:'12'}});
}

beforeEach(async()=>{
 await resetDb();vi.clearAllMocks();
 student1=(await student('A')).id;
 student2=(await student('B')).id;
 as(student1);
});

describe('opt-in optical mistakes -> PostgreSQL -> adaptive reviews',()=>{
 it('imports wrong and blank questions only; leaves all correct questions out',async()=>{
  const r=await recoverPOST(req());
  expect(r.status).toBe(200);
  const result=await r.json();
  expect(result).toMatchObject({ok:true,alreadySaved:false,reviewLinked:2,
   attempt:{correct:28,wrong:1,blank:1,net:27.75}});
  expect(await db.practiceLog.count({where:{studentId:student1}})).toBe(1);
  const log=await db.dailyLog.findUnique({
   where:{legacyId:'PARAGRAF_OPTIK_FIRST:'+student1+':01'}
  });
  expect(log).toBeTruthy();
  const rows=await db.reviewQueueItem.findMany({where:{studentId:student1},include:{question:true}});
  expect(rows).toHaveLength(2);
  expect(rows.every(x=>x.status==='DUE'&&x.stepIndex===0&&!x.lastCorrect)).toBe(true);
  expect(rows.map(x=>x.question.id).sort()).toEqual([
   'KEKS_PRINT_A3_V1_Q00001','KEKS_PRINT_A3_V1_Q00002'
  ]);
  expect(rows[0].question.sourceKind).toBe('PARAGRAF_PRINT_A3_V1');
  expect(rows[0].question.active).toBe(false);
  expect(Object.keys(rows[0].question.options as Record<string,unknown>).sort()).toEqual(['A','B','C','D','E']);
  const view=await reviewsGET();
  expect(view.status).toBe(200);
  const payload=await view.json();
  expect(payload.items).toHaveLength(2);
  expect(payload.items[0].question).not.toHaveProperty('correctAnswer');
 });
 it('does not award duplicate logs, reset schedule, or let changed answer rewrite the first attempt',async()=>{
  expect((await recoverPOST(req())).status).toBe(200);
  const reviewed=await db.reviewQueueItem.findFirstOrThrow({
   where:{studentId:student1,questionId:'KEKS_PRINT_A3_V1_Q00001'}
  });
  const newDue=new Date(Date.now()+86400000);
  await db.reviewQueueItem.update({where:{id:reviewed.id},data:{stepIndex:1,status:'PENDING',dueAt:newDue}});
  const second=await recoverPOST(req(key));
  expect(second.status).toBe(200);
  expect((await second.json()).alreadySaved).toBe(true);
  expect(await db.practiceLog.count({where:{studentId:student1}})).toBe(1);
  expect(await db.dailyLog.count({where:{studentId:student1}})).toBe(1);
  expect(await db.reviewQueueItem.count({where:{studentId:student1}})).toBe(2);
  const after=await db.reviewQueueItem.findUniqueOrThrow({where:{id:reviewed.id}});
  expect(after.stepIndex).toBe(1);
  expect(after.dueAt.getTime()).toBe(newDue.getTime());
 });
 it('keeps student-specific imports isolated on the same immutable question',async()=>{
  expect((await recoverPOST(req())).status).toBe(200);
  as(student2);
  expect((await recoverPOST(req())).status).toBe(200);
  expect(await db.questionBankItem.count({where:{id:'KEKS_PRINT_A3_V1_Q00001'}})).toBe(1);
  expect(await db.reviewQueueItem.count({where:{studentId:student1}})).toBe(2);
  expect(await db.reviewQueueItem.count({where:{studentId:student2}})).toBe(2);
  const review=await reviewsGET();
  expect((await review.json()).items).toHaveLength(2);
 });
 it('correct first repeat moves a queued printed item to a future date',async()=>{
  expect((await recoverPOST(req())).status).toBe(200);
  const item=await db.reviewQueueItem.findFirstOrThrow({
   where:{studentId:student1,questionId:'KEKS_PRINT_A3_V1_Q00001'}
  });
  const r=await reviewPOST(new Request('http://localhost/api/student/reviews',{
   method:'POST',headers:{'content-type':'application/json'},
   body:JSON.stringify({id:item.id,answer:key[0]})
  }));
  expect(r.status).toBe(200);
  expect((await r.json()).correct).toBe(true);
  const row=await db.reviewQueueItem.findUniqueOrThrow({where:{id:item.id}});
  expect(row.stepIndex).toBe(1);
  expect(row.status).toBe('PENDING');
  expect(row.dueAt.getTime()).toBeGreaterThan(Date.now());
 });
 it('rejects invalid exams and cannot import a missing or incorrect key',async()=>{
  const r=await recoverPOST(new Request(url,{
   method:'POST',headers:{'content-type':'application/json'},
   body:JSON.stringify({testNo:51,encoded:mistake})
  }));
  expect(r.status).toBe(400);
  expect(await db.reviewQueueItem.count()).toBe(0);
 });
 it('persists blank-specific self report and second try, without promoting review mastery',async()=>{
  const r=await recoverPOST(req(mistake,{'1':'SORU_KOKU','2':'BOS_IKI_SIK'},{
   '1':{answer:key[0],evidence:'Metindeki koşulu işaretledim.'},
   '2':{answer:key[1],evidence:'İki seçenek arasında kaldım.'}
  }));
  expect(r.status).toBe(200);
  const record=await db.dailyLog.findUniqueOrThrow({
   where:{legacyId:'PARAGRAF_OPTIK_FIRST:'+student1+':01'}
  });
  const data=record.payload as Record<string,any>;
  expect(data.reasons).toMatchObject({'1':'SORU_KOKU','2':'BOS_IKI_SIK'});
  expect(data.selfChecks['1']).toMatchObject({
   answer:key[0],attemptCorrect:true,masteryVerified:false
  });
  expect(data.selfChecks['2']).toMatchObject({
   answer:key[1],attemptCorrect:true,masteryVerified:false
  });
  expect(data.verifiedMastery).toBe(false);
  const queue=await db.reviewQueueItem.findMany({where:{studentId:student1}});
  expect(queue).toHaveLength(2);
  expect(queue.every(x=>x.status==='DUE'&&x.stepIndex===0)).toBe(true);
 });
 it('rejects oversized evidence and preserves the initial submission on re-import',async()=>{
  const bad=await recoverPOST(req(mistake,{},{
   '1':{answer:key[0],evidence:'x'.repeat(501)}
  }));
  expect(bad.status).toBe(400);
  expect(await db.dailyLog.count({where:{studentId:student1}})).toBe(0);
  expect((await recoverPOST(req(mistake,{'2':'BOS_YONTEM'}))).status).toBe(200);
  const later=await recoverPOST(req(mistake,{'2':'BOS_SURE'},{
   '2':{answer:key[1],evidence:'Changed evidence'}
  }));
  expect(later.status).toBe(200);
  expect((await later.json()).alreadySaved).toBe(true);
  const data=(await db.dailyLog.findUniqueOrThrow({
   where:{legacyId:'PARAGRAF_OPTIK_FIRST:'+student1+':01'}
  })).payload as Record<string,any>;
  expect(data.reasons['2']).toBe('BOS_YONTEM');
  expect(data.selfChecks).toEqual({});
 });

});
