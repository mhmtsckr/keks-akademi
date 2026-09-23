import { withApiErrors } from '@/lib/apiGuard';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { decryptPrivateCode } from '@/lib/security';
import { turkeyMonthWindow } from '@/lib/monthlyAccess';

async function GET__handler(){
  await requireRole(['ADMIN']);
  const month=turkeyMonthWindow();
  const [codes,accesses]=await Promise.all([
    db.academyCode.findMany({orderBy:{createdAt:'desc'},take:200}),
    db.testAccess.findMany({
      orderBy:{createdAt:'desc'},
      take:200,
      include:{student:{select:{fullName:true,studentCode:true}}}
    })
  ]);

  const studentIds=[...new Set(codes.map(c=>c.assignedStudentId).filter(Boolean) as string[])];
  const students=studentIds.length?await db.student.findMany({
    where:{id:{in:studentIds}},
    select:{id:true,fullName:true,studentCode:true}
  }):[];
  const studentMap=new Map(students.map(s=>[s.id,s]));

  const monthlyUses=await db.testAccess.findMany({
    where:{
      source:'ACADEMY_CODE',
      createdAt:{gte:month.start,lt:month.end},
      academyCodeId:{not:null}
    },
    select:{academyCodeId:true,status:true,createdAt:true}
  });
  const usedByCode=new Map(monthlyUses.map(x=>[x.academyCodeId!,x]));

  const safeCodes=codes.map(c=>{
    let code:string|null=null;
    if(c.codeCiphertext){
      try{code=decryptPrivateCode(c.codeCiphertext)}catch{code=null}
    }
    const student=c.assignedStudentId?studentMap.get(c.assignedStudentId):null;
    const monthlyUse=usedByCode.get(c.id);
    return {
      id:c.id,
      codeHint:c.codeHint,
      code,
      assignedStudentId:c.assignedStudentId,
      student:student||null,
      monthlyRecurring:c.monthlyRecurring,
      currentMonth:month.key,
      currentMonthStatus:monthlyUse?monthlyUse.status:'AVAILABLE',
      currentMonthActivatedAt:monthlyUse?.createdAt||null,
      maxUses:c.maxUses,
      useCount:c.useCount,
      active:c.active,
      expiresAt:c.expiresAt,
      createdAt:c.createdAt,
      usedAt:c.usedAt
    };
  });

  return NextResponse.json({ok:true,codes:safeCodes,accesses,currentMonth:month.key,legacyCodesReset:true});
}

export const GET = withApiErrors(GET__handler);
