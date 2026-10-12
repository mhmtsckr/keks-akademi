import {NextResponse} from 'next/server';
import {requireRole} from '@/lib/auth';
import {withApiErrors} from '@/lib/apiGuard';
import {db} from '@/lib/db';
import {buildCoachPerformanceQueue} from '@/lib/tymmCoachQueue';

async function GET__handler(){
 const user=await requireRole(['COACH','ADMIN']);
 if(!user.coachProfile)return NextResponse.json({error:'Koç profili bulunamadı.'},{status:403});
 // Ownership is enforced at the database level before reading evidence.
 const students=await db.student.findMany({
   where:{coachId:user.coachProfile.id},
   select:{id:true,fullName:true,gradeLevel:true}
 });
 if(!students.length)return NextResponse.json({ok:true,items:[],summary:{waiting:0,overdue:0},partial:false});
 // Do not retrieve answers or ratings for students outside this coach's assignment.
 const entries=await db.dailyLog.findMany({
   where:{
    studentId:{in:students.map(s=>s.id)},
    OR:[
      {payload:{path:['type'],equals:'TYMM_PERFORMANCE_SUBMISSION'}},
      {payload:{path:['type'],equals:'TYMM_TRANSFER_SUBMISSION'}}
    ]
   },
   select:{id:true,studentId:true,createdAt:true,payload:true},
   orderBy:[{createdAt:'desc'},{id:'desc'}],
   take:501
 });
 const partial=entries.length>500;
 const items=buildCoachPerformanceQueue(students,entries.slice(0,500),new Date());
 return NextResponse.json({
  ok:true,items:items.slice(0,50),
  summary:{waiting:items.length,overdue:items.filter(x=>x.priority==='OVERDUE').length},
  partial,limitedTo:partial?500:null,
  note:partial?'Kuyruk 500 kayıtla sınırlandırılmıştır, toplam sayı kısmi olabilir.':'Öğrencilerin yalnız sizinle eşleşen performans gönderimleri gösterilir. Metin yanıtları bu listede yer almaz.'
 });
}
export const GET=withApiErrors(GET__handler);
