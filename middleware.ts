import { NextRequest,NextResponse } from 'next/server';

function validRequestId(value:string|null){
  return Boolean(value&&/^[A-Za-z0-9._:-]{8,100}$/.test(value));
}

export function middleware(request:NextRequest){
  const requestId=validRequestId(request.headers.get('x-request-id'))
    ?request.headers.get('x-request-id')!
    :crypto.randomUUID();
  const requestHeaders=new Headers(request.headers);
  requestHeaders.set('x-request-id',requestId);
  const response=NextResponse.next({request:{headers:requestHeaders}});
  response.headers.set('x-request-id',requestId);
  return response;
}

export const config={matcher:'/api/:path*'};
