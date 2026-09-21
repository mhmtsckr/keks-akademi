import { readJson, withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { writeAudit } from '@/lib/audit';
import { decryptPrivateCode } from '@/lib/security';

const patchSchema=z.object({
  userId:z.string(),
  status:z.enum(['PENDING','ACTIVE','SUSPENDED']).optional(),
  role:z.enum(['ADMIN','COACH','STUDENT','PARENT']).optional()
});

async function GET__handler(req:Request){
  await requireRole(['ADMIN']);
  const {searchParams}=new URL(req.url);
  const role=searchParams.get('role') as any;
  const q=(searchParams.get('q')||'').trim();
  const where:any={};
  if(role&&['ADMIN','COACH','STUDENT','PARENT'].includes(role))where.role=role;
  if(q)where.OR=[{name:{contains:q,mode:'insensitive'}},{email:{contains:q,mode:'insensitive'}}];
  const users=await db.user.findMany({
    where,orderBy:{createdAt:'desc'},take:200,
    select:{id:true,name:true,email:true,role:true,status:true,createdAt:true,
      coachProfile:{select:{_count:{select:{students:true}}}},
      student:{select:{studentCode:true,gradeLevel:true,accessKeyCiphertext:true,accessKeyExpiresAt:true,credentialsDeliveryStatus:true,credentialsEmailedAt:true,coach:{select:{user:{select:{name:true}}}}}},
      parentProfile:{select:{student:{select:{fullName:true,studentCode:true}}}}
    }
  });
  const visibleUsers=users.map(u=>({
    ...u,
    student:u.student?{
      studentCode:u.student.studentCode,
      gradeLevel:u.student.gradeLevel,
      coach:u.student.coach,
      credentialsDeliveryStatus:u.student.credentialsDeliveryStatus,
      credentialsEmailedAt:u.student.credentialsEmailedAt,
      accessKey:u.student.accessKeyCiphertext?safeDecrypt(u.student.accessKeyCiphertext):null,
      accessKeyExpiresAt:u.student.accessKeyExpiresAt,
      accessKeyExpired:u.student.accessKeyExpiresAt.getTime()<=Date.now()
    }:null
  }));
  return NextResponse.json({ok:true,users:visibleUsers});
}

function safeDecrypt(value:string){
  try{return decryptPrivateCode(value)}catch{return null}
}

async function PATCH__handler(req:Request){
  const admin=await requireRole(['ADMIN']);
  const input=await readJson(req, patchSchema);
  if(admin.id===input.userId&&input.status==='SUSPENDED') return NextResponse.json({error:'Kendi hesabınızı askıya alamazsınız.'},{status:400});
  const before=await db.user.findUnique({where:{id:input.userId},select:{id:true,name:true,role:true,status:true}});
  if(!before)return NextResponse.json({error:'Kullanıcı bulunamadı.'},{status:404});
  const updated=await db.user.update({where:{id:input.userId},data:{
    ...(input.status?{status:input.status}:{}),
    ...(input.role?{role:input.role}:{}),
  },select:{id:true,name:true,email:true,role:true,status:true}});
  await writeAudit({actorUserId:admin.id,action:'USER_UPDATE',entityType:'User',entityId:updated.id,summary:updated.name+' kullanıcısı güncellendi.',metadata:{before,after:updated}});
  return NextResponse.json({ok:true,user:updated});
}

export const GET = withApiErrors(GET__handler);
export const PATCH = withApiErrors(PATCH__handler);
