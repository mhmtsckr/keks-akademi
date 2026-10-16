import {describe,expect,it,vi} from 'vitest';
import {createHash} from 'node:crypto';
import {paragrafPrintedPageAnswerKey,printedEditionDiagnostics,PRINT_ANSWERS_SHA256} from './paragrafPrintAnswerKey';

describe('KEKS Paragraf A3 - sunucu anahtarı koruması',()=>{
  it('yanlış veya eksik anahtar varsa tüm cevapları kilitler',()=>{
    const prior=process.env.KEKS_PARAGRAF_A3_ANSWERS;
    try{
      vi.stubEnv('KEKS_PARAGRAF_A3_ANSWERS','ABCDE');
      expect(paragrafPrintedPageAnswerKey(1,[1,2,3,4])).toEqual([]);
      expect(printedEditionDiagnostics().loaded).toBe(false);
    }finally{
      vi.unstubAllEnvs();
      if(prior!==undefined)process.env.KEKS_PARAGRAF_A3_ANSWERS=prior;
    }
  });
  it('baskı anahtarı sunucu ortamında verildiyse hash ve 1500 soru doğrulanır',()=>{
    const packed=process.env.KEKS_PARAGRAF_A3_ANSWERS;
    if(!packed)return;
    expect(createHash('sha256').update(packed).digest('hex')).toBe(PRINT_ANSWERS_SHA256);
    const diagnostics=printedEditionDiagnostics();
    expect(diagnostics).toMatchObject({loaded:true,testCount:50,totalQuestions:1500,topicRows:10});
    expect(paragrafPrintedPageAnswerKey(1,[1,2,3,4]).map(x=>x.correctAnswer)).toHaveLength(4);
  });
  it('geçersiz test ve soru numarasına cevap anahtarı vermez',()=>{
    expect(paragrafPrintedPageAnswerKey(0,[1])).toEqual([]);
    expect(paragrafPrintedPageAnswerKey(51,[1])).toEqual([]);
    expect(paragrafPrintedPageAnswerKey(1,[31])).toEqual([]);
  });
});
