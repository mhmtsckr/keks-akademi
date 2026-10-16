import {describe,expect,it} from 'vitest';
import {
  getParagrafDetailedSolution,PARAGRAF_DETAILED_TOTAL,
  paragrafDetailedSignature,paragrafDetailedSolutionUrl,
  verifyParagrafDetailedSignature
} from './paragrafDetailedSolutions';
const secret='test-only-qr-secret-strong-enough-01234567890';

describe('KEKS Paragraf 1500 question-specific detailed solutions',()=>{
  it('contains every print-edition question once, in exact test and question order',()=>{
    const ids=new Set<string>();
    for(let i=1;i<=PARAGRAF_DETAILED_TOTAL;i++){
      const id=String(i).padStart(5,'0');
      const q=getParagrafDetailedSolution(id);
      expect(q,'Missing solution '+id).toBeTruthy();
      expect(q!.id).toBe(id);
      expect(q!.testNo).toBe(Math.floor((i-1)/30)+1);
      expect(q!.questionNo).toBe((i-1)%30+1);
      expect(q!.content).toContain('1. Kökü tanı:');
      expect(q!.content).toContain('2. Kanıt haritası:');
      expect(q!.content).toContain('3. Çeldirici analizi:');
      expect(q!.content).toContain('4. Hata defteri:');
      expect(q!.content).toContain('5. Altın ilke:');
      for(const answer of ['A','B','C','D','E']){
        expect(q!.content).toContain(answer+' (');
      }
      ids.add(q!.id);
    }
    expect(ids.size).toBe(1500);
  });
  it('does not confuse print solution 00001 with legacy 6000-row IDs',()=>{
    expect(getParagrafDetailedSolution('00001')).toMatchObject({
      testNo:1,questionNo:1,answer:'C'
    });
    expect(getParagrafDetailedSolution('01500')).toMatchObject({
      testNo:50,questionNo:30,answer:'C'
    });
  });
  it.each(['1','001','00000','01501','99999','01/01','..%2F001','x001','00001a'])(
    'rejects invalid question identifier %s',(id)=>{
      expect(getParagrafDetailedSolution(id)).toBeNull();
      expect(paragrafDetailedSignature(id,secret)).toBeNull();
    }
  );
  it('one QR signature never grants access to the next or previous question',()=>{
    const key1=paragrafDetailedSignature('00001',secret)!;
    const key2=paragrafDetailedSignature('00002',secret)!;
    expect(key1).toMatch(/^[a-f0-9]{32}$/);
    expect(key1).not.toBe(key2);
    expect(verifyParagrafDetailedSignature('00001',key1,secret)).toBe(true);
    expect(verifyParagrafDetailedSignature('00002',key1,secret)).toBe(false);
    expect(verifyParagrafDetailedSignature('00001',key1.slice(0,-1)+'g',secret)).toBe(false);
    expect(verifyParagrafDetailedSignature('00001',null,secret)).toBe(false);
    expect(verifyParagrafDetailedSignature('00001',[key1],secret)).toBe(false);
    expect(verifyParagrafDetailedSignature('00001',key1,'bad')).toBe(false);
  });
  it('generates an exact single-question URL',()=>{
    const u=paragrafDetailedSolutionUrl('01500',secret,'https://keksakademi.vercel.app/');
    expect(u).toBe('https://keksakademi.vercel.app/paragraf/ayrintili/01500?k='+
      paragrafDetailedSignature('01500',secret));
  });
});
