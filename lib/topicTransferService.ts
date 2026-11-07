/** Student-scoped persistence for observational topic-transfer assessment. */
import {db} from '@/lib/db';
import {
 TOPIC_TRANSFER_ATTEMPT_LIMIT,TOPIC_TRANSFER_WINDOW_DAYS,
 summarizeTopicTransferEvidence
} from '@/lib/topicTransferEvidence';

export async function loadTopicTransferEvidence(studentId:string){
 const since=new Date(Date.now()-TOPIC_TRANSFER_WINDOW_DAYS*86400000);
 const attempts=await db.practiceQuizAttempt.findMany({
  where:{studentId,createdAt:{gte:since}},
  orderBy:{createdAt:'desc'},
  take:TOPIC_TRANSFER_ATTEMPT_LIMIT+1,
  select:{
   id:true,quizId:true,createdAt:true,correct:true,wrong:true,blank:true,answers:true,
   quiz:{select:{questionIds:true,createdAt:true,examType:true}}
  }
 });
 const selected=attempts.slice(0,TOPIC_TRANSFER_ATTEMPT_LIMIT);
 const ids=[...new Set(selected.flatMap(attempt=>
  Array.isArray(attempt.quiz.questionIds)
   ?attempt.quiz.questionIds.filter((q):q is string=>typeof q==='string'&&q.length>0)
   :[]
 ))];
 const exposureHistoryLimit=2000;
 const allQuizExposures=selected.length?await db.practiceQuiz.findMany({
  where:{studentId},orderBy:{createdAt:'desc'},
  take:exposureHistoryLimit+1,
  select:{createdAt:true,questionIds:true}
 }):[];
 const questions=ids.length?await db.questionBankItem.findMany({
  where:{id:{in:ids}},
  select:{
   id:true,subject:true,topic:true,examType:true,sourceKind:true,
   correctAnswer:true,active:true,reviewStatus:true
  }
 }):[];
 return summarizeTopicTransferEvidence(selected,questions,studentId,{
  truncated:attempts.length>TOPIC_TRANSFER_ATTEMPT_LIMIT||allQuizExposures.length>exposureHistoryLimit,
  quizExposures:allQuizExposures.slice(0,exposureHistoryLimit)
 });
}
