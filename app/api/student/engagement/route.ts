import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';

const actionSchema=z.object({action:z.literal('progress'),id:z.string(),currentValue:z.number().min(0)});
const gameSchema=z.object({action:z.literal('game_attempt'),gameContentId:z.string(),score:z.number().int().min(0),maxScore:z.number().int().positive(),durationSeconds:z.number().int().min(0),mistakes:z.any().optional()});
const schema=z.discriminatedUnion('action',[actionSchema,gameSchema]);

export async function GET(){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const id=user.student.id;
  const [actions,gamification,badges,games,leaderboard,sessions]=await Promise.all([
    db.coachingAction.findMany({where:{studentId:id,status:'ACTIVE'},orderBy:{periodEnd:'asc'}}),
    db.studentGamification.findUnique({where:{studentId:id}}),
    db.badgeAward.findMany({where:{studentId:id},orderBy:{awardedAt:'desc'}}),
    db.gameContent.findMany({where:{active:true},orderBy:{createdAt:'desc'},take:30}),
    db.studentGamification.findMany({orderBy:{xp:'desc'},take:20,include:{student:{select:{fullName:true,studentCode:true}}}}),
    db.coachingSession.findMany({where:{studentId:id,startsAt:{gte:new Date()}},orderBy:{startsAt:'asc'},take:10})
  ]);
  return NextResponse.json({ok:true,actions,gamification,badges,games,leaderboard,sessions});
}

export async function POST(req:Request){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const input=schema.parse(await req.json());
  if(input.action==='progress'){
    const row=await db.coachingAction.findFirst({where:{id:input.id,studentId:user.student.id}});
    if(!row)return NextResponse.json({error:'Aksiyon bulunamadı.'},{status:404});
    const current=Math.min(input.currentValue,row.targetValue);
    const updated=await db.coachingAction.update({where:{id:row.id},data:{currentValue:current,status:current>=row.targetValue?'COMPLETED':'ACTIVE'}});
    return NextResponse.json({ok:true,row:updated});
  }

  const content=await db.gameContent.findUnique({where:{id:input.gameContentId}});
  if(!content||!content.active)return NextResponse.json({error:'Oyun bulunamadı.'},{status:404});
  const ratio=Math.max(0,Math.min(1,input.score/input.maxScore));
  const xp=Math.round(20+80*ratio);
  const attempt=await db.gameAttempt.create({data:{studentId:user.student.id,gameContentId:content.id,score:input.score,maxScore:input.maxScore,durationSeconds:input.durationSeconds,xpEarned:xp,mistakes:input.mistakes}});
  const current=await db.studentGamification.upsert({where:{studentId:user.student.id},create:{studentId:user.student.id,xp,level:1,lastPlayedAt:new Date()},update:{xp:{increment:xp},lastPlayedAt:new Date()}});
  const level=Math.max(1,Math.floor(current.xp/500)+1);
  if(level!==current.level)await db.studentGamification.update({where:{studentId:user.student.id},data:{level}});
  if(current.xp>=500)await db.badgeAward.upsert({where:{studentId_badgeKey:{studentId:user.student.id,badgeKey:'XP500'}},create:{studentId:user.student.id,badgeKey:'XP500',title:'500 XP',description:'Mikro tekrar çalışmalarında 500 XP kazanıldı.'},update:{}});
  return NextResponse.json({ok:true,attempt,xp});
}
