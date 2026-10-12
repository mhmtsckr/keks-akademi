import type {MicroLesson} from './bankFreeMicroLessons';
import {findVerifiedThemeById} from './verifiedGrade7TurkishThemes';
import {findGrade56Theme} from './verifiedGrade56Themes';

export type LessonSourceEvidence={
  themeVerified:boolean;
  outcomeCodeVerified:boolean;
  theme:string|null;outcomeCode:string|null;
  sourceUrl:string|null;checkedOn:string|null;
  interpretation:string;
};

export function lessonSourceEvidence(lesson:MicroLesson):LessonSourceEvidence{
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
