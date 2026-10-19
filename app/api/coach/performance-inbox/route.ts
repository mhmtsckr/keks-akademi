import {NextResponse} from 'next/server';
import {requireRole} from '@/lib/auth';
import {db} from '@/lib/db';
import {withApiErrors,HttpError} from '@/lib/apiGuard';
import {summarizeCoachTymmInbox} from '@/lib/tymmCoachInbox';

async function GET__handler(){
 const user=await requireRole(['COACH','ADMIN']);
 if(!user.coachProfile)throw new HttpError(403,'Bu alan yalnız atanmış koçun öğrencilerine açıktır.');
 const students=await db.student.findMany({
  where:{coachId:user.coachProfile.id},
  select:{id:true,fullName:true,gradeLevel:true},
  orderBy:{createdAt:'desc'},take:500
 });
 if(!students.length)return NextResponse.json({
  ok:true,counts:{awaitingCoach:0,waitingOver48Hours:0,transferReady:0,transferUpcoming48Hours:0},
  items:[],partial:false,note:'Bu koça atanmış öğrenci bulunmuyor.'
 });
 // Minimal database projection; do not include answers, notes, or rubric evidence in responses.
 const batch=await db.dailyLog.findMany({
  where:{
   studentId:{in:students.map(s=>s.id)},
   OR:[
    {payload:{path:['type'],equals:'TYMM_PERFORMANCE_SUBMISSION'}},
    {payload:{path:['type'],equals:'TYMM_PERFORMANCE_REVIEWED'}},
    {payload:{path:['type'],equals:'TYMM_TRANSFER_SUBMISSION'}},
    {payload:{path:['type'],equals:'TYMM_TRANSFER_REVIEWED'}}
   ]
  },
  select:{id:true,studentId:true,createdAt:true,payload:true},
  orderBy:{createdAt:'desc'},take:5001
 });
 const partial=students.length===500||batch.length>5000;
 const result=summarizeCoachTymmInbox(students,batch.slice(0,5000),new Date());
 return NextResponse.json({
  ok:true,...result,items:result.items.slice(0,150),
  partial,
  scope:'ASSIGNED_COACH_STUDENTS_ONLY',
  warning:partial?'Veri sınırına ulaşıldı. Gösterilen sayılar tam olmayabilir; yönetici performans kuyruğu kapasitesini artırmalıdır.':null
 });
}
export const GET=withApiErrors(GET__handler);
