import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requireRole} from '@/lib/auth';
import {readJson,withApiErrors,HttpError} from '@/lib/apiGuard';
import {db} from '@/lib/db';
import {writeAudit} from '@/lib/audit';

const schema=z.object({
  id:z.string().min(1),
  action:z.enum(['PUBLISH','HIDE'])
});

async function GET__handler(){
  await requireRole(['ADMIN']);
  const rows=await db.userTestimonial.findMany({
    where:{submittedAt:{not:null}},
    select:{
      id:true,role:true,rating:true,sanitizedComment:true,contextLabel:true,
      publishConsent:true,status:true,piiFlagged:true,submittedAt:true,publishedAt:true
    },
    orderBy:[{status:'asc'},{submittedAt:'desc'}],
    take:100
  });
  return NextResponse.json({ok:true,testimonials:rows});
}

async function PATCH__handler(req:Request){
  const admin=await requireRole(['ADMIN']);
  const input=await readJson(req,schema);
  const row=await db.userTestimonial.findUnique({where:{id:input.id}});
  if(!row||!row.submittedAt)throw new HttpError(404,'Yorum bulunamadı.');

  if(input.action==='PUBLISH'&&!row.publishConsent){
    throw new HttpError(409,'Kullanıcı bu yoruma herkese açık yayın izni vermedi.');
  }

  const updated=await db.userTestimonial.update({
    where:{id:row.id},
    data:input.action==='PUBLISH'
      ?{status:'PUBLISHED',piiFlagged:false,publishedAt:new Date()}
      :{status:'HIDDEN',publishedAt:null}
  });

  await writeAudit({
    actorUserId:admin.id,
    action:input.action==='PUBLISH'?'TESTIMONIAL_ADMIN_PUBLISHED':'TESTIMONIAL_ADMIN_HIDDEN',
    entityType:'UserTestimonial',
    entityId:updated.id,
    summary:input.action==='PUBLISH'
      ?'Anonimleştirilmiş kullanıcı yorumu yönetici incelemesi sonrası yayınlandı.'
      :'Kullanıcı yorumu anasayfadan kaldırıldı.',
    metadata:{role:updated.role,publishConsent:updated.publishConsent}
  });

  return NextResponse.json({ok:true,status:updated.status});
}

export const GET=withApiErrors(GET__handler);
export const PATCH=withApiErrors(PATCH__handler);
