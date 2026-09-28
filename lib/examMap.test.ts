import {describe,expect,it} from 'vitest';
import {aggregateExamMapEvidence,getExamMapTopic,resolveExamMapLeaf} from './examMap';

describe('ÖSYM/MEB sınav haritası',()=>{
  it('TYT Problemler için Yüzde-Kâr-Zarar alt konusunu çözer',()=>{
    const leaf=resolveExamMapLeaf({
      examType:'TYT',subject:'Matematik',topic:'Problemler',
      problemType:'yüzde problemi',questionType:'Kâr-zarar'
    });
    expect(leaf.subTopic).toBe('Yüzde-Kâr-Zarar');
    expect(leaf.questionType).toBe('Kâr-zarar');
  });

  it('detaylandırılmamış konular için güvenli genel düğüm üretir',()=>{
    const map=getExamMapTopic('TYT','Matematik','Kümeler');
    expect(map.subTopics[0].name).toBe('Kümeler');
  });

  it('aynı yaprakta bütün performans verisini birleştirir',()=>{
    const leaf=resolveExamMapLeaf({
      examType:'TYT',subject:'Matematik',topic:'Problemler',
      subTopic:'Yüzde-Kâr-Zarar',questionType:'Kâr-zarar'
    });
    const rows=aggregateExamMapEvidence([
      {leaf,correct:2,wrong:3,blank:0,durationSeconds:120,errorReason:'ISLEM_HATASI',source:'PRACTICE'},
      {leaf,correct:1,wrong:3,blank:1,durationSeconds:130,errorReason:null,source:'EXAM'}
    ]);
    expect(rows[0].total).toBe(10);
    expect(rows[0].accuracy).toBe(30);
    expect(rows[0].status).toBe('ZAYIF');
    expect(rows[0].primaryError).toBe('ISLEM_HATASI');
    expect(rows[0].sources).toContain('EXAM');
  });
});
