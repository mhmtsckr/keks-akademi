import {describe,expect,it} from 'vitest';
import {printedParagrafReviewRow,printedParagrafWrongRows,PARAGRAF_PRINT_SOURCE} from './paragrafPrintReview';

const questions=[
  {id:'KEKS50-00001',testNo:1,questionNo:1,topic:'Ana düşünce',correctAnswer:'C'},
  {id:'KEKS50-00002',testNo:1,questionNo:2,topic:'Örtük anlam',correctAnswer:'B'},
  {id:'KEKS50-00003',testNo:1,questionNo:3,topic:'Çıkarım',correctAnswer:'A'},
  {id:'KEKS50-00004',testNo:1,questionNo:4,topic:'Yazarın amacı',correctAnswer:'C'}
];
describe('KEKS A3 printed-question review records',()=>{
  it('only incorrect, not blank or correct, goes into review queue',()=>{
    const list=printedParagrafWrongRows(questions,[
      {questionNo:1,status:'WRONG'},
      {questionNo:2,status:'CORRECT'},
      {questionNo:3,status:'BLANK'},
      {questionNo:4,status:'WRONG'}
    ]);
    expect(list.map(x=>x.id)).toEqual(['KEKS_PRINT_A3_V1_Q00001','KEKS_PRINT_A3_V1_Q00004']);
    expect(list[0].sourceKind).toBe(PARAGRAF_PRINT_SOURCE);
    expect(list.every(x=>x.active===false&&x.reviewStatus==='PRINT_PROOF')).toBe(true);
  });
  it('does not invent missing printed question text or silently publish it',()=>{
    const row=printedParagrafReviewRow(questions[0]);
    expect(row.prompt).toContain('Önce basılı sayfadaki paragrafı');
    expect(row.explanation).toContain('ayrı KEKS Paragraf');
    expect(row).toMatchObject({correctAnswer:'C',examType:'TYT',subject:'Türkçe'});
    expect(row.options).toMatchObject({_printedCode:'KEKS50-00001',_testNo:1,_questionNo:1,_pageInTest:1});
  });
  it('rejects code collisions and invalid printed question addresses',()=>{
    expect(()=>printedParagrafReviewRow({...questions[0],id:'00001'})).toThrow();
    expect(()=>printedParagrafReviewRow({...questions[0],testNo:0})).toThrow();
    expect(()=>printedParagrafReviewRow({...questions[0],questionNo:31})).toThrow();
    expect(()=>printedParagrafReviewRow({...questions[0],correctAnswer:'Z'})).toThrow();
  });
  it('uniquely identifies one question per 50x30 print edition',()=>{
    const all=Array.from({length:50},(_,t)=>Array.from({length:30},(_,i)=>{
      const n=t*30+i+1;
      return printedParagrafReviewRow({
        id:'KEKS50-'+String(n).padStart(5,'0'),testNo:t+1,questionNo:i+1,
        topic:'Paragraf',correctAnswer:'A'
      }).id;
    })).flat();
    expect(all).toHaveLength(1500);
    expect(new Set(all).size).toBe(1500);
  });
});
