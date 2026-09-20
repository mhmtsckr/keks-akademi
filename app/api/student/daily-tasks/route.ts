import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const from=new Date(Date.now()-7*86400000);
  const to=new Date(Date.now()+31*86400000);
  const actions=await db.coachingAction.findMany({
    where:{
      studentId:user.student.id,
      taskDate:{not:null,gte:from,lte:to}
    },
    include:{submission:true},
    orderBy:[{taskDate:'asc'},{createdAt:'asc'}]
  });
  return NextResponse.json({ok:true,actions});
}
