import type {MicroLesson} from './bankFreeMicroLessons';
import {findVerifiedThemeById} from './verifiedGrade7TurkishThemes';

export type LessonSourceEvidence={
  themeVerified:boolean;
  outcomeCodeVerified:boolean;
  theme:string|null;outcomeCode:string|null;
  sourceUrl:string|null;checkedOn:string|null;
  interpretation:string;
};

export function lessonSourceEvidence(lesson:MicroLesson):LessonSourceEvidence{
 const theme=lesson.sourceThemeId?findVerifiedThemeById(lesson.sourceThemeId):null;
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
