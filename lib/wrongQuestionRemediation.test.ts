import {describe,it,expect} from 'vitest';
import {buildWrongQuestionSupport,isRemediationReason,selectRemediationQuestions} from './wrongQuestionRemediation';

const source={id:'wrong-1',examType:'TYT',subject:'Matematik',topic:'Problemler'};
function candidate(id:string,patch:Record<string,unknown>={}){
  return {id,examType:'TYT',subject:'Matematik',topic:'Problemler',prompt:'Soru',active:true,reviewStatus:'APPROVED',sourceKind:'ORIGINAL',...patch};
}

describe('yanlıştan öğrenme motoru',()=>{
  it('yalnız aynı ders, sınav ve konudaki onaylı farklı soruları seçer',()=>{
    const pool=[
      candidate('wrong-1'),candidate('ok'),candidate('second'),
      candidate('other-topic',{topic:'Üslü Sayılar'}),
      candidate('other-exam',{examType:'AYT'}),
      candidate('inactive',{active:false}),
      candidate('review',{reviewStatus:'PENDING'}),
      candidate('private',{sourceKind:'STUDENT_WRONG:someone'})
    ];
    expect(selectRemediationQuestions(source,pool).map(x=>x.id)).toEqual(['ok','second']);
  });
  it('emin olmayan otomatik sınıflandırmayı kesin kazanım gibi sunmaz',()=>{
    const help=buildWrongQuestionSupport({subject:'Matematik',topic:'Problemler',classificationConfidence:0.25});
    expect(help.topicConfirmationNeeded).toBe(true);
    expect(help.acquisition).toBeNull();
    expect(help.hasVerifiedExplanation).toBe(false);
  });
  it('öğrenci tarafından seçilen hataya uygun açıklama önerir',()=>{
    const help=buildWrongQuestionSupport({subject:'Matematik',topic:'Problemler',errorReason:'ISLEM_HATASI',explanation:'İşlemi kontrol et.'});
    expect(help.instruction).toContain('adım adım');
    expect(help.explanation).toBe('İşlemi kontrol et.');
    expect(isRemediationReason('DIKKAT')).toBe(true);
    expect(isRemediationReason('RANDOM')).toBe(false);
  });
});
