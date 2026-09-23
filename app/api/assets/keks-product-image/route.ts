import { KEKS_PRODUCT_IMAGE_BASE64 } from '@/lib/keksProductImage';

export const dynamic='force-static';

export async function GET(){
  const bytes=Uint8Array.from(Buffer.from(KEKS_PRODUCT_IMAGE_BASE64,'base64'));
  return new Response(bytes,{
    headers:{
      'Content-Type':'image/webp',
      'Cache-Control':'public, max-age=31536000, immutable',
      'Content-Disposition':'inline; filename="keks-egilim-on-gorusme.webp"'
    }
  });
}
