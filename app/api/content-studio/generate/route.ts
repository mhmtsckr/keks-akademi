import { readJson, withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { contentFingerprint, generateStudioContent, StudioType } from '@/lib/contentStudio';
import { generateApprovedLearningContent, LEARNING_TYPES, LearningContentType } from '@/lib/approvedContentEngine';

const LEGACY_TYPES=['FLASHCARDS','QUIZ','SLIDES','INFOGRAPHIC','AUDIO_SCRIPT','VIDEO_LESSON','SIMILAR_QUESTIONS'] as const;
const TYPES=[...LEGACY_TYPES,'MINI_TEST','MATCHING','FILL_BLANK','ACTIVE_RECALL','MICRO_GAME'] as const;
const schema=z.object({uploadId:z.string(),types:z.array(z.enum(TYPES)).min(1).max(12)});

async function authorizedUpload(user:any,id:string){
  const row=await db.contentUpload.findUnique({where:{id},include:{student:true}});
  if(!row) return null;
  if(user.role==='ADMIN'||row.ownerUserId===user.id) return row;
  if(user.role==='STUDENT'&&user.student?.id===row.studentId) return row;
  if(user.role==='COACH'&&user.coachProfile?.id===row.student?.coachId) return row;
  return null;
}

async function POST__handler(req:Request){
  const user=await requireRole(['ADMIN','COACH','STUDENT']);
  const input=await readJson(req, schema);
  const upload=await authorizedUpload(user,input.uploadId);
  if(!upload) return NextResponse.json({error:'Kaynak bulunamadı veya erişim yok.'},{status:404});
  if(upload.status!=='APPROVED') return NextResponse.json({error:'İçerik üretimi yalnız koç/yönetici tarafından onaylanmış kaynaklardan yapılabilir.'},{status:409});
  if(!upload.extractedText) return NextResponse.json({error:'Bu dosyadan henüz metin çıkarılamadı. Görsel içerik için vision bağlantısı gerekir.'},{status:422});

  const outputs=[] as any[];
  for(const type of input.types){
    const fp=contentFingerprint(upload.sha256,type,upload.studentId);
    const old=await db.generatedContent.findUnique({where:{fingerprint:fp}});
    if(old){outputs.push({...old,reused:true});continue}

    const isLearning=(LEARNING_TYPES as readonly string[]).includes(type);
    const result=isLearning
      ?generateApprovedLearningContent(type as LearningContentType,upload.extractedText,upload.student?.gradeLevel)
      :generateStudioContent(type as StudioType,upload.extractedText);
    const quality=(result as any).quality||{
      passed:result.qualityScore>=70,
      issues:result.qualityScore>=70?[]:['kalite puanı 70 altı'],
      threshold:70
    };
    const payload={...(result.payload as any),_quality:quality,_source:{uploadId:upload.id,approved:true,gradeLevel:upload.student?.gradeLevel||null}};

    const row=await db.generatedContent.create({data:{
      uploadId:upload.id,
      studentId:upload.studentId,
      createdByUserId:user.id,
      type,
      title:result.title,
      payload,
      fingerprint:fp,
      status:'QUALITY_REVIEW',
      qualityScore:result.qualityScore,
      visibleToStudent:false,
      visibleToParent:false
    }});
    outputs.push({...row,reused:false,quality});
  }
  return NextResponse.json({ok:true,outputs:outputs.map(x=>({
    id:x.id,type:x.type,title:x.title,status:x.status,qualityScore:x.qualityScore,reused:x.reused,
    quality:(x.payload as any)?._quality||x.quality||null
  }))});
}

export const POST = withApiErrors(POST__handler);
