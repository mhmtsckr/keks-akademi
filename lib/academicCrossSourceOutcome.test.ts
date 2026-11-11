import {describe,it,expect} from 'vitest';
import {evaluateAcademicCrossSourceOutcome} from './academicCrossSourceOutcome';
const opened='2026-11-02T09:00:00Z',now=new Date('2026-11-11T13:00:00Z');
const task={id:'follow-1',examType:'TYT',subject:'Türkçe',topic:'Ana düşünce',
  createdAt:opened,status:'OPEN'};
const row=(day:string,examType:string,correct:number,wrong:number)=>({
  examType,subject:'Türkçe',topic:'Ana düşünce',date:day+'T12:00:00Z',
  correct,wrong,blank:0
});
const practices=[
  row('2026-10-29','TYT',9,1),row('2026-10-30','TYT',9,1),
  row('2026-11-04','TYT',8,2),row('2026-11-06','TYT',8,2),
];
const exams=[
  row('2026-10-29','TYT',1,5),row('2026-10-30','TYT',1,5),
  row('2026-11-04','TYT',3,3),row('2026-11-06','TYT',3,3),
];
describe('Akademik yeniden ölçüm: koç inceleme talebinden önce ve sonra',()=>{
 it('iki kaynak arasında değişen farkı hesaplar fakat nedensel etki ilan etmez',()=>{
  const r=evaluateAcademicCrossSourceOutcome(task,practices,exams,now);
  expect(r.state).toBe('GAP_NARROWED');
  expect(r.baseline).toMatchObject({gapPoints:73,practice:{questions:20,days:2},exam:{questions:12,days:2}});
  expect(r.followUp).toMatchObject({gapPoints:30,practice:{questions:20,days:2},exam:{questions:12,days:2}});
  expect(r.absoluteGapChange).toBe(-43);
  expect(r.note).toContain('nedensel değildir');
 });
 it('fark artarsa bunu olumsuz ölçüm sinyali olarak gösterir',()=>{
  const r=evaluateAcademicCrossSourceOutcome(task,
    practices,[row('2026-10-29','TYT',5,1),row('2026-10-30','TYT',5,1),
      row('2026-11-04','TYT',0,6),row('2026-11-06','TYT',0,6)],now);
  expect(r.state).toBe('GAP_WIDENED');
 });
 it('tek deneme gününü yeterli kanıt saymaz',()=>{
  const r=evaluateAcademicCrossSourceOutcome(task,practices,
    [...exams.slice(0,2),row('2026-11-04','TYT',6,6)],now);
  expect(r.state).toBe('INSUFFICIENT_DATA');
  expect(r.followUp.gapPoints).toBeNull();
 });
 it('TYT/AYT ve başka konuyu karıştırmaz',()=>{
  const r=evaluateAcademicCrossSourceOutcome(task,
    practices.map((p,i)=>i===0?{...p,examType:'AYT'}:p),
    exams,now);
  expect(r.state).toBe('INSUFFICIENT_DATA');
 });
 it('ilk 48 saat için değerlendirme bekleniyor durumu verir',()=>{
  const r=evaluateAcademicCrossSourceOutcome(task,[],[],new Date('2026-11-03T12:00:00Z'));
  expect(r.state).toBe('WAITING_FOR_DATA');
 });
 it('bozuk ve gelecekteki soruları dışlar',()=>{
  const r=evaluateAcademicCrossSourceOutcome(task,
    [...practices,{...row('2026-11-07','TYT',10,0),correct:-1},
     row('2026-11-16','TYT',10,0)],exams,now);
  expect(r.followUp.practice.questions).toBe(20);
 });
});
