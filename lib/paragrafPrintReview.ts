import {PRINT_EDITION} from '@/lib/paragrafPrintAnswerKey';
import type {ParagrafSolutionRow} from '@/lib/paragrafPage';

export const PARAGRAF_PRINT_SOURCE = 'PARAGRAF_PRINT_A3_V1';

/**
 * The printed passage/options are not stored digitally yet. The review therefore
 * references the exact paper question rather than inventing question content.
 * Shared immutable catalog row; student ownership is enforced by ReviewQueueItem.
 */
export function printedParagrafReviewRow(q:ParagrafSolutionRow) {
  if(!Number.isInteger(q.testNo)||q.testNo<1||q.testNo>50||
     !Number.isInteger(q.questionNo)||q.questionNo<1||q.questionNo>30||
     !/^[A-E]$/.test(q.correctAnswer))throw new Error('Geçersiz basılı soru kimliği.');
  const ordinal=(q.testNo-1)*30+q.questionNo;
  const paperId='KEKS50-'+String(ordinal).padStart(5,'0');
  if(q.id!==paperId)throw new Error('Soru kodu bu baskıyla uyuşmuyor.');
  const id='KEKS_PRINT_A3_V1_Q'+String(ordinal).padStart(5,'0');
  const pageInTest=Math.ceil(q.questionNo/4);
  return {
    id,examType:'TYT',subject:'Türkçe',topic:q.topic,
    prompt:'KEKS Paragraf basılı kitabı · Test '+q.testNo+' · Soru '+q.questionNo+
      '. Önce basılı sayfadaki paragrafı ve seçenekleri yeniden okuyun; ardından cevabı işaretleyin.',
    options:{
      A:'A',B:'B',C:'C',D:'D',E:'E',
      _kind:'PAPER_REFERENCE',_edition:PRINT_EDITION,
      _testNo:q.testNo,_questionNo:q.questionNo,_pageInTest:pageInTest,
      _printedCode:paperId
    },
    correctAnswer:q.correctAnswer,
    explanation:'Özgün soru metni ve ayrıntılı çözüm ayrı KEKS Paragraf basılı/çözüm PDF dosyalarındadır. '+
      'Test '+q.testNo+' soru '+q.questionNo+' için o kaynaklara başvurun.',
    sourceKind:PARAGRAF_PRINT_SOURCE,
    active:false,reviewStatus:'PRINT_PROOF'
  } as const;
}

export function printedParagrafWrongRows(questions:readonly ParagrafSolutionRow[],
  gradedItems:readonly {questionNo:number;status:string}[]){
  const wrong=new Set(gradedItems.filter(x=>x.status==='WRONG').map(x=>x.questionNo));
  return questions.filter(q=>wrong.has(q.questionNo)).map(printedParagrafReviewRow);
}
