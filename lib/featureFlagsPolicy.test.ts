import fs from 'node:fs';
import path from 'node:path';
import {describe,expect,it} from 'vitest';
import {FEATURE_KEYS,featureEnabledForStudent} from '@/lib/systemConfig';

const ROOT=process.cwd();
const read=(file:string)=>fs.readFileSync(path.join(ROOT,file),'utf8');

describe('feature flag rollout controls',()=>{
  it('supports ALL, OFF and targeted PILOT evaluation',()=>{
    expect(featureEnabledForStudent({mode:'ALL',studentCodes:[]},'211')).toBe(true);
    expect(featureEnabledForStudent({mode:'OFF',studentCodes:['211']},'211')).toBe(false);
    expect(featureEnabledForStudent({mode:'PILOT',studentCodes:['211','445212']},'211')).toBe(true);
    expect(featureEnabledForStudent({mode:'PILOT',studentCodes:['211','445212']},'999')).toBe(false);
    expect(featureEnabledForStudent({mode:'PILOT',studentCodes:['211']},null)).toBe(false);
  });

  it('keeps rollout keys in one central registry',()=>{
    expect(FEATURE_KEYS).toEqual([
      'SMART_COACH',
      'ADAPTIVE_RECOMMENDATION',
      'TODAY_PLAN',
      'SMART_NOTIFICATIONS',
      'GAMIFICATION'
    ]);
    expect(read('app/api/admin/feature-flags/route.ts')).toContain('z.enum(FEATURE_KEYS)');
  });

  it('provides an emergency kill switch in the admin console',()=>{
    const ui=read('app/components/AdminFeatureFlags.tsx');
    expect(ui).toContain('Acil Kapat');
    expect(ui).toContain("save(flag,'OFF')");
  });

  it('gates new student modules in both UI and API',()=>{
    const studentPage=read('app/ogrenci/page.tsx');
    const todayApi=read('app/api/student/today/route.ts');
    const notificationsApi=read('app/api/student/notifications/route.ts');

    expect(studentPage).toContain('featureFlags.TODAY_PLAN');
    expect(studentPage).toContain('featureFlags.SMART_NOTIFICATIONS');
    expect(todayApi).toContain("isFeatureEnabled('TODAY_PLAN'");
    expect(notificationsApi).toContain("isFeatureEnabled('SMART_NOTIFICATIONS'");
  });
});
