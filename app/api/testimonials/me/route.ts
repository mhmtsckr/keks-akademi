import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requireRole} from '@/lib/auth';
import {readJson,withApiErrors,HttpError} from '@/lib/apiGuard';
import {db} from '@/lib/db';
import {writeAudit} from '@/lib/audit';
import {
  sanitizeTestimonial,
  TESTIMONIAL_SNOOZE_DAYS,
  testimonialContextLabel,
  testimonialEligible,
  testimonialSubmissionStatus,
  type TestimonialRole
} from '@/lib/userTestimonials';

const schema=z.discriminatedUnion('action',[
  z.object({
    action:z.literal('SUBMIT'),
    rating:z.number().int().min(1).max(5),
    comment:z.string().trim().min(20).max(800),
    publishConsent:z.boolean()
  }),
  z.object({action:z.literal('SNOOZE')}),
  z.object({action:z.literal('REVOKE')})
]);

async function contextForUser(user:Awaited<ReturnType<typeof requireRole>>){
  let role=user.role as TestimonialRole;
  let usageStartedAt=user.createdAt;
  let gradeLevel:string|null=null;
  let academicTrack:string|null=null;
  const privateTokens:Array<string|null|undefined>=[user.name,user.email];

  if(role==='STUDENT'&&user.student){
    usageStartedAt=user.student.createdAt;
    gradeLevel=user.student.gradeLevel;
    academicTrack=user.student.academicTrack;
    privateTokens.push(user.student.fullName,user.student.studentCode);
  }else if(role==='PARENT'&&user.parentProfile){
    usageStartedAt=user.parentProfile.createdAt;
    const student=await db.student.findUnique({
      where:{id:user.parentProfile.studentId},
      select:{fullName:true,studentCode:true,gradeLevel:true,academicTrack:true}
    });
    if(student){
      gradeLevel=student.gradeLevel;
      academicTrack=student.academicTrack;
      privateTokens.push(student.fullName,student.studentCode);
    }
  }else if(role==='COACH'&&user.coachProfile){
    usageStartedAt=user.coachProfile.createdAt;
  }

  const contextLabel=testimonialContextLabel({role,usageStartedAt,gradeLevel,academicTrack});
  return {role,usageStartedAt,gradeLevel,academicTrack,privateTokens,contextLabel};
}

async function GET__handler(){
  const user=await requireRole(['STUDENT','PARENT','COACH']);
  const now=new Date();
  const context=await contextForUser(user);
  const row=await db.userTestimonial.findUnique({where:{userId:user.id}});
  const eligible=testimonialEligible(context.usageStartedAt,now);
  const shouldPrompt=eligible
    &&!row?.submittedAt
    &&(!row||row.status!=='SNOOZED'||!row.nextPromptAt||row.nextPromptAt<=now);

  return NextResponse.json({
    ok:true,
    eligible,
    shouldPrompt,
    contextLabel:context.contextLabel,
    usageStartedAt:context.usageStartedAt,
    testimonial:row?{
      status:row.status,
      rating:row.rating,
      publishConsent:row.publishConsent,
      submittedAt:row.submittedAt,
      publishedAt:row.publishedAt,
      nextPromptAt:row.nextPromptAt
    }:null
  });
}

async function POST__handler(req:Request){
  const user=await requireRole(['STUDENT','PARENT','COACH']);
  const input=await readJson(req,schema);
  const now=new Date();
  const context=await contextForUser(user);

  if(!testimonialEligible(context.usageStartedAt,now)){
    throw new HttpError(403,'KEKS deneyiminiz 30 günü tamamladıktan sonra yorum bırakabilirsiniz.');
  }

  if(input.action==='SNOOZE'){
    const nextPromptAt=new Date(now.getTime()+TESTIMONIAL_SNOOZE_DAYS*86400000);
    const row=await db.userTestimonial.upsert({
      where:{userId:user.id},
      create:{
        userId:user.id,
        role:context.role,
        contextLabel:context.contextLabel,
        usageStartedAt:context.usageStartedAt,
        status:'SNOOZED',
        promptedAt:now,
        nextPromptAt
      },
      update:{
        role:context.role,
        contextLabel:context.contextLabel,
        usageStartedAt:context.usageStartedAt,
        status:'SNOOZED',
        promptedAt:now,
        nextPromptAt
      }
    });
    await writeAudit({
      actorUserId:user.id,
      action:'TESTIMONIAL_PROMPT_SNOOZED',
      entityType:'UserTestimonial',
      entityId:row.id,
      summary:'Gerçek kullanıcı yorumu isteği 30 gün ertelendi.',
      metadata:{nextPromptAt:nextPromptAt.toISOString(),role:context.role}
    });
    return NextResponse.json({ok:true,status:row.status,nextPromptAt});
  }

  const existing=await db.userTestimonial.findUnique({where:{userId:user.id}});

  if(input.action==='REVOKE'){
    if(!existing?.submittedAt)throw new HttpError(404,'Yayın izni kaldırılacak bir yorum bulunamadı.');
    const row=await db.userTestimonial.update({
      where:{userId:user.id},
      data:{publishConsent:false,status:'HIDDEN',publishedAt:null,consentUpdatedAt:now}
    });
    await writeAudit({
      actorUserId:user.id,
      action:'TESTIMONIAL_PUBLICATION_REVOKED',
      entityType:'UserTestimonial',
      entityId:row.id,
      summary:'Kullanıcı yorumunun anasayfa yayın iznini kaldırdı.',
      metadata:{role:context.role}
    });
    return NextResponse.json({ok:true,status:row.status,publishConsent:false});
  }

  const cleaned=sanitizeTestimonial(input.comment,context.privateTokens);
  if(cleaned.sanitized.length<20){
    throw new HttpError(400,'Kişisel bilgiler temizlendikten sonra yorum çok kısa kaldı. Deneyiminizi biraz daha ayrıntılı yazın.');
  }
  const status=testimonialSubmissionStatus(input.publishConsent,cleaned.piiFlagged);
  const publishedAt=status==='PUBLISHED'?now:null;

  const row=await db.userTestimonial.upsert({
    where:{userId:user.id},
    create:{
      userId:user.id,
      role:context.role,
      rating:input.rating,
      comment:cleaned.sanitized,
      sanitizedComment:cleaned.sanitized,
      contextLabel:context.contextLabel,
      usageStartedAt:context.usageStartedAt,
      publishConsent:input.publishConsent,
      status,
      piiFlagged:cleaned.piiFlagged,
      promptedAt:now,
      submittedAt:now,
      publishedAt,
      consentUpdatedAt:now
    },
    update:{
      role:context.role,
      rating:input.rating,
      comment:cleaned.sanitized,
      sanitizedComment:cleaned.sanitized,
      contextLabel:context.contextLabel,
      usageStartedAt:context.usageStartedAt,
      publishConsent:input.publishConsent,
      status,
      piiFlagged:cleaned.piiFlagged,
      submittedAt:existing?.submittedAt||now,
      publishedAt,
      consentUpdatedAt:now,
      nextPromptAt:null
    }
  });

  await writeAudit({
    actorUserId:user.id,
    action:'TESTIMONIAL_SUBMITTED',
    entityType:'UserTestimonial',
    entityId:row.id,
    summary:'30+ günlük KEKS kullanıcısı doğrulanmış deneyim yorumu gönderdi.',
    metadata:{
      role:context.role,
      rating:input.rating,
      publishConsent:input.publishConsent,
      publicationStatus:status,
      piiFlagged:cleaned.piiFlagged,
      contextLabel:context.contextLabel
    }
  });

  return NextResponse.json({
    ok:true,
    status,
    publishConsent:input.publishConsent,
    contextLabel:context.contextLabel,
    message:status==='PUBLISHED'
      ?'Teşekkürler. Yorumunuz kimlik bilgileri gösterilmeden anasayfada yayınlandı.'
      :status==='REVIEW'
        ?'Teşekkürler. Yayın izniniz alındı; kişisel bilgi güvenliği için yorumunuz kısa bir incelemeden sonra yayınlanacak.'
        :'Teşekkürler. Geri bildiriminiz KEKS gelişimi için kaydedildi ve herkese açık yayınlanmayacak.'
  });
}

export const GET=withApiErrors(GET__handler);
export const POST=withApiErrors(POST__handler);
