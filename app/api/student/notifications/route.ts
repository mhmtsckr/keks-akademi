import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requireRole} from '@/lib/auth';
import {readJson,withApiErrors} from '@/lib/apiGuard';
import {acknowledgeSmartNotification,buildSmartNotifications} from '@/lib/smartNotifications';

const schema=z.object({
  notificationId:z.string().trim().min(1).max(300)
});

async function GET__handler(){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const notifications=await buildSmartNotifications(user.student.id);
  return NextResponse.json({ok:true,notifications});
}

async function POST__handler(req:Request){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const input=await readJson(req,schema);
  const notification=await acknowledgeSmartNotification(user.student.id,input.notificationId);
  if(!notification)return NextResponse.json({error:'Bildirim artık güncel değil veya zaten okundu.'},{status:404});
  return NextResponse.json({ok:true,notification});
}

export const GET=withApiErrors(GET__handler);
export const POST=withApiErrors(POST__handler);
