import { withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { analyzeSource, extractDocumentText, sha256 } from '@/lib/contentStudio';

const MAX_FILE=15*1024*1024;
const ALLOWED_EXT=['.pdf','.docx','.pptx','.txt','.md','.png','.jpg','.jpeg','.webp'];

function ext(name:string){const i=name.lastIndexOf('.');return i>=0?name.slice(i).toLowerCase():'';}

async function resolveStudent(user:any,requested:string|null){
  if(user.role==='STUDENT') return user.student?.id||null;
  if(!requested) return null;
  if(user.role==='ADMIN') return (await db.student.findUnique({where:{id:requested},select:{id:true}}))?.id||null;
  if(user.role==='COACH'&&user.coachProfile) return (await db.student.findFirst({where:{id:requested,coachId:user.coachProfile.id},select:{id:true}}))?.id||null;
  return null;
}

async function POST__handler(req:Request){
  const user=await requireRole(['ADMIN','COACH','STUDENT']);
  const form=await req.formData();
  const file=form.get('file');
  if(!(file instanceof File)) return NextResponse.json({error:'Dosya gerekli.'},{status:400});
  if(file.size<1||file.size>MAX_FILE) return NextResponse.json({error:'Dosya boyutu 1 bayt ile 15 MB arasında olmalı.'},{status:413});
  if(!ALLOWED_EXT.includes(ext(file.name))) return NextResponse.json({error:'Desteklenmeyen dosya türü.'},{status:415});
  const requested=form.get('studentId')?String(form.get('studentId')):null;
  const studentId=await resolveStudent(user,requested);
  if(user.role!=='ADMIN'&&!studentId) return NextResponse.json({error:'Öğrenci eşleşmesi bulunamadı.'},{status:403});

  const bytes=new Uint8Array(await file.arrayBuffer());
  const hash=sha256(bytes);
  const existing=studentId?await db.contentUpload.findFirst({where:{studentId,sha256:hash}}):null;
  if(existing){
    const analysis=analyzeSource(existing.extractedText||'',existing.fileName);
    return NextResponse.json({ok:true,deduplicated:true,upload:{id:existing.id,fileName:existing.fileName,status:existing.status},analysis});
  }

  let extractedText='';
  let extractionError='';
  try{extractedText=await extractDocumentText(bytes,file.type||'application/octet-stream',file.name)}catch(e:any){extractionError=e?.message||'Metin çıkarma başarısız.'}
  const analysis=analyzeSource(extractedText,file.name);
  const status=extractedText?'READY':(file.type.startsWith('image/')?'NEEDS_VISION':'NEEDS_REVIEW');
  const row=await db.contentUpload.create({data:{
    studentId,ownerUserId:user.id,fileName:file.name,mimeType:file.type||'application/octet-stream',fileSize:file.size,
    fileData:bytes,sha256:hash,extractedText:extractedText||null,category:'AUTO',isQuestionSource:analysis.isQuestionSource,status
  }});
  return NextResponse.json({ok:true,deduplicated:false,upload:{id:row.id,fileName:row.fileName,status:row.status},analysis,extractionError:extractionError||null});
}

export const POST = withApiErrors(POST__handler);
