import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { calcNet } from '@/lib/performance';

const schema=z.object({answers:z.record(z.string(),z.string().nullable())});

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 const user=await requireRole(['STUDENT']);
 if(!user.student) return NextResponse.json({error:'Öğrenci profili bulunamadı.'},{status:400});
 const {id}=await params;
 const quiz=await db.practiceQuiz.findFirst({where:{id,studentId:user.student.id}});
 if(!quiz) return NextResponse.json({error:'Test bulunamadı.'},{status:404});
 const input=schema.parse(await req.json());
 const ids=Array.isArray(quiz.questionIds)?quiz.questionIds.map(String):[];
 const qs=await db.questionBankItem.findMany({where:{id:{in:ids}}});
 let correct=0,wrong=0,blank=0;
 for(const q of qs){
   const ans=input.answers[q.id];
   if(!ans) blank++; else if(ans===q.correctAnswer) correct++; else wrong++;
 }
 const net=calcNet(correct,wrong);
 const attempt=await db.practiceQuizAttempt.create({data:{quizId:quiz.id,studentId:user.student.id,answers:input.answers,correct,wrong,blank,net}});
 await db.practiceLog.create({data:{studentId:user.student.id,examType:quiz.examType,subject:quiz.subject,topic:quiz.topic,correct,wrong,blank,total:correct+wrong+blank,net}});
 const report=await db.studentReport.create({data:{
   studentId:user.student.id,
   title:'Otomatik Test Performans Raporu · '+quiz.title,
   summary:`D ${correct} · Y ${wrong} · B ${blank} · Net ${net}`,
   content:`${quiz.title} testinde ${correct} doğru, ${wrong} yanlış, ${blank} boş ve ${net} net elde edildi. Koç, yanlış yapılan konu ve alt becerileri sonraki programda önceliklendirmelidir.`,
   createdByUserId:user.id,
   visibleToStudent:true,
   visibleToParent:true
 }});
 return NextResponse.json({ok:true,attempt:{id:attempt.id,correct,wrong,blank,net},reportId:report.id});
}
