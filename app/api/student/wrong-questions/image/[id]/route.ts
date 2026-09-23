import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { withApiErrors } from '@/lib/apiGuard';

async function GET__handler(_:Request,{params}:{params:Promise<{id:string}>}){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const {id}=await params;
  const upload=await db.contentUpload.findFirst({
    where:{id,studentId:user.student.id,category:'WRONG_QUESTION'}
  });
  if(!upload)return NextResponse.json({error:'Görsel bulunamadı.'},{status:404});
  return new Response(upload.fileData,{
    headers:{
      'Content-Type':upload.mimeType,
      'Content-Length':String(upload.fileSize),
      'Cache-Control':'private, max-age=3600',
      'Content-Disposition':'inline; filename="'+upload.fileName.replace(/"/g,'')+'"'
    }
  });
}
export const GET=withApiErrors(GET__handler);
