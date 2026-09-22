import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readJson,withApiErrors } from '@/lib/apiGuard';
import { requireRole } from '@/lib/auth';
import { publishMebMicroGames } from '@/lib/mebGameScheduler';
import { writeAudit } from '@/lib/audit';
import { db } from '@/lib/db';
import { ensureMebCoreQuestionBank } from '@/lib/mebCoreQuestionBank';

const schema=z.object({limit:z.number().int().min(1).max(30).optional()});

async function GET__handler(){
  await requireRole(['ADMIN']);
  const core=await ensureMebCoreQuestionBank();
  const [sourceCount,topicGroups,activeGames]=await Promise.all([
    db.questionBankItem.count({where:{active:true,reviewStatus:'APPROVED',sourceKind:{in:['MEB_TEXTBOOK','MEB_TYMM','MEB_OFFICIAL']},officialSourceUrl:{not:null}}}),
    db.questionBankItem.groupBy({by:['examType','subject','topic'],where:{active:true,reviewStatus:'APPROVED',sourceKind:{in:['MEB_TEXTBOOK','MEB_TYMM','MEB_OFFICIAL']},officialSourceUrl:{not:null}},_count:{_all:true}}),
    db.gameContent.count({where:{active:true,studentId:null,generationSource:{in:['AUTO_AI_MEB','AUTO_MEB_QBANK','AUTO_MEB_CORE']}}})
  ]);
  return NextResponse.json({
    ok:true,
    cronConfigured:true,
    cronAuthMode:process.env.CRON_SECRET?'CRON_SECRET':'VERCEL_CRON_FALLBACK',
    scheduleUtc:'04:00',
    scheduleTurkey:'07:00',
    sourceCount,
    readyTopics:topicGroups.filter(x=>x._count._all>=2).length,
    activeGames,
    coreSources:core.total,
    seededNow:core.seeded
  });
}

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

export const GET=withApiErrors(GET__handler);
export const POST=withApiErrors(POST__handler);
