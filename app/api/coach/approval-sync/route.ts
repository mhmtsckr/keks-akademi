import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { withApiErrors } from '@/lib/apiGuard';

async function GET__handler(){
  const user=await requireRole(['COACH','ADMIN']);
  if(!user.coachProfile)return NextResponse.json({error:'Koç profili bulunamadı.'},{status:400});

  const latest=await db.coachAlert.findFirst({
    where:{
      kind:'OABT_FIELD_APPROVED',
      student:{coachId:user.coachProfile.id}
    },
    orderBy:{createdAt:'desc'},
    select:{id:true,createdAt:true,studentId:true}
  });

  return NextResponse.json({
    ok:true,
    version:latest?latest.id+':'+latest.createdAt.toISOString():'none',
    latestAt:latest?.createdAt.toISOString()||null,
    studentId:latest?.studentId||null
  });
}
export const GET=withApiErrors(GET__handler);
