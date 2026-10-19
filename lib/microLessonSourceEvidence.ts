import type {MicroLesson} from './bankFreeMicroLessons';
import {findVerifiedThemeById} from './verifiedGrade7TurkishThemes';
import {findGrade56Theme} from './verifiedGrade56Themes';
import {findAdditionalTymmOutcome} from './verifiedAdditionalTymmOutcomes';
import {findVerifiedGeographyOutcome} from './verifiedGrade10GeographyOutcomes';
import {findVerifiedLiteratureTheme} from './verifiedGrade911LiteratureThemes';

export type LessonSourceEvidence={
  themeVerified:boolean;
  outcomeCodeVerified:boolean;
  theme:string|null;outcomeCode:string|null;
  sourceUrl:string|null;checkedOn:string|null;
  interpretation:string;
};

export function lessonSourceEvidence(lesson:MicroLesson):LessonSourceEvidence{
 const literature=lesson.sourceThemeId?findVerifiedLiteratureTheme(lesson.sourceThemeId):null;
 if(literature&&literature.verification==='OUTCOME_CODE'&&literature.subject===lesson.subject
  &&lesson.targetGrades?.includes(literature.grade)&&literature.sourceUrl===lesson.sourceUrl)
   return {
    themeVerified:true,outcomeCodeVerified:true,theme:literature.theme,
    outcomeCode:literature.outcomeCode,sourceUrl:literature.sourceUrl,checkedOn:literature.checkedOn,
    interpretation:'MEB 2026–2027 Türk Dili ve Edebiyatı tema ve öğrenme çıktısı kodu doğrulandı. Bu mikro alıştırma tek başına okuma/yazma/konuşma performansını eksiksiz ölçmez; öğretmen ve MEB onayı değildir.'
   };
  // A verified MEB theme title is evidence of scope, not a verified
  // learning-outcome code. The two states must never be conflated.
  if(literature&&literature.verification==='THEME_TITLE'&&literature.subject===lesson.subject
    &&lesson.targetGrades?.includes(literature.grade)&&literature.sourceUrl===lesson.sourceUrl)
    return {
      themeVerified:true,outcomeCodeVerified:false,theme:literature.theme,
      outcomeCode:null,sourceUrl:literature.sourceUrl,checkedOn:literature.checkedOn,
      interpretation:'MEB 2026–2027 tema başlığı doğrulandı. Bu mikro ders KEKS tarafından hazırlanmış konu/beceri alıştırmasıdır; resmî öğrenme çıktısı kodu eşleştirmesi ve alan uzmanı incelemesi bekleniyor.'
    };
  const geo=lesson.sourceThemeId?findVerifiedGeographyOutcome(lesson.sourceThemeId):null;
 if(geo&&geo.subject===lesson.subject&&lesson.targetGrades?.includes(geo.grade)&&lesson.sourceUrl===geo.url)
   return {
     themeVerified:true,outcomeCodeVerified:true,theme:geo.theme,outcomeCode:geo.code,
     sourceUrl:geo.url,checkedOn:geo.checkedOn,
     interpretation:'MEB TYMM 10. sınıf Coğrafya öğrenme çıktısı kaynağı doğrulandı. KEKS tarafından hazırlanan özgün soruların branş uzmanı veya MEB tarafından onaylandığı anlamına gelmez.'
   };
 const official=lesson.sourceThemeId?findAdditionalTymmOutcome(lesson.sourceThemeId):null;
 if(official&&official.subject===lesson.subject
   &&lesson.targetGrades?.includes(official.grade)&&lesson.sourceUrl===official.url){
   return {
     themeVerified:true,outcomeCodeVerified:true,theme:official.theme,
     outcomeCode:official.code,sourceUrl:official.url,checkedOn:official.checkedOn,
     interpretation:'Öğrenme çıktısının kodu ve kapsamı MEB resmî programından doğrulandı; KEKS özgün sorusunun kazanımı eksiksiz ölçtüğü veya alan uzmanı tarafından onaylandığı iddia edilemez.'
   };
 }
  const theme=lesson.sourceThemeId?findVerifiedThemeById(lesson.sourceThemeId):null;
 const middle=lesson.sourceThemeId?findGrade56Theme(lesson.sourceThemeId):null;
 if(middle&&middle.skill&&middle.subject===lesson.subject&&
    lesson.targetGrades?.includes(middle.grade)&&middle.sourceUrl===lesson.sourceUrl){
   return {
     themeVerified:true,outcomeCodeVerified:middle.verification==='OUTCOME_CODE',
     theme:(middle.type==='TEMA'?'Tema: ':'Ünite: ')+middle.title,
     outcomeCode:middle.outcomeCode,sourceUrl:middle.sourceUrl,checkedOn:middle.checkedOn,
     interpretation:middle.outcomeCode
       ?'MEB tema/ünite ve öğrenme çıktısı kodu resmî sayfada doğrulandı. Bu, KEKS alıştırmalarının çıktıyı tam ölçtüğünün veya öğretmen tarafından onaylandığının kanıtı değildir.'
       :'MEB tema ve hedef beceri kapsamı doğrulandı. Kesin öğrenme çıktısı kodu bu ders için henüz doğrulanmadı; öğretmen onayı ayrıca gerekir.'
   };
 }
 const sameSubject=theme?.subject===lesson.subject;
 const sameGrade=Boolean(theme&&lesson.targetGrades?.includes(theme.grade));
 const sameUrl=Boolean(theme&&lesson.sourceUrl===theme.sourceUrl);
 if(!theme||!sameSubject||!sameGrade||!sameUrl){
   return {
     themeVerified:false,outcomeCodeVerified:false,theme:null,outcomeCode:null,
     sourceUrl:lesson.sourceUrl||null,checkedOn:null,
     interpretation:'İçerik için eşleşen resmî tema ve konu kanıtı henüz doğrulanmadı.'
   };
 }
 return {
   themeVerified:true,outcomeCodeVerified:theme.verification==='KOD_DOGRULANDI',
   theme:theme.theme,outcomeCode:theme.outcomeCode,
   sourceUrl:theme.sourceUrl,checkedOn:theme.checkedOn,
   interpretation:theme.outcomeCode
    ?'Tema ve öğrenme çıktısı kodu resmî MEB kaynağından kontrol edildi. Bu, KEKS sorularının kazanıma pedagojik uygunluğunun onaylandığı anlamına gelmez.'
    :'Resmî MEB tema ve beceri kapsamı kontrol edildi. Kesin öğrenme çıktısı kodu ve KEKS sorularının uygunluğu uzman doğrulaması bekliyor.'
 };
}
