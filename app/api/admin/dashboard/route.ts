import { withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { keksPricingSummary } from '@/lib/monthlyProduct';

async function GET__handler(){
  await requireRole(['ADMIN']);
  const now=new Date();
  const seven=new Date(now.getTime()-7*24*60*60*1000);
  const [
    users,students,coaches,parents,payments,paidPayments,pendingPayments,
    pendingCoaches,pendingQuestions,openAlerts,practice7,tech7,recentAssessments,pendingPlans
  ]=await Promise.all([
    db.user.count(),
    db.student.count(),
    db.user.count({where:{role:'COACH'}}),
    db.user.count({where:{role:'PARENT'}}),
    db.payment.count(),
    db.payment.count({where:{status:'PAID'}}),
    db.payment.count({where:{status:'PENDING'}}),
    db.user.count({where:{role:'COACH',status:'PENDING'}}),
    db.questionBankItem.count({where:{reviewStatus:'PENDING'}}),
    db.coachAlert.count({where:{resolved:false}}),
    db.practiceLog.count({where:{createdAt:{gte:seven}}}),
    db.techniquePracticeSession.count({where:{createdAt:{gte:seven}}}),
    db.assessment.findMany({orderBy:{completedAt:'desc'},take:500,select:{report:true}}),
    db.preInterviewAttempt.count({where:{reviewStatus:'ADMIN_REVIEW'}})
  ]);
  const pendingScreenings=recentAssessments.filter(a=>{
    const r=a.report&&typeof a.report==='object'&&!Array.isArray(a.report)?a.report as Record<string,unknown>:{};
    return r.workflowStatus==='ADMIN_REVIEW';
  }).length;
  const revenue=await db.payment.aggregate({where:{status:'PAID'},_sum:{amountKurus:true}});
  return NextResponse.json({ok:true,stats:{
    users,students,coaches,parents,payments,paidPayments,pendingPayments,
    pendingCoaches,pendingQuestions,openAlerts,practice7,tech7,pendingScreenings,pendingPlans,
    revenueKurus:revenue._sum.amountKurus||0,
    pricing:keksPricingSummary()
  }});
}

export const GET = withApiErrors(GET__handler);
