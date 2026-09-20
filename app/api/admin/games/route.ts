import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { writeAudit } from '@/lib/audit';

const item=z.object({
  gameType:z.enum(['WORD','CROSSWORD','CONNECTIONS','MATCH']),
  examType:z.string().optional(),
  subject:z.string().min(1),
  topic:z.string().min(1),
  title:z.string().min(1),
  payload:z.unknown(),
  difficulty:z.string().default('ORTA')
});
const schema=z.object({items:z.array(item).min(1).max(500)});

export async function GET(){
  await requireRole(['ADMIN']);
  const items=await db.gameContent.findMany({orderBy:{createdAt:'desc'},take:300});
  return NextResponse.json({ok:true,items});
}
export async function POST(req:Request){
  const user=await requireRole(['ADMIN']);
  const input=schema.parse(await req.json());
  const rows=[];
  for(const x of input.items){
    rows.push(await db.gameContent.create({data:{
      gameType:x.gameType,
      examType:x.examType||null,
      subject:x.subject,
      topic:x.topic,
      title:x.title,
      payload:(x.payload??{}) as any,
      difficulty:x.difficulty,
      createdByUserId:user.id
    }}));
  }
  await writeAudit({actorUserId:user.id,action:'GAME_CONTENT_IMPORT',entityType:'GameContent',summary:rows.length+' oyun içeriği eklendi.',metadata:{count:rows.length}});
  return NextResponse.json({ok:true,count:rows.length});
}
