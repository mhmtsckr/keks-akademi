import {NextResponse} from 'next/server';
import {db} from '@/lib/db';

export const dynamic='force-dynamic';

export async function GET(){
  const rows=await db.userTestimonial.findMany({
    where:{
      status:'PUBLISHED',
      publishConsent:true,
      rating:{not:null},
      sanitizedComment:{not:null}
    },
    select:{
      id:true,
      rating:true,
      sanitizedComment:true,
      contextLabel:true,
      publishedAt:true
    },
    orderBy:[{publishedAt:'desc'},{createdAt:'desc'}],
    take:12
  });

  return NextResponse.json({
    ok:true,
    testimonials:rows.map(row=>({
      id:row.id,
      rating:row.rating,
      comment:row.sanitizedComment,
      contextLabel:row.contextLabel,
      publishedAt:row.publishedAt
    }))
  });
}
