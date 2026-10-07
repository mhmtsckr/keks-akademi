import {describe,expect,it} from 'vitest';
import {aggregateAcquisitionEvidence,aggregateExamMapEvidence,getExamMapTopic,resolveExamMapLeaf} from './examMap';
import {EDUCATION_LEVELS} from './educationLevels';

describe('ÖSYM/MEB eğitim düzeyi sınav haritası',()=>{
  it('TYT Problemler için Yüzde-Kâr-Zarar alt konusunu çözer',()=>{
    const leaf=resolveExamMapLeaf({
      examType:'TYT',subject:'Matematik',topic:'Problemler',
      problemType:'yüzde problemi',questionType:'Kâr-zarar'
    });
    expect(leaf.subTopic).toBe('Yüzde-Kâr-Zarar');
    expect(leaf.questionType).toBe('Kâr-zarar');
  });

  it('detaylandırılmamış sınav konuları için güvenli genel düğüm üretir',()=>{
    const map=getExamMapTopic('TYT','Matematik','Kümeler');
    expect(map.subTopics[0].name).toBe('Kümeler');
  });

  it('7. sınıf oran-orantı ölçümünü resmi düzey haritasına bağlar',()=>{
    const leaf=resolveExamMapLeaf({
      examType:'ORTAOKUL_7',
      gradeLevel:EDUCATION_LEVELS.MIDDLE_7,
      subject:'Matematik',
      topic:'Oran ve Orantı',
      subTopic:'Doğru Orantılı Problem Çözme',
      acquisition:'MAT.7.1.7',
      questionType:'Problem kurma'
    });
    expect(leaf.educationLevelKey).toBe('MIDDLE_7');
    expect(leaf.unit).toBe('1. Tema: Sayılar ve Nicelikler (2)');
    expect(leaf.acquisitionId).toBe('MAT.7.1.7');
    expect(leaf.questionType).toBe('Problem kurma');
  });

  it('7 ve 8. sınıf matematik düğümlerini birbirine karıştırmaz',()=>{
    const seven=resolveExamMapLeaf({
      examType:'ORTAOKUL_7',gradeLevel:EDUCATION_LEVELS.MIDDLE_7,
      subject:'Matematik',topic:'Oran ve Orantı',subTopic:'Oran',acquisition:'MAT.7.1.5'
    });
    const eight=resolveExamMapLeaf({
      examType:'ORTAOKUL_8',gradeLevel:EDUCATION_LEVELS.MIDDLE_8,
      subject:'Matematik',topic:'Gerçek Sayılar',subTopic:'Kareköklü İfadeler',acquisition:'MAT.8.1.2'
    });
    expect(seven.educationLevelKey).toBe('MIDDLE_7');
    expect(eight.educationLevelKey).toBe('MIDDLE_8');
    expect(seven.acquisitionId).not.toBe(eight.acquisitionId);
  });

  it('aynı yaprakta bütün performans verisini birleştirir',()=>{
    const leaf=resolveExamMapLeaf({
      examType:'TYT',subject:'Matematik',topic:'Problemler',
      subTopic:'Yüzde-Kâr-Zarar',questionType:'Kâr-zarar'
    });
    const rows=aggregateExamMapEvidence([
      {leaf,correct:2,wrong:3,blank:0,durationSeconds:120,errorReason:'ISLEM_HATASI',source:'PRACTICE',measuredAt:new Date('2026-10-01')},
      {leaf,correct:1,wrong:3,blank:1,durationSeconds:130,errorReason:null,source:'EXAM',measuredAt:new Date('2026-10-02')}
    ]);
    expect(rows[0].total).toBe(10);
    expect(rows[0].accuracy).toBe(30);
    expect(rows[0].status).toBe('ZAYIF');
    expect(rows[0].primaryError).toBe('ISLEM_HATASI');
    expect(rows[0].sources).toContain('EXAM');
  });

  it('kazanım için son üç ölçümün ağırlıklı başarısını hesaplar',()=>{
    const leaf=resolveExamMapLeaf({
      examType:'ORTAOKUL_7',
      gradeLevel:EDUCATION_LEVELS.MIDDLE_7,
      subject:'Matematik',
      topic:'Oran ve Orantı',
      subTopic:'Doğru Orantılı Problem Çözme',
      acquisition:'MAT.7.1.7',
      questionType:'Problem kurma'
    });
    const rows=aggregateAcquisitionEvidence([
      {leaf,correct:6,wrong:4,blank:0,durationSeconds:null,errorReason:null,source:'PRACTICE',measuredAt:new Date('2026-09-20')},
      {leaf,correct:5,wrong:5,blank:0,durationSeconds:null,errorReason:null,source:'PRACTICE',measuredAt:new Date('2026-10-01')},
      {leaf,correct:5,wrong:4,blank:1,durationSeconds:null,errorReason:null,source:'PRACTICE',measuredAt:new Date('2026-10-03')},
      {leaf,correct:6,wrong:4,blank:0,durationSeconds:null,errorReason:null,source:'PRACTICE',measuredAt:new Date('2026-10-05')}
    ]);
    expect(rows[0].measurementCount).toBe(4);
    expect(rows[0].last3MeasurementCount).toBe(3);
    expect(rows[0].last3Accuracy).toBe(53);
    expect(rows[0].status).toBe('ZAYIF');
  });
});
