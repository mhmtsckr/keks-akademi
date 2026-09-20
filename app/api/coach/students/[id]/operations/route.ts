import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { writeAudit } from '@/lib/audit';
import { createGoogleCalendarEvent,createOutlookEvent,createZoomMeeting } from '@/lib/calendarSync';
import { awardXp } from '@/lib/gamification';

const sessionSchema=z.object({action:z.literal('session'),title:z.string().min(2),startsAt:z.string(),endsAt:z.string(),timeZone:z.string().default('Europe/Istanbul'),calendarProvider:z.enum(['LOCAL','GOOGLE','OUTLOOK']).default('LOCAL'),meetingProvider:z.enum(['NONE','GOOGLE_MEET','ZOOM']).default('NONE'),notes:z.string().optional()});
const actionSchema=z.object({action:z.literal('coaching_action'),title:z.string().min(2),description:z.string().optional(),metricType:z.enum(['COUNT','MINUTES','PAGES','QUESTIONS']).default('COUNT'),targetValue:z.number().positive(),cadence:z.enum(['WEEKLY','MONTHLY']).default('WEEKLY'),periodStart:z.string(),periodEnd:z.string()});
const analyticSchema=z.object({action:z.literal('analytics'),examType:z.string(),subject:z.string(),topic:z.string(),questionType:z.string().default('GENEL'),correct:z.number().int().min(0),wrong:z.number().int().min(0),blank:z.number().int().min(0),avgSeconds:z.number().min(0).optional(),examDate:z.string().optional()});
const sessionStatusSchema=z.object({action:z.literal('session_status'),sessionId:z.string(),status:z.enum(['SCHEDULED','COMPLETED','CANCELED'])});
const cohortSchema=z.object({action:z.literal('cohort'),cohortId:z.string().optional(),name:z.string().min(2).optional(),description:z.string().optional()});
const schema=z.discriminatedUnion('action',[sessionSchema,actionSchema,analyticSchema,sessionStatusSchema,cohortSchema]);

export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await requireRole(['COACH','ADMIN']);
  const {id}=await params;
  const student=await db.student.findFirst({where:{id,coachId:user.coachProfile?.id}});
  if(!student)return NextResponse.json({error:'Öğrenci bulunamadı.'},{status:404});
  const [sessions,actions,analytics,connections,cohorts]=await Promise.all([
    db.coachingSession.findMany({where:{studentId:id},orderBy:{startsAt:'desc'},take:40}),
    db.coachingAction.findMany({where:{studentId:id},orderBy:{createdAt:'desc'},take:50}),
    db.examAnalyticsRecord.findMany({where:{studentId:id},orderBy:{examDate:'desc'},take:200}),
    db.calendarConnection.findMany({where:{coachId:user.coachProfile!.id,active:true},select:{provider:true,accountEmail:true,timeZone:true}}),
    db.cohort.findMany({where:{coachId:user.coachProfile!.id,active:true},include:{members:{select:{studentId:true}}},orderBy:{createdAt:'desc'}})
  ]);
  return NextResponse.json({ok:true,sessions,actions,analytics,connections,cohorts});
}

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await requireRole(['COACH','ADMIN']);
  if(!user.coachProfile)return NextResponse.json({error:'Koç profili yok.'},{status:403});
  const {id}=await params;
  const student=await db.student.findFirst({where:{id,coachId:user.coachProfile.id}});
  if(!student)return NextResponse.json({error:'Öğrenci bulunamadı.'},{status:404});
  const input=schema.parse(await req.json());

  if(input.action==='cohort'){
    let cohortId=input.cohortId;
    if(!cohortId){
      if(!input.name)return NextResponse.json({error:'Kohort adı gerekli.'},{status:400});
      const cohort=await db.cohort.create({data:{coachId:user.coachProfile.id,name:input.name,description:input.description||null}});
      cohortId=cohort.id;
    }else{
      const cohort=await db.cohort.findFirst({where:{id:cohortId,coachId:user.coachProfile.id}});
      if(!cohort)return NextResponse.json({error:'Kohort bulunamadı.'},{status:404});
    }
    await db.cohortMember.upsert({where:{cohortId_studentId:{cohortId,studentId:id}},create:{cohortId,studentId:id},update:{}});
    return NextResponse.json({ok:true,cohortId});
  }

  if(input.action==='session'){
    const startsAt=new Date(input.startsAt),endsAt=new Date(input.endsAt);
    if(!(endsAt>startsAt))return NextResponse.json({error:'Bitiş başlangıçtan sonra olmalı.'},{status:400});
    let externalEventId:string|undefined,meetingUrl:string|undefined,syncStatus='LOCAL';
    try{
      if(input.meetingProvider==='ZOOM'){
        const zoom=await db.calendarConnection.findUnique({where:{coachId_provider:{coachId:user.coachProfile.id,provider:'ZOOM'}}});
        if(zoom){const z=await createZoomMeeting(zoom,{...input,startsAt,endsAt});meetingUrl=z.meetingUrl}
        else syncStatus='NEEDS_CONNECTION';
      }
      if(input.meetingProvider==='GOOGLE_MEET' && input.calendarProvider!=='GOOGLE'){
        const google=await db.calendarConnection.findUnique({where:{coachId_provider:{coachId:user.coachProfile.id,provider:'GOOGLE'}}});
        if(google){
          const g=await createGoogleCalendarEvent(google,{...input,meetingProvider:'GOOGLE_MEET',startsAt,endsAt});
          externalEventId=g.externalEventId;meetingUrl=g.meetingUrl||undefined;syncStatus='SYNCED';
        }else syncStatus='NEEDS_CONNECTION';
      }
      if(input.calendarProvider!=='LOCAL' && !(input.calendarProvider==='GOOGLE'&&externalEventId)){
        const conn=await db.calendarConnection.findUnique({where:{coachId_provider:{coachId:user.coachProfile.id,provider:input.calendarProvider}}});
        if(conn){
          const result=input.calendarProvider==='GOOGLE'
            ?await createGoogleCalendarEvent(conn,{...input,startsAt,endsAt})
            :await createOutlookEvent(conn,{...input,startsAt,endsAt});
          externalEventId=result.externalEventId;
          meetingUrl=meetingUrl||result.meetingUrl||undefined;
          syncStatus='SYNCED';
        }else syncStatus='NEEDS_CONNECTION';
      }
    }catch{syncStatus='SYNC_ERROR'}
    const row=await db.coachingSession.create({data:{coachId:user.coachProfile.id,studentId:id,title:input.title,startsAt,endsAt,timeZone:input.timeZone,calendarProvider:input.calendarProvider==='LOCAL'?null:input.calendarProvider,externalEventId,meetingProvider:input.meetingProvider==='NONE'?null:input.meetingProvider,meetingUrl,notes:input.notes||null,createdByUserId:user.id,syncStatus}});
    await writeAudit({actorUserId:user.id,action:'COACHING_SESSION_CREATE',entityType:'CoachingSession',entityId:row.id,summary:student.fullName+' için koçluk seansı oluşturuldu.',metadata:{startsAt,endsAt,syncStatus}});
    return NextResponse.json({ok:true,row});
  }

  if(input.action==='session_status'){
    const session=await db.coachingSession.findFirst({where:{id:input.sessionId,studentId:id,coachId:user.coachProfile.id}});
    if(!session)return NextResponse.json({error:'Seans bulunamadı.'},{status:404});
    const row=await db.coachingSession.update({where:{id:session.id},data:{status:input.status}});
    if(input.status==='COMPLETED')await awardXp(id,'SESSION',session.id,80);
    return NextResponse.json({ok:true,row});
  }

  if(input.action==='coaching_action'){
    const row=await db.coachingAction.create({data:{studentId:id,createdByUserId:user.id,title:input.title,description:input.description||null,metricType:input.metricType,targetValue:input.targetValue,cadence:input.cadence,periodStart:new Date(input.periodStart),periodEnd:new Date(input.periodEnd)}});
    return NextResponse.json({ok:true,row});
  }

  const row=await db.examAnalyticsRecord.create({data:{studentId:id,examType:input.examType,subject:input.subject,topic:input.topic,questionType:input.questionType,correct:input.correct,wrong:input.wrong,blank:input.blank,avgSeconds:input.avgSeconds,examDate:input.examDate?new Date(input.examDate):new Date()}});
  return NextResponse.json({ok:true,row});
}
