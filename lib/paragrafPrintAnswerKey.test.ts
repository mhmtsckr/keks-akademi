import {describe,expect,it} from 'vitest';
import {createHash} from 'node:crypto';
import {
  paragrafPrintedPageAnswerKey,printedEditionDiagnostics,PRINT_ANSWERS_SHA256
} from './paragrafPrintAnswerKey';

describe('KEKS TYT Paragraf basılı 50 testin bağımsız cevap anahtarı',()=>{
  it('sadece 50 test ve 1500 cevap içerir',()=>{
    expect(printedEditionDiagnostics()).toMatchObject({testCount:50,totalQuestions:1500,topicRows:10});
  });
  it('kaynak QR-doğrulama CSV cevaplarının SHA-256 özetini korur',()=>{
    const answers=Array.from({length:50},(_,i)=>
      paragrafPrintedPageAnswerKey(i+1,Array.from({length:30},(_,j)=>j+1)))
      .flat().map(x=>x.correctAnswer).join('');
    expect(answers).toHaveLength(1500);
    expect(createHash('sha256').update(answers).digest('hex')).toBe(PRINT_ANSWERS_SHA256);
  });
  it('001, 008, 009 ve 400 sayfa sınırlarında doğru soru/tanıma erişir',()=>{
    expect(paragrafPrintedPageAnswerKey(1,[1,2,3,4]).map(x=>x.correctAnswer)).toEqual(['C','B','A','C']);
    expect(paragrafPrintedPageAnswerKey(1,[29,30])).toHaveLength(2);
    expect(paragrafPrintedPageAnswerKey(50,[29,30])).toHaveLength(2);
    expect(paragrafPrintedPageAnswerKey(0,[1])).toEqual([]);
    expect(paragrafPrintedPageAnswerKey(51,[1])).toEqual([]);
    expect(paragrafPrintedPageAnswerKey(1,[31])).toEqual([]);
  });
  it('eski tek-soru çözüm kimliklerinden farklı baskı-kimlikleri üretir',()=>{
    const first=paragrafPrintedPageAnswerKey(1,[1])[0];
    expect(first).toMatchObject({id:'KEKS50-00001',topic:'Ana düşünce',correctAnswer:'C'});
    expect(first.id).not.toBe('00001');
  });
});
