import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { appBaseUrl,verifyOAuthState } from '@/lib/integrationOAuth';
import { encryptPrivateCode } from '@/lib/security';

export async function GET(req:Request,{params}:{params:Promise<{provider:string}>}){
  const user=await currentUser();if(!user||!user.coachProfile)return NextResponse.redirect(appBaseUrl()+'/koc?integration=unauthorized');
  const {provider:raw}=await params;const provider=raw.toUpperCase();const u=new URL(req.url);const code=u.searchParams.get('code');const state=u.searchParams.get('state');
  if(!code||!state||!verifyOAuthState(state,user.id,provider))return NextResponse.redirect(appBaseUrl()+'/koc?integration=invalid');
  const redirect=appBaseUrl()+'/api/integrations/'+raw+'/callback';
  let token:any=null,email:string|null=null;
  try{
    if(provider==='GOOGLE'){
      const body=new URLSearchParams({code,client_id:process.env.GOOGLE_CLIENT_ID||'',client_secret:process.env.GOOGLE_CLIENT_SECRET||'',redirect_uri:redirect,grant_type:'authorization_code'});
      const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body});if(!r.ok)throw new Error('token');token=await r.json();
      const me=await fetch('https://openidconnect.googleapis.com/v1/userinfo',{headers:{authorization:'Bearer '+token.access_token}});if(me.ok)email=(await me.json() as any).email||null;
    }else if(provider==='OUTLOOK'){
      const body=new URLSearchParams({code,client_id:process.env.MICROSOFT_CLIENT_ID||'',client_secret:process.env.MICROSOFT_CLIENT_SECRET||'',redirect_uri:redirect,grant_type:'authorization_code',scope:'offline_access User.Read Calendars.ReadWrite'});
      const r=await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body});if(!r.ok)throw new Error('token');token=await r.json();
      const me=await fetch('https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName',{headers:{authorization:'Bearer '+token.access_token}});if(me.ok){const j:any=await me.json();email=j.mail||j.userPrincipalName||null}
    }else if(provider==='ZOOM'){
      const auth=Buffer.from((process.env.ZOOM_CLIENT_ID||'')+':'+(process.env.ZOOM_CLIENT_SECRET||'')).toString('base64');
      const body=new URLSearchParams({grant_type:'authorization_code',code,redirect_uri:redirect});
      const r=await fetch('https://zoom.us/oauth/token',{method:'POST',headers:{authorization:'Basic '+auth,'content-type':'application/x-www-form-urlencoded'},body});if(!r.ok)throw new Error('token');token=await r.json();
      const me=await fetch('https://api.zoom.us/v2/users/me',{headers:{authorization:'Bearer '+token.access_token}});if(me.ok)email=(await me.json() as any).email||null;
    }else throw new Error('provider');
    await db.calendarConnection.upsert({where:{coachId_provider:{coachId:user.coachProfile.id,provider}},create:{coachId:user.coachProfile.id,provider,accountEmail:email,calendarId:provider==='GOOGLE'?'primary':null,timeZone:'Europe/Istanbul',accessTokenCiphertext:encryptPrivateCode(token.access_token),refreshTokenCiphertext:token.refresh_token?encryptPrivateCode(token.refresh_token):null,expiresAt:token.expires_in?new Date(Date.now()+Number(token.expires_in)*1000):null,active:true},update:{accountEmail:email,accessTokenCiphertext:encryptPrivateCode(token.access_token),refreshTokenCiphertext:token.refresh_token?encryptPrivateCode(token.refresh_token):undefined,expiresAt:token.expires_in?new Date(Date.now()+Number(token.expires_in)*1000):null,active:true}});
    return NextResponse.redirect(appBaseUrl()+'/koc?integration='+provider.toLowerCase()+'-ok');
  }catch{return NextResponse.redirect(appBaseUrl()+'/koc?integration='+provider.toLowerCase()+'-error')}
}
