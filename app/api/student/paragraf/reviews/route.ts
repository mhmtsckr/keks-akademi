import {NextResponse} from 'next/server';
import {requireRole} from '@/lib/auth';
import {db} from '@/lib/db';
import {PARAGRAF_PRINT_SOURCE} from '@/lib/paragrafPrintReview';
import {withApiErrors,HttpError} from '@/lib/apiGuard';

async function GET__handler(){
  const user=await requireRole(['STUDENT']);
  if(!user.student)throw new HttpError(403,'Öğrenci profili bulunamadı.');
  const items=await db.reviewQueueItem.findMany({
    where:{
      studentId:user.student.id,
      status:{in:['DUE','PENDING']},
      question:{sourceKind:PARAGRAF_PRINT_SOURCE}
    },
    select:{id:true,questionId:true,dueAt:true,status:true,stepIndex:true,
      question:{select:{id:true,prompt:true,topic:true,options:true}}},
    orderBy:{dueAt:'asc'},take:100
  });
  return NextResponse.json({
    ok:true,items:items.map(item=>{
      const raw=item.question.options;
      const o=raw&&typeof raw==='object'&&!Array.isArray(raw)
        ? raw as Record<string,unknown>:{};
      return {
        id:item.id,questionId:item.questionId,dueAt:item.dueAt,status:item.status,
        stepIndex:item.stepIndex,isDue:item.dueAt.getTime()<=Date.now(),
        question:{
          prompt:item.question.prompt,topic:item.question.topic,
          testNo:typeof o._testNo==='number'?o._testNo:null,
          questionNo:typeof o._questionNo==='number'?o._questionNo:null,
          pageInTest:typeof o._pageInTest==='number'?o._pageInTest:null
        }
      };
    })
  },{headers:{'Cache-Control':'private, no-store'}});
}
export const GET=withApiErrors(GET__handler);
