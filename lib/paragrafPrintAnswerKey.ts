/**
 * Private answer-key verifier for the KEKS 50-test / 1,500-question
 * A3 print-proof QR verification CSV (2026-10-16), NOT the legacy 6,000-row
 * ParagrafBookSolution table. Editorial approval is still pending.
 *
 * The packed answer letters reside in an encrypted server-only environment variable.
 */
export const PRINT_EDITION = 'KEKS_TYT_PARAGRAF_A3_V1';
export const PRINT_ANSWERS_SHA256 = '6fd9cc8ca3da9824862f289ed97ea2c1aa2a327eb2627a46cfb122ad6aba89e4';

const TOPICS = ['Ana düşünce','Örtük anlam','Ulaşılamayan yargı',
 'Kavramsal ayrım','Başlık belirleme','Kapsam ve koşul',
 'Düşünceyi temellendirme','Çıkarım','Eleştirel tutum','Yazarın amacı'] as const;

import {createHash} from 'node:crypto';

/** Read from encrypted Vercel environment; refuse incomplete or altered keys. */
function readAnswerRows():string[] {
  const packed=process.env.KEKS_PARAGRAF_A3_ANSWERS||'';
  if(!/^[A-E]{1500}$/.test(packed))return [];
  if(createHash('sha256').update(packed).digest('hex')!==PRINT_ANSWERS_SHA256)return [];
  return packed.match(/.{30}/g)||[];
}

const TOPIC_ROWS = `
010101232323454545676767898989
989898101010323232545454767676
676767898989010101232323454545
545454767676989898101010323232
232323454545676767898989010101
101010323232545454767676989898
898989010101232323454545676767
767676989898101010323232545454
454545676767898989010101232323
323232545454767676989898101010
`.trim().split(/\s+/);

export function paragrafPrintedPageAnswerKey(testNo:number,questionNos:readonly number[]){
  const answers=readAnswerRows()[testNo-1];
  const topics=TOPIC_ROWS[(testNo-1)%10];
  if(!answers||answers.length!==30||!topics||topics.length!==30 ||
    questionNos.some(q=>!Number.isInteger(q)||q<1||q>30))return [];
  return questionNos.map(questionNo=>{
    const item=(testNo-1)*30+questionNo;
    return {
      id:'KEKS50-'+String(item).padStart(5,'0'),
      testNo,questionNo,topic:TOPICS[Number(topics[questionNo-1])],
      correctAnswer:answers[questionNo-1]
    };
  });
}

export function printedEditionDiagnostics(){
  const rows=readAnswerRows();
  return {edition:PRINT_EDITION,testCount:50,loaded:rows.length===50,
    totalQuestions:rows.reduce((n,s)=>n+s.length,0),
    topicRows:TOPIC_ROWS.length};
}
