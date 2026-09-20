import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(){
  const coaches=await db.coachProfile.findMany({
    where:{user:{status:'ACTIVE',role:'COACH'}},
    select:{id:true,user:{select:{name:true,email:true}},_count:{select:{students:true}}},
    orderBy:{user:{name:'asc'}}
  });
  return NextResponse.json({ok:true,coaches:coaches.map(c=>({
    id:c.id,
    name:c.user.name,
    studentCount:c._count.students
  }))});
}
