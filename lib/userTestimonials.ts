import {educationLevelKey} from '@/lib/educationLevelProfile';

export const TESTIMONIAL_MIN_DAYS=30;
export const TESTIMONIAL_SNOOZE_DAYS=30;

export type TestimonialRole='STUDENT'|'PARENT'|'COACH';

function daysBetween(start:Date,end:Date){
  return Math.max(0,Math.floor((end.getTime()-start.getTime())/86400000));
}

export function testimonialUsageMonths(start:Date,now=new Date()){
  return Math.max(1,Math.floor(daysBetween(start,now)/30));
}

export function testimonialEligible(start:Date,now=new Date()){
  return daysBetween(start,now)>=TESTIMONIAL_MIN_DAYS;
}

function trackLabel(track?:string|null){
  const t=(track||'').toLocaleUpperCase('tr-TR');
  if(t.includes('SAY'))return 'Sayısal';
  if(t.includes('EŞİT')||t.includes('ESIT'))return 'Eşit Ağırlık';
  if(t.includes('SÖZ')||t.includes('SOZ'))return 'Sözel';
  if(t.includes('DİL')||t.includes('DIL'))return 'Dil';
  return '';
}

export function testimonialAudienceLabel(role:TestimonialRole,gradeLevel?:string|null,academicTrack?:string|null){
  if(role==='COACH')return 'KEKS Partner Koç';

  const raw=(gradeLevel||'').trim();
  const key=educationLevelKey(raw);
  const track=trackLabel(academicTrack);
  let studentLabel='KEKS öğrencisi';

  if(key==='PRIMARY_123')studentLabel='İlkokul 1-3. sınıf öğrencisi';
  else if(key==='PRIMARY_4')studentLabel='4. sınıf öğrencisi';
  else if(key==='MIDDLE_56')studentLabel='Ortaokul 5-6. sınıf öğrencisi';
  else if(key==='MIDDLE_7')studentLabel='7. sınıf öğrencisi';
  else if(key==='MIDDLE_8')studentLabel='8. sınıf LGS öğrencisi';
  else if(key==='HIGH_910')studentLabel='Lise 9-10. sınıf öğrencisi';
  else if(key==='HIGH_11')studentLabel='11. sınıf'+(track?' '+track:'')+' öğrencisi';
  else if(key==='HIGH_12')studentLabel='12. sınıf YKS öğrencisi';
  else if(key==='GRADUATE_YKS')studentLabel='Mezun YKS öğrencisi';
  else if(/KPSS|EKPSS/i.test(raw))studentLabel='KPSS / EKPSS öğrencisi';
  else if(/DGS/i.test(raw))studentLabel='DGS öğrencisi';
  else if(/ALES/i.test(raw))studentLabel='ALES öğrencisi';
  else if(/YÖKDİL|YOKDIL/i.test(raw))studentLabel='YÖKDİL öğrencisi';
  else if(/YDS/i.test(raw))studentLabel='YDS öğrencisi';
  else if(/AGS\s*\/\s*ÖABT|AGS\s*\/\s*OABT/i.test(raw))studentLabel='AGS / ÖABT öğrencisi';
  else if(/AGS\s*\/\s*YDS/i.test(raw))studentLabel='AGS / YDS öğrencisi';

  if(role==='PARENT')return studentLabel.replace('öğrencisi','velisi');
  return studentLabel;
}

export function testimonialContextLabel(input:{
  role:TestimonialRole;
  usageStartedAt:Date;
  gradeLevel?:string|null;
  academicTrack?:string|null;
  now?:Date;
}){
  const months=testimonialUsageMonths(input.usageStartedAt,input.now||new Date());
  return testimonialAudienceLabel(input.role,input.gradeLevel,input.academicTrack)+' · '+months+' ay KEKS kullanıcısı';
}

function escapeRegex(value:string){
  return value.replace(/[.*+?^\x24{}()|[\]\\]/g,'\\$&');
}

function normalizePrivateTokens(tokens:Array<string|null|undefined>){
  return [...new Set(tokens
    .filter((x):x is string=>typeof x==='string')
    .map(x=>x.trim())
    .filter(x=>x.length>=3))]
    .sort((a,b)=>b.length-a.length);
}

export function sanitizeTestimonial(input:string,privateTokens:Array<string|null|undefined>=[]){
  let text=input.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
  let flagged=false;

  const replacements:Array<[RegExp,string]>=[
    [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[e-posta kaldırıldı]'],
    [/https?:\/\/\S+|www\.\S+/gi,'[bağlantı kaldırıldı]'],
    [/(?:\+?90[\s.-]?)?(?:0?[\s.-]?)?5\d{2}[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}\b/g,'[telefon kaldırıldı]'],
    [/\b[1-9]\d{10}\b/g,'[kimlik bilgisi kaldırıldı]']
  ];
  for(const [pattern,replacement] of replacements){
    if(pattern.test(text)){
      flagged=true;
      pattern.lastIndex=0;
      text=text.replace(pattern,replacement);
    }
  }

  for(const token of normalizePrivateTokens(privateTokens)){
    const pattern=new RegExp(escapeRegex(token),'giu');
    if(pattern.test(text)){
      flagged=true;
      text=text.replace(pattern,'[kişisel bilgi kaldırıldı]');
    }
  }

  const institution=/\b[\p{L}'’-]+(?:\s+[\p{L}'’-]+){0,4}\s+(?:Lisesi|Ortaokulu|İlkokulu|Okulu|Koleji|Üniversitesi|Kursu|Dershanesi)\b/iu;
  const addressHint=/\b(?:mahallesi|mah\.|sokak|sok\.|cadde|cad\.|apartmanı|apt\.)\b/iu;
  const socialHandle=/(^|\s)@[a-z0-9_.]{3,}/i;
  if(institution.test(text)||addressHint.test(text)||socialHandle.test(text))flagged=true;

  text=text.replace(/\s+/g,' ').trim().slice(0,800);
  return {sanitized:text,piiFlagged:flagged};
}

export function testimonialSubmissionStatus(publishConsent:boolean,piiFlagged:boolean){
  if(!publishConsent)return 'PRIVATE';
  return piiFlagged?'REVIEW':'PUBLISHED';
}
