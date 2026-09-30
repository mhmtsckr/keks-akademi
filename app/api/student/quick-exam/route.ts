import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requireRole} from '@/lib/auth';
import {db} from '@/lib/db';
import {readJson,withApiErrors} from '@/lib/apiGuard';

const schema=z.object({
  examType:z.string().trim().min(1).max(40),
  totalNet:z.number().min(-100).max(500),
  durationMinutes:z.number().int().min(1).max(600).optional()
});

async function POST__handler(req:Request){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const input=await readJson(req,schema);
  const row=await db.examResult.create({data:{
    studentId:user.student.id,
    examType:input.examType,
    payload:{
      net:input.totalNet,
      totalNet:input.totalNet,
      ...(input.durationMinutes?{usedDurationMinutes:input.durationMinutes}:{}),
      entryMode:'MOBILE_QUICK'
    }
  }});
  await db.auditLog.create({data:{
    actorUserId:user.id,
    action:'MOBILE_QUICK_EXAM_CREATED',
    entityType:'ExamResult',
    entityId:row.id,
    summary:'Öğrenci mobil hızlı girişten deneme sonucu ekledi.',
    metadata:{examType:input.examType,totalNet:input.totalNet,durationMinutes:input.durationMinutes||null}
  }});
  return NextResponse.json({ok:true,row:{id:row.id,examType:row.examType,createdAt:row.createdAt}});
}

export const POST=withApiErrors(POST__handler);
