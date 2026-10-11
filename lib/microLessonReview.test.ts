import {describe,expect,it} from 'vitest';
import {EXPANDED_MICRO_LESSONS} from './expandedMicroLessons';
import {lessonReviewDigest,resolveMicroLessonReview} from './microLessonReview';

describe('sürüm ve içerik özetiyle imzalı mikro ders onayı',()=>{
 const lesson=EXPANDED_MICRO_LESSONS[0];
 it('inceleme olmadan pilot kalır',()=>{
  expect(resolveMicroLessonReview(lesson,null).status).toBe('PILOT');
 });
 it('ayni sürüm ve aynı içerik onaylanabilir',()=>{
  const review={actorUserId:'admin-1',createdAt:new Date('2026-10-11T16:00:00Z'),
   metadata:{decision:'APPROVE',version:lesson.version,digest:lessonReviewDigest(lesson)}};
  const state=resolveMicroLessonReview(lesson,review);
  expect(state.status).toBe('APPROVED');
  expect(state.reviewerUserId).toBe('admin-1');
 });
 it('düzenleme, iptal veya farklı sürüm varsa onayı geçersiz sayar',()=>{
  const review={actorUserId:'admin',createdAt:new Date(),
   metadata:{decision:'APPROVE',version:lesson.version,digest:lessonReviewDigest(lesson)}};
  expect(resolveMicroLessonReview({...lesson,title:'Değiştirildi'},review).status).toBe('PILOT');
  expect(resolveMicroLessonReview(lesson,{...review,metadata:{...review.metadata,version:99}}).status).toBe('PILOT');
  expect(resolveMicroLessonReview(lesson,{...review,metadata:{...review.metadata,decision:'REVOKE'}}).status).toBe('PILOT');
 });
});
