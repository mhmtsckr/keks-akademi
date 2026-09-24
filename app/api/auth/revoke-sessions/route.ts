import { NextResponse } from 'next/server';
import { currentUser,endCurrentSession,revokeAllSessions } from '@/lib/auth';
import { writeAudit } from '@/lib/audit';
import { withApiErrors } from '@/lib/apiGuard';

async function POST__handler(){
  const user=await currentUser();
  if(!user)return NextResponse.json({error:'Oturum açmanız gerekiyor.'},{status:401});

  await revokeAllSessions(user.id);
  await writeAudit({
    actorUserId:user.id,
    action:'ALL_SESSIONS_REVOKED',
    entityType:'User',
    entityId:user.id,
    summary:'Kullanıcı tüm cihazlardaki aktif oturumlarını kapattı.',
    metadata:{reason:'USER_SECURITY_ACTION'}
  });
  await endCurrentSession('ALL_SESSIONS_REVOKED');

  return NextResponse.json({
    ok:true,
    message:'Tüm cihazlardaki oturumlar kapatıldı. Yeniden giriş yapmanız gerekir.'
  });
}

export const POST=withApiErrors(POST__handler);
