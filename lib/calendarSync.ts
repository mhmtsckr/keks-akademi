import { decryptPrivateCode } from './security';

type Connection={provider:string;calendarId:string|null;accessTokenCiphertext:string|null;refreshTokenCiphertext:string|null;expiresAt:Date|null};
type SessionInput={title:string;startsAt:Date;endsAt:Date;timeZone:string;notes?:string|null;meetingProvider?:string|null};

async function refreshGoogle(connection:Connection){
  if(!connection.refreshTokenCiphertext) throw new Error('GOOGLE_REFRESH_TOKEN_MISSING');
  const refresh=decryptPrivateCode(connection.refreshTokenCiphertext);
  const body=new URLSearchParams({
    client_id:process.env.GOOGLE_CLIENT_ID||'',
    client_secret:process.env.GOOGLE_CLIENT_SECRET||'',
    refresh_token:refresh,
    grant_type:'refresh_token'
  });
  const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body});
  if(!r.ok)throw new Error('GOOGLE_TOKEN_REFRESH_FAILED');
  return r.json();
}

async function refreshMicrosoft(connection:Connection){
  if(!connection.refreshTokenCiphertext) throw new Error('MS_REFRESH_TOKEN_MISSING');
  const refresh=decryptPrivateCode(connection.refreshTokenCiphertext);
  const body=new URLSearchParams({
    client_id:process.env.MICROSOFT_CLIENT_ID||'',
    client_secret:process.env.MICROSOFT_CLIENT_SECRET||'',
    refresh_token:refresh,
    grant_type:'refresh_token',
    scope:'offline_access Calendars.ReadWrite User.Read'
  });
  const r=await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body});
  if(!r.ok)throw new Error('MS_TOKEN_REFRESH_FAILED');
  return r.json();
}

export async function usableAccessToken(connection:Connection){
  if(!connection.accessTokenCiphertext)throw new Error('ACCESS_TOKEN_MISSING');
  if(!connection.expiresAt||connection.expiresAt.getTime()>Date.now()+60_000) return decryptPrivateCode(connection.accessTokenCiphertext);
  if(connection.provider==='GOOGLE') return (await refreshGoogle(connection)).access_token as string;
  if(connection.provider==='OUTLOOK') return (await refreshMicrosoft(connection)).access_token as string;
  return decryptPrivateCode(connection.accessTokenCiphertext);
}

export async function createGoogleCalendarEvent(connection:Connection,input:SessionInput){
  const token=await usableAccessToken(connection);
  const createMeet=input.meetingProvider==='GOOGLE_MEET';
  const body:any={
    summary:input.title,
    description:input.notes||'KEKS Akademi koçluk görüşmesi',
    start:{dateTime:input.startsAt.toISOString(),timeZone:input.timeZone},
    end:{dateTime:input.endsAt.toISOString(),timeZone:input.timeZone}
  };
  if(createMeet) body.conferenceData={createRequest:{requestId:crypto.randomUUID(),conferenceSolutionKey:{type:'hangoutsMeet'}}};
  const url='https://www.googleapis.com/calendar/v3/calendars/'+encodeURIComponent(connection.calendarId||'primary')+'/events'+(createMeet?'?conferenceDataVersion=1':'');
  const r=await fetch(url,{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify(body)});
  if(!r.ok)throw new Error('GOOGLE_EVENT_CREATE_FAILED');
  const j:any=await r.json();
  const meet=j.hangoutLink||j.conferenceData?.entryPoints?.find((x:any)=>x.entryPointType==='video')?.uri||null;
  return {externalEventId:j.id as string,meetingUrl:meet};
}

export async function createOutlookEvent(connection:Connection,input:SessionInput){
  const token=await usableAccessToken(connection);
  const body:any={
    subject:input.title,
    body:{contentType:'text',content:input.notes||'KEKS Akademi koçluk görüşmesi'},
    start:{dateTime:input.startsAt.toISOString().replace('Z',''),timeZone:'UTC'},
    end:{dateTime:input.endsAt.toISOString().replace('Z',''),timeZone:'UTC'}
  };
  const r=await fetch('https://graph.microsoft.com/v1.0/me/events',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify(body)});
  if(!r.ok)throw new Error('OUTLOOK_EVENT_CREATE_FAILED');
  const j:any=await r.json();
  return {externalEventId:j.id as string,meetingUrl:j.onlineMeeting?.joinUrl||null};
}

export async function createZoomMeeting(connection:Connection,input:SessionInput){
  const token=await usableAccessToken(connection);
  const body={topic:input.title,type:2,start_time:input.startsAt.toISOString(),duration:Math.max(15,Math.round((input.endsAt.getTime()-input.startsAt.getTime())/60000)),timezone:input.timeZone};
  const r=await fetch('https://api.zoom.us/v2/users/me/meetings',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify(body)});
  if(!r.ok)throw new Error('ZOOM_MEETING_CREATE_FAILED');
  const j:any=await r.json();
  return {externalEventId:String(j.id),meetingUrl:j.join_url as string};
}
