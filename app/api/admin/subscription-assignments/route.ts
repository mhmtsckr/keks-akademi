import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requireRole} from '@/lib/auth';
import {readJson,withApiErrors} from '@/lib/apiGuard';
import {db} from '@/lib/db';
import {writeAudit} from '@/lib/audit';
import {ALL_PLANS,COACH_PLANS} from '@/lib/subscriptionPlans';

const bodySchema=z.object({
  userId:z.string().min(1),
  planId:z.string().min(1),
  term:z.enum(['MONTHLY','THREE_MONTHS','SIX_MONTHS','ANNUAL'])
});

const monthsByTerm={MONTHLY:1,THREE_MONTHS:3,SIX_MONTHS:6,ANNUAL:12} as const;
function addMonths(date:Date,months:number){
  const y=date.getUTCFullYear(),m=date.getUTCMonth(),day=date.getUTCDate();
  const first=new Date(Date.UTC(y,m+months,1,date.getUTCHours(),date.getUTCMinutes(),date.getUTCSeconds(),date.getUTCMilliseconds()));
  const lastDay=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0)).getUTCDate();
  first.setUTCDate(Math.min(day,lastDay));
  return first;
}

async function GET__handler(){
  await requireRole(['ADMIN']);
  const [users,subscriptions]=await Promise.all([
    db.user.findMany({
      where:{role:{in:['COACH','STUDENT']}},
      select:{id:true,name:true,role:true,status:true,student:{select:{studentCode:true}},coachProfile:{select:{id:true,maxActiveStudents:true,_count:{select:{students:true}}}}},
      orderBy:{name:'asc'},take:500
    }),
    db.subscription.findMany({
      where:{status:'ACTIVE',user:{role:{in:['COACH','STUDENT']}}},
      orderBy:{createdAt:'desc'},take:500,
      select:{id:true,userId:true,planId:true,startsAt:true,endsAt:true,status:true,provider:true}
    })
  ]);
  return NextResponse.json({ok:true,users,subscriptions,plans:ALL_PLANS.map(p=>({id:p.id,name:p.name,audience:p.audience,capacity:p.capacity??null}))});
}

async function POST__handler(req:Request){
  const admin=await requireRole(['ADMIN']);
  const input=await readJson(req,bodySchema);
  const plan=ALL_PLANS.find(x=>x.id===input.planId);
  if(!plan)return NextResponse.json({error:'Geçersiz abonelik planı.'},{status:400});
  const user=await db.user.findUnique({
    where:{id:input.userId},
    select:{id:true,name:true,role:true,status:true,coachProfile:{select:{id:true,_count:{select:{students:true}}}}}
  });
  if(!user||user.role!==plan.audience)return NextResponse.json({error:'Hesap rolü ile plan türü eşleşmiyor.'},{status:400});
  if(user.status!=='ACTIVE')return NextResponse.json({error:'Abonelik atamak için hesap yönetici tarafından etkinleştirilmiş olmalı.'},{status:400});
  if(user.role==='COACH'&&!user.coachProfile)return NextResponse.json({error:'Koç profili eksik.'},{status:400});
  if(user.role==='COACH'&&!plan.capacity)return NextResponse.json({error:'Bu koç paketi için kapasite manuel belirlenmeli.'},{status:400});
  if(user.role==='COACH'&&user.coachProfile&&user.coachProfile._count.students>(plan.capacity||0)){
    return NextResponse.json({error:'Mevcut öğrenci sayısı seçilen koç paketinin kapasitesini aşıyor.'},{status:409});
  }

  const startsAt=new Date();
  const endsAt=addMonths(startsAt,monthsByTerm[input.term]);
  const subscription=await db.$transaction(async tx=>{
    await tx.subscription.updateMany({
      where:{userId:user.id,status:'ACTIVE'},
      data:{status:'CANCELLED'}
    });
    if(user.role==='COACH'&&plan.capacity){
      await tx.coachProfile.update({where:{userId:user.id},data:{maxActiveStudents:plan.capacity}});
    }
    return tx.subscription.create({
      data:{
        userId:user.id,planId:plan.id,status:'ACTIVE',
        provider:'ADMIN_GRANT',providerReference:'TERM:'+input.term,
        startsAt,endsAt
      },
      select:{id:true,userId:true,planId:true,startsAt:true,endsAt:true,status:true}
    });
  });
  await writeAudit({
    actorUserId:admin.id,
    action:'ADMIN_SUBSCRIPTION_TERM_ASSIGNED',
    entityType:'Subscription',
    entityId:subscription.id,
    summary:user.name+' hesabına '+plan.name+' / '+input.term+' planı yönetici tarafından atandı.',
    metadata:{userId:user.id,planId:plan.id,term:input.term,startsAt:startsAt.toISOString(),endsAt:endsAt.toISOString(),source:'ADMIN_GRANT'}
  });
  return NextResponse.json({ok:true,subscription});
}

export const GET=withApiErrors(GET__handler);
export const POST=withApiErrors(POST__handler);
