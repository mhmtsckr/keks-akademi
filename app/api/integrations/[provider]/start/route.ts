import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { appBaseUrl,makeOAuthState } from '@/lib/integrationOAuth';

export async function GET(_req:Request,{params}:{params:Promise<{provider:string}>}){
  const user=await requireRole(['COACH','ADMIN']);
  if(!user.coachProfile)return NextResponse.json({error:'Koç profili yok.'},{status:403});
  const {provider:raw}=await params;const provider=raw.toUpperCase();
  const state=makeOAuthState(user.id,provider);
  const redirect=appBaseUrl()+'/api/integrations/'+raw+'/callback';
  let url='';
  if(provider==='GOOGLE'){
    if(!process.env.GOOGLE_CLIENT_ID)return NextResponse.json({error:'Google OAuth yapılandırılmamış.'},{status:503});
    const p=new URLSearchParams({client_id:process.env.GOOGLE_CLIENT_ID,redirect_uri:redirect,response_type:'code',access_type:'offline',prompt:'consent',scope:'openid email https://www.googleapis.com/auth/calendar.events',state});
    url='https://accounts.google.com/o/oauth2/v2/auth?'+p.toString();
  }else if(provider==='OUTLOOK'){
    if(!process.env.MICROSOFT_CLIENT_ID)return NextResponse.json({error:'Microsoft OAuth yapılandırılmamış.'},{status:503});
    const p=new URLSearchParams({client_id:process.env.MICROSOFT_CLIENT_ID,redirect_uri:redirect,response_type:'code',response_mode:'query',scope:'offline_access User.Read Calendars.ReadWrite',state});
    url='https://login.microsoftonline.com/common/oauth2/v2.0/authorize?'+p.toString();
  }else if(provider==='ZOOM'){
    if(!process.env.ZOOM_CLIENT_ID)return NextResponse.json({error:'Zoom OAuth yapılandırılmamış.'},{status:503});
    const p=new URLSearchParams({response_type:'code',client_id:process.env.ZOOM_CLIENT_ID,redirect_uri:redirect,state});
    url='https://zoom.us/oauth/authorize?'+p.toString();
  }else return NextResponse.json({error:'Desteklenmeyen sağlayıcı.'},{status:400});
  return NextResponse.redirect(url);
}
