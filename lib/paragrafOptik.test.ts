import {describe,it,expect} from 'vitest';
import {parseOpticalTest,detailedQuestions,gradeOptical,readOpticalMarks} from './paragrafOptik';
import {opticalResultQrSvg} from './paragrafOptikQr';
describe('KEKS 50-test print optical grading',()=>{
 it('validates only 01–50 test ids and exactly 30 choices',()=>{
  for(let i=1;i<=50;i++)expect(parseOpticalTest(String(i).padStart(2,'0'))).toBe(i);
  for(const t of ['0','1','00','51','99','-1','01x'])expect(parseOpticalTest(t)).toBeNull();
  expect(readOpticalMarks('A'.repeat(30))).toHaveLength(30);
  for(const code of ['A'.repeat(29),'A'.repeat(31),'Z'.repeat(30),'A'.repeat(20)+'B'.repeat(9)+'0'])
   expect(readOpticalMarks(code)).toBeNull();
 });
 it('grades every answer key from the actual print edition without changing it',()=>{
  let seen=0;
  for(let test=1;test<=50;test++){
   const key=detailedQuestions(test)!;
   expect(key).toHaveLength(30);
   const answers=key.map(q=>q.answer).join('');
   const score=gradeOptical(test,answers)!;
   expect(score.correct).toBe(30);
   expect(score.wrong).toBe(0);
   expect(score.blank).toBe(0);
   expect(score.net).toBe(30);
   expect(score.details.every((v,i)=>v.chosen===key[i].answer)).toBe(true);
   expect(score.recommendations).toHaveLength(0);
   seen+=key.length;
  }
  expect(seen).toBe(1500);
 });
 it('grades wrong and unanswered choices and recommends the exact missed topic',()=>{
  const key=detailedQuestions(1)!;
  const original=key.map(q=>q.answer).join('');
  const alternative=key[0].answer==='A'?'B':'A';
  const marked=alternative+'X'+original.slice(2);
  const r=gradeOptical(1,marked)!;
  expect(r).toMatchObject({correct:28,wrong:1,blank:1,net:27.75});
  expect(r.details[0].status).toBe('YANLIŞ');
  expect(r.details[1].status).toBe('BOŞ');
  expect(r.recommendations.map(x=>x.topic)).toContain(key[0].topic);
 });
 it('builds a scannable and private, third-party-free SVG QR from a valid result URL',()=>{
  const u='https://keksakademi.vercel.app/paragraf/optik/01/sonuc?c='+'A'.repeat(30);
  const svg=opticalResultQrSvg(u);
  expect(svg).toContain('<svg');
  expect(svg).toContain('viewBox="0 0 45 45"');
  expect(svg).toContain('M4,4');
  expect(svg!.length).toBeGreaterThan(1500);
  expect(opticalResultQrSvg(u.replace('keksakademi.vercel.app','elsewhere.example'))).toBeNull();
  expect(opticalResultQrSvg(u+'x')).toBeNull();
 });
});
