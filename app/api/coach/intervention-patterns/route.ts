import {NextResponse} from 'next/server';
import {requireRole} from '@/lib/auth';
import {withApiErrors} from '@/lib/apiGuard';
import {buildCoachInterventionPatterns} from '@/lib/learningEngine';

async function GET__handler(){
  const user=await requireRole(['COACH','ADMIN']);
  if(!user.coachProfile)return NextResponse.json({error:'Koç profili yok.'},{status:403});
  const learning=await buildCoachInterventionPatterns(user.coachProfile.id);
  return NextResponse.json({ok:true,learning});
}

export const GET=withApiErrors(GET__handler);
