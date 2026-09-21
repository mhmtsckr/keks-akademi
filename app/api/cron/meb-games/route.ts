import { NextResponse } from 'next/server';
import { publishMebMicroGames } from '@/lib/mebGameScheduler';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export async function GET(req:Request){
  const secret=process.env.CRON_SECRET;
  if(!secret)return NextResponse.json({error:'CRON_SECRET tanımlı değil.'},{status:500});
  if(req.headers.get('authorization')!==`Bearer ${secret}`)return NextResponse.json({error:'Yetkisiz.'},{status:401});

  const result=await publishMebMicroGames();
  return NextResponse.json(result);
}
