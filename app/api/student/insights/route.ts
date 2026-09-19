import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { refreshCoachAlerts } from '@/lib/analytics';

export async function GET(){
 const user=await requireRole(['STUDENT']);
 if(!user.student) return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
 const insights=await refreshCoachAlerts(user.student.id);
 return NextResponse.json({ok:true,insights});
}
