import type {ParagrafChoiceLetter} from './paragrafDetailedSolutions';
import {describe,expect,it} from 'vitest';
import {detailedQuestions} from './paragrafOptik';
import {
 independentTransferFor,publicIndependentTransfer,gradeIndependentTransfer
} from './paragrafIndependentTransfer';
import {GET,POST} from '@/app/api/paragraf/transfer/route';

function testMarks(testNo:number,sourceNo:number,kind:'WRONG'|'BLANK'){
 const rows=detailedQuestions(testNo)!;
 const answers=rows.map(q=>q.answer);
 answers[sourceNo-1]=kind==='BLANK'?'X':answers[sourceNo-1]==='A'?'B':'A';
 return answers.join('');
}
describe('KEKS 1500 paragraph question independent transfer for wrong/blank',()=>{
 it('selects an original, different-test same-skill question for all 50 tests and both error categories',()=>{
  for(let testNo=1;testNo<=50;testNo++){
   for(const kind of ['WRONG','BLANK'] as const){
    const marks=testMarks(testNo,1,kind);
    const source=detailedQuestions(testNo)![0];
    const selected=independentTransferFor(testNo,marks,1);
    expect(selected,'Missing transfer for test '+testNo).toBeTruthy();
    expect(selected!.testNo).not.toBe(testNo);
    expect(selected!.topic).toBe(source.topic);
    expect(selected!.question.passage.length).toBeGreaterThan(120);
    expect(Object.keys(selected!.question.choices).sort()).toEqual(['A','B','C','D','E']);
    const publicRow=publicIndependentTransfer(testNo,marks,1)!;
    expect(publicRow.questionId).toBe(selected!.id);
    expect(publicRow).not.toHaveProperty('answer');
    expect(publicRow).not.toHaveProperty('teaching');
    expect(JSON.stringify(publicRow)).not.toContain('correctAnswer');
   }
  }
 });
 it('refuses perfect tests, malformed forms, invalid question numbers and unrelated transfer IDs',()=>{
  const key=detailedQuestions(1)!.map(q=>q.answer).join('');
  expect(independentTransferFor(1,key,1)).toBeNull();
  expect(independentTransferFor(1,'Z'.repeat(30),1)).toBeNull();
  expect(independentTransferFor(1,testMarks(1,1,'BLANK'),0)).toBeNull();
  expect(independentTransferFor(1,testMarks(1,1,'BLANK'),31)).toBeNull();
  expect(gradeIndependentTransfer(1,testMarks(1,1,'BLANK'),1,'00001','A')).toBeNull();
 });
 it('evaluates another question on server using original key and does not claim mastery',()=>{
  const marks=testMarks(1,1,'WRONG');
  const selected=independentTransferFor(1,marks,1)!;
  const correct=gradeIndependentTransfer(1,marks,1,selected.id,selected.answer as ParagrafChoiceLetter)!;
  expect(correct).toMatchObject({correct:true,questionId:selected.id,countsAsMastery:false});
  const wrongAnswer:ParagrafChoiceLetter=selected.answer==='A'?'B':'A';
  const wrong=gradeIndependentTransfer(1,marks,1,selected.id,wrongAnswer)!;
  expect(wrong.correct).toBe(false);
  expect(wrong.chosenReason).toContain(selected.question.choices[wrongAnswer]);
  expect(wrong.rightReason).toContain(selected.question.choices[selected.answer as keyof typeof selected.question.choices]);
 });
 it('never exposes answer before POST and validates POST source/answer',async()=>{
  const marks=testMarks(1,1,'BLANK');
  const getUrl=new URL('http://localhost/api/paragraf/transfer');
  getUrl.searchParams.set('testNo','1');
  getUrl.searchParams.set('encoded',marks);
  getUrl.searchParams.set('sourceQuestionNo','1');
  const getResult=await GET(new Request(getUrl));
  expect(getResult.status).toBe(200);
  expect(getResult.headers.get('Cache-Control')).toContain('no-store');
  const payload=await getResult.json();
  expect(payload.question).not.toHaveProperty('answer');
  expect(payload.question).not.toHaveProperty('correctAnswer');
  expect(payload.question).not.toHaveProperty('teaching');
  const invalid=await POST(new Request(getUrl,{method:'POST',headers:{'content-type':'application/json'},
   body:JSON.stringify({testNo:1,encoded:marks,sourceQuestionNo:1,questionId:'00001',answer:'A'})}));
  expect(invalid.status).toBe(404);
  const candidate=independentTransferFor(1,marks,1)!;
  const scored=await POST(new Request(getUrl,{method:'POST',headers:{'content-type':'application/json'},
   body:JSON.stringify({testNo:1,encoded:marks,sourceQuestionNo:1,questionId:candidate.id,answer:candidate.answer})}));
  expect(scored.status).toBe(200);
  expect((await scored.json()).result).toMatchObject({correct:true,countsAsMastery:false});
 });
});
