import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const user=await currentUser();
  if(!user) return new NextResponse('Yetkisiz.',{status:401});
  const {id}=await context.params;
  const item=await db.libraryItem.findUnique({where:{id},include:{student:{include:{coach:true,parentProfiles:true}}}});
  if(!item || !item.fileData || !item.fileName) return new NextResponse('Dosya bulunamadı.',{status:404});

  let allowed=false;
  if(user.role==='ADMIN') allowed=true;
  if(user.role==='STUDENT' && user.student?.id===item.studentId) allowed=true;
  if(user.role==='COACH' && user.coachProfile?.id===item.student.coachId) allowed=true;
  if(user.role==='PARENT' && user.parentProfile?.studentId===item.studentId && user.parentProfile.active && user.parentProfile.consentRecordedAt && user.parentProfile.allowReports) allowed=true;
  if(!allowed) return new NextResponse('Yetkisiz.',{status:403});

  return new NextResponse(item.fileData,{
    headers:{
      'content-type':item.mimeType||'application/octet-stream',
      'content-disposition':`inline; filename*=UTF-8''${encodeURIComponent(item.fileName)}`,
      'content-length':String(item.fileSize||item.fileData.length)
    }
  });
}
