import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { readJson,withApiErrors } from '@/lib/apiGuard';
import { isEmailVerified,issueEmailVerification } from '@/lib/emailVerification';

const schema=z.object({email:z.string().email(),role:z.enum(['STUDENT','COACH'])});

async function POST__handler(req:Request){
  const input=await readJson(req,schema);
  const email=input.email.trim().toLowerCase();
  const user=await db.user.findUnique({where:{email},select:{id:true,email:true,name:true,role:true,status:true,updatedAt:true}});
  if(!user||user.role!==input.role||user.status==='SUSPENDED'){
    return NextResponse.json({ok:true,sent:false,message:'Hesap doğrulama bekliyorsa yeni kod gönderilir.'});
  }
  if(await isEmailVerified(user.id))return NextResponse.json({ok:true,verified:true,message:'E-posta adresiniz zaten doğrulanmış.'});
  const issued=await issueEmailVerification(req,user);
  if(!issued.ok)return NextResponse.json({error:issued.error,retryAfterSeconds:'retryAfterSeconds' in issued?issued.retryAfterSeconds:undefined},{status:issued.status});
  return NextResponse.json({ok:true,sent:true,challenge:issued.challenge,message:issued.message});
}

export const POST=withApiErrors(POST__handler);
