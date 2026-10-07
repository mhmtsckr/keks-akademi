import {db} from '@/lib/db';

export const SALES_LEAD_STATUSES=['NEW','CALLED','SPOKEN','PACKAGE_RECOMMENDED','WON','LOST'] as const;
export type SalesLeadStatus=(typeof SALES_LEAD_STATUSES)[number];
export type SalesLeadSource='CALLBACK'|'WHATSAPP';

export const SALES_LEAD_STATUS_LABELS:Record<SalesLeadStatus,string>={
  NEW:'Yeni',
  CALLED:'Arandı',
  SPOKEN:'Görüşüldü',
  PACKAGE_RECOMMENDED:'Paket Önerildi',
  WON:'Kazanıldı',
  LOST:'Kaybedildi'
};

export function normalizeLeadPhone(value:string){
  const digits=value.replace(/\D/g,'');
  if(digits.length<10||digits.length>15)throw new Error('Telefon numarası geçersiz.');
  if(digits.startsWith('90'))return digits;
  if(digits.startsWith('0'))return '90'+digits.slice(1);
  if(digits.length===10)return '90'+digits;
  return digits;
}

export function salesLeadTimestampPatch(status:SalesLeadStatus,now=new Date()){
  if(status==='CALLED'||status==='SPOKEN'||status==='PACKAGE_RECOMMENDED'){
    return {lastContactedAt:now};
  }
  if(status==='WON'){
    return {lastContactedAt:now,wonAt:now,lostAt:null};
  }
  if(status==='LOST'){
    return {lastContactedAt:now,lostAt:now,wonAt:null};
  }
  return {};
}

type InquiryInput={
  source:SalesLeadSource;
  phone:string;
  name?:string|null;
  audience?:string|null;
  educationLevel?:string|null;
  inquiryPlanId?:string|null;
  preferredTime?:string|null;
  note?:string|null;
  lastMessage?:string|null;
};

export async function upsertSalesLeadInquiry(input:InquiryInput){
  const phoneNormalized=normalizeLeadPhone(input.phone);
  const now=new Date();
  return db.salesLead.upsert({
    where:{phoneNormalized},
    create:{
      phone:input.phone,
      phoneNormalized,
      name:input.name?.trim()||null,
      source:input.source,
      lastSource:input.source,
      inquiryCount:1,
      callbackRequestCount:input.source==='CALLBACK'?1:0,
      whatsappRequestCount:input.source==='WHATSAPP'?1:0,
      audience:input.audience||null,
      educationLevel:input.educationLevel?.trim()||null,
      inquiryPlanId:input.inquiryPlanId||null,
      preferredTime:input.preferredTime||null,
      note:input.note?.trim()||null,
      lastMessage:input.lastMessage?.trim()||null,
      firstSeenAt:now,
      lastSeenAt:now
    },
    update:{
      phone:input.phone,
      lastSource:input.source,
      lastSeenAt:now,
      inquiryCount:{increment:1},
      ...(input.source==='CALLBACK'?{callbackRequestCount:{increment:1}}:{whatsappRequestCount:{increment:1}}),
      ...(input.name?.trim()?{name:input.name.trim()}:{}),
      ...(input.audience?{audience:input.audience}:{}),
      ...(input.educationLevel?.trim()?{educationLevel:input.educationLevel.trim()}:{}),
      ...(input.inquiryPlanId?{inquiryPlanId:input.inquiryPlanId}:{}),
      ...(input.preferredTime?{preferredTime:input.preferredTime}:{}),
      ...(input.note?.trim()?{note:input.note.trim()}:{}),
      ...(input.lastMessage?.trim()?{lastMessage:input.lastMessage.trim()}:{})
    }
  });
}
