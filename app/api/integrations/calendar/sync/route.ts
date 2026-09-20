import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { usableAccessToken } from '@/lib/calendarSync';

export async function POST(){
  const user=await requireRole(['COACH','ADMIN']);if(!user.coachProfile)return NextResponse.json({error:'Koç profili yok.'},{status:403});
  const connections=await db.calendarConnection.findMany({where:{coachId:user.coachProfile.id,provider:{in:['GOOGLE','OUTLOOK']},active:true}});
  let updated=0,errors=0;
  for(const c of connections){
    try{
      const token=await usableAccessToken(c);
      if(c.provider==='GOOGLE'){
        const p=new URLSearchParams({timeMin:new Date(Date.now()-30*86400000).toISOString(),timeMax:new Date(Date.now()+365*86400000).toISOString(),singleEvents:'true',maxResults:'250'});
        const r=await fetch('https://www.googleapis.com/calendar/v3/calendars/'+encodeURIComponent(c.calendarId||'primary')+'/events?'+p,{headers:{authorization:'Bearer '+token}});if(!r.ok)throw new Error();
        const j:any=await r.json();
        for(const e of j.items||[]){const local=await db.coachingSession.findFirst({where:{coachId:user.coachProfile.id,externalEventId:e.id}});if(local){await db.coachingSession.update({where:{id:local.id},data:{title:e.summary||local.title,startsAt:e.start?.dateTime?new Date(e.start.dateTime):local.startsAt,endsAt:e.end?.dateTime?new Date(e.end.dateTime):local.endsAt,status:e.status==='cancelled'?'CANCELED':local.status,syncStatus:'SYNCED'}});updated++}}
      }else{
        const r=await fetch('https://graph.microsoft.com/v1.0/me/calendarView?startDateTime='+encodeURIComponent(new Date(Date.now()-30*86400000).toISOString())+'&endDateTime='+encodeURIComponent(new Date(Date.now()+365*86400000).toISOString())+'&$top=250',{headers:{authorization:'Bearer '+token,'Prefer':'outlook.timezone="UTC"'}});if(!r.ok)throw new Error();
        const j:any=await r.json();
        for(const e of j.value||[]){const local=await db.coachingSession.findFirst({where:{coachId:user.coachProfile.id,externalEventId:e.id}});if(local){await db.coachingSession.update({where:{id:local.id},data:{title:e.subject||local.title,startsAt:e.start?.dateTime?new Date(e.start.dateTime+'Z'):local.startsAt,endsAt:e.end?.dateTime?new Date(e.end.dateTime+'Z'):local.endsAt,syncStatus:'SYNCED'}});updated++}}
      }
    }catch{errors++}
  }
  return NextResponse.json({ok:true,updated,errors});
}
