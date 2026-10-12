
import {createHash} from 'node:crypto';
import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requireRole} from '@/lib/auth';
import {readJson,withApiErrors,HttpError} from '@/lib/apiGuard';
import {db} from '@/lib/db';
import {evaluateEditorialGate,EDITORIAL_STAGES} from '@/lib/editorialGate';

export const runtime='nodejs';
export const dynamic='force-dynamic';

const stageSchema=z.enum(EDITORIAL_STAGES);
const optionSchema=z.array(z.string().trim().min(1).max(800)).length(5)
 .refine(a=>new Set(a.map(v=>v.toLocaleLowerCase('tr-TR'))).size===5,'Seçenekler farklı olmalı.');
const sourceSchema=z.object({
  doi:z.string().max(180).nullable().optional(),
  pmcid:z.string().max(100).nullable().optional(),
  url:z.string().url().max(500).nullable().optional(),
  title:z.string().max(400).nullable().optional(),
  sourceId:z.string().max(100).nullable().optional()
});
const bodySchema=z.object({
  examType:z.string().trim().min(2).max(40).default('TYT'),
  subject:z.string().trim().min(2).max(80).default('Türkçe'),
  topic:z.string().trim().min(2).max(120),
  skill:z.string().max(160).optional(),
  difficulty:z.string().max(30).optional(),
  passage:z.string().trim().min(50).max(9000),
  stem:z.string().trim().min(15).max(750),
  options:optionSchema,
  correctAnswer:z.enum(['A','B','C','D','E']),
  explanation:z.string().trim().min(10).max(4500),
  sourceRefs:z.array(sourceSchema).min(1).max(5),
  qualityFlags:z.array(z.string().max(120)).max(25).default([])
});
const importSchema=z.object({
  operation:z.literal('IMPORT'),
  items:z.array(bodySchema.extend({externalId:z.string().regex(/^KEKS-TYT-P-\d{5,6}$/)})).min(1).max(25)
});
const assignSchema=z.object({
  operation:z.literal('ASSIGN'),
  email:z.string().email().max(250),
  stage:stageSchema
});
const revokeSchema=z.object({
  operation:z.literal('REVOKE'),
  email:z.string().email().max(250),
  stage:stageSchema
});
const postSchema=z.discriminatedUnion('operation',[importSchema,assignSchema,revokeSchema]);

const identity=z.object({
  id:z.string().min(5),
  revision:z.number().int().positive(),
  contentHash:z.string().regex(/^[a-f0-9]{64}$/)
});
const reviewSchema=identity.extend({
  operation:z.literal('REVIEW'),
  stage:stageSchema,
  decision:z.enum(['APPROVE','REJECT','NEEDS_REVISION']),
  note:z.string().trim().min(20).max(1500),
  confirmedReviewed:z.literal(true),
  rightsVerified:z.boolean().default(false)
});
const reviseSchema=identity.extend({
  operation:z.literal('REVISE'),
  reason:z.string().trim().min(20).max(1500),
  data:bodySchema
});
const publishSchema=identity.extend({
  operation:z.literal('PUBLISH'),
  confirmedPublish:z.literal(true)
});
const patchSchema=z.discriminatedUnion('operation',[reviewSchema,reviseSchema,publishSchema]);

type Content=z.infer<typeof bodySchema>;
function digest(q:Content){
  return createHash('sha256').update(JSON.stringify({
    examType:q.examType,subject:q.subject,topic:q.topic,skill:q.skill||null,
    difficulty:q.difficulty||null,passage:q.passage,stem:q.stem,
    options:q.options,correctAnswer:q.correctAnswer,explanation:q.explanation,
    sourceRefs:q.sourceRefs
  })).digest('hex');
}
function fromDraft(q:any):Content{
  return {
    examType:q.examType,subject:q.subject,topic:q.topic,
    skill:q.skill||undefined,difficulty:q.difficulty||undefined,
    passage:q.passage,stem:q.stem,
    options:q.options as string[],correctAnswer:q.correctAnswer,
    explanation:q.explanation,sourceRefs:q.sourceRefs||[],
    qualityFlags:q.qualityFlags||[]
  };
}
async function GET__handler(req:Request){
  const admin=await requireRole(['ADMIN']);
  const params=new URL(req.url).searchParams;
  const status=params.get('status')||'PENDING';
  const page=Math.max(0,Math.min(1000,Number(params.get('page'))||0));
  const where=status==='ALL'?{}:{status};
  const [rows,counts,reviewers]=await Promise.all([
    db.editorialQuestionDraft.findMany({
      where,orderBy:{createdAt:'asc'},skip:page*20,take:20,
      include:{reviews:{orderBy:{createdAt:'asc'}}}
    }),
    db.editorialQuestionDraft.groupBy({by:['status'],_count:{_all:true}}),
    db.editorialReviewer.findMany({orderBy:{createdAt:'asc'}})
  ]);
  const reviewerIds=[...new Set(reviewers.map(r=>r.userId))];
  const staff=reviewerIds.length?await db.user.findMany({
    where:{id:{in:reviewerIds}},select:{id:true,name:true,email:true,status:true,role:true}
  }):[];
  const staffById=new Map(staff.map(r=>[r.id,r]));
  return NextResponse.json({
    ok:true,
    items:rows.map(row=>({...row,gate:evaluateEditorialGate(row,row.reviews)})),
    counts:counts.map(x=>({status:x.status,count:x._count._all})),
    reviewers:reviewers.map(x=>({stage:x.stage,userId:x.userId,
      name:staffById.get(x.userId)?.name||'Bilinmeyen',
      email:staffById.get(x.userId)?.email||'',
      active:staffById.get(x.userId)?.status==='ACTIVE'})),
    myStages:reviewers.filter(x=>x.userId===admin.id).map(x=>x.stage),
    page
  });
}
async function POST__handler(req:Request){
  const admin=await requireRole(['ADMIN']);
  const input=await readJson(req,postSchema);
  if(input.operation==='IMPORT'){
    const prepared=input.items.map(({externalId,...q})=>({
      externalId,...q,contentHash:digest(q),status:'PENDING',
      options:q.options,sourceRefs:q.sourceRefs,qualityFlags:q.qualityFlags
    }));
    const result=await db.editorialQuestionDraft.createMany({data:prepared,skipDuplicates:true});
    await db.auditLog.create({data:{
      actorUserId:admin.id,action:'EDITORIAL_DRAFT_IMPORT',entityType:'EditorialQuestionDraft',
      summary:result.count+' yayımlanmamış taslak soru içe aktarıldı.',
      metadata:{requested:input.items.length,inserted:result.count}
    }});
    return NextResponse.json({ok:true,inserted:result.count,skipped:input.items.length-result.count});
  }
  const user=await db.user.findUnique({where:{email:input.email.toLowerCase()},
    select:{id:true,name:true,email:true,role:true,status:true}});
  if(!user||user.role!=='ADMIN'||user.status!=='ACTIVE')
    throw new HttpError(400,'Editör için aktif yetkili yönetici hesabı gerekli.');
  if(input.operation==='ASSIGN'){
    await db.editorialReviewer.upsert({
      where:{userId_stage:{userId:user.id,stage:input.stage}},
      create:{userId:user.id,stage:input.stage,grantedByUserId:admin.id},
      update:{}
    });
  }else{
    await db.editorialReviewer.deleteMany({where:{userId:user.id,stage:input.stage}});
  }
  await db.auditLog.create({data:{
    actorUserId:admin.id,action:'EDITORIAL_REVIEWER_'+input.operation,
    entityType:'EditorialReviewer',entityId:user.id,
    summary:'Editör yetkisi '+input.operation+' · '+input.stage,
    metadata:{stage:input.stage,staffUserId:user.id}
  }});
  return NextResponse.json({ok:true,user:{id:user.id,name:user.name},stage:input.stage});
}
async function PATCH__handler(req:Request){
  const admin=await requireRole(['ADMIN']);
  const input=await readJson(req,patchSchema);
  const q=await db.editorialQuestionDraft.findUnique({
    where:{id:input.id},include:{reviews:{orderBy:{createdAt:'asc'}}}
  });
  if(!q)throw new HttpError(404,'Taslak bulunamadı.');
  if(q.status==='PUBLISHED')throw new HttpError(409,'Yayımlanmış kayıt salt okunurdur.');
  if(q.status==='PUBLISHING')throw new HttpError(409,'Yayımlama işlemi sürüyor.');
  if(q.revision!==input.revision||q.contentHash!==input.contentHash)
    throw new HttpError(409,'Soru, incelemeden sonra değişti. Ekranı yenileyin.');

  if(input.operation==='REVIEW'){
    const allowed=await db.editorialReviewer.findUnique({
      where:{userId_stage:{userId:admin.id,stage:input.stage}}
    });
    if(!allowed)throw new HttpError(403,'Bu editör aşaması için görevlendirilmediniz.');
    if(input.stage==='SOURCE_RIGHTS'&&input.decision==='APPROVE'&&!input.rightsVerified)
      throw new HttpError(400,'Kaynak ve ticari kullanım hakkı doğrulanmadan kaynak onayı verilemez.');
    const saved=await db.$transaction(async tx=>{
      const fresh=await tx.editorialQuestionDraft.findUnique({where:{id:input.id}});
      if(!fresh||fresh.revision!==input.revision||fresh.contentHash!==input.contentHash||fresh.status==='PUBLISHED')
        throw new HttpError(409,'İnceleme sırasında soru değişti.');
      return tx.editorialReview.create({data:{
        questionId:input.id,reviewerUserId:admin.id,stage:input.stage,
        decision:input.decision,note:input.note,revision:input.revision,
        contentHash:input.contentHash,
        rightsVerified:input.stage==='SOURCE_RIGHTS'&&input.decision==='APPROVE'&&input.rightsVerified
      }});
    });
    await db.auditLog.create({data:{
      actorUserId:admin.id,action:'EDITORIAL_REVIEW',entityType:'EditorialQuestionDraft',
      entityId:input.id,summary:'Editör kararı · '+input.stage+' · '+input.decision,
      metadata:{reviewId:saved.id,revision:input.revision,contentHash:input.contentHash}
    }});
    return NextResponse.json({ok:true,decisionId:saved.id});
  }

  if(input.operation==='REVISE'){
    const newHash=digest(input.data);
    if(newHash===q.contentHash)
      throw new HttpError(400,'İçerik değişmedi. Gerekirse editör notu ekleyin.');
    await db.$transaction(async tx=>{
      const updated=await tx.editorialQuestionDraft.updateMany({
        where:{id:q.id,revision:q.revision,status:{notIn:['PUBLISHED','PUBLISHING']}},
        data:{...input.data,revision:{increment:1},contentHash:newHash,status:'PENDING'}
      });
      if(updated.count!==1)throw new HttpError(409,'Sürüm değişti, tekrar deneyin.');
      await tx.editorialRevision.create({data:{
        questionId:q.id,revision:q.revision,actorUserId:admin.id,
        reason:input.reason,snapshot:fromDraft(q)
      }});
      await tx.auditLog.create({data:{
        actorUserId:admin.id,action:'EDITORIAL_REVISION',
        entityType:'EditorialQuestionDraft',entityId:q.id,
        summary:'Soru yeni sürüme taşındı; önceki onaylar geçersiz.',
        metadata:{previousRevision:q.revision,nextRevision:q.revision+1,reason:input.reason}
      }});
    });
    return NextResponse.json({ok:true,nextRevision:q.revision+1,previousApprovalsInvalidated:true});
  }

  const published=await db.$transaction(async tx=>{
    const fresh=await tx.editorialQuestionDraft.findUnique({where:{id:input.id}});
    if(!fresh||fresh.revision!==input.revision||fresh.contentHash!==input.contentHash||fresh.status==='PUBLISHED')
      throw new HttpError(409,'Yayımlama için güncel sürüm gerekli.');
    const reviews=await tx.editorialReview.findMany({where:{questionId:input.id},orderBy:{createdAt:'asc'}});
    const gate=evaluateEditorialGate(fresh,reviews);
    if(!gate.ready)throw new HttpError(409,'Yayın kapısı kapalı: '+gate.missing.join(', '));
    // A formerly authorized or suspended signer is NOT an admissible active approver.
    const signed=Object.entries(gate.approvals);
    const activeReviewers=await tx.editorialReviewer.findMany({
      where:{OR:signed.map(([stage,data])=>({stage,userId:data.reviewerUserId}))}
    });
    const signerAccounts=await tx.user.findMany({
      where:{id:{in:signed.map(([,data])=>data.reviewerUserId)},role:'ADMIN',status:'ACTIVE'},
      select:{id:true}
    });
    if(activeReviewers.length!==EDITORIAL_STAGES.length||signerAccounts.length!==EDITORIAL_STAGES.length)
      throw new HttpError(409,'Editörün yetkisi veya aktif hesabı değişti; yeniden inceleme gerekli.');
    const locked=await tx.editorialQuestionDraft.updateMany({
      where:{id:input.id,status:{notIn:['PUBLISHED','PUBLISHING']},revision:input.revision},
      data:{status:'PUBLISHING'}
    });
    if(locked.count!==1)throw new HttpError(409,'Soru başka işlemde yayımlanıyor.');
    const o=fresh.options as string[];
    const question=await tx.questionBankItem.create({data:{
      examType:fresh.examType,subject:fresh.subject,topic:fresh.topic,
      prompt:fresh.passage+'\n\n'+fresh.stem,
      options:{A:o[0],B:o[1],C:o[2],D:o[3],E:o[4]},
      correctAnswer:fresh.correctAnswer,explanation:fresh.explanation,
      sourceKind:'ORIGINAL',active:true,reviewStatus:'APPROVED',
      reviewedAt:new Date(),reviewedByUserId:admin.id,
      reviewNote:'KEKS editöryal yayın kapısı · '+fresh.externalId
    }});
    await tx.editorialQuestionDraft.update({
      where:{id:input.id},data:{status:'PUBLISHED',publishedQuestionId:question.id}
    });
    await tx.auditLog.create({data:{
      actorUserId:admin.id,action:'EDITORIAL_QUESTION_PUBLISHED',
      entityType:'EditorialQuestionDraft',entityId:input.id,
      summary:'Üç bağımsız editör onayıyla öğrenci soru bankasına yayımlandı.',
      metadata:{externalId:fresh.externalId,bankQuestionId:question.id,
        revision:fresh.revision,approvals:gate.approvals}
    }});
    return question.id;
  });
  return NextResponse.json({ok:true,published:true,bankQuestionId:published});
}
export const GET=withApiErrors(GET__handler);
export const POST=withApiErrors(POST__handler);
export const PATCH=withApiErrors(PATCH__handler);
