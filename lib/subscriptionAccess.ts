import { db } from './db';
import { ALL_PLANS } from './subscriptionPlans';

export async function getActiveSubscription(userId:string){
 const now=new Date();
 const subscription=await db.subscription.findFirst({
  where:{userId,status:'ACTIVE',OR:[{endsAt:null},{endsAt:{gt:now}}]},
  orderBy:{createdAt:'desc'}
 });
 if(!subscription)return null;
 const plan=ALL_PLANS.find(p=>p.id===subscription.planId);
 return plan?{subscription,plan}:null;
}

export async function hasActiveSubscription(userId:string,audience?:'STUDENT'|'COACH'){
 const active=await getActiveSubscription(userId);
 return Boolean(active&&(!audience||active.plan.audience===audience));
}
