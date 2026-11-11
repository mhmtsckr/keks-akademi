import { NextRequest,NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';

function validRequestId(value:string|null){
  return Boolean(value&&/^[A-Za-z0-9._:-]{8,100}$/.test(value));
}

function clientIp(req:NextRequest){
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ||req.headers.get('x-real-ip')?.trim()
    ||req.headers.get('cf-connecting-ip')?.trim()
    ||'unknown';
}

const MUTATION_METHODS=new Set(['POST','PUT','DELETE','PATCH']);

function isOriginAllowed(request:NextRequest):boolean{
  const origin=request.headers.get('origin');
  if(!origin)return true;
  try{
    const originHost=new URL(origin).host;
    const requestHost=request.headers.get('host')||request.nextUrl.host;
    return originHost===requestHost;
  }catch{
    return false;
  }
}

const RATE_LIMITS:{pattern:string;max:number;windowSeconds:number}[]=[
  {pattern:'/api/auth/register',max:5,windowSeconds:900},
  {pattern:'/api/auth/student-register',max:5,windowSeconds:900},
  {pattern:'/api/auth/password-reset/request',max:5,windowSeconds:900},
  {pattern:'/api/auth/change-email/request',max:5,windowSeconds:900},
  {pattern:'/api/auth/email-verification/resend',max:5,windowSeconds:900},
];

const SECURITY_HEADERS:{name:string;value:string}[]=[
  {name:'X-Content-Type-Options',value:'nosniff'},
  {name:'X-Frame-Options',value:'DENY'},
  {name:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
  {name:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=()'},
];

export function middleware(request:NextRequest){
  const {pathname}=request.nextUrl;

  const requestId=validRequestId(request.headers.get('x-request-id'))
    ?request.headers.get('x-request-id')!
    :crypto.randomUUID();

  if(
    pathname.startsWith('/api/')&&
    !pathname.startsWith('/api/external/')&&
    MUTATION_METHODS.has(request.method)&&
    !isOriginAllowed(request)
  ){
    return NextResponse.json(
      {error:'Origin doğrulaması başarısız.'},
      {status:403,headers:{'x-request-id':requestId}},
    );
  }

  if(request.method==='POST'){
    const rule=RATE_LIMITS.find(r=>pathname===r.pattern);
    if(rule){
      const result=checkRateLimit(clientIp(request),rule.pattern,rule.max,rule.windowSeconds);
      if(!result.allowed){
        return NextResponse.json(
          {error:'Çok fazla istek gönderildi. Lütfen bekleyin.'},
          {status:429,headers:{'x-request-id':requestId,'retry-after':String(result.retryAfterSeconds)}},
        );
      }
    }
  }

  const requestHeaders=new Headers(request.headers);
  requestHeaders.set('x-request-id',requestId);
  const response=NextResponse.next({request:{headers:requestHeaders}});
  response.headers.set('x-request-id',requestId);
  for(const h of SECURITY_HEADERS) response.headers.set(h.name,h.value);
  return response;
}

export const config={
  matcher:['/((?!_next/static|_next/image|favicon\\.ico|icons|manifest\\.json|sw\\.js).*)'],
};
