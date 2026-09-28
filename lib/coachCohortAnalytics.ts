export type CohortStudentInput={
  id:string;
  fullName:string;
  studentCode:string;
  overdueReviews:number;
  currentAccuracy:number|null;
  previousAccuracy:number|null;
  currentQuestions:number;
  previousQuestions:number;
  currentTaskCompletion:number|null;
  previousTaskCompletion:number|null;
  lastActivityAt:string|null;
  completedOrScheduledSessionThisWeek:boolean;
};

export function buildCoachCohorts(students:CohortStudentInput[],now=new Date()){
  const sevenDaysAgo=now.getTime()-7*86400000;

  const repeatDelayers=students
    .filter(x=>x.overdueReviews>0)
    .sort((a,b)=>b.overdueReviews-a.overdueReviews)
    .map(x=>({
      ...x,
      signal:x.overdueReviews+' gecikmiş tekrar'
    }));

  const fastestImproving=students
    .filter(x=>
      x.currentAccuracy!=null&&x.previousAccuracy!=null&&
      x.currentQuestions>=10&&x.previousQuestions>=10&&
      x.currentAccuracy-x.previousAccuracy>=5
    )
    .map(x=>({
      ...x,
      accuracyDelta:Math.round((x.currentAccuracy||0)-(x.previousAccuracy||0)),
      taskDelta:x.currentTaskCompletion!=null&&x.previousTaskCompletion!=null
        ?Math.round(x.currentTaskCompletion-x.previousTaskCompletion)
        :null
    }))
    .sort((a,b)=>b.accuracyDelta-a.accuracyDelta)
    .map(x=>({
      ...x,
      signal:'Doğruluk '+(x.accuracyDelta>0?'+':'')+x.accuracyDelta+' puan'+
        (x.taskDelta!=null?' · görev tamamlama '+(x.taskDelta>0?'+':'')+x.taskDelta+' puan':'')
    }));

  const inactive=students
    .filter(x=>!x.lastActivityAt||new Date(x.lastActivityAt).getTime()<sevenDaysAgo)
    .sort((a,b)=>{
      const at=a.lastActivityAt?new Date(a.lastActivityAt).getTime():0;
      const bt=b.lastActivityAt?new Date(b.lastActivityAt).getTime():0;
      return at-bt;
    })
    .map(x=>({
      ...x,
      signal:x.lastActivityAt
        ?Math.floor((now.getTime()-new Date(x.lastActivityAt).getTime())/86400000)+' gündür aktivite yok'
        :'Henüz aktivite kaydı yok'
    }));

  const meetingNeeded=students
    .map(x=>{
      const reasons:string[]=[];
      const inactiveNow=!x.lastActivityAt||new Date(x.lastActivityAt).getTime()<sevenDaysAgo;
      if(inactiveNow)reasons.push('7+ gündür aktivite yok');
      if(x.overdueReviews>=3)reasons.push(x.overdueReviews+' gecikmiş tekrar');
      if(x.currentTaskCompletion!=null&&x.currentTaskCompletion<50)reasons.push('haftalık görev tamamlama %'+x.currentTaskCompletion);
      if(x.currentAccuracy!=null&&x.previousAccuracy!=null&&x.currentQuestions>=10&&x.previousQuestions>=10&&x.currentAccuracy-x.previousAccuracy<=-8){
        reasons.push('doğruluk '+Math.round(x.currentAccuracy-x.previousAccuracy)+' puan geriledi');
      }
      return {...x,reasons};
    })
    .filter(x=>x.reasons.length>0&&!x.completedOrScheduledSessionThisWeek)
    .sort((a,b)=>b.reasons.length-a.reasons.length||b.overdueReviews-a.overdueReviews)
    .map(x=>({...x,signal:x.reasons.join(' · ')}));

  return {repeatDelayers,fastestImproving,inactive,meetingNeeded};
}
