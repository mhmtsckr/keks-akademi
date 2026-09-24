import crypto from 'node:crypto';
import { SignJWT,jwtVerify } from 'jose';

export type AuthChallengePurpose='PASSWORD_RESET'|'EMAIL_VERIFY'|'ADMIN_2FA'|'EMAIL_CHANGE';

function jwtSecret(){
  const secret=process.env.AUTH_SECRET;
  if(!secret)throw new Error('AUTH_SECRET_MISSING');
  return new TextEncoder().encode(secret);
}
function secretString(){
  const secret=process.env.AUTH_SECRET;
  if(!secret)throw new Error('AUTH_SECRET_MISSING');
  return secret;
}
function codeHash(jti:string,userId:string,code:string){
  return crypto.createHmac('sha256',secretString()).update(jti+'|'+userId+'|'+code).digest('hex');
}
function safeEqualHex(a:string,b:string){
  if(!/^[a-f0-9]{64}$/i.test(a)||!/^[a-f0-9]{64}$/i.test(b))return false;
  const aa=Buffer.from(a,'hex');
  const bb=Buffer.from(b,'hex');
  return aa.length===bb.length&&crypto.timingSafeEqual(aa,bb);
}

export async function createAuthChallenge(input:{
  user:{id:string;updatedAt:Date};
  purpose:AuthChallengePurpose;
  expiresIn?:string;
  remember?:boolean;
  data?:Record<string,string>;
}){
  const code=String(crypto.randomInt(100000,1000000));
  const jti=crypto.randomUUID();
  const hash=codeHash(jti,input.user.id,code);
  const token=await new SignJWT({
    purpose:input.purpose,
    nonce:input.user.updatedAt.toISOString(),
    codeHash:hash,
    remember:Boolean(input.remember),
    data:input.data||{}
  })
    .setProtectedHeader({alg:'HS256'})
    .setSubject(input.user.id)
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(input.expiresIn||'10m')
    .sign(jwtSecret());
  return {token,code,jti};
}

export async function readAuthChallenge(token:string,purpose:AuthChallengePurpose){
  const {payload}=await jwtVerify(token,jwtSecret());
  if(
    payload.purpose!==purpose||
    !payload.sub||
    !payload.jti||
    typeof payload.nonce!=='string'||
    typeof payload.codeHash!=='string'
  )throw new Error('INVALID_AUTH_CHALLENGE');
  return {
    userId:String(payload.sub),
    jti:String(payload.jti),
    nonce:payload.nonce,
    codeHash:payload.codeHash,
    remember:Boolean(payload.remember),
    data:(payload.data&&typeof payload.data==='object'&&!Array.isArray(payload.data)?payload.data:{}) as Record<string,string>
  };
}

export function verifyAuthChallengeCode(challenge:{jti:string;userId:string;codeHash:string},code:string){
  return safeEqualHex(codeHash(challenge.jti,challenge.userId,code),challenge.codeHash);
}
