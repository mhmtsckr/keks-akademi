import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(){
  await requireRole(['ADMIN']);
  const [codes,accesses]=await Promise.all([
    db.academyCode.findMany({orderBy:{createdAt:'desc'},take:100}),
    db.testAccess.findMany({orderBy:{createdAt:'desc'},take:100,include:{student:{select:{fullName:true,studentCode:true}}}})
  ]);
  return NextResponse.json({ok:true,codes,accesses});
}
