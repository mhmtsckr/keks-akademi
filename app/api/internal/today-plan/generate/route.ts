import { NextResponse } from 'next/server';
import { createRemoteJWKSet,jwtVerify } from 'jose';
import { withApiErrors } from '@/lib/apiGuard';
import { generateMorningTodayPlans } from '@/lib/learningEngine';

export const runtime='nodejs';
export const dynamic='force-dynamic';

const OIDC_ISSUER='https://token.actions.githubusercontent.com';
const OIDC_AUDIENCE='keks-today-plan';
const EXPECTED_REPOSITORY='mhmtsckr/keks-akademi';
const EXPECTED_WORKFLOW='/.github/workflows/today-plan-morning.yml@';
const githubJwks=createRemoteJWKSet(new URL(OIDC_ISSUER+'/.well-known/jwks'));

async function authorizedScheduler(req:Request){
  const auth=req.headers.get('authorization')||'';
  const token=auth.startsWith('Bearer ')?auth.slice(7):'';
  if(!token)return false;
  try{
    const {payload}=await jwtVerify(token,githubJwks,{
      issuer:OIDC_ISSUER,
      audience:OIDC_AUDIENCE
    });
    return payload.repository===EXPECTED_REPOSITORY
      && typeof payload.workflow_ref==='string'
      && payload.workflow_ref.includes(EXPECTED_WORKFLOW)
      && payload.ref==='refs/heads/main'
      && (payload.event_name==='schedule'||payload.event_name==='workflow_dispatch');
  }catch{
    return false;
  }
}

async function POST__handler(req:Request){
  if(!(await authorizedScheduler(req))){
    return NextResponse.json({error:'Yetkisiz zamanlayıcı isteği.'},{status:401});
  }
  const result=await generateMorningTodayPlans();
  return NextResponse.json({ok:true,...result});
}

export const POST=withApiErrors(POST__handler);
