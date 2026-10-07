import {NextResponse} from 'next/server';
import {currentUser,sessionCookiePresent} from '@/lib/auth';

export async function GET(){
  const [cookiePresent,user]=await Promise.all([
    sessionCookiePresent(),
    currentUser()
  ]);
  return NextResponse.json({
    ok:true,
    cookiePresent,
    authenticated:Boolean(user),
    role:user?.role||null,
    status:user?.status||null
  },{headers:{'Cache-Control':'no-store, no-cache, must-revalidate','Pragma':'no-cache'}});
}
