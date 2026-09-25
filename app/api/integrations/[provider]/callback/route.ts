import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { appBaseUrl,verifyOAuthState } from '@/lib/integrationOAuth';
import { encryptPrivateCode } from '@/lib/security';

function escapeHtml(value:string){
  return value.replace(/[&<>"']/g,ch=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]||ch));
}

function callbackUrl(raw:string){
  return appBaseUrl()+'/api/integrations/'+raw+'/callback';
}

async function completeConnection(input:{
  coachId:string;
  rawProvider:string;
  provider:string;
  code:string;
}){
  const {coachId,rawProvider,provider,code}=input;
  const redirect=callbackUrl(rawProvider);
  let token:any=null;
  let email:string|null=null;

  if(provider==='GOOGLE'){
    const body=new URLSearchParams({
      code,
      client_id:process.env.GOOGLE_CLIENT_ID||'',
      client_secret:process.env.GOOGLE_CLIENT_SECRET||'',
      redirect_uri:redirect,
      grant_type:'authorization_code'
    });
    const r=await fetch('https://oauth2.googleapis.com/token',{
      method:'POST',
      headers:{'content-type':'application/x-www-form-urlencoded'},
      body
    });
    if(!r.ok)throw new Error('OAUTH_TOKEN_EXCHANGE_FAILED');
    token=await r.json();
    const me=await fetch('https://openidconnect.googleapis.com/v1/userinfo',{
      headers:{authorization:'Bearer '+token.access_token}
    });
    if(me.ok)email=(await me.json() as any).email||null;
  }else if(provider==='OUTLOOK'){
    const body=new URLSearchParams({
      code,
      client_id:process.env.MICROSOFT_CLIENT_ID||'',
      client_secret:process.env.MICROSOFT_CLIENT_SECRET||'',
      redirect_uri:redirect,
      grant_type:'authorization_code',
      scope:'offline_access User.Read Calendars.ReadWrite'
    });
    const r=await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token',{
      method:'POST',
      headers:{'content-type':'application/x-www-form-urlencoded'},
      body
    });
    if(!r.ok)throw new Error('OAUTH_TOKEN_EXCHANGE_FAILED');
    token=await r.json();
    const me=await fetch('https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName',{
      headers:{authorization:'Bearer '+token.access_token}
    });
    if(me.ok){
      const j:any=await me.json();
      email=j.mail||j.userPrincipalName||null;
    }
  }else if(provider==='ZOOM'){
    const auth=Buffer.from((process.env.ZOOM_CLIENT_ID||'')+':'+(process.env.ZOOM_CLIENT_SECRET||'')).toString('base64');
    const body=new URLSearchParams({grant_type:'authorization_code',code,redirect_uri:redirect});
    const r=await fetch('https://zoom.us/oauth/token',{
      method:'POST',
      headers:{authorization:'Basic '+auth,'content-type':'application/x-www-form-urlencoded'},
      body
    });
    if(!r.ok)throw new Error('OAUTH_TOKEN_EXCHANGE_FAILED');
    token=await r.json();
    const me=await fetch('https://api.zoom.us/v2/users/me',{
      headers:{authorization:'Bearer '+token.access_token}
    });
    if(me.ok)email=(await me.json() as any).email||null;
  }else{
    throw new Error('OAUTH_PROVIDER_UNSUPPORTED');
  }

  if(!token?.access_token)throw new Error('OAUTH_ACCESS_TOKEN_MISSING');

  await db.calendarConnection.upsert({
    where:{coachId_provider:{coachId,provider}},
    create:{
      coachId,
      provider,
      accountEmail:email,
      calendarId:provider==='GOOGLE'?'primary':null,
      timeZone:'Europe/Istanbul',
      accessTokenCiphertext:encryptPrivateCode(token.access_token),
      refreshTokenCiphertext:token.refresh_token?encryptPrivateCode(token.refresh_token):null,
      expiresAt:token.expires_in?new Date(Date.now()+Number(token.expires_in)*1000):null,
      active:true
    },
    update:{
      accountEmail:email,
      accessTokenCiphertext:encryptPrivateCode(token.access_token),
      refreshTokenCiphertext:token.refresh_token?encryptPrivateCode(token.refresh_token):undefined,
      expiresAt:token.expires_in?new Date(Date.now()+Number(token.expires_in)*1000):null,
      active:true
    }
  });
}

export async function GET(req:Request,{params}:{params:Promise<{provider:string}>}){
  const user=await currentUser();
  if(!user||!user.coachProfile)return NextResponse.redirect(appBaseUrl()+'/koc?integration=unauthorized');

  const {provider:raw}=await params;
  const provider=raw.toUpperCase();
  const u=new URL(req.url);
  const code=u.searchParams.get('code');
  const state=u.searchParams.get('state');

  if(!code||!state||!verifyOAuthState(state,user.id,provider)){
    return NextResponse.redirect(appBaseUrl()+'/koc?integration=invalid');
  }

  // OAuth sağlayıcıları callback'i GET ile çağırır. GET hiçbir kalıcı durumu değiştirmez;
  // yalnız aynı doğrulanmış code/state çiftini POST'a aktarır. Token exchange ve DB write POST'tadır.
  const action='/api/integrations/'+encodeURIComponent(raw)+'/callback';
  const html='<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><title>KEKS bağlantısı tamamlanıyor</title></head><body>'
    +'<form id="oauth-complete" method="post" action="'+escapeHtml(action)+'">'
    +'<input type="hidden" name="code" value="'+escapeHtml(code)+'">'
    +'<input type="hidden" name="state" value="'+escapeHtml(state)+'">'
    +'<noscript><button type="submit">Bağlantıyı Tamamla</button></noscript></form>'
    +'<script>document.getElementById("oauth-complete").submit()</script></body></html>';

  return new Response(html,{
    status:200,
    headers:{
      'content-type':'text/html; charset=utf-8',
      'cache-control':'no-store, max-age=0',
      'referrer-policy':'no-referrer',
      'content-security-policy':"default-src 'none'; script-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
      'x-content-type-options':'nosniff'
    }
  });
}

export async function POST(req:Request,{params}:{params:Promise<{provider:string}>}){
  const user=await currentUser();
  if(!user||!user.coachProfile)return NextResponse.redirect(appBaseUrl()+'/koc?integration=unauthorized',303);

  const {provider:raw}=await params;
  const provider=raw.toUpperCase();
  const form=new URLSearchParams(await req.text());
  const code=form.get('code');
  const state=form.get('state');

  if(!code||!state||!verifyOAuthState(state,user.id,provider)){
    return NextResponse.redirect(appBaseUrl()+'/koc?integration=invalid',303);
  }

  try{
    await completeConnection({
      coachId:user.coachProfile.id,
      rawProvider:raw,
      provider,
      code
    });
    return NextResponse.redirect(appBaseUrl()+'/koc?integration='+provider.toLowerCase()+'-ok',303);
  }catch{
    return NextResponse.redirect(appBaseUrl()+'/koc?integration='+provider.toLowerCase()+'-error',303);
  }
}
