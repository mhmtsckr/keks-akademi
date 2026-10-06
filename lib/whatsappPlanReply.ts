import {STUDENT_PLANS,STUDENT_TERM_PRICING,type KeksPlan} from '@/lib/subscriptionPlans';

export type WhatsAppPlanMatch={
  plan:KeksPlan;
  pricing:(typeof STUDENT_TERM_PRICING)[string];
};

const normalize=(value:string)=>value
  .toLocaleLowerCase('tr-TR')
  .replaceAll('ç','c')
  .replaceAll('ğ','g')
  .replaceAll('ı','i')
  .replaceAll('ö','o')
  .replaceAll('ş','s')
  .replaceAll('ü','u')
  .replace(/[–—−]/g,'-')
  .replace(/[./()]/g,' ')
  .replace(/\s+/g,' ')
  .trim();

function planById(id:string):WhatsAppPlanMatch|null{
  const plan=STUDENT_PLANS.find(item=>item.id===id);
  const pricing=STUDENT_TERM_PRICING[id];
  return plan&&pricing?{plan,pricing}:null;
}

export function detectStudentPlanFromWhatsAppMessage(message:string):WhatsAppPlanMatch|null{
  const text=normalize(message);

  for(const plan of STUDENT_PLANS){
    if(text.includes(normalize(plan.level))){
      return planById(plan.id);
    }
  }

  if(/\bags\s*(?:\/|\+|ve)?\s*oabt\b/.test(text)||text.includes('ogretmen 360'))return planById('student-teacher-360');
  if(/\bags\s*(?:\/|\+|ve)?\s*yds\b/.test(text))return planById('student-ags-language');
  if(/\byokdil\b/.test(text)||/\byds\b/.test(text))return planById('student-language');
  if(/\bkpss\b/.test(text)||/\bekpss\b/.test(text))return planById('student-kamu');
  if(/\bdgs\b/.test(text))return planById('student-dgs');
  if(/\bales\b/.test(text))return planById('student-ales');
  if(/\bmezun\b/.test(text))return planById('student-mezun-360');

  const gradeMatch=text.match(/(?:^|\D)(1[0-2]|[1-9])\s*\.?\s*(?:sinif|sinifi)\b/);
  if(gradeMatch){
    const grade=Number(gradeMatch[1]);
    if(grade<=3)return planById('student-primary-12');
    if(grade===4)return planById('student-primary-34');
    if(grade<=6)return planById('student-middle-56');
    if(grade===7)return planById('student-lgs-prep');
    if(grade===8)return planById('student-lgs-360');
    if(grade<=10)return planById('student-high-910');
    if(grade===11)return planById('student-yks-prep');
    if(grade===12)return planById('student-yks-360');
  }

  if(/\blgs\b/.test(text))return planById('student-lgs-360');
  if(/\byks\b/.test(text))return planById('student-yks-360');

  return null;
}

const price=(value:number)=>value.toLocaleString('tr-TR')+' TL';

export function buildWhatsAppPlanReply(message:string):string|null{
  const match=detectStudentPlanFromWhatsAppMessage(message);
  if(!match)return null;

  const {plan,pricing}=match;
  const parent=normalize(message).includes('veliyim');
  const intro=parent
    ? 'Çocuğunuz için paylaştığınız eğitim düzeyine göre uygun KEKS paketi:'
    : 'Paylaştığınız eğitim düzeyine göre uygun KEKS paketi:';

  return [
    'Merhaba, KEKS Akademi’ye hoş geldiniz! 👋',
    '',
    intro,
    `🎓 ${plan.level}`,
    `📦 ${plan.name}`,
    '',
    '💳 Abonelik seçenekleri:',
    `• İlk ay özel: ${price(pricing.firstMonth)}`,
    `• Aylık: ${price(pricing.monthly)} / ay`,
    `• 3 aylık: ${price(pricing.threeMonths)}`,
    `• 6 aylık: ${price(pricing.sixMonths)}`,
    `• Yıllık: ${price(pricing.annual)}`,
    '',
    '✅ Pakete dahil:',
    ...plan.features.map(feature=>`• ${feature}`),
    '',
    'Detaylı paket karşılaştırması:',
    'https://keksakademi.vercel.app/abonelik-planlari',
    '',
    'İsterseniz hedefinizi ve mevcut çalışma durumunu da yazabilirsiniz; size uygun başlangıç yolunu birlikte netleştirebiliriz.'
  ].join('\n');
}

export function looksLikeKeksPlanInquiry(message:string){
  const text=normalize(message);
  return text.includes('keks akademi')&&(
    text.includes('abonelik plan')||
    text.includes('paket')||
    text.includes('ucret')
  );
}

export const WHATSAPP_LEVEL_PROMPT='Eğitim düzeyinizi veya hazırlanılan sınavı (ör. İlkokul 4 | Proje Ortaokuluna Hazırlık, Ortaokul 8 | Maarif Model, Lise 11 | Maarif Model (Alan), Lise 12 | YKS, Mezun | YKS, KPSS, DGS, ALES, YDS, AGS / ÖABT) yazarsanız size uygun KEKS paketini ve güncel ücretleri hemen paylaşabilirim.';
