import {db} from '@/lib/db';
import {calculateCrmLifecycle,type CrmLifecycleSnapshot,type CrmVerifiedPurchase} from '@/lib/crmLifecycle';

type LeadLink={id:string;status:string;studentId:string|null};

function isPaytrConfirmed(payload:unknown,merchantOid:string){
  if(!payload||typeof payload!=='object'||Array.isArray(payload))return false;
  const value=payload as Record<string,unknown>;
  // Only the signed PayTR callback writes a successful provider payload.
  return value.status==='success'&&value.merchant_oid===merchantOid&&typeof value.hash==='string';
}
export async function fetchCrmLifecycleBatch(leads:LeadLink[],now=new Date()){
  const results:Record<string,CrmLifecycleSnapshot>={};
  const studentIds=[...new Set(leads.map(x=>x.studentId).filter((x):x is string=>Boolean(x)))];
  if(studentIds.length===0){
    for(const lead of leads)results[lead.id]=calculateCrmLifecycle({leadStatus:lead.status,linked:false,purchases:[],now});
    return results;
  }
  const [students,payments]=await Promise.all([
    db.student.findMany({where:{id:{in:studentIds}},select:{id:true,userId:true}}),
    db.payment.findMany({where:{studentId:{in:studentIds},status:'PAID',provider:'PAYTR'},
      select:{studentId:true,merchantOid:true,providerPayload:true}})
  ]);
  const userIds=students.map(x=>x.userId).filter((x):x is string=>Boolean(x));
  const subscriptions=userIds.length?await db.subscription.findMany({
    where:{userId:{in:userIds},provider:'PAYTR',status:{in:['ACTIVE','EXPIRED','CANCELLED']}},
    select:{userId:true,providerReference:true,status:true,startsAt:true,endsAt:true}
  }):[];

  const studentUser=new Map(students.map(x=>[x.id,x.userId]));
  const subscriptionByUser=new Map<string,typeof subscriptions>();
  for(const s of subscriptions)subscriptionByUser.set(s.userId,[...(subscriptionByUser.get(s.userId)||[]),s]);

  const purchasesByStudent=new Map<string,CrmVerifiedPurchase[]>();
  for(const p of payments){
    if(!isPaytrConfirmed(p.providerPayload,p.merchantOid))continue;
    const userId=studentUser.get(p.studentId);
    if(!userId)continue;
    const matched=(subscriptionByUser.get(userId)||[]).find(s=>s.providerReference===p.merchantOid&&s.startsAt);
    if(!matched?.startsAt)continue;
    const purchased=purchasesByStudent.get(p.studentId)||[];
    purchased.push({merchantOid:p.merchantOid,startedAt:matched.startsAt,endsAt:matched.endsAt,status:matched.status});
    purchasesByStudent.set(p.studentId,purchased);
  }

  const firstDates=[...purchasesByStudent.values()].flatMap(x=>x.map(p=>p.startedAt.getTime()));
  if(firstDates.length===0){
    for(const lead of leads)results[lead.id]=calculateCrmLifecycle({
      leadStatus:lead.status,linked:Boolean(lead.studentId),purchases:[],now
    });
    return results;
  }
  const earliest=new Date(Math.min(...firstDates));
  // Read educational events in batches; no phone-based matching and no private notes returned to the UI.
  const [tasks,practices,sessions]=await Promise.all([
    db.coachingAction.findMany({
      where:{studentId:{in:studentIds},
        OR:[{taskDate:{gte:earliest,lte:now}},{createdAt:{gte:new Date(now.getTime()-7*86400000),lte:now}}]},
      select:{studentId:true,taskDate:true,status:true,updatedAt:true,
        submission:{select:{submittedAt:true}}}
    }),
    db.practiceLog.findMany({where:{studentId:{in:studentIds},date:{gte:earliest,lte:now}},
      select:{studentId:true,date:true}}),
    db.coachingSession.findMany({where:{studentId:{in:studentIds},startsAt:{gte:earliest,lte:now}},
      select:{studentId:true,startsAt:true,endsAt:true,status:true,completedAt:true,updatedAt:true}})
  ]);
  const taskMap=new Map<string,typeof tasks>(),practiceMap=new Map<string,typeof practices>(),sessionMap=new Map<string,typeof sessions>();
  for(const item of tasks)taskMap.set(item.studentId,[...(taskMap.get(item.studentId)||[]),item]);
  for(const item of practices)practiceMap.set(item.studentId,[...(practiceMap.get(item.studentId)||[]),item]);
  for(const item of sessions)sessionMap.set(item.studentId,[...(sessionMap.get(item.studentId)||[]),item]);

  for(const lead of leads){
    const sid=lead.studentId;
    results[lead.id]=calculateCrmLifecycle({
      leadStatus:lead.status,linked:Boolean(sid),
      purchases:sid?purchasesByStudent.get(sid)||[]:[],
      tasks:sid?(taskMap.get(sid)||[]).map(x=>({
        taskDate:x.taskDate,status:x.status,updatedAt:x.updatedAt,
        submittedAt:x.submission?.submittedAt||null
      })):[],
      practices:sid?(practiceMap.get(sid)||[]).map(x=>({date:x.date})):[],
      sessions:sid?(sessionMap.get(sid)||[]).map(x=>({
        startsAt:x.startsAt,endsAt:x.endsAt,status:x.status,completedAt:x.completedAt,updatedAt:x.updatedAt
      })):[],
      now
    });
  }
  return results;
}
