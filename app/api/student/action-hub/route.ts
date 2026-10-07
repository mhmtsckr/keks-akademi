import {NextResponse} from 'next/server';
import {requireRole} from '@/lib/auth';
import {withApiErrors} from '@/lib/apiGuard';
import {buildStudentActionHub} from '@/lib/studentActionEngine';
import {isFeatureEnabled} from '@/lib/systemConfig';

async function POST__handler(){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  if(!(await isFeatureEnabled('TODAY_PLAN',user.student.studentCode))){
    return NextResponse.json({error:'Bugünün Planı bu hesap için etkin değil.'},{status:403});
  }
  return NextResponse.json({ok:true,hub:await buildStudentActionHub(user.student.id)});
}

export const POST=withApiErrors(POST__handler);
