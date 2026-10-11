import {createHash} from 'node:crypto';
import {db} from './db';
import {ALL_MICRO_LESSONS,type MicroLesson} from './bankFreeMicroLessons';

export type LessonPublicationStatus='PILOT'|'APPROVED';

export function lessonReviewDigest(lesson:MicroLesson):string{
  // Each approval is tied to exactly this subject/content and answer key version.
  return createHash('sha256').update(JSON.stringify(lesson)).digest('hex');
}
function meta(value:unknown):Record<string,unknown>{
  return value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};
}

export function resolveMicroLessonReview(
 lesson:MicroLesson,
 latest:{metadata:unknown;createdAt:Date;actorUserId:string|null}|null
){
 const m=meta(latest?.metadata);
 const approved=m.decision==='APPROVE'&&m.version===lesson.version
   &&m.digest===lessonReviewDigest(lesson);
 return {
   status:(approved?'APPROVED':'PILOT') as LessonPublicationStatus,
   reviewedAt:approved?latest?.createdAt.toISOString()||null:null,
   reviewerUserId:approved?latest?.actorUserId||null:null
 };
}

export async function getMicroLessonReviewStatusMap(){
 const ids=ALL_MICRO_LESSONS.map(x=>x.id);
 const latest=await db.auditLog.findMany({
   where:{action:'MICRO_LESSON_REVIEW',entityType:'MicroLesson',entityId:{in:ids}},
   orderBy:{createdAt:'desc'},take:500,
   select:{entityId:true,metadata:true,createdAt:true,actorUserId:true}
 });
 const seen=new Map<string,typeof latest[number]>();
 for(const row of latest)if(row.entityId&&!seen.has(row.entityId))seen.set(row.entityId,row);
 return new Map(ALL_MICRO_LESSONS.map(lesson=>[
   lesson.id,resolveMicroLessonReview(lesson,seen.get(lesson.id)||null)
 ]));
}
