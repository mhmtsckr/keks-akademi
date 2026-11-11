import {describe,expect,it} from 'vitest';
import {buildAcademicPerformanceCenter,type PerformancePractice,type ExamEvidence} from './academicPerformanceCenter';
const now=new Date('2026-11-11T12:00:00Z');
const entry=(day:string,examType:string,subject:string,topic:string|null,
  correct:number,wrong:number,blank=0,submissionId:string|null=null):PerformancePractice=>({
  date:day+'T10:00:00+03:00',examType,subject,topic,
  correct,wrong,blank,total:correct+wrong+blank,net:correct-wrong/4,
  errorReason:wrong?'BILGI_EKSIKLIGI':null,taskSubmissionId:submissionId
});
const base=[
 entry('2026-10-30','TYT','Türkçe','Ana düşünce',3,7),
 entry('2026-11-01','TYT','Türkçe','Ana düşünce',4,6),
 entry('2026-11-08','TYT','Türkçe','Ana düşünce',8,2,0),
 entry('2026-11-10','TYT','Türkçe','Ana düşünce',9,1,0,'receipt-1')
];
describe('Akademik Performans Merkezi / kanıta dayalı analitik',()=>{
  it('soru, boş, doğru ve trend farkını farklı gün eşiğiyle hesaplar',()=>{
    const rows=[...base.filter((_,i)=>i!==2),
      entry('2026-11-08','TYT','Türkçe','Ana düşünce',8,2)];
    const r=buildAcademicPerformanceCenter(rows,[],now);
    expect(r.overview).toMatchObject({questions:40,correct:24,wrong:16,days:4});
    expect(r.subjects[0].accuracyDelta).toBe(50);
    expect(r.subjects[0].signal).toBe('IMPROVING');
    expect(r.subjects[0].priority).toBe('REVIEW');
    expect(r.overview.reportedQuestions).toBe(10);
    expect(r.overview.otherPracticeQuestions).toBe(30);
  });
  it('yalnız tek günlük yüksek doğruluğu öğrenme veya iyileşme saymaz',()=>{
    const rows=[entry('2026-11-10','TYT','Türkçe','Paragraf',20,0)];
    const r=buildAcademicPerformanceCenter(rows,[],now);
    expect(r.subjects[0].signal).toBe('MEASURE_MORE');
    expect(r.subjects[0].priority).toBe('COLLECT_EVIDENCE');
    expect(r.subjects[0].accuracyDelta).toBeNull();
    expect(r.topics[0].signal).toBe('MEASURE_MORE');
    expect(r.topics[0].confidence).toBe('INSUFFICIENT');
  });
  it('TYT ve AYT aynı konuyu karıştırmaz, veri kaynağı belirtilir',()=>{
    const rows=[
      entry('2026-11-03','TYT','Matematik','Fonksiyonlar',3,7),
      entry('2026-11-06','TYT','Matematik','Fonksiyonlar',2,8),
      entry('2026-11-08','AYT','Matematik','Fonksiyonlar',10,0,0),
    ];
    rows[2].blank=0;
    const result=buildAcademicPerformanceCenter(rows,[],now);
    expect(result.subjects).toHaveLength(2);
    expect(result.topics).toHaveLength(2);
    expect(new Set(result.topics.map(x=>x.examType))).toEqual(new Set(['TYT','AYT']));
  });
  it('deneme analizi toplam pratik soru sayısına çift eklenmez',()=>{
    const exam:ExamEvidence[]=[{
      examType:'TYT',subject:'Türkçe',topic:'Ana düşünce',questionType:'Paragraf',
      examDate:'2026-11-10T09:00:00Z',correct:6,wrong:2,blank:2,avgSeconds:70
    }];
    const result=buildAcademicPerformanceCenter([
      entry('2026-11-10','TYT','Türkçe','Ana düşünce',8,2)
    ],exam,now);
    expect(result.overview.questions).toBe(10);
    expect(result.formalExamTopics[0].questions).toBe(10);
    expect(result.examEvidenceRecords).toBe(1);
  });
  it('yanlış nedeni raporunu TYT ve AYT için ayrı tutar',()=>{
    const rows=[
      entry('2026-11-08','TYT','Türkçe','Paragraf',3,7),
      entry('2026-11-09','AYT','Türkçe','Paragraf',4,6)
    ];
    const r=buildAcademicPerformanceCenter(rows,[],now);
    expect(r.errorReasons).toHaveLength(2);
    expect(r.errorReasons.map(x=>x.examType).sort()).toEqual(['AYT','TYT']);
  });
  it('geçersiz ve gelecekteki kayıtları dışlar ve sınırlılığı raporlar',()=>{
    const invalid={...entry('2026-11-10','TYT','Türkçe','Paragraf',3,2),total:10};
    const later=entry('2026-11-25','TYT','Türkçe','Paragraf',9,1);
    const result=buildAcademicPerformanceCenter([
      invalid,later,entry('2026-11-10','TYT','Türkçe','Paragraf',4,3,3)
    ],[],now);
    expect(result.overview.excludedPractice).toBe(2);
    expect(result.overview.questions).toBe(10);
    expect(result.limitations).toContain('bağımsız');
  });
  it('yanlış nedeni kayıtları sayar; bütün yanlış sorulara kesin neden atamaz',()=>{
    const rows=[entry('2026-11-08','TYT','Türkçe','Paragraf',2,8),
      entry('2026-11-09','TYT','Türkçe','Paragraf',7,3)];
    const result=buildAcademicPerformanceCenter(rows,[],now);
    expect(result.errorReasons[0]).toMatchObject({records:2,wrongQuestionsInRecords:11});
    expect(result.limitations).toContain('tek bir kayıt');
  });
});
