import { NextResponse } from 'next/server';

export async function POST(){
  return NextResponse.json({
    error:'Online ödeme şu anda kullanılmıyor. Paket bilgisi ve kayıt için WhatsApp üzerinden KEKS Akademi ile iletişime geçin.'
  },{status:410});
}
