import {describe,expect,it} from 'vitest';
import {buildAcademicEvidenceConsistency,type PracticeEvidenceRow,type ExamEvidenceRow}
  from './academicEvidenceConsistency';

const now=new Date('2026-11-11T12:00:00Z');
const practice=(day:string,correct:number,wrong:number,blank=0,
  examType='TYT',subject='Türkçe',topic='Ana düşünce',reported=false):PracticeEvidenceRow=>({
  examType,subject,topic,date:day+'T09:00:00+03:00',
  total:correct+wrong+blank,correct,wrong,blank,
  taskSubmissionId:reported?'receipt-'+day:null
});
const exam=(day:string,correct:number,wrong:number,blank=0,
  examType='TYT',subject='Türkçe',topic='Ana düşünce'):ExamEvidenceRow=>({
  examType,subject,topic,examDate:day+'T11:00:00+03:00',correct,wrong,blank
});

describe('Akademik Performans Merkezi / haftalık ritim ve iki kaynak karşılaştırması',()=>{
  it('beş ardışık 7 günlük dilimi sıfır veri haftalarıyla birlikte gösterir',()=>{
    const r=buildAcademicEvidenceConsistency([
      practice('2026-10-09',6,4),
      practice('2026-10-15',8,2),
      practice('2026-11-10',7,3)
    ],[],now);
    const weeks=r.weekly[0].weeks;
    expect(weeks).toHaveLength(5);
    expect(weeks[0]).toMatchObject({
      start:'2026-10-08',end:'2026-10-14',questions:10,studyDays:1,
      evidence:'INSUFFICIENT'
    });
    expect(weeks[1].questions).toBe(10);
    expect(weeks[2].questions).toBe(0);
    expect(weeks[3].accuracy).toBeNull();
    expect(weeks[4].questions).toBe(10);
    expect(weeks.reduce((x,y)=>x+y.questions,0)).toBe(30);
  });
  it('aynı haftada 2 ayrı günde 12 sorudan azını güçlü kanıt saymaz',()=>{
    const r=buildAcademicEvidenceConsistency([
      practice('2026-11-09',5,0),practice('2026-11-10',5,0)
    ],[],now);
    const w=r.weekly[0].weeks[4];
    expect(w.studyDays).toBe(2);
    expect(w.accuracy).toBe(100);
    expect(w.evidence).toBe('INSUFFICIENT');
  });
  it('pratik yüksek ama deneme düşükse karşılaştırma çelişkisini açıklar',()=>{
    const rows=[
      practice('2026-11-08',12,0,0,'TYT','Türkçe','Ana düşünce',true),
      practice('2026-11-10',12,0)
    ];
    const exams=[
      exam('2026-11-08',1,5),
      exam('2026-11-10',2,4)
    ];
    const r=buildAcademicEvidenceConsistency(rows,exams,now);
    expect(r.topics[0]).toMatchObject({
      examType:'TYT',subject:'Türkçe',status:'CONFLICTING',
      practiceQuestions:24,practiceDays:2,practiceReportedQuestions:12,
      examQuestions:12,examDays:2,practiceAccuracy:100,
      examAccuracy:25,accuracyGapPoints:75
    });
    expect(r.sourceQuality).toMatchObject({comparableTopics:1,contradictoryTopics:1});
    expect(r.weekly[0].weeks[4].questions).toBe(24);
    expect(r.limitations).toContain('ikinci kez');
  });
  it('bir kaynak eksikken veya sadece 1 deneme günü varken güçlü sonuç üretmez',()=>{
    const r=buildAcademicEvidenceConsistency([
      practice('2026-11-08',10,0),
      practice('2026-11-10',10,0)
    ],[exam('2026-11-10',0,25)],now);
    expect(r.topics[0].status).toBe('INSUFFICIENT');
    expect(r.topics[0].accuracyGapPoints).toBeNull();
    expect(r.topics[0].examDays).toBe(1);
  });
  it('TYT AYT ve farklı konu sonuçlarını birleştirmez',()=>{
    const r=buildAcademicEvidenceConsistency([
      practice('2026-11-08',9,1),
      practice('2026-11-10',9,1),
      practice('2026-11-08',1,9,0,'AYT','Türkçe','Ana düşünce'),
      practice('2026-11-10',2,8,0,'AYT','Türkçe','Ana düşünce')
    ],[
      exam('2026-11-08',5,0),
      exam('2026-11-10',5,0)
    ],now);
    expect(r.weekly).toHaveLength(2);
    expect(r.topics).toHaveLength(2);
    expect(r.topics.find(x=>x.examType==='TYT')?.status).toBe('BOTH_HIGH');
    expect(r.topics.find(x=>x.examType==='AYT')?.status).toBe('INSUFFICIENT');
  });
  it('hatalı, gelecek tarihli ve 35 gün dışındaki kayıtları saymaz',()=>{
    const bad={...practice('2026-11-10',4,1),total:9};
    const r=buildAcademicEvidenceConsistency([
      bad,practice('2026-11-25',5,0),practice('2026-10-01',5,0),
      practice('2026-11-10',3,2)
    ],[
      {...exam('2026-11-10',1,1),wrong:-2},
      exam('2026-11-25',1,1),
      exam('2026-11-10',1,1)
    ],now);
    expect(r.sourceQuality).toMatchObject({excludedPractice:3,excludedExams:2});
    expect(r.weekly[0].weeks[4].questions).toBe(5);
    expect(r.topics[0].examQuestions).toBe(2);
  });
  it('günün sınırını İstanbul saatine göre ayırır',()=>{
    const row=practice('2026-11-10',4,6);
    row.date='2026-11-10T22:50:00Z'; // Istanbul: 2026-11-11
    const r=buildAcademicEvidenceConsistency([row],[],now);
    expect(r.weekly[0].weeks[4].questions).toBe(10);
    expect(r.weekly[0].weeks[4].end).toBe('2026-11-11');
  });
});
