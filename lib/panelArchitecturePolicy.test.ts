import fs from 'node:fs';
import path from 'node:path';
import {describe,expect,it} from 'vitest';

const ROOT=process.cwd();
const read=(file:string)=>fs.readFileSync(path.join(ROOT,file),'utf8');

function countTag(source:string,component:string){
  return (source.match(new RegExp('<'+component+'\\b','g'))||[]).length;
}

describe('panel information architecture guardrails',()=>{
  it('renders each major student capability once on the main student surface',()=>{
    const source=read('app/ogrenci/page.tsx');
    const modules=[
      'StudentTodayPlan',
      'StudentSmartNotifications',
      'StudentCommandCenter',
      'StudentDailyTasks',
      'StudentWrongQuestionBank',
      'AdaptiveRecommendation',
      'SmartCoachDashboard',
      'StudentEngagementHub',
      'StudyTechniqueLab',
      'StudentProgressTools',
      'StudentResourceTracker',
      'StudentActions',
      'StudentPreInterview',
      'AccountSecurity',
      'PanelNavigator'
    ];

    const duplicates=modules
      .map(component=>({component,count:countTag(source,component)}))
      .filter(x=>x.count>1);

    expect(duplicates,'A major student capability must have one canonical panel location.').toEqual([]);
    expect(source).toContain('Diğer bölümler ve ayrıntılı araçlar');
  });

  it('renders each major coach capability once on the main coach surface',()=>{
    const source=read('app/koc/page.tsx');
    const modules=[
      'CoachMorningBrief',
      'CoachCommandCenter',
      'CoachStudentTable',
      'CoachAccessCodeClaim',
      'AccountSecurity',
      'PanelNavigator'
    ];

    const duplicates=modules
      .map(component=>({component,count:countTag(source,component)}))
      .filter(x=>x.count>1);

    expect(duplicates,'A major coach capability must have one canonical panel location.').toEqual([]);
  });

  it('keeps the administrator entry surface consolidated',()=>{
    const source=read('app/yonetici/page.tsx');
    expect(countTag(source,'AdminConsole')).toBe(1);
  });
});
