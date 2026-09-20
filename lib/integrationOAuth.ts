import crypto from 'node:crypto';

function secret(){return process.env.AUTH_SECRET||''}
export function appBaseUrl(){return process.env.APP_URL||process.env.VERCEL_PROJECT_PRODUCTION_URL||process.env.VERCEL_URL?((process.env.APP_URL||'https://'+(process.env.VERCEL_PROJECT_PRODUCTION_URL||process.env.VERCEL_URL))):'http://localhost:3000'}
export function makeOAuthState(userId:string,provider:string){
  const ts=Date.now().toString();
  const payload=[userId,provider,ts].join('|');
  const sig=crypto.createHmac('sha256',secret()).update(payload).digest('base64url');
  return Buffer.from(payload+'|'+sig).toString('base64url');
}
export function verifyOAuthState(state:string,userId:string,provider:string){
  try{
    const decoded=Buffer.from(state,'base64url').toString('utf8');
    const [uid,p,ts,sig]=decoded.split('|');
    if(uid!==userId||p!==provider||Date.now()-Number(ts)>15*60*1000)return false;
    const payload=[uid,p,ts].join('|');
    const expected=crypto.createHmac('sha256',secret()).update(payload).digest('base64url');
    return crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected));
  }catch{return false}
}
