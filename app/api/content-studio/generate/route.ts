import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { contentFingerprint, generateStudioContent, StudioType } from '@/lib/contentStudio';

const TYPES=['FLASHCARDS','QUIZ','SLIDES','INFOGRAPHIC','AUDIO_SCRIPT','VIDEO_LESSON','SIMILAR_QUESTIONS'] as const;
const schema=z.object({uploadId:z.string(),types:z.array(z.enum(TYPES)).min(1).max(7)});

async function authorizedUpload(user:any,id:string){
  const row=await db.contentUpload.findUnique({where:{id},include:{student:true}});
  if(!row) return null;
  if(user.role==='ADMIN'||row.ownerUserId===user.id) return row;
  if(user.role==='STUDENT'&&user.student?.id===row.studentId) return row;
  if(user.role==='COACH'&&user.coachProfile?.id===row.student?.coachId) return row;
  return null;
}

export async function POST(req:Request){
  const user=await requireRole(['ADMIN','COACH','STUDENT']);
  const input=schema.parse(await req.json());
  const upload=await authorizedUpload(user,input.uploadId);
  if(!upload) return NextResponse.json({error:'Kaynak bulunamadı veya erişim yok.'},{status:404});
  if(!upload.extractedText) return NextResponse.json({error:'Bu dosyadan henüz metin çıkarılamadı. Görsel içerik için vision bağlantısı gerekir.'},{status:422});

  const outputs=[] as any[];
  for(const type of input.types as StudioType[]){
    const fp=contentFingerprint(upload.sha256,type,upload.studentId);
    const old=await db.generatedContent.findUnique({where:{fingerprint:fp}});
    if(old){outputs.push({...old,reused:true});continue}
    const result=generateStudioContent(type,upload.extractedText);
    const visible=user.role==='STUDENT';
    const row=await db.generatedContent.create({data:{
      uploadId:upload.id,studentId:upload.studentId,createdByUserId:user.id,type,title:result.title,payload:result.payload,
      fingerprint:fp,status:visible?'PUBLISHED':'DRAFT',qualityScore:result.qualityScore,visibleToStudent:visible,visibleToParent:false
    }});
    outputs.push({...row,reused:false});
  }
  return NextResponse.json({ok:true,outputs:outputs.map(x=>({id:x.id,type:x.type,title:x.title,status:x.status,qualityScore:x.qualityScore,reused:x.reused}))});
}
