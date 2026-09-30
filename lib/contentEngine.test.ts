import fs from 'node:fs';
import path from 'node:path';
import {describe,expect,it} from 'vitest';
import {evaluateContentQuality,learnerBand} from '@/lib/contentEngine';

const ROOT=process.cwd();
const read=(file:string)=>fs.readFileSync(path.join(ROOT,file),'utf8');

describe('KEKS Content Engine kalite kapısı',()=>{
  it('öğrenci düzeyine göre içerik yoğunluğunu ayarlar',()=>{
    expect(learnerBand('3. sınıf').itemCount).toBe(6);
    expect(learnerBand('7. sınıf').itemCount).toBe(8);
    expect(learnerBand('11. sınıf').itemCount).toBe(12);
    expect(learnerBand('YKS Mezun').key).toBe('ADVANCED');
  });

  it('yapısal olarak eksik içeriği yayın kalitesinde saymaz',()=>{
    const q=evaluateContentQuality('MINI_TEST',{items:[{prompt:'Soru var ama seçenek yok.'}]},'Kaynak metinde temel kavram ve açıklamalar yer almaktadır.','7. sınıf');
    expect(q.passed).toBe(false);
    expect(q.issues.length).toBeGreaterThan(0);
  });

  it('üretim API si yalnız onaylı kaynağı kabul eder ve doğrudan yayınlamaz',()=>{
    const route=read('app/api/content-studio/generate/route.ts');
    expect(route).toContain("upload.status!=='APPROVED'");
    expect(route).toContain("status:result.qualityPassed?'QUALITY_REVIEW':'QUALITY_FAILED'");
    expect(route).toContain('visibleToStudent:false');
    expect(route).toContain('visibleToParent:false');
    expect(route).not.toContain("status:visible?'PUBLISHED':'DRAFT'");
  });

  it('yayın API si kaynak ve kalite eşiğini zorunlu kılar',()=>{
    const route=read('app/api/content-studio/items/[id]/publish/route.ts');
    expect(route).toContain("item.upload.status!=='APPROVED'");
    expect(route).toContain('MIN_QUALITY=75');
    expect(route).toContain("item.status==='QUALITY_FAILED'");
    expect(route).toContain('approvedByUserId');
  });

  it('yeni kaynaklar onay bekleyen durumda başlar',()=>{
    const route=read('app/api/content-studio/upload/route.ts');
    expect(route).toContain("'PENDING_APPROVAL'");
    expect(route).not.toContain("extractedText?'READY'");
  });

  it('istenen öğrenme formatlarının tamamı içerik motorunda bulunur',()=>{
    const engine=read('lib/contentEngine.ts');
    for(const type of ['MINI_TEST','FLASHCARDS','MATCHING','FILL_BLANK','ACTIVE_RECALL','MICRO_GAME']){
      expect(engine).toContain("'"+type+"'");
    }
  });
});
