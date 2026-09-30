import fs from 'node:fs';
import path from 'node:path';
import {describe,expect,it} from 'vitest';

const ROOT=process.cwd();
const read=(file:string)=>fs.readFileSync(path.join(ROOT,file),'utf8');

describe('KEKS PWA ve mobil öğrenci deneyimi',()=>{
  it('PWA doğrudan hafif Bugün ekranından açılır',()=>{
    const manifest=read('app/manifest.ts');
    expect(manifest).toContain("start_url:'/ogrenci/bugun?source=pwa'");
    expect(manifest).toContain("display:'standalone'");
    expect(manifest).toContain("url:'/ogrenci/bugun#gunluk-gorevler'");
    expect(manifest).toContain("url:'/ogrenci/bugun#yanlis-ekle'");
  });

  it('service worker özel öğrenci/API verisini cachelemez',()=>{
    const sw=read('public/sw.js');
    expect(sw).toContain("url.pathname.startsWith('/api/')");
    expect(sw).toContain("request.mode==='navigate'");
    expect(sw).toContain("caches.match('/offline.html')");
    expect(sw).not.toContain("STATIC_PATHS=['/ogrenci");
  });

  it('mobil hızlı işlem çubuğu görev, yanlış ve denemeyi erişilebilir kılar',()=>{
    const ui=read('app/components/StudentMobileQuickActions.tsx');
    expect(ui).toContain("'ilk-bekleyen-gorev','gunluk-gorevler'");
    expect(ui).toContain("go('yanlis-ekle')");
    expect(ui).toContain("setShowExam(true)");
    expect(ui).toContain('/api/student/quick-exam');
  });

  it('hızlı deneme girişi öğrenciye ait ExamResult üretir',()=>{
    const route=read('app/api/student/quick-exam/route.ts');
    expect(route).toContain("requireRole(['STUDENT'])");
    expect(route).toContain('db.examResult.create');
    expect(route).toContain("entryMode:'MOBILE_QUICK'");
  });

  it('mobil Bugün sayfası ağır öğrenci dashboard sorgularını çalıştırmaz',()=>{
    const page=read('app/ogrenci/bugun/page.tsx');
    expect(page).toContain('<StudentTodayPlan/>');
    expect(page).toContain('<StudentDailyTasks/>');
    expect(page).not.toContain('db.student.findUnique');
    expect(page).not.toContain('buildGoalDistance');
    expect(page).not.toContain('buildStudentExamMap');
  });
});
