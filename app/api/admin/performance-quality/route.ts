import {NextResponse} from 'next/server';
import {requireRole} from '@/lib/auth';
import {withApiErrors} from '@/lib/apiGuard';
import {db} from '@/lib/db';
import {performanceQualitySnapshot} from '@/lib/tymmPerformanceQualityAnalytics';

const WINDOW_DAYS=90;
const MAX_LOGS=2500;
async function GET__handler(){
 await requireRole(['ADMIN']);
 const asOf=new Date();
 const cutoff=new Date(asOf.getTime()-WINDOW_DAYS*86400000);
 // Source data are bounded and never include student names, IDs, response bodies or coach notes in the API.
 const rows=await db.dailyLog.findMany({
  where:{createdAt:{gte:cutoff,lte:asOf},OR:[
   {payload:{path:['type'],equals:'TYMM_PERFORMANCE_SUBMISSION'}},
   {payload:{path:['type'],equals:'TYMM_PERFORMANCE_REVIEWED'}},
   {payload:{path:['type'],equals:'TYMM_TRANSFER_SUBMISSION'}},
   {payload:{path:['type'],equals:'TYMM_TRANSFER_REVIEWED'}}
  ]},
  select:{createdAt:true,payload:true},
  orderBy:{createdAt:'desc'},take:MAX_LOGS+1
 });
 const report=performanceQualitySnapshot(rows.slice(0,MAX_LOGS),asOf,{
  days:WINDOW_DAYS,truncated:rows.length>MAX_LOGS
 });
 return NextResponse.json({ok:true,report},{headers:{'Cache-Control':'private, no-store'}});
}
export const GET=withApiErrors(GET__handler);
