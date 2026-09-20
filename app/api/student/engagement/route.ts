import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { awardXp } from '@/lib/gamification';

const actionSchema=z.object({action:z.literal('progress'),id:z.string(),currentValue:z.number().min(0)});
const analyticSchema=z.object({action:z.literal('analytics'),examType:z.string(),subject:z.string(),topic:z.string(),questionType:z.string().default('GENEL'),correct:z.number().int().min(0),wrong:z.number().int().min(0),blank:z.number().int().min(0),avgSeconds:z.number().min(0).optional(),examDate:z.string().optional()});
const gameSchema=z.object({action:z.literal('game_attempt'),gameContentId:z.string(),score:z.number().int().min(0),maxScore:z.number().int().positive(),durationSeconds:z.number().int().min(0),mistakes:z.any().optional()});
const forumSchema=z.object({action:z.literal('forum_post'),cohortId:z.string(),body:z.string().min(2).max(2000)});
const schema=z.discriminatedUnion('action',[actionSchema,gameSchema,analyticSchema,forumSchema]);

export async function GET(){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const id=user.student.id;
  const weekStart=new Date(Date.now()-7*24*60*60*1000);
  const monthStart=new Date(Date.now()-30*24*60*60*1000);
  const [actions,gamification,badges,games,sessions,weeklyLedger,monthlyLedger,cohorts]=await Promise.all([
    db.coachingAction.findMany({where:{studentId:id,status:'ACTIVE'},orderBy:{periodEnd:'asc'}}),
    db.studentGamification.findUnique({where:{studentId:id}}),
    db.badgeAward.findMany({where:{studentId:id},orderBy:{awardedAt:'desc'}}),
    db.gameContent.findMany({where:{active:true},orderBy:{createdAt:'desc'},take:100}),
    db.coachingSession.findMany({where:{studentId:id,startsAt:{gte:new Date()}},orderBy:{startsAt:'asc'},take:10}),
    db.xpLedger.groupBy({by:['studentId'],where:{createdAt:{gte:weekStart}},_sum:{xp:true},orderBy:{_sum:{xp:'desc'}},take:20}),
    db.xpLedger.groupBy({by:['studentId'],where:{createdAt:{gte:monthStart}},_sum:{xp:true},orderBy:{_sum:{xp:'desc'}},take:20}),
    db.cohortMember.findMany({where:{studentId:id},include:{cohort:{include:{posts:{orderBy:{createdAt:'desc'},take:30,include:{student:{select:{fullName:true}}}}}}}})
  ]);
  const wordGames=games.filter(x=>x.gameType==='WORD');
  const nonWordGames=games.filter(x=>x.gameType!=='WORD').slice(0,24);
  const twoDayIndex=Math.floor(Date.now()/(2*24*60*60*1000));
  const dailyWord=wordGames.length?[wordGames[twoDayIndex%wordGames.length]]:[];
  const visibleGames=[...dailyWord,...nonWordGames];
  const ids=[...new Set([...weeklyLedger.map(x=>x.studentId),...monthlyLedger.map(x=>x.studentId)])];
  const students=ids.length?await db.student.findMany({where:{id:{in:ids}},select:{id:true,fullName:true,studentCode:true}}):[];
  const map=new Map(students.map(x=>[x.id,x]));
  const weeklyLeaderboard=weeklyLedger.map(x=>({studentId:x.studentId,xp:x._sum.xp||0,student:map.get(x.studentId)}));
  const monthlyLeaderboard=monthlyLedger.map(x=>({studentId:x.studentId,xp:x._sum.xp||0,student:map.get(x.studentId)}));
  return NextResponse.json({ok:true,actions,gamification,badges,games:visibleGames,weeklyLeaderboard,monthlyLeaderboard,sessions,cohorts});
}

export async function POST(req:Request){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const input=schema.parse(await req.json());
  if(input.action==='progress'){
    const row=await db.coachingAction.findFirst({where:{id:input.id,studentId:user.student.id}});
    if(!row)return NextResponse.json({error:'Aksiyon bulunamadı.'},{status:404});
    const current=Math.min(input.currentValue,row.targetValue);
    const completed=current>=row.targetValue;
    const updated=await db.coachingAction.update({where:{id:row.id},data:{currentValue:current,status:completed?'COMPLETED':'ACTIVE'}});
    if(completed){
      await awardXp(user.student.id,'ACTION',row.id,60);
      await db.badgeAward.upsert({where:{studentId_badgeKey:{studentId:user.student.id,badgeKey:'FIRST_ACTION'}},create:{studentId:user.student.id,badgeKey:'FIRST_ACTION',title:'İlk Aksiyon Tamamlandı',description:'Koçluk aksiyonlarından ilkini tamamladı.'},update:{}});
    }
    return NextResponse.json({ok:true,row:updated});
  }

  if(input.action==='forum_post'){
    const member=await db.cohortMember.findFirst({where:{cohortId:input.cohortId,studentId:user.student.id}});
    if(!member)return NextResponse.json({error:'Bu kohorta erişiminiz yok.'},{status:403});
    const row=await db.forumPost.create({data:{cohortId:input.cohortId,studentId:user.student.id,authorUserId:user.id,body:input.body}});
    return NextResponse.json({ok:true,row});
  }

  if(input.action==='analytics'){
    const row=await db.examAnalyticsRecord.create({data:{studentId:user.student.id,examType:input.examType,subject:input.subject,topic:input.topic,questionType:input.questionType,correct:input.correct,wrong:input.wrong,blank:input.blank,avgSeconds:input.avgSeconds,examDate:input.examDate?new Date(input.examDate):new Date()}});
    return NextResponse.json({ok:true,row});
  }

  const content=await db.gameContent.findUnique({where:{id:input.gameContentId}});
  if(!content||!content.active)return NextResponse.json({error:'Oyun bulunamadı.'},{status:404});
  const ratio=Math.max(0,Math.min(1,input.score/input.maxScore));
  const xp=Math.round(20+80*ratio);
  const attempt=await db.gameAttempt.create({data:{studentId:user.student.id,gameContentId:content.id,score:input.score,maxScore:input.maxScore,durationSeconds:input.durationSeconds,xpEarned:xp,mistakes:input.mistakes}});
  await awardXp(user.student.id,'GAME',attempt.id,xp);
  return NextResponse.json({ok:true,attempt,xp});
}
