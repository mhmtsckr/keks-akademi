import { NextResponse } from 'next/server';
import { currentSessionClaims,currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { withApiErrors } from '@/lib/apiGuard';

type SessionMeta={
  sidHash?:string;
  device?:string;
  ipHash?:string|null;
  remember?:boolean;
  expiresAt?:string;
  reason?:string;
};

async function GET__handler(){
  const user=await currentUser();
  if(!user)return NextResponse.json({error:'Oturum açmanız gerekiyor.'},{status:401});
  const current=await currentSessionClaims();

  const [sessionLogs,lastPasswordEvent]=await Promise.all([
    db.auditLog.findMany({
      where:{
        actorUserId:user.id,
        action:{in:['SESSION_CREATED','SESSION_ENDED']},
        createdAt:{gte:user.updatedAt}
      },
      orderBy:{createdAt:'desc'},
      take:200,
      select:{action:true,metadata:true,createdAt:true}
    }),
    db.auditLog.findFirst({
      where:{actorUserId:user.id,action:{in:['PASSWORD_CHANGED','PASSWORD_RESET_COMPLETED']}},
      orderBy:{createdAt:'desc'},
      select:{createdAt:true,action:true}
    })
  ]);

  const ended=new Set<string>();
  for(const log of sessionLogs){
    if(log.action!=='SESSION_ENDED')continue;
    const meta=(log.metadata||{}) as SessionMeta;
    if(meta.sidHash)ended.add(meta.sidHash);
  }

  const now=Date.now();
  const active=sessionLogs
    .filter(x=>x.action==='SESSION_CREATED')
    .map(x=>({createdAt:x.createdAt,meta:(x.metadata||{}) as SessionMeta}))
    .filter(x=>Boolean(x.meta.sidHash)&&!ended.has(String(x.meta.sidHash))&&(!x.meta.expiresAt||new Date(x.meta.expiresAt).getTime()>now))
    .filter((x,index,arr)=>arr.findIndex(y=>y.meta.sidHash===x.meta.sidHash)===index)
    .slice(0,20)
    .map(x=>({
      id:String(x.meta.sidHash),
      device:x.meta.device||'Bilinmeyen cihaz',
      remember:Boolean(x.meta.remember),
      createdAt:x.createdAt,
      expiresAt:x.meta.expiresAt||null,
      current:Boolean(current&&x.meta.sidHash===current.sidHash)
    }));

  const lastLogin=sessionLogs.find(x=>x.action==='SESSION_CREATED')?.createdAt||null;

  return NextResponse.json({
    ok:true,
    account:{
      email:user.email,
      role:user.role,
      lastLoginAt:lastLogin,
      lastPasswordChangeAt:lastPasswordEvent?.createdAt||null,
      securityStampAt:user.updatedAt
    },
    activeSessions:active,
    activeSessionCount:active.length
  });
}

export const GET=withApiErrors(GET__handler);
