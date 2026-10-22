import {getParagrafDetailedSolution,paragrafDetailedSolutionUrl} from '@/lib/paragrafDetailedSolutions';
export type Mark='A'|'B'|'C'|'D'|'E'|'X';
export const OPTICAL_EXAM_COUNT=50;
export const OPTICAL_QUESTIONS=30;
export function parseOpticalTest(value:string){
 if(!/^(?:0[1-9]|[1-4][0-9]|50)$/.test(value))return null;
 return Number(value);
}
export function readOpticalMarks(value:string){
 if(!/^[A-EX]{30}$/.test(value))return null;
 return value.split('') as Mark[];
}
export function detailedQuestions(test:number){
 if(!Number.isInteger(test)||test<1||test>50)return null;
 const questions=[];
 for(let q=1;q<=30;q++){
  const row=getParagrafDetailedSolution(String((test-1)*30+q).padStart(5,'0'));
  if(!row)return null;
  questions.push(row);
 }
 return questions;
}
export function gradeOptical(test:number,encoded:string){
 const marks=readOpticalMarks(encoded);
 const questions=detailedQuestions(test);
 if(!marks||!questions)return null;
 let correct=0,wrong=0,blank=0;
 const topics=new Map<string,{topic:string,total:number,correct:number,wrong:number,blank:number,questions:number[]}>();
 const details=questions.map((q,i)=>{
  const chosen=marks[i],status=chosen==='X'?'BOŞ':chosen===q.answer?'DOĞRU':'YANLIŞ';
  if(status==='BOŞ')blank++;else if(status==='DOĞRU')correct++;else wrong++;
  const entry=topics.get(q.topic)||{topic:q.topic,total:0,correct:0,wrong:0,blank:0,questions:[]};
  entry.total++;if(status==='BOŞ')entry.blank++;else if(status==='DOĞRU')entry.correct++;else{entry.wrong++;entry.questions.push(i+1);}
  topics.set(q.topic,entry);
  const secret=process.env.KEKS_PARAGRAF_QR_SECRET||'';
  return {number:i+1,chosen,answer:q.answer,topic:q.topic,status,solutionUrl:status!=='DOĞRU'?paragrafDetailedSolutionUrl(q.id,secret,'https://keksakademi.vercel.app'):null};
 });
 const topicsResult=[...topics.values()].sort((a,b)=>b.wrong-a.wrong||b.blank-a.blank||a.topic.localeCompare(b.topic,'tr'));
 const recommendations=topicsResult.filter(x=>x.wrong>0||x.blank>0).slice(0,5).map(x=>({
  ...x,advice:x.wrong>0?(x.wrong>=2?'Öncelikli çalış':'Tekrar et'):'Boş bırakılan soruyu tamamla'
 }));
 return {test,encoded,correct,wrong,blank,net:Math.round((correct-wrong/4)*100)/100,details,topics:topicsResult,recommendations};
}
