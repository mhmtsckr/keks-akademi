import {NextRequest} from 'next/server';
import {parseOpticalTest,readOpticalMarks} from '@/lib/paragrafOptik';
import {opticalResultQrSvg} from '@/lib/paragrafOptikQr';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:NextRequest,context:{params:Promise<{testNo:string}>}){
 const {testNo}=await context.params;
 const test=parseOpticalTest(testNo);
 const encoded=request.nextUrl.searchParams.get('c')||'';
 if(test===null||!readOpticalMarks(encoded))return new Response('Bad test or answers',{status:400,headers:{'Cache-Control':'no-store'}});
 const url='https://keksakademi.vercel.app/paragraf/optik/'+testNo+'/sonuc?c='+encoded;
 const svg=opticalResultQrSvg(url);
 if(!svg)return new Response('QR unavailable',{status:400,headers:{'Cache-Control':'no-store'}});
 return new Response(svg,{status:200,headers:{
  'Content-Type':'image/svg+xml; charset=utf-8',
  'Cache-Control':'private, no-store, max-age=0',
  'X-Content-Type-Options':'nosniff',
  'Content-Security-Policy':"default-src 'none'; style-src 'none'; sandbox"
 }});
}
