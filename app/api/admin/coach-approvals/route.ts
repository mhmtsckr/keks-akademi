import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { writeAudit } from '@/lib/audit';
import { readJson,withApiErrors } from '@/lib/apiGuard';

const schema=z.object({
  action:z.enum(['APPROVE_ONE','APPROVE_ALL','SUSPEND_ONE']),
  userId:z.string().optional()
});

async function GET__handler(){
  await requireRole(['ADMIN']);
  const coaches=await db.user.findMany({
    where:{role:'COACH',status:'PENDING'},
    select:{
      id:true,name:true,email:true,status:true,createdAt:true,
      coachProfile:{select:{id:true,_count:{select:{students:true}}}}
    },
    orderBy:{createdAt:'asc'},
    take:100
  });
  return NextResponse.json({ok:true,count:coaches.length,coaches});
}

async function POST__handler(req:Request){
  const admin=await requireRole(['ADMIN']);
  const input=await readJson(req,schema);

  if(input.action==='APPROVE_ALL'){
    const pending=await db.user.findMany({
      where:{role:'COACH',status:'PENDING'},
      select:{id:true,name:true,email:true}
    });
    if(!pending.length)return NextResponse.json({ok:true,approved:0,message:'Onay bekleyen koç bulunmuyor.'});

    const result=await db.user.updateMany({
      where:{id:{in:pending.map(x=>x.id)},role:'COACH',status:'PENDING'},
      data:{status:'ACTIVE'}
    });

    await writeAudit({
      actorUserId:admin.id,
      action:'COACH_BULK_APPROVED',
      entityType:'User',
      summary:result.count+' bekleyen koç hesabı toplu olarak onaylandı.',
      metadata:{userIds:pending.map(x=>x.id),count:result.count}
    });

    return NextResponse.json({ok:true,approved:result.count,message:result.count+' koç hesabı onaylandı.'});
  }

  if(!input.userId)return NextResponse.json({error:'Koç kullanıcı bilgisi eksik.'},{status:400});

  const coach=await db.user.findFirst({
    where:{id:input.userId,role:'COACH'},
    select:{id:true,name:true,email:true,status:true}
  });
  if(!coach)return NextResponse.json({error:'Koç hesabı bulunamadı.'},{status:404});

  if(input.action==='APPROVE_ONE'){
    if(coach.status==='ACTIVE')return NextResponse.json({ok:true,message:'Koç hesabı zaten aktif.'});
    const updated=await db.user.update({where:{id:coach.id},data:{status:'ACTIVE'}});
    await writeAudit({
      actorUserId:admin.id,
      action:'COACH_APPROVED',
      entityType:'User',
      entityId:coach.id,
      summary:coach.name+' koç hesabı hızlı onay ile aktif edildi.',
      metadata:{email:coach.email}
    });
    return NextResponse.json({ok:true,userId:updated.id,message:coach.name+' onaylandı ve aktif edildi.'});
  }

  await db.user.update({where:{id:coach.id},data:{status:'SUSPENDED'}});
  await writeAudit({
    actorUserId:admin.id,
    action:'COACH_SUSPENDED',
    entityType:'User',
    entityId:coach.id,
    summary:coach.name+' koç başvurusu askıya alındı.',
    metadata:{email:coach.email}
  });
  return NextResponse.json({ok:true,message:coach.name+' askıya alındı.'});
}

export const GET=withApiErrors(GET__handler);
export const POST=withApiErrors(POST__handler);
