import {getParagrafDetailedSolution,type ParagrafChoiceLetter} from '@/lib/paragrafDetailedSolutions';
import {gradeOptical} from '@/lib/paragrafOptik';
import {paragrafReadingGuide} from '@/lib/paragrafLearningPlaybook';

export type IndependentTransfer={
  sourceQuestionNo:number;
  questionId:string;
  testNo:number;
  questionNo:number;
  topic:string;
  passage:string;
  stem:string;
  choices:Record<ParagrafChoiceLetter,string>;
  readingGoal:string;
};
/**
 * Select one different, already-authored print question for the *same* skill.
 * No synthetic or fabricated question is used. Never select from the current
 * 30-question test, to avoid leaking answers before its completion.
 */
export function independentTransferFor(testNo:number,encoded:string,sourceQuestionNo:number){
  const graded=gradeOptical(testNo,encoded);
  if(!graded||!Number.isInteger(sourceQuestionNo)||sourceQuestionNo<1||sourceQuestionNo>30)return null;
  const origin=graded.details[sourceQuestionNo-1];
  if(!origin||origin.status==='DOĞRU')return null;
  const serial=(testNo-1)*30+sourceQuestionNo;
  for(let offset=37;offset<1500+37;offset++){
    const idx=((serial-1+offset)%1500)+1;
    const question=getParagrafDetailedSolution(String(idx).padStart(5,'0'));
    if(!question||question.testNo===testNo||question.topic!==origin.topic)continue;
    const item=question.question;
    if(!item?.passage?.trim()||!item?.stem?.trim()||!item?.choices||
      (['A','B','C','D','E'] as const).some(k=>!item.choices[k]?.trim()))continue;
    return question;
  }
  return null;
}
export function publicIndependentTransfer(testNo:number,encoded:string,sourceQuestionNo:number):IndependentTransfer|null{
  const q=independentTransferFor(testNo,encoded,sourceQuestionNo);
  if(!q)return null;
  return {
    sourceQuestionNo,questionId:q.id,testNo:q.testNo,questionNo:q.questionNo,
    topic:q.topic,passage:q.question.passage,stem:q.question.stem,
    choices:q.question.choices,readingGoal:paragrafReadingGuide(q.topic).focus
  };
}
export function gradeIndependentTransfer(testNo:number,encoded:string,sourceQuestionNo:number,
  questionId:string,answer:ParagrafChoiceLetter){
  const q=independentTransferFor(testNo,encoded,sourceQuestionNo);
  if(!q||q.id!==questionId)return null;
  const correct=answer===q.answer;
  return {
    sourceQuestionNo,questionId:q.id,topic:q.topic,chosen:answer,correct,
    correctAnswer:q.answer,
    chosenReason:q.teaching.analysis[answer].explanation,
    rightReason:q.teaching.analysis[q.answer as ParagrafChoiceLetter].explanation,
    lesson:q.teaching.lesson,
    learningCheck:q.teaching.check,
    countsAsMastery:false,
    recommendedNextStep:correct
      ?'Farklı bir soruda doğruya ulaştın. Konunun kalıcılığını 1, 3, 7, 14 ve 28. günlerde bağımsız tekrarlarla ölç.'
      :'Bu sorudaki seçeneğin neden elendiğini oku, kanıtı göster ve aynı beceriyi sonraki tekrarda yeniden dene.'
  };
}
