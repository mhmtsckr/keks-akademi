import { withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { refreshCoachAlerts } from '@/lib/analytics';

async function GET__handler(){
 const user=await requireRole(['STUDENT']);
 if(!user.student) return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
 const insights=await refreshCoachAlerts(user.student.id);
 return NextResponse.json({ok:true,insights});
}

export const GET = withApiErrors(GET__handler);
