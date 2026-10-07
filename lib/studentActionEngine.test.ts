import fs from 'node:fs';
import path from 'node:path';
import {describe,expect,it} from 'vitest';
import {selectNextBestAction} from '@/lib/studentActionEngine';

const ROOT=process.cwd();
const read=(file:string)=>fs.readFileSync(path.join(ROOT,file),'utf8');

describe('Sonraki En Doğru Aksiyon motoru',()=>{
  it('tamamlanmamış ilk günlük aksiyonu tek sonraki iş olarak seçer',()=>{
    const next=selectNextBestAction([
      {id:'a',order:1,source:'ACTION',title:'30 paragraf',completed:true,estimatedMinutes:25,targetValue:30,metricType:'QUESTIONS',why:'Tamamlandı'},
      {id:'b',order:2,source:'REVIEW_BATCH',title:'2 gecikmiş tekrar',completed:false,estimatedMinutes:8,targetValue:2,metricType:'REVIEWS',why:'Unutma riski'},
      {id:'c',order:3,source:'PRACTICE',title:'20 soru Matematik',completed:false,estimatedMinutes:30,targetValue:20,metricType:'QUESTIONS',why:'Doğruluk geliştirme'}
    ]);

    expect(next).toMatchObject({
      id:'b',
      priority:'HIGH',
      badge:'GECİKMİŞ TEKRAR',
      ctaLabel:'Tekrarı Başlat',
      executionTarget:'#miza-orkestrator'
    });
  });

  it('koç görevini kritik öncelik olarak işaretler',()=>{
    const next=selectNextBestAction([
      {id:'coach',order:1,source:'ACTION',title:'Koç görevi',completed:false,estimatedMinutes:20,targetValue:10,metricType:'QUESTIONS',why:'Koç tarafından atandı'}
    ]);
    expect(next?.priority).toBe('CRITICAL');
    expect(next?.badge).toBe('KOÇ ÖNCELİĞİ');
  });

  it('bütün işler bittiyse yeni görev uydurmaz',()=>{
    expect(selectNextBestAction([
      {id:'done',order:1,source:'ACTION',title:'Bitti',completed:true}
    ])).toBeNull();
  });

  it('öğrenci ana ekranını tek aksiyon yüzeyiyle başlatır ve ayrıntıları kapalı tutar',()=>{
    const page=read('app/ogrenci/page.tsx');
    expect(page).toContain('<StudentActionHub/>');
    expect(page.indexOf('<StudentActionHub/>')).toBeLessThan(page.indexOf('<MizaLearningOrchestrator/>'));
    expect(page).toContain('Bugünün ayrıntıları ve diğer öğrenci araçları');
    expect(page).toContain("title:'Sonraki En Doğru Aksiyon'");
  });

  it('MİZA ilk kalan görevi doğrudan uygulama yüzeyinde gösterir',()=>{
    const miza=read('app/components/MizaLearningOrchestrator.tsx');
    expect(miza).toContain("const nextTask=useMemo(()=>orchestration?.tasks?.find(x=>!x.completed)||null");
    expect(miza).toContain('MİZA · ŞİMDİ UYGULA');
    expect(miza).toContain('<TaskControls task={nextTask}');
    expect(miza).toContain("task.id!==nextTask?.id");
  });

  it('İlk 7 Gün gerçek davranış verisini kapasite kalibrasyonuna bağlar',()=>{
    const engine=read('lib/studentActionEngine.ts');
    expect(engine).toContain("planSource:'ONBOARDING_V1'");
    expect(engine).toContain("status:finished?'CALIBRATED'");
    expect(engine).toContain('actualAverageMinutes');
    expect(engine).toContain('suggestedDailyMinutes');
  });
});
