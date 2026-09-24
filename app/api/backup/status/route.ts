import { createHash, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Called only after the encrypted archive has been uploaded successfully.
export async function POST(req:Request){
  const expected=process.env.BACKUP_STATUS_SECRET;
  const supplied=req.headers.get('authorization')?.replace(/^Bearer /,'')||'';
  if(!expected||!supplied)return NextResponse.json({error:'Unauthorized'},{status:401});
  const a=createHash('sha256').update(supplied).digest();
  const b=createHash('sha256').update(expected).digest();
  if(!timingSafeEqual(a,b))return NextResponse.json({error:'Unauthorized'},{status:401});
  const body=await req.json().catch(()=>null);
  if(!body||!/^keks-[0-9]{8}-[0-9]+\.dump\.gpg$/.test(body.fileName))return NextResponse.json({error:'Invalid backup identifier'},{status:400});
  await db.auditLog.create({data:{action:'BACKUP_SUCCEEDED',entityType:'DATABASE',summary:'Encrypted backup stored in restricted artifact storage',metadata:{fileName:body.fileName,runId:String(body.runId||'').slice(0,30)}}});
  return NextResponse.json({ok:true});
}
