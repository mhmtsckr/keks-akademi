import { withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { buildStudentInsights } from '@/lib/analytics';

async function GET__handler(){
 const user=await requireRole(['STUDENT']);
 if(!user.student) return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
 const insights=await buildStudentInsights(user.student.id);
 const weak=insights.weakSubjects[0];
 const incomplete=insights.incomplete.find(x=>!weak||x.subject===weak.subject)||insights.incomplete[0];
 return NextResponse.json({ok:true,recommendation:{
   subject:weak?.subject||incomplete?.subject||null,
   topic:incomplete?.topic||null,
   reason:insights.suggestion,
   suggestedQuestionCount:weak&&weak.accuracy<45?10:15
 }});
}

export const GET = withApiErrors(GET__handler);
