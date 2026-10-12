import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requireRole} from '@/lib/auth';
import {readJson,withApiErrors} from '@/lib/apiGuard';
import {db} from '@/lib/db';
import {ALL_MICRO_LESSONS,microLessonById} from '@/lib/bankFreeMicroLessons';
import {getMicroLessonReviewStatusMap,lessonReviewDigest} from '@/lib/microLessonReview';
import {lessonSourceEvidence} from '@/lib/microLessonSourceEvidence';

const patchSchema=z.object({
  id:z.string().min(3).max(120),
  version:z.number().int().positive(),
  contentDigest:z.string().regex(/^[a-f0-9]{64}$/),
  decision:z.enum(['APPROVE','REVOKE']),
  note:z.string().trim().min(12).max(1200),
  confirmedReviewed:z.literal(true)
});

async function GET__handler(){
 await requireRole(['ADMIN']);
 const states=await getMicroLessonReviewStatusMap();
 return NextResponse.json({ok:true,lessons:ALL_MICRO_LESSONS.map(lesson=>({
   ...lesson,sourceEvidence:lessonSourceEvidence(lesson),publication:states.get(lesson.id)||{status:'PILOT'},
   contentDigest:lessonReviewDigest(lesson),
   exerciseCount:lesson.exercises.length
 }))});
}

async function PATCH__handler(req:Request){
 const admin=await requireRole(['ADMIN']);
 const input=await readJson(req,patchSchema);
 const lesson=microLessonById(input.id,input.version);
 if(!lesson)return NextResponse.json({error:'Bu sürüm için mikro ders bulunamadı.'},{status:404});
 const digest=lessonReviewDigest(lesson);
 if(input.contentDigest!==digest)return NextResponse.json({error:'İçerik son görüntülemeden sonra değişti. Yenileyip bu sürümü yeniden inceleyin.'},{status:409});
 const current=(await getMicroLessonReviewStatusMap()).get(lesson.id);
 if(input.decision==='REVOKE'&&current?.status!=='APPROVED')
   return NextResponse.json({error:'Bu ders zaten pilot durumunda.'},{status:409});
 await db.auditLog.create({data:{
   actorUserId:admin.id,
   action:'MICRO_LESSON_REVIEW',entityType:'MicroLesson',entityId:lesson.id,
   summary:lesson.subject+' · '+lesson.title+' · '+(input.decision==='APPROVE'?'Yönetici incelemesiyle onaylandı.':'Onay geri alındı.'),
   metadata:{
     decision:input.decision,version:lesson.version,digest,
     note:input.note,reviewType:'ADMIN_CONTENT_REVIEW'
   }
 }});
 return NextResponse.json({ok:true,id:lesson.id,version:lesson.version,
   status:input.decision==='APPROVE'?'APPROVED':'PILOT',
   message:input.decision==='APPROVE'
     ?'İçerik bu sürüm için yönetici onayı aldı. Bu, bağımsız uzman değerlendirmesi yapıldığı anlamına gelmez.'
     :'İçerik yeniden pilot inceleme durumuna alındı.'});
}

export const GET=withApiErrors(GET__handler);
export const PATCH=withApiErrors(PATCH__handler);
