import {ImageResponse} from 'next/og';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

export const runtime='nodejs';
export const dynamic='force-dynamic';

/**
 * Generate installable 192/512px PNG icons from the approved KEKS logo.
 * The source artwork is the same file used for native Android launcher icons.
 */
export async function GET(request:Request){
  const size=new URL(request.url).searchParams.get('size')==='192'?192:512;
  const bytes=await readFile(path.join(process.cwd(),'public/keks-brand-navy-icon.webp'));
  const dataUri='data:image/webp;base64,'+bytes.toString('base64');
  return new ImageResponse(
    <div style={{
      display:'flex',width:'100%',height:'100%',alignItems:'center',
      justifyContent:'center',backgroundColor:'#071a30'
    }}>
      <img alt="KEKS Akademi" src={dataUri} width={size} height={size}
        style={{width:size,height:size}}/>
    </div>,
    {width:size,height:size,headers:{'Cache-Control':'public, max-age=86400'}}
  );
}
