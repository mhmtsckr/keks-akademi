import {NextResponse} from 'next/server';
import {z} from 'zod';
import {db} from '@/lib/db';
import {HttpError,readJson,withApiErrors} from '@/lib/apiGuard';
import {authHash,clientIp} from '@/lib/authAbuse';
import {sendCallbackRequest} from '@/lib/mailer';
import {upsertSalesLeadInquiry} from '@/lib/salesLead';
import {detectStudentPlanFromWhatsAppMessage} from '@/lib/whatsappPlanReply';

const callbackSchema=z.object({
  name:z.string().trim().min(2).max(80),
  phone:z.string().trim().min(10).max(24).regex(/^[0-9+() .-]+$/,'Telefon numarası geçersiz.'),
  audience:z.enum(['ÖĞRENCİ','VELİ','PARTNER_KOÇ']),
  education:z.string().trim().max(80).default(''),
  preferredTime:z.enum(['09:00–12:00','12:00–15:00','15:00–18:00','18:00–21:00']),
  note:z.string().trim().max(500).default(''),
  consent:z.literal(true),
  website:z.string().max(200).optional()
});

async function POST__handler(req:Request){
  const input=await readJson(req,callbackSchema);

  // Botlar için görünmez alan doluysa sessizce başarı döndür.
  if(input.website)return NextResponse.json({ok:true});

  const ipId='callback-ip:'+authHash(clientIp(req));
  const phoneDigits=input.phone.replace(/\D/g,'');
  if(phoneDigits.length<10||phoneDigits.length>15)throw new HttpError(400,'Telefon numarası geçersiz.');
  const phoneId='callback-phone:'+authHash(phoneDigits);
  const hourAgo=new Date(Date.now()-60*60*1000);
  const dayAgo=new Date(Date.now()-24*60*60*1000);
  const [ipCount,phoneCount]=await Promise.all([
    db.auditLog.count({where:{action:'PUBLIC_CALLBACK_REQUEST',entityType:'PublicLead',entityId:ipId,createdAt:{gte:hourAgo}}}),
    db.auditLog.count({where:{action:'PUBLIC_CALLBACK_REQUEST_PHONE',entityType:'PublicLead',entityId:phoneId,createdAt:{gte:dayAgo}}})
  ]);
  if(ipCount>=5||phoneCount>=3)throw new HttpError(429,'Çok fazla arama talebi gönderildi. Lütfen daha sonra tekrar deneyin.');

  const audienceLabel=input.audience==='PARTNER_KOÇ'?'KEKS Partner Koç':input.audience==='VELİ'?'Veli':'Öğrenci';
  const detectedPlan=detectStudentPlanFromWhatsAppMessage(input.education);
  const lead=await upsertSalesLeadInquiry({
    source:'CALLBACK',
    phone:input.phone,
    name:input.name,
    audience:input.audience,
    educationLevel:detectedPlan?.plan.level||input.education,
    inquiryPlanId:detectedPlan?.plan.id||null,
    preferredTime:input.preferredTime,
    note:input.note
  });

  let mailDelivered=false;
  try{
    const result=await sendCallbackRequest({
      name:input.name,
      phone:input.phone,
      audience:audienceLabel,
      education:input.education,
      preferredTime:input.preferredTime,
      note:input.note
    });
    mailDelivered=!('skipped' in result&&result.skipped);
  }catch{
    mailDelivered=false;
  }

  await Promise.all([
    db.auditLog.create({data:{action:'PUBLIC_CALLBACK_REQUEST',entityType:'SalesLead',entityId:lead.id,summary:'Abonelik sayfasından arama talebi CRM lead olarak kaydedildi.',metadata:{audience:input.audience,preferredTime:input.preferredTime,mailDelivered}}}),
    db.auditLog.create({data:{action:'PUBLIC_CALLBACK_REQUEST_PHONE',entityType:'PublicLead',entityId:phoneId,summary:'Telefon bazlı arama talebi kotası kaydedildi.'}})
  ]);

  return NextResponse.json({ok:true,leadId:lead.id,mailDelivered});
}

export const POST=withApiErrors(POST__handler);
