import { withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { dailyTaskStatus } from '@/lib/dailyTaskStatus';

async function GET__handler(){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const from=new Date(Date.now()-14*86400000);
  const to=new Date(Date.now()+31*86400000);
  const actions=await db.coachingAction.findMany({
    where:{
      studentId:user.student.id,
      taskDate:{not:null,gte:from,lte:to},
      status:{in:['ACTIVE','COMPLETED','RESCHEDULED']}
    },
    include:{submission:true},
    orderBy:[{taskDate:'asc'},{createdAt:'asc'}]
  });
  // Never expose the action's mutable workflow status as the student's completion decision.
  const now=new Date();
  return NextResponse.json({ok:true,actions:actions.map(a=>({
    ...a,
    dailyStatus:dailyTaskStatus({taskDate:a.taskDate,periodEnd:a.periodEnd,submittedAt:a.submission?.submittedAt||null},now)
  }))},{headers:{'Cache-Control':'private, no-store'}});
}

export const GET = withApiErrors(GET__handler);
