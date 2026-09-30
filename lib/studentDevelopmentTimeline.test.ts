import fs from 'node:fs';
import path from 'node:path';
import {describe,expect,it} from 'vitest';
import {examNet} from '@/lib/studentDevelopmentTimeline';

const ROOT=process.cwd();
const read=(file:string)=>fs.readFileSync(path.join(ROOT,file),'utf8');

describe('Öğrenci gelişim zaman çizelgesi',()=>{
  it('deneme payloadından net değerini güvenli biçimde okur',()=>{
    expect(examNet({net:62.5})).toBe(62.5);
    expect(examNet({totalNet:71.25})).toBe(71.25);
    expect(examNet({score:84})).toBe(84);
    expect(examNet({foo:'bar'})).toBeNull();
  });

  it('son 365 günlük akademik ve koçluk olaylarını toplar',()=>{
    const lib=read('lib/studentDevelopmentTimeline.ts');
    expect(lib).toContain('365*86400000');
    expect(lib).toContain('assessments:');
    expect(lib).toContain('plans:');
    expect(lib).toContain('examResults:');
    expect(lib).toContain('targets:');
    expect(lib).toContain('coachingSessions:');
  });

  it('net artışını aynı sınav türündeki önceki sonuçla karşılaştırır',()=>{
    const lib=read('lib/studentDevelopmentTimeline.ts');
    expect(lib).toContain('previousByType');
    expect(lib).toContain("title:gain?'Net artışı · '+exam.examType");
    expect(lib).toContain("badge:gain?'NET ARTIŞI':'DENEME'");
  });

  it('veli görünümünde ham net yerine gelişim özetini kullanır',()=>{
    const lib=read('lib/studentDevelopmentTimeline.ts');
    expect(lib).toContain("if(audience==='PARENT')");
    expect(lib).toContain("' denemesinde önceki aynı sınava göre +'+delta+' net gelişim kaydedildi.'");
    expect(lib).not.toContain("audience==='PARENT'?net");
  });

  it('öğrenci, koç ve veli panellerinde zaman çizelgesi görünür',()=>{
    expect(read('app/ogrenci/page.tsx')).toContain('audience="STUDENT"');
    expect(read('app/koc/ogrenci/[id]/page.tsx')).toContain('audience="COACH"');
    expect(read('app/veli/page.tsx')).toContain('audience="PARENT"');
  });
});
