import { SignJWT, jwtVerify } from 'jose';

const issuer='keks-akademi';
const audience='keks-external-assessment';
const secret=()=>new TextEncoder().encode(process.env.AUTH_SECRET!);

export async function createExternalAssessmentToken(studentId:string,accessId:string){
  if(!process.env.AUTH_SECRET)throw new Error('AUTH_SECRET_MISSING');
  return new SignJWT({accessId,kind:'KEKS_EXTERNAL_ASSESSMENT'})
    .setProtectedHeader({alg:'HS256'})
    .setSubject(studentId)
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(secret());
}

export async function verifyExternalAssessmentToken(token:string){
  if(!process.env.AUTH_SECRET)throw new Error('AUTH_SECRET_MISSING');
  const {payload}=await jwtVerify(token,secret(),{issuer,audience});
  if(payload.kind!=='KEKS_EXTERNAL_ASSESSMENT'||!payload.sub||typeof payload.accessId!=='string'){
    throw new Error('INVALID_EXTERNAL_ASSESSMENT_TOKEN');
  }
  return {studentId:payload.sub,accessId:payload.accessId};
}
