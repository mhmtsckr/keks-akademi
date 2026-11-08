import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requireRole} from '@/lib/auth';
import {withApiErrors,readJson} from '@/lib/apiGuard';
import {db} from '@/lib/db';

const kinds=['ONBOARDING','CONTEXT','SCREENING','INTERVIEW'] as const;
const kindSchema=z.enum(kinds);
const scopeSchema=z.string().min(1).max(120).regex(/^[a-zA-Z0-9_.:-]+$/);
const draftKey=(studentId:string,kind:string,scope:string)=>'KEKS_FORM_DRAFT_V1:'+studentId+':'+kind+':'+scope;

const onboardingData=z.object({
 step:z.number().int().min(0).max(7),goal:z.string().max(240),gradeLevel:z.string().max(100),
 academicTrack:z.string().max(120),dailyMinutes:z.number().int().min(0).max(480),
 weakSubjects:z.array(z.string().max(80)).max(5),
 resources:z.array(z.object({title:z.string().max(160),subject:z.string().max(80),publisher:z.string().max(120)})).max(8),
 noResources:z.boolean(),resourceDraft:z.object({title:z.string().max(160),subject:z.string().max(80),publisher:z.string().max(120)}),
 hasExam:z.boolean(),examType:z.string().max(50),totalNet:z.string().max(15),durationMinutes:z.string().max(15),
 preferredDays:z.array(z.string().max(16)).max(7),studyStart:z.string().max(5),studyEnd:z.string().max(5),
 coachId:z.string().max(100)
}).strict();
const contextData=z.object({
 learningStage:z.enum(['FOUNDATION','DEVELOPING','INDEPENDENT']),
 dailyMinutes:z.number().int().min(0).max(480),weeklyDays:z.number().int().min(0).max(7),
 numericalShare:z.number().int().min(0).max(100),numericalGaps:z.string().max(400),
 verbalGaps:z.string().max(400),lastEvaluation:z.string().max(500),
 challengeExample:z.string().max(500),obstacles:z.string().max(400),
 teacherObservation:z.string().max(400),guidanceRead:z.boolean()
}).strict();
const screeningData=z.object({answers:z.record(z.string().max(100),z.number().int().min(1).max(5)),page:z.number().int().min(0).max(100)}).strict();
const interviewData=z.object({answers:z.record(z.string().max(100),z.string().max(2500)),academicTrack:z.string().max(120)}).strict();
const inputSchema=z.object({
 kind:kindSchema,scope:scopeSchema,data:z.unknown()
}).strict();

async function GET__handler(req:Request){
 const user=await requireRole(['STUDENT']);
 if(!user.student)return NextResponse.json({error:'Öğrenci profili bulunamadı.'},{status:403});
 const url=new URL(req.url);
 const kind=kindSchema.safeParse(url.searchParams.get('kind'));
 const scope=scopeSchema.safeParse(url.searchParams.get('scope'));
 if(!kind.success||!scope.success)return NextResponse.json({error:'Taslak türü veya sürümü geçersiz.'},{status:400});
 const row=await db.dailyLog.findUnique({where:{legacyId:draftKey(user.student.id,kind.data,scope.data)}});
 if(!row||row.studentId!==user.student.id)return NextResponse.json({ok:true,draft:null});
 const payload=row.payload&&typeof row.payload==='object'&&!Array.isArray(row.payload)?row.payload as Record<string,unknown>:{};
 return NextResponse.json({ok:true,draft:{data:payload.data,updatedAt:payload.updatedAt||row.createdAt.toISOString()}});
}

async function PUT__handler(req:Request){
 const user=await requireRole(['STUDENT']);
 if(!user.student)return NextResponse.json({error:'Öğrenci profili bulunamadı.'},{status:403});
 const raw=await readJson(req,inputSchema);
 const schema=raw.kind==='ONBOARDING'?onboardingData:raw.kind==='CONTEXT'?contextData:raw.kind==='SCREENING'?screeningData:interviewData;
 const parsed=schema.safeParse(raw.data);
 if(!parsed.success)return NextResponse.json({error:'Form taslağı doğrulanamadı.'},{status:400});
 if(JSON.stringify(parsed.data).length>30000)return NextResponse.json({error:'Form taslağı çok büyük.'},{status:413});
 const key=draftKey(user.student.id,raw.kind,raw.scope);
 const payload={kind:raw.kind,scope:raw.scope,data:parsed.data,updatedAt:new Date().toISOString()};
 await db.dailyLog.upsert({where:{legacyId:key},
  create:{legacyId:key,studentId:user.student.id,date:new Date(),payload},
  update:{payload,date:new Date()}});
 return NextResponse.json({ok:true,savedAt:payload.updatedAt});
}

async function DELETE__handler(req:Request){
 const user=await requireRole(['STUDENT']);
 if(!user.student)return NextResponse.json({error:'Öğrenci profili bulunamadı.'},{status:403});
 const url=new URL(req.url);
 const kind=kindSchema.safeParse(url.searchParams.get('kind'));
 const scope=scopeSchema.safeParse(url.searchParams.get('scope'));
 if(!kind.success||!scope.success)return NextResponse.json({error:'Taslak türü veya sürümü geçersiz.'},{status:400});
 await db.dailyLog.deleteMany({where:{legacyId:draftKey(user.student.id,kind.data,scope.data),studentId:user.student.id}});
 return NextResponse.json({ok:true});
}
export const GET=withApiErrors(GET__handler);
export const PUT=withApiErrors(PUT__handler);
export const DELETE=withApiErrors(DELETE__handler);
