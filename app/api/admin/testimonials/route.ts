import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requireRole} from '@/lib/auth';
import {readJson,withApiErrors,HttpError} from '@/lib/apiGuard';
import {db} from '@/lib/db';
import {writeAudit} from '@/lib/audit';
import {sanitizeTestimonial} from '@/lib/userTestimonials';

const schema=z.discriminatedUnion('action',[
  z.object({id:z.string().min(1),action:z.literal('PUBLISH')}),
  z.object({id:z.string().min(1),action:z.literal('HIDE')}),
  z.object({
    id:z.string().min(1),
    action:z.literal('REVIEW_AND_PUBLISH'),
    sanitizedComment:z.string().trim().min(20).max(800)
  })
]);

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

  if(input.action!=='HIDE'&&!row.publishConsent){
    throw new HttpError(409,'Kullanıcı bu yoruma herkese açık yayın izni vermedi.');
  }

  if(input.action==='PUBLISH'&&row.piiFlagged){
    throw new HttpError(409,'Bu yorum kişisel bilgi kontrolünde. Temizlenmiş metni yeniden doğrulamadan yayınlayamazsınız.');
  }

  let nextComment=row.sanitizedComment;
  let publicationAction=input.action;

  if(input.action==='REVIEW_AND_PUBLISH'){
    const cleaned=sanitizeTestimonial(input.sanitizedComment);
    if(cleaned.piiFlagged){
      throw new HttpError(409,'Düzenlenen metinde hâlâ kişisel bilgi işareti var. Kurum, adres, iletişim veya sosyal medya bilgisini kaldırın.');
    }
    if(cleaned.sanitized.length<20){
      throw new HttpError(400,'Temizlenmiş yorum yayınlamak için çok kısa.');
    }
    nextComment=cleaned.sanitized;
    publicationAction='PUBLISH';
  }

  const updated=await db.userTestimonial.update({
    where:{id:row.id},
    data:publicationAction==='PUBLISH'
      ?{
          status:'PUBLISHED',
          sanitizedComment:nextComment,
          comment:nextComment,
          piiFlagged:false,
          publishedAt:new Date()
        }
      :{status:'HIDDEN',publishedAt:null}
  });

  await writeAudit({
    actorUserId:admin.id,
    action:publicationAction==='PUBLISH'?'TESTIMONIAL_ADMIN_PUBLISHED':'TESTIMONIAL_ADMIN_HIDDEN',
    entityType:'UserTestimonial',
    entityId:updated.id,
    summary:publicationAction==='PUBLISH'
      ?'Anonimleştirilmiş kullanıcı yorumu yönetici incelemesi sonrası yayınlandı.'
      :'Kullanıcı yorumu anasayfadan kaldırıldı.',
    metadata:{
      role:updated.role,
      publishConsent:updated.publishConsent,
      reviewedPii:Boolean(row.piiFlagged)
    }
  });

  return NextResponse.json({ok:true,status:updated.status});
}

export const GET=withApiErrors(GET__handler);
export const PATCH=withApiErrors(PATCH__handler);
