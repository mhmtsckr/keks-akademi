/**
 * Small, source-independent KEKS pilot lesson catalog.
 * Worked examples are individually authored, NOT derived from an uploaded question.
 * This catalog is not a substitute for pedagogical/teacher review or a full question bank.
 */
import {EXPANDED_MICRO_LESSONS} from './expandedMicroLessons';
import {GRADE_SEED_LESSONS} from './gradeSeedMicroLessons';
import {GRADE7_TURKISH_THEME_LESSONS} from './grade7TurkishThemeLessons';
import {GRADE56_TYMM_PILOT_LESSONS} from './grade56TymmPilotLessons';
import {ADDITIONAL_TYMM_PILOT_LESSONS} from './additionalTymmPilotLessons';
import {GRADE10_GEOGRAPHY_PILOTS} from './grade10GeographyPilotLessons';
import {GRADE9_GEOGRAPHY_PILOTS} from './grade9GeographyPilotLessons';
import {GRADE9_11_LITERATURE_PILOTS} from './grade911LiteraturePilotLessons';
import {TDE_REMAINING_THEME_PILOTS} from './tdeRemainingThemePilots';
import {TYMM_MATH_PILOT_LESSONS} from './tymmMathPilotLessons2026';
import {GRADE7_SCIENCE_PILOTS} from './grade7SciencePilotLessons2026';
import {GRADE57_SOCIAL_PILOTS} from './grade57SocialPilotLessons2026';
import {findExpandedMicroLesson} from './expandedMicroLessonMatch';

export type GuidedExercise={
  prompt:string;
  options?:Readonly<Record<string,string>>;
  answer:string;
  explanation:string;
  // Used to test mathematical consistency of the hand-authored examples.
  verify?:{base:number;firstMultiplier:number;secondMultiplier:number};
};
export type MicroLesson={
  id:string;version:number;subject:string;title:string;skill:string;
  explanation:string;misconception:string;
  worked:{prompt:string;steps:string[];answer:string};
  exercises:readonly GuidedExercise[];
  contentStatus:'PILOT';
  sourceUrl?:string;
  targetGrades?:readonly number[];
  targetExams?:readonly string[];
  topicTags?:readonly string[];
  sourceThemeId?:string;
};

export const MICRO_LESSONS:readonly MicroLesson[]=[
  {
    id:'math-percent-changes-v1',version:1,targetGrades:[7,8,9,10,11,12],targetExams:["TYT","AYT","YKS"],subject:'Matematik',title:'Ardışık yüzde değişimleri',
    skill:'Bir artış ve indirimden sonraki son tutarı hesaplama',
    explanation:'Ardışık yüzde değişimlerinde her işlem o andaki tutara uygulanır. %20 artış için 1,20; %20 indirim için 0,80 çarpanı kullanılır.',
    misconception:'Aynı oranda zam ve indirim birbirini sıfırlamaz. Çünkü indirim, artıştan sonraki yeni tutara uygulanır.',
    worked:{
      prompt:'100 birim olan ürün önce %20 zamlanıyor, ardından %20 indiriliyor. Son değer kaç birim?',
      steps:['100 × 1,20 = 120 birim','120 × 0,80 = 96 birim','Son fiyat 96 birim; başlangıca göre %4 azalma vardır.'],
      answer:'96 birim'
    },
    exercises:[
      {prompt:'200 birim önce %10 zamlanıyor, sonra %10 indiriliyor. Son değer kaç birim?',answer:'198',explanation:'200 × 1,10 = 220; 220 × 0,90 = 198 birim.',verify:{base:200,firstMultiplier:1.1,secondMultiplier:0.9}},
      {prompt:'150 birim önce %20 zamlanıyor, sonra %10 indiriliyor. Son değer kaç birim?',answer:'162',explanation:'150 × 1,20 = 180; 180 × 0,90 = 162 birim.',verify:{base:150,firstMultiplier:1.2,secondMultiplier:0.9}},
      {prompt:'80 birim önce %25 indiriliyor, ardından %20 zamlanıyor. Son değer kaç birim?',answer:'72',explanation:'80 × 0,75 = 60; 60 × 1,20 = 72 birim.',verify:{base:80,firstMultiplier:0.75,secondMultiplier:1.2}},
      {prompt:'240 birim önce %25 zamlanıyor, sonra %20 indiriliyor. Son değer kaç birim?',answer:'240',explanation:'240 × 1,25 = 300; 300 × 0,80 = 240 birim.',verify:{base:240,firstMultiplier:1.25,secondMultiplier:0.8}}
    ],
    contentStatus:'PILOT'
  },
  {
    id:'math-fraction-ops-v1',version:1,targetGrades:[5,6,7,8,9,10,11,12],targetExams:["TYT","AYT","YKS","DGS"],subject:'Matematik',title:'Kesirlerde toplama ve çıkarma',
    skill:'Payda eşitleyerek rasyonel sayılarla işlem yapma',
    explanation:'Kesirler toplanırken veya çıkarılırken paydalar eşitlenir; ardından yalnız paylar üzerinde işlem yapılır.',
    misconception:'Paylar ile paydalar ayrı ayrı toplanmaz. 1/2 + 1/3, 2/5 değil 5/6 eder.',
    worked:{
      prompt:'1/2 + 1/3 işleminin sonucu nedir?',
      steps:['Ortak payda 6 seçilir.','1/2 = 3/6 ve 1/3 = 2/6 olur.','3/6 + 2/6 = 5/6.'],
      answer:'5/6'
    },
    exercises:[
      {prompt:'1/4 + 1/2 = ?',answer:'3/4',explanation:'1/2 = 2/4 olduğundan 1/4 + 2/4 = 3/4.'},
      {prompt:'2/3 − 1/6 = ?',answer:'1/2',explanation:'2/3 = 4/6; 4/6 − 1/6 = 3/6 = 1/2.'},
      {prompt:'3/5 + 1/10 = ?',answer:'7/10',explanation:'3/5 = 6/10; 6/10 + 1/10 = 7/10.'},
      {prompt:'5/6 − 1/3 = ?',answer:'1/2',explanation:'1/3 = 2/6; 5/6 − 2/6 = 3/6 = 1/2.'}
    ],
    contentStatus:'PILOT'
  },
  {
    id:'math-exponent-rules-v1',version:1,targetGrades:[7,8,9,10,11,12],targetExams:["TYT","AYT","YKS"],subject:'Matematik',title:'Üslü sayılarda aynı taban',
    skill:'Aynı tabanlı üslü ifadelerde çarpma ve bölme',
    explanation:'Aynı tabanlı kuvvetler çarpılırken üsler toplanır; bölünürken üsler çıkarılır.',
    misconception:'Üsleri toplarken tabanlar çarpılmaz: 2³ × 2² = 2⁵, 4⁵ değil.',
    worked:{
      prompt:'2³ × 2² işlemi kaçtır?',
      steps:['Tabanların aynı (2) olduğunu belirle.','Üsleri topla: 3 + 2 = 5.','2⁵ = 32.'],
      answer:'32'
    },
    exercises:[
      {prompt:'3² × 3¹ = ?',answer:'27',explanation:'3² × 3¹ = 3³ = 27.'},
      {prompt:'2⁴ × 2² = ?',answer:'64',explanation:'2⁴ × 2² = 2⁶ = 64.'},
      {prompt:'5² ÷ 5¹ = ?',answer:'5',explanation:'5² ÷ 5¹ = 5¹ = 5.'},
      {prompt:'4² × 4¹ = ?',answer:'64',explanation:'4² × 4¹ = 4³ = 64.'}
    ],
    contentStatus:'PILOT'
  }
];

function normalize(value:string){
  return value.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
}

export const ALL_MICRO_LESSONS:readonly MicroLesson[]=[...MICRO_LESSONS,...EXPANDED_MICRO_LESSONS,...GRADE_SEED_LESSONS,...GRADE7_TURKISH_THEME_LESSONS,...GRADE56_TYMM_PILOT_LESSONS,...ADDITIONAL_TYMM_PILOT_LESSONS,...GRADE10_GEOGRAPHY_PILOTS,...GRADE9_GEOGRAPHY_PILOTS,...GRADE9_11_LITERATURE_PILOTS,...TDE_REMAINING_THEME_PILOTS,...TYMM_MATH_PILOT_LESSONS,...GRADE7_SCIENCE_PILOTS,...GRADE57_SOCIAL_PILOTS];

export function findMicroLesson(input:{
  subject:string;topic:string;prompt?:string|null;selectedLessonId?:string|null
}):MicroLesson|null{
  const subject=normalize(input.subject);
  // Explicit choice is the only supported matching strategy for an image-only upload.
  if(input.selectedLessonId){
    return ALL_MICRO_LESSONS.find(x=>x.id===input.selectedLessonId&&normalize(x.subject)===subject)||null;
  }
  // Match only an explicit, narrow skill tag; never infer grade from a general "Türkçe" topic.
  const preciseTopic=normalize(input.topic);
  const matched=[...GRADE56_TYMM_PILOT_LESSONS,...ADDITIONAL_TYMM_PILOT_LESSONS,...GRADE10_GEOGRAPHY_PILOTS,...GRADE9_GEOGRAPHY_PILOTS,...GRADE9_11_LITERATURE_PILOTS,...TDE_REMAINING_THEME_PILOTS,...TYMM_MATH_PILOT_LESSONS,...GRADE7_SCIENCE_PILOTS,...GRADE57_SOCIAL_PILOTS].filter(x=>
    normalize(x.subject)===subject&&x.topicTags?.some(tag=>normalize(tag)===preciseTopic));
  if(matched.length===1)return matched[0];
  if(!subject.includes('matematik'))
    return findExpandedMicroLesson(input);
  const topic=normalize(input.topic);
  const prompt=normalize(input.prompt||'');
  // A broad "Problemler" label is insufficient unless the question text gives evidence.
  if(topic.includes('yuzde')||(topic.includes('problem')&&/(?:yuzde|%|zam|indirim)/.test(prompt)))
    return MICRO_LESSONS[0];
  if(topic.includes('kesir')||topic.includes('rasyonel')){
    if(topic.includes('islem')||topic.includes('kesir')||/\d+\s*\/\s*\d+|topla|cikar|payda|kesir/.test(prompt))
      return MICRO_LESSONS[1];
  }
  if(topic.includes('uslu')){
    // A shared "Üslü ve Köklü Sayılar" tag alone does not prove this is an exponent question.
    if(!topic.includes('koklu')||/(?:us|kuvvet|uzeri|\^|\u00b2|\u00b3)/.test(prompt))
      return MICRO_LESSONS[2];
  }
  return null;
}

export function microLessonById(id:string,version:number):MicroLesson|null{
  return ALL_MICRO_LESSONS.find(x=>x.id===id&&x.version===version)||null;
}
