import fs from 'node:fs';
import path from 'node:path';
import {describe,expect,it} from 'vitest';
import {monthPeriod,monthlyExamNet} from '@/lib/monthlyDevelopmentReport';

const ROOT=process.cwd();
const read=(file:string)=>fs.readFileSync(path.join(ROOT,file),'utf8');

describe('Canlı aylık KEKS Gelişim Raporu',()=>{
  it('İstanbul ay sınırlarını ve önceki ayı üretir',()=>{
    const base=new Date('2026-09-30T15:00:00Z');
    expect(monthPeriod(base,0).key).toContain('2026');
    expect(monthPeriod(base,0).label.toLocaleLowerCase('tr-TR')).toContain('eylül');
    expect(monthPeriod(base,-1).label.toLocaleLowerCase('tr-TR')).toContain('ağustos');
  });

  it('farklı deneme payload biçimlerinden net değerini okur',()=>{
    expect(monthlyExamNet({net:62.5})).toBe(62.5);
    expect(monthlyExamNet({totalNet:71.25})).toBe(71.25);
    expect(monthlyExamNet({score:84})).toBe(84);
    expect(monthlyExamNet({foo:'bar'})).toBeNull();
  });

  it('istenen rapor başlıklarının tamamını canlı motor içinde hesaplar',()=>{
    const lib=read('lib/monthlyDevelopmentReport.ts');
    for(const token of ['academic:','behavior:','review:','strongAreas','interventionAreas','nextMonthGoals']){
      expect(lib).toContain(token);
    }
    expect(lib).toContain('nextGoals.slice(0,3)');
    expect(lib).toContain('previousLabel');
  });

  it('veli görünümünde ham deneme ortalamasını kapatır',()=>{
    const lib=read('lib/monthlyDevelopmentReport.ts');
    expect(lib).toContain("examAverage:audience==='PARENT'?null:currentExamAvg");
    const ui=read('app/components/MonthlyDevelopmentReport.tsx');
    expect(ui).toContain("audience!=='PARENT'");
  });

  it('PDF dışa aktarımı aynı canlı rapor bileşenini kullanır',()=>{
    const page=read('app/rapor/aylik/[studentId]/page.tsx');
    expect(page).toContain('<MonthlyDevelopmentReport');
    expect(page).toContain('printable');
    expect(page).toContain('<PrintButton/>');
    expect(page).toContain("user.role==='PARENT'");
    expect(page).toContain("user.role==='COACH'");
    expect(page).toContain("user.role==='STUDENT'");
  });

  it('öğrenci koç ve veli panellerinde canlı rapor görünür',()=>{
    expect(read('app/ogrenci/page.tsx')).toContain('audience="STUDENT"');
    expect(read('app/koc/ogrenci/[id]/page.tsx')).toContain('audience="COACH"');
    expect(read('app/veli/page.tsx')).toContain('audience="PARENT"');
    expect(read('app/ogrenci/page.tsx')).toContain('Aylık KEKS Gelişim Raporu');
  });
});
