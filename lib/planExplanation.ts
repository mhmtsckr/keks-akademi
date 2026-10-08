function cleanReasons(reasons?:string[]|null){
  return (reasons||[]).map(x=>x.trim()).filter(Boolean).slice(0,2);
}

function riskyBecause(reasons?:string[]|null){
  const items=cleanReasons(reasons);
  return items.length?' Riskli çünkü '+items.join(' '):'';
}

export function buildPracticeWhy(input:{
  subject:string;
  topic:string;
  questionTarget:number;
  recentAccuracies:number[];
  dueReviewCount:number;
  dueReviewSteps?:number[];
  masteryStatus?:string|null;
  masteryRiskReasons?:string[];
}) {
  const reasons:string[]=[];

  if(input.recentAccuracies.length>=2 && input.recentAccuracies.slice(0,2).every(x=>x<55)){
    const latestTwo=input.recentAccuracies.slice(0,2).map(x=>'%'+Math.round(x)).join(' ve ');
    reasons.push('son iki testte doğruluğun '+latestTwo+' ile %55’in altında');
  }else if(input.recentAccuracies[0]!=null && input.recentAccuracies[0]<55){
    reasons.push('son testte doğruluğun %'+Math.round(input.recentAccuracies[0])+' ile %55’in altında');
  }else if(input.masteryStatus==='RISKY'){
    reasons.push('bu konu performans, tekrar, hız ve unutma sinyallerine göre riskli durumda');
  }else if(input.masteryStatus==='LEARNING'){
    reasons.push('bu konu hâlâ öğrenme aşamasında');
  }

  if(input.dueReviewCount>0){
    const sevenDay=input.dueReviewSteps?.includes(7);
    reasons.push(sevenDay
      ?'7 günlük tekrarın bugün'
      :input.dueReviewCount+' tekrar kaydın bugün');
  }

  if(!reasons.length){
    reasons.push('konu çalışmasının ardından öğrenme durumunu yeniden ölçmek gerekiyor');
  }

  return 'Bugün '+input.subject+' '+input.questionTarget+' soru önerildi çünkü '+reasons.join(' ve ')+'.'
    +(input.masteryStatus==='RISKY'?riskyBecause(input.masteryRiskReasons):'');
}

export function buildReviewWhy(input:{
  count:number;
  sevenDayCount?:number;
  subjects?:string[];
}) {
  const parts:string[]=[];
  if((input.sevenDayCount||0)>0)parts.push((input.sevenDayCount||0)+' adet 7 günlük tekrar bugün');
  if(input.count-(input.sevenDayCount||0)>0)parts.push((input.count-(input.sevenDayCount||0))+' diğer tekrarın vadesi geldi');
  const subjectText=input.subjects?.length?' Öncelikli dersler: '+input.subjects.slice(0,3).join(', ')+'.':'';
  return 'Bu tekrar bloğu önerildi çünkü '+(parts.length?parts.join(' ve '):input.count+' tekrarın vadesi geldi')+'.'+subjectText;
}

export function buildActionWhy(input:{
  title:string;
  latestAccuracy?:number|null;
  masteryStatus?:string|null;
  masteryRiskReasons?:string[];
}) {
  if(input.latestAccuracy!=null&&input.latestAccuracy<55){
    return 'Bu görev bugün öne alındı çünkü ilgili konuda son ölçülen doğruluk %'+Math.round(input.latestAccuracy)+' ve güçlendirme gerekiyor.'
      +(input.masteryStatus==='RISKY'?riskyBecause(input.masteryRiskReasons):'');
  }
  if(input.masteryStatus==='RISKY'){
    return 'Bu görev bugün öne alındı çünkü ilgili konu riskli durumda.'+riskyBecause(input.masteryRiskReasons);
  }
  if(input.masteryStatus==='LEARNING'){
    return 'Bu görev bugün öne alındı çünkü konu öğrenme aşamasında ve düzenli uygulama gerekiyor.';
  }
  return 'Bu görev bugün koç planında yer aldığı için günlük sıraya alındı.';
}
