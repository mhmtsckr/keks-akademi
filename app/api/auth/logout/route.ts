import { NextResponse } from 'next/server';
import { endCurrentSession } from '@/lib/auth';

export async function POST(){
  await endCurrentSession('USER_LOGOUT');
  return NextResponse.json({ok:true});
}
