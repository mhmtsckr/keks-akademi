import {describe,expect,it} from 'vitest';
import {summarizeCoachTymmInbox,type TymmInboxLog} from './tymmCoachInbox';
import {TYMM_PERFORMANCE_TASKS} from './tymmPerformanceTasks';

const task=TYMM_PERFORMANCE_TASKS[0];
const students=[
 {id:'s1',fullName:'Öğrenci 1',gradeLevel:'5. sınıf'},
 {id:'s2',fullName:'Öğrenci 2',gradeLevel:'5. sınıf'}
];
function record(id:string,studentId:string,type:string,when:string,review?:Record<string,unknown>):TymmInboxLog{
 return {id,studentId,createdAt:new Date(when),
  payload:{type,taskId:task.id,taskVersion:task.version,grade:task.grade,
   transferVariantId:task.id.replace(/-v1$/,'-transfer-v1'),transferVersion:1,review}};
}
function reviewed(at:string){
 return {reviewedAt:at,total:8,max:8,criterionScores:task.criteria.map(c=>({id:c.id,score:2}))};
}
const now=new Date('2026-10-20T12:00:00.000Z');

describe('Koçun tüm öğrencileri için TYMM takip kutusu',()=>{
 it('48 saati aşan bekleyen inceleme ve yeni teslimi sayar',()=>{
  const list=[
   record('old','s1','TYMM_PERFORMANCE_SUBMISSION','2026-10-16T08:00:00Z'),
   record('fresh','s2','TYMM_TRANSFER_SUBMISSION','2026-10-20T11:00:00Z'),
   record('intruder','different-coach','TYMM_PERFORMANCE_SUBMISSION','2026-10-10T00:00:00Z')
  ];
  const result=summarizeCoachTymmInbox(students,list,now);
  expect(result.counts.awaitingCoach).toBe(2);
  expect(result.counts.waitingOver48Hours).toBe(1);
  expect(result.items.some(x=>x.studentId==='different-coach')).toBe(false);
  expect(result.items.find(x=>x.id==='old')?.overdue).toBe(true);
  expect(result.items.find(x=>x.id==='fresh')?.kind).toBe('TRANSFER_REVIEW');
  expect(JSON.stringify(result)).not.toContain('student answer');
 });
 it('ilk insan rubriğinden yedi gün sonra açılacak veya açılmış görevleri gösterir',()=>{
  const rows=[
   record('a','s1','TYMM_PERFORMANCE_REVIEWED','2026-10-10T00:00:00Z',reviewed('2026-10-12T10:00:00Z')),
   record('b','s2','TYMM_PERFORMANCE_REVIEWED','2026-10-12T00:00:00Z',reviewed('2026-10-15T11:00:00Z'))
  ];
  const result=summarizeCoachTymmInbox(students,rows,now);
  expect(result.counts.transferReady).toBe(1);
  expect(result.counts.transferUpcoming48Hours).toBe(1);
  expect(result.items.find(x=>x.studentId==='s1')?.kind).toBe('TRANSFER_READY');
  expect(result.items.find(x=>x.studentId==='s2')?.kind).toBe('TRANSFER_UPCOMING');
  expect(result.items.find(x=>x.studentId==='s2')?.timestamp).toBe('2026-10-22T11:00:00.000Z');
 });
 it('ikinci teslim gelince öğrenciye hazır görev görünmez; yalnız koç kuyruğuna girer',()=>{
  const rows=[
   record('a','s1','TYMM_PERFORMANCE_REVIEWED','2026-10-10T00:00:00Z',reviewed('2026-10-12T10:00:00Z')),
   record('x','s1','TYMM_TRANSFER_SUBMISSION','2026-10-20T11:00:00Z')
  ];
  const result=summarizeCoachTymmInbox(students,rows,now);
  expect(result.counts.transferReady).toBe(0);
  expect(result.counts.awaitingCoach).toBe(1);
  expect(result.items.find(x=>x.id==='x')?.kind).toBe('TRANSFER_REVIEW');
 });
 it('geçersiz görev ve yanlış sınıf verisi inceleme kuyruğuna alınmaz',()=>{
  const rows=[
   record('wrong','s1','TYMM_PERFORMANCE_SUBMISSION','2026-10-16T08:00:00Z'),
   record('wrong-class','s1','TYMM_TRANSFER_SUBMISSION','2026-10-19T08:00:00Z')
  ];
  rows[0].payload={...rows[0].payload as object,taskId:'fake'};
  rows[1].payload={...rows[1].payload as object,grade:12};
  expect(summarizeCoachTymmInbox(students,rows,now).counts.awaitingCoach).toBe(0);
 });
 it('inceleme zamanının gerçek tarihi ve gecikme eşikleri kullanılır',()=>{
  const rows=[
   record('exact','s1','TYMM_PERFORMANCE_SUBMISSION','2026-10-18T12:00:00Z'),
   record('recent','s2','TYMM_PERFORMANCE_SUBMISSION','2026-10-19T12:00:00Z')
  ];
  const result=summarizeCoachTymmInbox(students,rows,now);
  expect(result.counts.waitingOver48Hours).toBe(1);
  expect(result.items.find(x=>x.id==='exact')?.waitingHours).toBe(48);
  expect(result.items.find(x=>x.id==='recent')?.waitingHours).toBe(24);
 });
});
