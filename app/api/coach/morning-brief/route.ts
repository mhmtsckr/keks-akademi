import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { withApiErrors } from '@/lib/apiGuard';
import { buildCoachMorningBrief } from '@/lib/learningEngine';

async function GET__handler(){
  const user=await requireRole(['COACH','ADMIN']);
  if(!user.coachProfile)return NextResponse.json({error:'Koç profili yok.'},{status:403});
  return NextResponse.json({ok:true,brief:await buildCoachMorningBrief(user.coachProfile.id)});
}
export const GET=withApiErrors(GET__handler);
