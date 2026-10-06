import {publicEducationContext,resolveEducationLevelProfile,scalePracticeQuestionsForEducationLevel} from '@/lib/educationLevelProfile';

export const STUDENT_ONBOARDING_VERSION=1;

type RecordLike=Record<string,any>;

function record(value:unknown):RecordLike{
  return value&&typeof value==='object'&&!Array.isArray(value)?value as RecordLike:{};
}

export function studentOnboardingState(profile:unknown){
  const root=record(profile);
  const raw=record(root.onboarding);
  return {
    status:raw.status==='REQUIRED'||raw.status==='COMPLETED'?raw.status as 'REQUIRED'|'COMPLETED':'LEGACY' as const,
    version:Number(raw.version)||0,
    completedAt:typeof raw.completedAt==='string'?raw.completedAt:null,
    starterPlanId:typeof raw.starterPlanId==='string'?raw.starterPlanId:null
  };
}

export function isStudentOnboardingRequired(profile:unknown){
  return studentOnboardingState(profile).status==='REQUIRED';
}

export function withRequiredStudentOnboarding(profile:unknown,at=new Date().toISOString()){
  const root=record(profile);
  return {
    ...root,
    onboarding:{
      version:STUDENT_ONBOARDING_VERSION,
      status:'REQUIRED',
      requiredAt:at,
      completedAt:null,
      starterPlanId:null
    }
  };
}

export function subjectsForOnboarding(gradeLevel?:string|null,academicTrack?:string|null){
  const education=resolveEducationLevelProfile(gradeLevel,academicTrack);
  if(education)return education.subjects;
  const raw=(gradeLevel||'').toLocaleUpperCase('tr-TR');
  if(raw.includes('KPSS')||raw.includes('EKPSS'))return ['Türkçe','Matematik','Tarih','Coğrafya','Vatandaşlık'];
  if(raw.includes('DGS'))return ['Türkçe','Matematik'];
  if(raw.includes('ALES'))return ['Sayısal','Sözel'];
  if(raw.includes('YDS')||raw.includes('YÖKDİL'))return ['Yabancı Dil','Kelime','Dil Bilgisi','Okuma','Çeviri'];
  if(raw.includes('AGS')||raw.includes('ÖABT')||raw.includes('OABT'))return ['AGS','Alan Bilgisi','Sözel Yetenek','Sayısal Yetenek'];
  return ['Türkçe','Matematik'];
}

export function defaultExamTypeForOnboarding(gradeLevel?:string|null){
  const education=resolveEducationLevelProfile(gradeLevel);
  if(education?.examMode==='LGS')return 'LGS';
  if(['YKS','YKS_GRADUATE','YKS_FOUNDATION'].includes(education?.examMode||''))return 'TYT';
  const raw=(gradeLevel||'').toLocaleUpperCase('tr-TR');
  if(raw.includes('KPSS'))return 'KPSS';
  if(raw.includes('EKPSS'))return 'EKPSS';
  if(raw.includes('DGS'))return 'DGS';
  if(raw.includes('ALES'))return 'ALES';
  if(raw.includes('YDS')||raw.includes('YÖKDİL'))return 'YDS';
  if(raw.includes('AGS'))return 'AGS';
  return education?.examMode==='SCHOOL'||education?.examMode==='FOUNDATION'||education?.examMode==='TRANSITION'?'OKUL':'GENEL';
}

function trDateKey(date:Date){
  return new Intl.DateTimeFormat('en-CA',{
    timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'
  }).format(date);
}

function dayName(date:Date){
  return new Intl.DateTimeFormat('tr-TR',{timeZone:'Europe/Istanbul',weekday:'long'}).format(date);
}

function humanTask(subject:string,minutes:number,questions:number,reason:string){
  return {
    title:subject+' başlangıç çalışması',
    subject,
    type:'FOCUS',
    minutes,
    questions,
    reason
  };
}

export function buildSevenDayStarterPlan(input:{
  gradeLevel:string;
  academicTrack?:string|null;
  goal:string;
  dailyMinutes:number;
  weakSubjects:string[];
  resources:Array<{title:string;subject:string;publisher?:string|null}>;
  preferredDays:string[];
  studyStart:string;
  studyEnd:string;
  lastExam?:{examType:string;totalNet:number;durationMinutes?:number|null}|null;
  now?:Date;
}){
  const now=input.now||new Date();
  const education=resolveEducationLevelProfile(input.gradeLevel,input.academicTrack);
  const allowed=subjectsForOnboarding(input.gradeLevel,input.academicTrack);
  const weak=input.weakSubjects.filter(x=>allowed.includes(x));
  const focus=weak.length?weak:allowed.slice(0,2);
  const dailyMinutes=Math.max(30,Math.min(input.dailyMinutes,education?.study.maxDailyMinutes||480));
  const baseQuestions=scalePracticeQuestionsForEducationLevel(Math.max(10,Math.round(dailyMinutes/6)),education);
  const days=[] as any[];

  for(let i=0;i<7;i++){
    const date=new Date(now.getTime()+i*86400000);
    const primary=focus[i%focus.length]||allowed[0]||'Genel';
    const secondary=focus[(i+1)%focus.length]||allowed[1]||primary;
    const isReview=i===6;
    const primaryMinutes=Math.max(15,Math.round(dailyMinutes*(isReview ? .35 : .5)));
    const secondaryMinutes=Math.max(10,Math.round(dailyMinutes*(isReview ? .25 : .3)));
    const reviewMinutes=Math.max(10,dailyMinutes-primaryMinutes-secondaryMinutes);
    const primaryQuestions=Math.max(5,Math.round(baseQuestions*(isReview ? .35 : .6)));
    const secondaryQuestions=Math.max(5,Math.round(baseQuestions*(isReview ? .25 : .4)));
    const tasks=isReview?[
      {title:'Haftalık tekrar ve yanlış kontrolü',subject:'Genel',type:'REVIEW',minutes:primaryMinutes,questions:0,reason:'İlk 6 günün öğrenmesini kalıcılaştırmak için.'},
      humanTask(primary,secondaryMinutes,primaryQuestions,'Haftanın en zayıf alanını yeniden ölçmek için.'),
      {title:'Mini başlangıç denemesi',subject:'Genel',type:'CHECK',minutes:reviewMinutes,questions:Math.max(10,Math.round(baseQuestions*.5)),reason:'İkinci haftanın planına veri üretmek için.'}
    ]:[
      humanTask(primary,primaryMinutes,primaryQuestions,'Sihirbazda zayıf alan olarak işaretlendiği için önceliklendirildi.'),
      humanTask(secondary,secondaryMinutes,secondaryQuestions,'Tek derse yüklenmeden ikinci önceliği korumak için.'),
      {title:'Kısa tekrar / yanlış notu',subject:primary,type:'REVIEW',minutes:reviewMinutes,questions:0,reason:'Aynı gün öğrenilen bilgiyi geri çağırmak için.'}
    ];
    days.push({
      day:i+1,
      date:trDateKey(date),
      dayName:dayName(date),
      preferred:Boolean(input.preferredDays.includes(dayName(date))),
      studyWindow:input.studyStart+'–'+input.studyEnd,
      dailyMinutes,
      tasks
    });
  }

  return {
    version:'STARTER_PLAN_V1',
    title:'İlk 7 Günlük Başlangıç Planı',
    generatedAt:now.toISOString(),
    goal:input.goal,
    educationContext:publicEducationContext(education),
    dailyMinutes,
    studyWindow:input.studyStart+'–'+input.studyEnd,
    preferredDays:input.preferredDays,
    weakSubjects:focus,
    resources:input.resources,
    baselineExam:input.lastExam||null,
    explanation:'Plan; eğitim düzeyi, gerçekçi günlük süre, zayıf dersler, mevcut kaynaklar, son deneme ve tercih edilen çalışma saatleri birlikte kullanılarak oluşturuldu.',
    days
  };
}
