import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requireRole} from '@/lib/auth';
import {db} from '@/lib/db';
import {HttpError,readJson,withApiErrors} from '@/lib/apiGuard';
import {writeAudit} from '@/lib/audit';
import {SALES_LEAD_STATUSES,salesLeadTimestampPatch} from '@/lib/salesLead';
import {fetchCrmLifecycleBatch} from '@/lib/crmLifecycleData';
import {summarizeCrmLifecycle} from '@/lib/crmLifecycle';

const term=z.enum(['monthly','threeMonths','sixMonths','annual']);

const patchSchema=z.object({
  id:z.string().min(1),
  studentCode:z.string().trim().max(40).nullable().optional(),
  status:z.enum(['NEW','CALLED','SPOKEN','PACKAGE_RECOMMENDED','WON','LOST']).optional(),
  recommendedPlanId:z.string().max(100).nullable().optional(),
  recommendedTerm:term.nullable().optional(),
  soldPlanId:z.string().max(100).nullable().optional(),
  soldTerm:term.nullable().optional(),
  saleAmountKurus:z.number().int().min(0).nullable().optional(),
  lostReason:z.string().trim().max(500).nullable().optional(),
  note:z.string().trim().max(1000).nullable().optional()
});

async function GET__handler(req:Request){
  await requireRole(['ADMIN']);
  const {searchParams}=new URL(req.url);
  const status=searchParams.get('status')||'ALL';
  const source=searchParams.get('source')||'ALL';
  const q=(searchParams.get('q')||'').trim();

  const where:any={};
  if(status!=='ALL'&&SALES_LEAD_STATUSES.includes(status as any))where.status=status;
  if(source!=='ALL'&&['CALLBACK','WHATSAPP'].includes(source))where.source=source;
  if(q){
    where.OR=[
      {name:{contains:q,mode:'insensitive'}},
      {phone:{contains:q}},
      {educationLevel:{contains:q,mode:'insensitive'}}
    ];
  }

  const [
    leads,
    total,
    statusCounts,
    educationCounts,
    requestTotals,
    wonPackageCounts,
    revenue
  ]=await Promise.all([
    db.salesLead.findMany({where,orderBy:[{updatedAt:'desc'}],take:300,
      include:{student:{select:{studentCode:true}}}}),
    db.salesLead.count(),
    db.salesLead.groupBy({by:['status'],_count:{_all:true}}),
    db.salesLead.groupBy({by:['educationLevel'],where:{educationLevel:{not:null}},_count:{_all:true},_sum:{inquiryCount:true}}),
    db.salesLead.aggregate({_sum:{inquiryCount:true,callbackRequestCount:true,whatsappRequestCount:true}}),
    db.salesLead.groupBy({
      by:['soldPlanId','soldTerm'],
      where:{status:'WON',soldPlanId:{not:null},soldTerm:{not:null}},
      _count:{_all:true},
      _sum:{saleAmountKurus:true}
    }),
    db.salesLead.aggregate({where:{status:'WON'},_sum:{saleAmountKurus:true}})
  ]);

  // Cohort KPIs are calculated over ALL explicitly linked customers, not the first
  // 300 visible leads or the current CRM search/filter results.
  const customerLinks=await db.salesLead.findMany({
    where:{studentId:{not:null}},
    select:{id:true,status:true,studentId:true}
  });
  const linkedIds=new Set(customerLinks.map(x=>x.id));
  const lifecycle=await fetchCrmLifecycleBatch([
    ...customerLinks,
    ...leads.filter(x=>!linkedIds.has(x.id))
  ]);
  const lifecycleSummary=summarizeCrmLifecycle(customerLinks.map(x=>lifecycle[x.id]));
  const won=statusCounts.find(x=>x.status==='WON')?._count._all||0;
  const lost=statusCounts.find(x=>x.status==='LOST')?._count._all||0;
  const active=Math.max(0,total-won-lost);

  return NextResponse.json({
    ok:true,
    leads:leads.map(x=>({...x,lifecycle:lifecycle[x.id]})),
    summary:{
      lifecycle:lifecycleSummary,
      lifecycleScope:'Tüm açıkça eşleştirilmiş öğrenci hesapları baz alınır; CRM arama ve filtrelerinden bağımsızdır.',
      total,
      active,
      won,
      lost,
      conversionRate:total?Math.round((won/total)*1000)/10:0,
      revenueKurus:revenue._sum.saleAmountKurus||0,
      statusCounts,
      totalRequests:requestTotals._sum.inquiryCount||0,
      callbackRequests:requestTotals._sum.callbackRequestCount||0,
      whatsappRequests:requestTotals._sum.whatsappRequestCount||0,
      educationCounts:educationCounts.sort((a,b)=>(b._sum.inquiryCount||0)-(a._sum.inquiryCount||0)),
      wonPackageCounts
    }
  });
}

async function PATCH__handler(req:Request){
  const admin=await requireRole(['ADMIN']);
  const input=await readJson(req,patchSchema);
  const before=await db.salesLead.findUnique({where:{id:input.id}});
  if(!before)throw new HttpError(404,'Lead bulunamadı.');

  const nextStatus=input.status??before.status;
  let studentIdPatch: {studentId:string|null}|undefined;
  if(input.studentCode!==undefined){
    if(input.studentCode===null||input.studentCode===''){
      studentIdPatch={studentId:null};
    }else{
      const student=await db.student.findUnique({
        where:{studentCode:input.studentCode},select:{id:true}
      });
      if(!student)throw new HttpError(404,'Bu öğrenci koduyla eşleşen kayıt bulunamadı.');
      const existing=await db.salesLead.findFirst({
        where:{studentId:student.id,id:{not:input.id}},select:{id:true}
      });
      if(existing)throw new HttpError(409,'Öğrenci başka bir CRM talebiyle ilişkilendirilmiş.');
      studentIdPatch={studentId:student.id};
    }
  }
  const recommendedPlanId=input.recommendedPlanId===undefined?before.recommendedPlanId:input.recommendedPlanId;
  const recommendedTerm=input.recommendedTerm===undefined?before.recommendedTerm:input.recommendedTerm;
  const soldPlanId=input.soldPlanId===undefined?before.soldPlanId:input.soldPlanId;
  const soldTerm=input.soldTerm===undefined?before.soldTerm:input.soldTerm;
  const saleAmountKurus=input.saleAmountKurus===undefined?before.saleAmountKurus:input.saleAmountKurus;

  if(nextStatus==='PACKAGE_RECOMMENDED'&&(!recommendedPlanId||!recommendedTerm)){
    throw new HttpError(400,'Paket Önerildi aşaması için önerilen paket ve süre seçilmelidir.');
  }
  if(nextStatus==='WON'&&(!soldPlanId||!soldTerm||!saleAmountKurus||saleAmountKurus<=0)){
    throw new HttpError(400,'Kazanıldı aşaması için satılan paket, süre ve gerçek satış tutarı girilmelidir.');
  }

  const row=await db.salesLead.update({
    where:{id:input.id},
    data:{
      ...(studentIdPatch||{}),
      ...(input.status?{status:input.status,...(input.status!==before.status?salesLeadTimestampPatch(input.status):{})}:{}),
      ...(input.recommendedPlanId!==undefined?{recommendedPlanId:input.recommendedPlanId}:{}),
      ...(input.recommendedTerm!==undefined?{recommendedTerm:input.recommendedTerm}:{}),
      ...(input.soldPlanId!==undefined?{soldPlanId:input.soldPlanId}:{}),
      ...(input.soldTerm!==undefined?{soldTerm:input.soldTerm}:{}),
      ...(input.saleAmountKurus!==undefined?{saleAmountKurus:input.saleAmountKurus}:{}),
      ...(input.lostReason!==undefined?{lostReason:input.lostReason}:{}),
      ...(input.note!==undefined?{note:input.note}:{}),
      ...(input.status==='WON'?{lostReason:null}:{}),
      ...(input.status==='LOST'?{saleAmountKurus:null}:{}),
    }
  });

  await writeAudit({
    actorUserId:admin.id,
    action:'SALES_LEAD_UPDATED',
    entityType:'SalesLead',
    entityId:row.id,
    summary:'Satış lead aşaması veya paket bilgisi güncellendi.',
    metadata:{
      beforeStatus:before.status,
      afterStatus:row.status,
      studentLinkChanged:studentIdPatch!==undefined&&before.studentId!==row.studentId,
      recommendedPlanId:row.recommendedPlanId,
      recommendedTerm:row.recommendedTerm,
      soldPlanId:row.soldPlanId,
      soldTerm:row.soldTerm
    }
  });

  return NextResponse.json({ok:true,lead:row});
}

export const GET=withApiErrors(GET__handler);
export const PATCH=withApiErrors(PATCH__handler);
