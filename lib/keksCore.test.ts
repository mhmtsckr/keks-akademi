import fs from 'node:fs';
import path from 'node:path';
import {describe,expect,it} from 'vitest';
import {KEKS_CORE_SENTENCE,KEKS_CORE_STEPS} from '@/lib/keksCore';

const ROOT=process.cwd();
const read=(file:string)=>fs.readFileSync(path.join(ROOT,file),'utf8');

describe('KEKS çekirdek ürün döngüsü',()=>{
  it('tek cümlelik çekirdeği sabitler',()=>{
    expect(KEKS_CORE_SENTENCE).toContain('öğrenciyi ölçer');
    expect(KEKS_CORE_SENTENCE).toContain('koça bir sonraki somut aksiyonu önerir');
  });

  it('ürün mantığını yedi adıma sabitler',()=>{
    expect(KEKS_CORE_STEPS.map(x=>x.label)).toEqual([
      'Ölç','Planla','Uygulat','Kaydet','Tekrar Ettir','Yeniden Ölç','Koça Aksiyon Öner'
    ]);
  });

  it('ana sayfa ve sistem sayfası aynı çekirdeği kullanır',()=>{
    expect(read('app/page.tsx')).toContain('KEKS_CORE_SENTENCE');
    expect(read('app/page.tsx')).toContain('<KeksCoreLoop/>');
    expect(read('app/sistem/page.tsx')).toContain('KEKS_CORE_STEPS.map');
  });

  it('öğrenci ve koç panellerinde çekirdek döngü görünür',()=>{
    expect(read('app/ogrenci/page.tsx')).toContain('<KeksCoreLoop compact/>');
    expect(read('app/koc/page.tsx')).toContain('<KeksCoreLoop compact/>');
  });
});
