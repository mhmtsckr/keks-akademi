import crypto from 'node:crypto';
import {NextRequest,NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {buildWhatsAppPlanReply,looksLikeKeksPlanInquiry,WHATSAPP_LEVEL_PROMPT} from '@/lib/whatsappPlanReply';

export const runtime='nodejs';
export const dynamic='force-dynamic';

type IncomingTextMessage={
  from?:string;
  id?:string;
  type?:string;
  text?:{body?:string};
};

type WhatsAppWebhookPayload={
  entry?:Array<{
    changes?:Array<{
      value?:{
        messages?:IncomingTextMessage[];
      };
    }>;
  }>;
};

function verifySignature(rawBody:string,signature:string|null){
  const secret=process.env.WHATSAPP_APP_SECRET;
  if(!secret||!signature?.startsWith('sha256='))return false;
  const expected='sha256='+crypto.createHmac('sha256',secret).update(rawBody).digest('hex');
  const a=Buffer.from(signature);
  const b=Buffer.from(expected);
  return a.length===b.length&&crypto.timingSafeEqual(a,b);
}

function getConfig(){
  const accessToken=process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId=process.env.WHATSAPP_PHONE_NUMBER_ID;
  const verifyToken=process.env.WHATSAPP_VERIFY_TOKEN;
  const graphVersion=process.env.WHATSAPP_GRAPH_VERSION;
  if(!accessToken||!phoneNumberId||!verifyToken||!graphVersion)return null;
  return {accessToken,phoneNumberId,verifyToken,graphVersion};
}

async function sendText(to:string,body:string){
  const config=getConfig();
  if(!config)throw new Error('WhatsApp Cloud API yapılandırması eksik.');
  const endpoint=`https://graph.facebook.com/${config.graphVersion}/${config.phoneNumberId}/messages`;
  const response=await fetch(endpoint,{
    method:'POST',
    headers:{
      Authorization:`Bearer ${config.accessToken}`,
      'Content-Type':'application/json'
    },
    body:JSON.stringify({
      messaging_product:'whatsapp',
      recipient_type:'individual',
      to,
      type:'text',
      text:{preview_url:false,body}
    })
  });
  if(!response.ok){
    const detail=(await response.text()).slice(0,800);
    throw new Error(`WhatsApp API ${response.status}: ${detail}`);
  }
}

function incomingMessages(payload:WhatsAppWebhookPayload){
  return (payload.entry??[])
    .flatMap(entry=>entry.changes??[])
    .flatMap(change=>change.value?.messages??[])
    .filter(message=>message.type==='text'&&message.id&&message.from&&message.text?.body);
}

export async function GET(request:NextRequest){
  const config=getConfig();
  if(!config)return new NextResponse('WhatsApp yapılandırması eksik.',{status:503});

  const mode=request.nextUrl.searchParams.get('hub.mode');
  const token=request.nextUrl.searchParams.get('hub.verify_token');
  const challenge=request.nextUrl.searchParams.get('hub.challenge');

  if(mode==='subscribe'&&token===config.verifyToken&&challenge){
    return new NextResponse(challenge,{status:200,headers:{'Content-Type':'text/plain'}});
  }
  return new NextResponse('Doğrulama başarısız.',{status:403});
}

export async function POST(request:NextRequest){
  const rawBody=await request.text();
  if(!verifySignature(rawBody,request.headers.get('x-hub-signature-256'))){
    return NextResponse.json({ok:false,error:'invalid_signature'},{status:401});
  }

  let payload:WhatsAppWebhookPayload;
  try{
    payload=JSON.parse(rawBody) as WhatsAppWebhookPayload;
  }catch{
    return NextResponse.json({ok:false,error:'invalid_json'},{status:400});
  }

  const messages=incomingMessages(payload);
  if(messages.length===0)return NextResponse.json({ok:true,handled:0});

  let handled=0;
  for(const message of messages){
    const messageId=message.id!;
    const from=message.from!;
    const body=message.text!.body!;

    const duplicate=await db.auditLog.findFirst({
      where:{
        action:'WHATSAPP_AUTO_REPLY',
        entityType:'WHATSAPP_MESSAGE',
        entityId:messageId
      },
      select:{id:true}
    });
    if(duplicate)continue;

    const planReply=buildWhatsAppPlanReply(body);
    const reply=planReply??(looksLikeKeksPlanInquiry(body)?WHATSAPP_LEVEL_PROMPT:null);
    if(!reply)continue;

    await sendText(from,reply);
    await db.auditLog.create({
      data:{
        action:'WHATSAPP_AUTO_REPLY',
        entityType:'WHATSAPP_MESSAGE',
        entityId:messageId,
        summary:planReply?'Eğitim düzeyine uygun paket yanıtı gönderildi.':'Eğitim düzeyi bilgisi istendi.',
        metadata:{
          source:'WHATSAPP_CLOUD_API',
          replyType:planReply?'PLAN':'LEVEL_PROMPT'
        }
      }
    });
    handled++;
  }

  return NextResponse.json({ok:true,handled});
}
