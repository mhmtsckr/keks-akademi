import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { summarizeGap } from '@/lib/performance';

function num(v:any){ const n=Number(v); return Number.isFinite(n)?n:null; }

export async function POST(_req:Request,{params}:{params:Promise<{id:string}>}){
 const user=await requireRole(['COACH','ADMIN']);
 if(!user.coachProfile) return NextResponse.json({error:'Koç profili yok.'},{status:400});
 const {id}=await params;
 const student=await db.student.findFirst({where:{id,coachId:user.coachProfile.id},include:{
   targets:{where:{active:true},orderBy:{createdAt:'desc'},take:1},
   examResults:{orderBy:{createdAt:'desc'},take:5},
   practiceLogs:{orderBy:{date:'desc'},take:100},
   topicProgress:{},
 }});
 if(!student) return NextResponse.json({error:'Öğrenci bulunamadı.'},{status:404});
 const target=student.targets[0];
 if(!target) return NextResponse.json({error:'Aktif hedef tanımlı değil.'},{status:400});
 const latest=student.examResults[0];
 const payload=(latest?.payload||{}) as any;
 const subjectNets:Record<string,number>={};
 for(const p of student.practiceLogs){
   subjectNets[p.subject]=(subjectNets[p.subject]||0)+p.net;
 }
 const targetNets=(target.benchmarkNets||{}) as Record<string,number>;
 const gap=summarizeGap({
   examType:target.examLevel,
   targetScore:target.score,
   targetRanking:target.ranking,
   targetPercentile:target.percentile,
   targetNets,
   examScore:num(payload.score),
   examRanking:num(payload.ranking),
   examPercentile:num(payload.percentile),
   subjectNets,
 });
 const completed=student.topicProgress.filter(x=>x.completed).length;
 const totalTopics=student.topicProgress.length;
 const accuracyBase=student.practiceLogs.reduce((a,p)=>({c:a.c+p.correct,w:a.w+p.wrong,b:a.b+p.blank}),{c:0,w:0,b:0});
 const totalQ=accuracyBase.c+accuracyBase.w+accuracyBase.b;
 const accuracy=totalQ?Math.round((accuracyBase.c/totalQ)*100):0;
 const summary=`${gap.status}. Konu ilerleme: ${completed}/${totalTopics}. Son soru performansı doğruluk oranı: %${accuracy}.`;
 const content=`Hedef: ${target.institutionName}${target.departmentName?' / '+target.departmentName:''}\nKaynak: ${target.source}${target.dataYear?' · '+target.dataYear:''}\n\nHedefe uzaklık: ${gap.text}\n\nKonu ilerleme: ${completed}/${totalTopics}\nToplam soru: ${totalQ} · Doğru: ${accuracyBase.c} · Yanlış: ${accuracyBase.w} · Boş: ${accuracyBase.b} · Doğruluk: %${accuracy}\n\nKoç önerisi: Hedef net açığı görülen dersler ve tamamlanmamış konular önceliklendirilmelidir. Sonraki denemede aynı metrikler yeniden karşılaştırılmalıdır.`;
 const report=await db.studentReport.create({data:{studentId:id,title:'Otomatik Performans ve Hedef Raporu',summary,content,createdByUserId:user.id,visibleToStudent:true,visibleToParent:true}});
 return NextResponse.json({ok:true,report,gap,metrics:{completed,totalTopics,totalQ,accuracy}});
}
