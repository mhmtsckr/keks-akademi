import { NextResponse } from 'next/server';
import { publishMebMicroGames } from '@/lib/mebGameScheduler';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(req:Request){
  const secret=process.env.CRON_SECRET;
  const auth=req.headers.get('authorization');
  const userAgent=req.headers.get('user-agent')||'';

  if(secret){
    if(auth!==`Bearer ${secret}`)return NextResponse.json({error:'Yetkisiz.'},{status:401});
  }else{
    const isVercelCron=/^vercel-cron\/\d+(?:\.\d+)*$/i.test(userAgent.trim());
    if(!isVercelCron)return NextResponse.json({error:'Yetkisiz cron istemcisi.'},{status:401});
  }

  const result=await publishMebMicroGames();
  return NextResponse.json({...result,cronAuth:secret?'CRON_SECRET':'VERCEL_CRON_FALLBACK'});
}
