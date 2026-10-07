import {describe,expect,it} from 'vitest';
import {calculateStudentIndicators,comparableWeekWindows,type StudentIndicatorEvidence} from './studentIndicators';

function d(value:string){return new Date(value+'T12:00:00Z')}
function action(title:string,date:string,done:boolean){
  return {title,taskDate:d(date),status:done?'COMPLETED':'ACTIVE',submission:done?{submittedAt:d(date)}:null};
}
function practice(subject:string,topic:string,date:string,correct:number,total:number){
  return {subject,topic,correct,wrong:total-correct,blank:0,total,date:d(date)};
}

describe('Açıklanabilir öğrenci göstergeleri',()=>{
  it('bu haftayı geçen haftanın aynı gün sayısıyla karşılaştırır',()=>{
    const w=comparableWeekWindows(new Date('2026-10-07T12:00:00Z'));
    expect(w.current.start.toISOString().slice(0,10)).toBe('2026-10-05');
    expect(w.current.end.toISOString().slice(0,10)).toBe('2026-10-08');
    expect(w.previous.start.toISOString().slice(0,10)).toBe('2026-09-28');
    expect(w.previous.end.toISOString().slice(0,10)).toBe('2026-10-01');
    expect(w.current.days).toBe(3);
  });

  it('tek skor yerine beş ayrı gösterge ve nedenlerini üretir',()=>{
    const currentActions=Array.from({length:20},(_,i)=>action('Bu hafta '+i,'2026-10-0'+(5+i%3),i<17));
    const previousActions=Array.from({length:19},(_,i)=>action('Geçen hafta '+i,'2026-09-'+(28+i%3),i<14));
    const evidence:StudentIndicatorEvidence={
      actions:[...currentActions,...previousActions],
      practice:[
        practice('Matematik','Oran-Orantı','2026-10-05',7,10),
        practice('Türkçe','Paragraf','2026-10-06',3,10),
        practice('Matematik','Problemler','2026-09-28',6,10),
        practice('Türkçe','Paragraf','2026-09-29',8,10)
      ],
      reviews:[
        {dueAt:d('2026-10-05'),status:'COMPLETED',completedAt:d('2026-10-05'),lastCorrect:true,question:{subject:'Matematik',topic:'Oran-Orantı'}},
        {dueAt:d('2026-10-06'),status:'COMPLETED',completedAt:d('2026-10-06'),lastCorrect:false,question:{subject:'Türkçe',topic:'Paragraf'}},
        {dueAt:d('2026-10-07'),status:'DUE',completedAt:null,lastCorrect:null,question:{subject:'Fen',topic:'Madde'}},
        {dueAt:d('2026-09-28'),status:'COMPLETED',completedAt:d('2026-09-28'),lastCorrect:true,question:{subject:'Matematik',topic:'Problemler'}},
        {dueAt:d('2026-09-29'),status:'COMPLETED',completedAt:d('2026-09-29'),lastCorrect:true,question:{subject:'Türkçe',topic:'Paragraf'}}
      ],
      techniques:[
        {createdAt:d('2026-10-07'),activeSeconds:1500},
        {createdAt:d('2026-09-30'),activeSeconds:1200}
      ]
    };
    const result=calculateStudentIndicators(evidence,new Date('2026-10-07T12:00:00Z'));
    expect(result.indicators.map(x=>x.label)).toEqual([
      'Çalışma Sürekliliği','Tekrar Disiplini','Bilgi Hâkimiyeti','Soru Doğruluğu','Plan Uyumu'
    ]);
    const plan=result.indicators.find(x=>x.key==='PLAN_ALIGNMENT');
    expect(plan?.value).toBe(85);
    expect(plan?.previous).toBe(74);
    expect(plan?.delta).toBe(11);
    expect(plan?.reasons[0]).toContain('+11 puan');
    const accuracy=result.indicators.find(x=>x.key==='QUESTION_ACCURACY');
    expect(accuracy?.value).toBe(50);
    expect(accuracy?.previous).toBe(70);
    expect(accuracy?.formula).toContain('Doğru soru');
    const mastery=result.indicators.find(x=>x.key==='KNOWLEDGE_MASTERY');
    expect(mastery?.value).toBe(50);
    expect(mastery?.evidence).toContain('1/2 ölçülen konuda');
  });

  it('veri olmayan alanı sıfır başarı gibi göstermez',()=>{
    const result=calculateStudentIndicators({actions:[],practice:[],reviews:[],techniques:[]},new Date('2026-10-07T12:00:00Z'));
    for(const item of result.indicators){
      expect(item.value).toBeNull();
      expect(item.trend).toBe('NO_COMPARISON');
    }
  });
});
