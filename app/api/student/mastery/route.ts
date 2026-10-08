import {NextResponse} from 'next/server';
import {requireRole} from '@/lib/auth';
import {withApiErrors} from '@/lib/apiGuard';
import {buildTopicMastery} from '@/lib/learningEngine';

async function GET__handler(){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const mastery=await buildTopicMastery(user.student.id);
  return NextResponse.json({
    ok:true,
    mastery:mastery.slice(0,20),
    summary:{
      risky:mastery.filter(x=>x.status==='RISKY').length,
      learning:mastery.filter(x=>x.status==='LEARNING').length,
      reinforcing:mastery.filter(x=>x.status==='REINFORCING').length,
      durable:mastery.filter(x=>x.status==='DURABLE').length,
      new:mastery.filter(x=>x.status==='NEW').length
    }
  },{headers:{'Cache-Control':'no-store'}});
}

export const GET=withApiErrors(GET__handler);
