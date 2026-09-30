import fs from 'node:fs';
import path from 'node:path';
import {describe,expect,it} from 'vitest';
import {median,qualityStatus} from '@/lib/coachQualityOperations';

const ROOT=process.cwd();
const read=(file:string)=>fs.readFileSync(path.join(ROOT,file),'utf8');

describe('Koç operasyon kalite sistemi',()=>{
  it('medyan tepki süresini hesaplar',()=>{
    expect(median([1,4,3])).toBe(3);
    expect(median([2,4])).toBe(3);
    expect(median([])).toBeNull();
  });

  it('tek bir puan yerine açıklanabilir durum üretir',()=>{
    expect(qualityStatus(90,80,60)).toBe('GOOD');
    expect(qualityStatus(70,80,60)).toBe('WATCH');
    expect(qualityStatus(40,80,60)).toBe('ACTION');
    expect(qualityStatus(null,80,60)).toBe('NO_DATA');
  });

  it('beş operasyon metriğini içerir',()=>{
    const lib=read('lib/coachQualityOperations.ts');
    for(const token of ['RESPONSE_SLA','SESSION_ACTION','INTERVENTION_LATENCY','REVIEW_FOLLOWUP','REPORT_COVERAGE']){
      expect(lib).toContain(token);
    }
    expect(lib).toContain('24*3600000');
    expect(lib).toContain('48');
    expect(lib).toContain('72*3600000');
  });

  it('hacim metriklerini kalite skoru olarak kullanmaz',()=>{
    const lib=read('lib/coachQualityOperations.ts');
    expect(lib).not.toContain('qualityScore');
    expect(lib).not.toContain('studentCount/');
    expect(lib).toContain('Bu ekran tek bir koç puanı üretmez');
  });

  it('koç panelinde kalite sistemi görünür',()=>{
    const page=read('app/koc/page.tsx');
    expect(page).toContain("href:'#koc-kalite'");
    expect(page).toContain('<CoachQualityOperations coachId={user.coachProfile.id}/>');
  });
});
