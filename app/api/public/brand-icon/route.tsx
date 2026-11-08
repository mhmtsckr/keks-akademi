import {readFile} from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

export const runtime='nodejs';
export const dynamic='force-dynamic';

// Cache only the two sizes declared in the web app manifest.
// Unlike next/og's ImageResponse, sharp reliably decodes the approved WebP logo.
const iconCache=new Map<number,Promise<Buffer>>();

async function pngIcon(size:number):Promise<Buffer>{
  let pending=iconCache.get(size);
  if(!pending){
    pending=readFile(path.join(process.cwd(),'public/keks-brand-navy-icon.webp'))
      .then(source=>sharp(source).resize(size,size,{fit:'contain',background:'#071a30'}).png().toBuffer())
      .catch((error:unknown)=>{
        iconCache.delete(size);
        throw error;
      });
    iconCache.set(size,pending);
  }
  return pending;
}

/** Return real, correctly sized PNG icons for the site and PWA installation. */
export async function GET(request:Request){
  const requestedSize=new URL(request.url).searchParams.get('size');
  const size=requestedSize==='192'?192:512;
  const bytes=await pngIcon(size);
  return new Response(new Uint8Array(bytes),{
    status:200,
    headers:{
      'Content-Type':'image/png',
      'Cache-Control':'public, max-age=86400, s-maxage=86400',
      'X-Content-Type-Options':'nosniff',
    },
  });
}
