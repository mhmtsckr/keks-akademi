import {resolveLearningCurriculumContext} from '@/lib/curriculumPolicy2026';
import {eligibleSubjectPracticeQuestion,type PracticeCandidate} from '@/lib/subjectIndependentPractice';

export type RecoveryCoverageStatus=
 'NEEDS_GRADE_OR_EXAM'|'INCOMPLETE_CATALOG_SCAN'|'MATCHING_APPROVED'|'NO_MATCHING_APPROVED';
/**
 * No fabricated questions. Presence of an eligible approved candidate is NOT
 * proof it has not been shown to this student before or that the topic label
 * is an officially mapped curriculum outcome.
 */
export function auditApprovedRecoveryCoverage(input:{
 gradeLevel:string|null;examType:string;subject:string;topic:string;originQuestionId:string;
 candidates:PracticeCandidate[];catalogTruncated:boolean
}){
 const ctx=resolveLearningCurriculumContext({
  gradeLevel:input.gradeLevel,examType:input.examType
 });
 if(ctx.framework==='UNRESOLVED')return {
  status:'NEEDS_GRADE_OR_EXAM' as const,matchingApproved:0,examType:input.examType,
  note:'Gerçek sınıf/sınav kapsamı doğrulanmadan soru havuzu eşleştirilmez.'
 };
 if(input.catalogTruncated)return {
  status:'INCOMPLETE_CATALOG_SCAN' as const,matchingApproved:0,examType:input.examType,
  note:'Havuz taraması sınırına ulaşıldı. Eksik soru sonucu çıkarılamaz; editör incelemeli.'
 };
 const matching=input.candidates.filter(q=>
  eligibleSubjectPracticeQuestion(q,{
   id:input.originQuestionId,examType:input.examType,
   subject:input.subject,topic:input.topic
  },ctx) &&
  q.subject===input.subject&&q.topic===input.topic
 ).length;
 return {
  status:(matching>0?'MATCHING_APPROVED':'NO_MATCHING_APPROVED') as RecoveryCoverageStatus,
  matchingApproved:matching,examType:input.examType,
  note:matching>0?
   'Düzeye uygun onaylı aday kayıt var. Daha önce görülmemiş yeni soru olup olmadığı, öğrenciye gösterilmeden önce ayrıca kontrol edilmelidir.':
   'Bu düzey ve beceride onaylı eşleşen başka kayıt yok. Editör/koç yeni içeriği doğrulamalıdır; sistem soru uydurmaz.'
 };
}
