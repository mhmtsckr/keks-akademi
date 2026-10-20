import type {MicroLesson} from './bankFreeMicroLessons';
import {findVerifiedThemeById} from './verifiedGrade7TurkishThemes';
import {findGrade56Theme} from './verifiedGrade56Themes';
import {findAdditionalTymmOutcome} from './verifiedAdditionalTymmOutcomes';
import {findVerifiedGeographyOutcome} from './verifiedGrade10GeographyOutcomes';
import {findGrade9GeographyOutcome} from './verifiedGrade9GeographyOutcomes';
import {findVerifiedLiteratureTheme} from './verifiedGrade911LiteratureThemes';
import {findVerifiedTymmMathOutcome} from './verifiedTymmMathOutcomes2026';
import {findGrade7ScienceOutcome} from './verifiedGrade7ScienceOutcomes';
import {findGrade57SocialOutcome} from './verifiedGrade57SocialOutcomes';
import {findVerifiedHistoryOutcome} from './verifiedGrade911HistoryOutcomes2026';

export type LessonSourceEvidence={
  themeVerified:boolean;
  outcomeCodeVerified:boolean;
  theme:string|null;outcomeCode:string|null;
  sourceUrl:string|null;checkedOn:string|null;
  interpretation:string;
};

export function lessonSourceEvidence(lesson:MicroLesson):LessonSourceEvidence{
 const history=lesson.sourceThemeId?findVerifiedHistoryOutcome(lesson.sourceThemeId):null;
 if(history&&lesson.subject===history.subject&&
   lesson.targetGrades?.includes(history.grade)&&lesson.sourceUrl===history.url){
   return {
    themeVerified:true,outcomeCodeVerified:true,
    theme:history.theme,outcomeCode:history.code,sourceUrl:history.url,checkedOn:history.checkedOn,
    interpretation:'2026–2027 MEB Tarih öğrenme çıktısı resmî kaynaktan doğrulandı. Bu kaynak eşleştirmesi KEKS özgün alıştırmalarının tüm çıktı becerilerini ölçtüğü, MEB onaylı olduğu veya branş uzmanı kontrolünden geçtiği anlamına gelmez.'
   };
 }
  const social=lesson.sourceThemeId?findGrade57SocialOutcome(lesson.sourceThemeId):null;
 if(social&&lesson.subject===social.subject&&lesson.targetGrades?.includes(social.grade)&&lesson.sourceUrl===social.url)
   return {themeVerified:true,outcomeCodeVerified:true,theme:social.theme,outcomeCode:social.code,
     sourceUrl:social.url,checkedOn:social.checkedOn,
     interpretation:'MEB 2026–2027 Sosyal Bilgiler öğrenme çıktısı kaynakta doğrulandı; KEKS pilot çoktan seçmeli soruları tartışma, harita çizimi, proje ve sosyal katılım performanslarının yerine geçmez. Resmî MEB veya branş uzmanı onayı değildir.'};

 const science=lesson.sourceThemeId?findGrade7ScienceOutcome(lesson.sourceThemeId):null;
 if(science&&science.subject===lesson.subject&&lesson.targetGrades?.includes(7)&&lesson.sourceUrl===science.url)
  return {themeVerified:true,outcomeCodeVerified:true,theme:science.title,
    outcomeCode:science.code,sourceUrl:science.url,checkedOn:science.checkedOn,
    interpretation:'MEB 2026–2027 7. sınıf Fen Bilimleri ünite ve ilgili tek öğrenme çıktısı doğrulandı. KEKS özgün pilot soruları tüm çıktı becerilerini ölçmez; resmî veya branş uzmanı onayı değildir.'};
 const math=lesson.sourceThemeId?findVerifiedTymmMathOutcome(lesson.sourceThemeId):null;
 if(math&&lesson.subject===math.subject&&lesson.targetGrades?.includes(math.grade)&&lesson.sourceUrl===math.url)
  return {themeVerified:true,outcomeCodeVerified:true,theme:math.theme,outcomeCode:math.code,sourceUrl:math.url,checkedOn:math.checkedOn,interpretation:'MEB TYMM 2026–2027 Matematik öğrenme çıktısı kodu resmî kaynaktan doğrulandı; dört seçenekli KEKS alıştırmaları çıktının tüm muhakeme/performans kanıtlarını ölçmez ve MEB veya uzman onayı değildir.'};
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
  const geo9=lesson.sourceThemeId?findGrade9GeographyOutcome(lesson.sourceThemeId):null;
 if(geo9&&geo9.subject===lesson.subject&&lesson.targetGrades?.includes(9)&&lesson.sourceUrl===geo9.url)
  return {themeVerified:true,outcomeCodeVerified:true,
    theme:geo9.theme,outcomeCode:geo9.code,sourceUrl:geo9.url,checkedOn:geo9.checkedOn,
    interpretation:'MEB 2026–2027 9. sınıf Coğrafya öğrenme çıktısı kaynakta doğrulandı. KEKS özgün pilot soruları çıktının tüm süreç, harita çizimi ve performans becerilerini ölçmez; MEB veya alan öğretmeni onayı değildir.'};
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
