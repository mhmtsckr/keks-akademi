import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readJson,withApiErrors } from '@/lib/apiGuard';
import { requireRole } from '@/lib/auth';
import { publishMebMicroGames } from '@/lib/mebGameScheduler';
import { writeAudit } from '@/lib/audit';

const schema=z.object({limit:z.number().int().min(1).max(30).optional()});

async function POST__handler(req:Request){
  const user=await requireRole(['ADMIN']);
  const input=await readJson(req,schema);
  const result=await publishMebMicroGames({limit:input.limit,createdByUserId:user.id});
  await writeAudit({
    actorUserId:user.id,
    action:'MEB_GAME_AUTO_PUBLISH',
    entityType:'GameContent',
    summary:(result.published?.length||0)+' MEB kaynaklı mikro tekrar oyunu yayınlandı.',
    metadata:{published:result.published?.length||0,skipped:result.skipped||0}
  });
  return NextResponse.json(result);
}

export const POST=withApiErrors(POST__handler);
