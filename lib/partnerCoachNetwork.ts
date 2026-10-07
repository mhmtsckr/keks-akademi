import {db} from '@/lib/db';
import {normalizeEducationLevelLabel} from '@/lib/taskEvaluation';

export const KEKS_PARTNER_STANDARD_VERSION='KEKS_PARTNER_V1';

export const KEKS_PARTNER_SPECIALTIES=[
  'İlkokul çalışma alışkanlığı',
  'Proje ortaokuluna hazırlık',
  'LGS',
  'YKS Sayısal',
  'YKS Eşit Ağırlık',
  'YKS Sözel',
  'YKS Dil',
  'KPSS / EKPSS',
  'DGS / ALES',
  'YDS / YÖKDİL',
  'AGS / ÖABT',
  'Planlama ve zaman yönetimi',
  'Tekrar ve öğrenme sistemi',
  'Deneme analizi',
  'Motivasyon ve süreklilik'
] as const;

export const KEKS_PARTNER_OPERATION_STANDARDS=[
  {key:'RESPONSE',title:'Zamanında yanıt ve takip',target:'Takip işleri için hedef yanıt süresi ≤ 24 saat'},
  {key:'SESSION_COMPLETION',title:'Görüşme disiplini',target:'Planlanan görüşmelerin en az %85’ini tamamlama'},
  {key:'SESSION_ACTION',title:'Görüşme sonrası aksiyon',target:'Tamamlanan görüşmeden sonra 24 saat içinde aksiyon oluşturma'},
  {key:'INTERVENTION',title:'Öğrenci sinyaline müdahale',target:'Geç görev / alarm sinyaline 48 saat içinde müdahale'},
  {key:'REVIEW',title:'Tekrar takibi',target:'Geciken tekrar sinyaline 72 saat içinde takip'},
  {key:'REPORT',title:'Rapor disiplini',target:'Uygun öğrenciler için 30 günlük gelişim raporu kapsaması'}
] as const;

type PartnerCoachRecord={
  id:string;
  userId:string;
  name:string;
  displayTitle:string|null;
  bio:string|null;
  specialties:string[];
  supportedEducationLevels:string[];
  maxActiveStudents:number;
  acceptingStudents:boolean;
  partnerStatus:string;
  responseTargetHours:number;
  studentCount:number;
  responseHours:number|null;
  sessionCompletionRate:number|null;
  profileCompleteness:number;
};

export type PartnerCoachMatch=PartnerCoachRecord&{
  availableSlots:number;
  eligible:boolean;
  fitReasons:string[];
  fitRank:number;
};

function strings(value:unknown){
  return Array.isArray(value)?value.filter((x):x is string=>typeof x==='string'&&x.trim().length>0).map(x=>x.trim()):[];
}

export function normalizePartnerLevels(value:unknown){
  return strings(value).map(x=>normalizeEducationLevelLabel(x)||x);
}

export function median(values:number[]){
  if(!values.length)return null;
  const sorted=[...values].sort((a,b)=>a-b);
  const mid=Math.floor(sorted.length/2);
  return sorted.length%2?sorted[mid]:(sorted[mid-1]+sorted[mid])/2;
}

export function coachSupportsEducationLevel(levels:string[],gradeLevel?:string|null){
  if(!gradeLevel)return true;
  if(!levels.length)return true;
  const normalized=normalizeEducationLevelLabel(gradeLevel)||gradeLevel;
  return levels.some(x=>(normalizeEducationLevelLabel(x)||x)===normalized);
}

function specialtyFit(specialties:string[],gradeLevel?:string|null,academicTrack?:string|null){
  const level=(gradeLevel||'').toLocaleUpperCase('tr-TR');
  const track=(academicTrack||'').toLocaleUpperCase('tr-TR');
  const wanted:string[]=[];
  if(level.includes('ORTAOKUL 8')||level.includes('LGS'))wanted.push('LGS');
  if(level.includes('LİSE 12')||level.includes('MEZUN')||level.includes('YKS')){
    if(track.includes('SAY'))wanted.push('YKS Sayısal');
    else if(track.includes('EŞİT')||track.includes('ESIT'))wanted.push('YKS Eşit Ağırlık');
    else if(track.includes('SÖZ')||track.includes('SOZ'))wanted.push('YKS Sözel');
    else if(track.includes('DİL')||track.includes('DIL'))wanted.push('YKS Dil');
  }
  if(level.includes('KPSS')||level.includes('EKPSS'))wanted.push('KPSS / EKPSS');
  if(level.includes('DGS')||level.includes('ALES'))wanted.push('DGS / ALES');
  if(level.includes('YDS')||level.includes('YÖKDİL'))wanted.push('YDS / YÖKDİL');
  if(level.includes('AGS')||level.includes('ÖABT'))wanted.push('AGS / ÖABT');
  const matched=wanted.filter(x=>specialties.includes(x));
  return {wanted,matched};
}

function profileCompleteness(input:{displayTitle:string|null;bio:string|null;specialties:string[];supportedEducationLevels:string[]}){
  let points=0;
  if(input.displayTitle?.trim())points+=25;
  if(input.bio?.trim()&&input.bio.trim().length>=30)points+=25;
  if(input.specialties.length)points+=25;
  if(input.supportedEducationLevels.length)points+=25;
  return points;
}

function roundedHours(v:number|null){
  return v==null?null:Math.round(v*10)/10;
}

export function rankPartnerCoach(input:PartnerCoachRecord,student:{gradeLevel?:string|null;academicTrack?:string|null}):PartnerCoachMatch{
  const levelMatch=coachSupportsEducationLevel(input.supportedEducationLevels,student.gradeLevel);
  const specialty=specialtyFit(input.specialties,student.gradeLevel,student.academicTrack);
  const availableSlots=Math.max(0,input.maxActiveStudents-input.studentCount);
  const eligible=input.partnerStatus==='ACTIVE'&&input.acceptingStudents&&availableSlots>0&&levelMatch;
  const fitReasons:string[]=[];
  let fitRank=0;

  if(levelMatch&&input.supportedEducationLevels.length){fitRank+=50;fitReasons.push('Eğitim düzeyini aktif olarak takip ediyor.')}
  else if(levelMatch){fitRank+=15;fitReasons.push('Düzey kapsamı henüz profilinde doğrulanmadı; mevcut Partner Koç havuzunda değerlendirildi.')}
  if(specialty.matched.length){fitRank+=20;fitReasons.push('Uzmanlık eşleşmesi: '+specialty.matched.join(', ')+'.')}
  if(availableSlots>0){fitRank+=Math.min(10,availableSlots);fitReasons.push(availableSlots+' öğrenci kapasitesi açık.')}
  if(input.responseHours!=null&&input.responseHours<=input.responseTargetHours){fitRank+=10;fitReasons.push('Son 30 günlük takip yanıt medyanı hedef süre içinde.')}
  if(input.sessionCompletionRate!=null&&input.sessionCompletionRate>=85){fitRank+=10;fitReasons.push('Görüşme tamamlama oranı KEKS standardında.')}
  if(input.responseHours==null)fitReasons.push('Yanıt süresi için henüz yeterli operasyon örneği yok.')
  if(input.sessionCompletionRate==null)fitReasons.push('Görüşme tamamlama oranı için henüz yeterli örnek yok.')

  return {...input,availableSlots,eligible,fitReasons,fitRank};
}

export async function buildPartnerCoachDirectory(student:{gradeLevel?:string|null;academicTrack?:string|null}={}){
  const now=new Date();
  const start=new Date(now.getTime()-30*86400000);
  const coaches=await db.coachProfile.findMany({
    where:{
      user:{status:'ACTIVE',role:'COACH'},
      partnerStatus:'ACTIVE'
    },
    select:{
      id:true,userId:true,displayTitle:true,bio:true,specialties:true,supportedEducationLevels:true,
      maxActiveStudents:true,acceptingStudents:true,partnerStatus:true,responseTargetHours:true,
      user:{select:{name:true}},
      _count:{select:{students:true}}
    },
    take:100
  });
  if(!coaches.length)return [] as PartnerCoachMatch[];

  const coachIds=coaches.map(x=>x.id);
  const [tasks,sessions]=await Promise.all([
    db.coachTask.findMany({
      where:{coachId:{in:coachIds},createdAt:{gte:start,lte:now}},
      select:{coachId:true,createdAt:true,completedAt:true}
    }),
    db.coachingSession.findMany({
      where:{coachId:{in:coachIds},startsAt:{gte:start,lte:now},status:{not:'CANCELLED'}},
      select:{coachId:true,startsAt:true,status:true,completedAt:true}
    })
  ]);

  const directory=coaches.map(coach=>{
    const coachTasks=tasks.filter(x=>x.coachId===coach.id);
    const completedTaskHours=coachTasks
      .filter(x=>x.completedAt)
      .map(x=>Math.max(0,(x.completedAt!.getTime()-x.createdAt.getTime())/3600000));
    const responseHours=roundedHours(median(completedTaskHours));

    const coachSessions=sessions.filter(x=>x.coachId===coach.id);
    const completedSessions=coachSessions.filter(x=>Boolean(x.completedAt)||x.status==='COMPLETED').length;
    const sessionCompletionRate=coachSessions.length?Math.round(completedSessions/coachSessions.length*100):null;

    const specialties=strings(coach.specialties);
    const supportedEducationLevels=normalizePartnerLevels(coach.supportedEducationLevels);
    const record:PartnerCoachRecord={
      id:coach.id,
      userId:coach.userId,
      name:coach.user.name,
      displayTitle:coach.displayTitle,
      bio:coach.bio,
      specialties,
      supportedEducationLevels,
      maxActiveStudents:coach.maxActiveStudents,
      acceptingStudents:coach.acceptingStudents,
      partnerStatus:coach.partnerStatus,
      responseTargetHours:coach.responseTargetHours,
      studentCount:coach._count.students,
      responseHours,
      sessionCompletionRate,
      profileCompleteness:profileCompleteness({displayTitle:coach.displayTitle,bio:coach.bio,specialties,supportedEducationLevels})
    };
    return rankPartnerCoach(record,student);
  });

  return directory
    .filter(x=>x.eligible)
    .sort((a,b)=>b.fitRank-a.fitRank||a.studentCount-b.studentCount||a.name.localeCompare(b.name,'tr'));
}
