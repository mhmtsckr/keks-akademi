import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { generateMicroGame } from '@/lib/microGameGenerator';
import { writeAudit } from '@/lib/audit';

const schema=z.object({
  examType:z.string().optional(),
  subject:z.string().min(1),
  topic:z.string().min(1),
  gameType:z.enum(['WORD','MATCH','CONNECTIONS','CROSSWORD']).optional()
});

export async function POST(req:Request){
  const user=await requireRole(['ADMIN']);
  const input=schema.parse(await req.json());
  const game=await generateMicroGame({
    createdByUserId:user.id,
    examType:input.examType||null,
    subject:input.subject,
    topic:input.topic,
    gameType:input.gameType
  });
  await writeAudit({
    actorUserId:user.id,
    action:'GAME_CONTENT_AUTO_CREATE',
    entityType:'GameContent',
    entityId:game.id,
    summary:input.subject+' · '+input.topic+' için mikro tekrar oyunu otomatik oluşturuldu.',
    metadata:{gameType:game.gameType,source:game.generationSource}
  });
  return NextResponse.json({ok:true,game});
}
