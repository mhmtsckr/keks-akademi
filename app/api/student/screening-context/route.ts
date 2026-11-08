import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requireRole} from '@/lib/auth';
import {withApiErrors,readJson} from '@/lib/apiGuard';
import {db} from '@/lib/db';

const schema=z.object({
 learningStage:z.enum(['FOUNDATION','DEVELOPING','INDEPENDENT']),
 dailyMinutes:z.number().int().min(10).max(480),
 weeklyDays:z.number().int().min(1).max(7),
 numericalShare:z.number().int().min(0).max(100),
 numericalGaps:z.string().trim().max(400),
 verbalGaps:z.string().trim().max(400),
 lastEvaluation:z.string().trim().max(500),
 challengeExample:z.string().trim().max(500),
 obstacles:z.string().trim().max(400),
 teacherObservation:z.string().trim().max(400),
 guidanceRead:z.literal(true)
}).strict();

const extract=(profile:unknown)=>{
 if(!profile||typeof profile!=='object'||Array.isArray(profile))return {};
 const item=(profile as Record<string,unknown>).nativeScreeningContext;
 return item&&typeof item==='object'&&!Array.isArray(item)?item:{};
};
async function GET__handler(){
 const user=await requireRole(['STUDENT']);
 if(!user.student)return NextResponse.json({error:'Öğrenci hesabı bulunamadı.'},{status:403});
 const s=await db.student.findUnique({where:{id:user.student.id},select:{profile:true,gradeLevel:true,academicTrack:true,goal:true,studentCode:true}});
 if(!s)return NextResponse.json({error:'Öğrenci bulunamadı.'},{status:404});
 return NextResponse.json({ok:true,context:extract(s.profile),profile:{gradeLevel:s.gradeLevel,academicTrack:s.academicTrack,goal:s.goal,studentCode:s.studentCode}});
}
async function PUT__handler(req:Request){
 const user=await requireRole(['STUDENT']);
 if(!user.student)return NextResponse.json({error:'Öğrenci hesabı bulunamadı.'},{status:403});
 const input=await readJson(req,schema);
 const student=await db.student.findUnique({where:{id:user.student.id},select:{id:true,profile:true}});
 if(!student)return NextResponse.json({error:'Öğrenci bulunamadı.'},{status:404});
 const profile=student.profile&&typeof student.profile==='object'&&!Array.isArray(student.profile)?student.profile as Record<string,unknown>:{};
 const context={...input,updatedAt:new Date().toISOString(),source:'KEKS_NATIVE'};
 await db.student.update({where:{id:student.id},data:{profile:{...profile,nativeScreeningContext:context}}});
 return NextResponse.json({ok:true,context});
}
export const GET=withApiErrors(GET__handler);
export const PUT=withApiErrors(PUT__handler);
