import {describe,expect,it} from 'vitest';
import {selectMonthlyMixedReview,selectWeeklyWrongTest,type PersonalBankItem} from './personalQuestionBank';

function item(id:string,subject:string,reason:PersonalBankItem['reason'],daysAgo:number):PersonalBankItem{
  return {
    questionId:id,examType:'TYT',subject,topic:'Konu',prompt:id,sourceKind:'ORIGINAL',
    addedAt:new Date(Date.UTC(2026,8,28)-daysAgo*86400000),reason,imageUrl:null
  };
}

describe('kişisel soru bankası test seçimi',()=>{
  const now=new Date(Date.UTC(2026,8,28));

  it('haftalık yanlışlar testine yalnız son 7 gündeki yanlışları alır',()=>{
    const rows=[
      item('w1','Matematik','WRONG',1),
      item('w2','Türkçe','UPLOADED_WRONG',6),
      item('m1','Biyoloji','MARKED',2),
      item('old','Tarih','WRONG',9)
    ];
    expect(selectWeeklyWrongTest(rows,now,15).map(x=>x.questionId)).toEqual(['w1','w2']);
  });

  it('aylık karma tekrarda yanlış ve işaretli soruları dersler arasında dağıtır',()=>{
    const rows=[
      item('m1','Matematik','WRONG',1),
      item('m2','Matematik','WRONG',2),
      item('t1','Türkçe','MARKED',3),
      item('b1','Biyoloji','UPLOADED_WRONG',4)
    ];
    const selected=selectMonthlyMixedReview(rows,now,3);
    expect(selected.map(x=>x.subject)).toEqual(['Matematik','Türkçe','Biyoloji']);
  });

  it('30 günden eski soruyu aylık havuza almaz',()=>{
    const selected=selectMonthlyMixedReview([item('old','Matematik','WRONG',31)],now,10);
    expect(selected).toHaveLength(0);
  });
});
