import {NextResponse} from 'next/server';
import {z} from 'zod';
import {requireRole} from '@/lib/auth';
import {db} from '@/lib/db';
import {readJson,withApiErrors,HttpError} from '@/lib/apiGuard';
import {writeAudit} from '@/lib/audit';
import bankJson from '@/data/keks-matematik-2026-bank.json';

export const runtime='nodejs';
export const dynamic='force-dynamic';
type RecordEntry={externalId:string;topic:string;page:number;test:number;number:number;prompt:string;options:Record<string,string>;correctAnswer:string;explanation:string;reviewStatus:string};
const bank=bankJson as RecordEntry[];
const prefix='KEKS_MAT_2026:';
const topicMap:Record<string,string>={
 'TEMEL KAVRAMLAR':'Temel Kavramlar',
 'SAYI BASAMAKLARI':'Sayı Basamakları',
 'RASYONEL SAYILAR':'Rasyonel Sayılar',
 'BÖLME VE BÖLÜNEBİLME':'Bölme ve Bölünebilme',
 'EBOB - EKOK':'OBEB-OKEK',
 'BASİT EŞİTSİZLİKLER':'Basit Eşitsizlikler',
 'MUTLAK DEĞER':'Mutlak Değer',
 'ÜSLÜ SAYILAR':'Üslü Sayılar',
 'KÖKLÜ SAYILAR':'Köklü Sayılar',
 'ÇARPANLARA AYIRMA':'Çarpanlara Ayırma',
 'ORAN - ORANTI':'Oran-Orantı',
 'DENKLEM ÇÖZME':'Denklem Çözme',
 'PROBLEMLER':'Problemler',
 'MANTIK':'Mantık',
 'KÜMELER':'Kümeler',
 'FONKSİYONLAR':'Fonksiyon',
 'PERMÜTASYON - KOMBİNASYON - BİNOM':'Permütasyon-Kombinasyon',
 'OLASILIK':'Olasılık',
 'İSTATİSTİK':'İstatistik',
 'TYT KONDİSYON DENEMESİ':'Karma'
};
const filter={examType:'TYT',subject:'Matematik',sourceKind:{startsWith:prefix}};
const listQuery=z.object({page:z.coerce.number().int().min(0).max(1000).default(0),status:z.enum(['PENDING','APPROVED','REJECTED','ALL']).default('PENDING')});
const importSchema=z.object({offset:z.number().int().min(0).max(2100),limit:z.number().int().min(1).max(50).default(50)});
const optionSchema=z.object({A:z.string().trim().min(1),B:z.string().trim().min(1),C:z.string().trim().min(1),D:z.string().trim().min(1),E:z.string().trim().min(1)}).strict();
const reviewSchema=z.object({
 id:z.string().min(5),action:z.enum(['APPROVE','REJECT','PENDING']),
 checkedMath:z.boolean().default(false),checkedSolution:z.boolean().default(false),
 note:z.string().trim().min(20).max(1500),
 prompt:z.string().trim().min(12).max(5000),
 options:optionSchema,correctAnswer:z.enum(['A','B','C','D','E']),
 explanation:z.string().trim().min(20).max(4000),
 topic:z.string().trim().min(2).max(100)
});
const sourceKind=(externalId:string)=>prefix+externalId;
function hasValidChoices(options:Record<string,string>,answer:string){
 const entries='ABCDE'.split('').map(x=>(options[x]||'').trim());
 return entries.every(x=>x.length>0)&&new Set(entries.map(x=>x.toLocaleLowerCase('tr-TR'))).size===5&&'ABCDE'.includes(answer);
}
async function GET__handler(req:Request){
 await requireRole(['ADMIN']);
 const input=listQuery.parse(Object.fromEntries(new URL(req.url).searchParams.entries()));
 const where={...filter,...(input.status==='ALL'?{}:{reviewStatus:input.status})};
 const [items,count,approved,pending,rejected]=await Promise.all([
  db.questionBankItem.findMany({where,orderBy:{createdAt:'asc'},skip:input.page*20,take:20}),
  db.questionBankItem.count({where:filter}),
  db.questionBankItem.count({where:{...filter,reviewStatus:'APPROVED',active:true}}),
  db.questionBankItem.count({where:{...filter,reviewStatus:'PENDING'}}),
  db.questionBankItem.count({where:{...filter,reviewStatus:'REJECTED'}})
 ]);
 return NextResponse.json({ok:true,total:bank.length,imported:count,approved,pending,rejected,items,page:input.page});
}
async function POST__handler(req:Request){
 const admin=await requireRole(['ADMIN']);
 const input=await readJson(req,importSchema);
 let inserted=0,skipped=0,invalid=0;
 for(const r of bank.slice(input.offset,input.offset+input.limit)){
   if(!/^KEKS-MAT-\d{4}$/.test(r.externalId)||!hasValidChoices(r.options,r.correctAnswer)||r.prompt.length<12||r.explanation.length<20){invalid++;continue;}
   if(await db.questionBankItem.findFirst({where:{sourceKind:sourceKind(r.externalId)},select:{id:true}})){skipped++;continue;}
   await db.questionBankItem.create({data:{
     examType:'TYT',subject:'Matematik',topic:topicMap[r.topic]||r.topic,
     prompt:r.prompt,options:r.options,correctAnswer:r.correctAnswer,explanation:r.explanation,
     sourceKind:sourceKind(r.externalId),sourceYear:2026,
     active:false,reviewStatus:'PENDING',
     reviewNote:'Kitap sayfası '+r.page+'; test '+r.test+'; soru '+r.number+'; matematiksel ve çözümsel kontrol gerekli.'
   }});
   inserted++;
 }
 await writeAudit({actorUserId:admin.id,action:'KEKS_MATH_DRAFT_IMPORT',entityType:'QuestionBankItem',
  summary:inserted+' matematik sorusu taslak aktarıldı.',metadata:{offset:input.offset,inserted,skipped,invalid}});
 return NextResponse.json({ok:true,total:bank.length,nextOffset:Math.min(bank.length,input.offset+input.limit),inserted,skipped,invalid});
}
async function PATCH__handler(req:Request){
 const admin=await requireRole(['ADMIN']);
 const input=await readJson(req,reviewSchema);
 const current=await db.questionBankItem.findFirst({where:{id:input.id,...filter}});
 if(!current)throw new HttpError(404,'KEKS Matematik sorusu bulunamadı.');
 if(!hasValidChoices(input.options,input.correctAnswer))throw new HttpError(400,'Seçenekler boş veya tekrarlı. Doğru seçenek A–E olmalı.');
 if(input.action==='APPROVE'){
   if(!input.checkedMath||!input.checkedSolution)throw new HttpError(400,'Hem soru hem çözüm matematiksel olarak kontrol edilmeden yayımlanamaz.');
   if(input.explanation.length<100)throw new HttpError(400,'Yayımdan önce en az 100 karakterlik, çözüm adımlarını gösteren açıklama yazılmalı.');
 }
 const reviewStatus=input.action==='APPROVE'?'APPROVED':input.action==='REJECT'?'REJECTED':'PENDING';
 const updated=await db.questionBankItem.update({where:{id:current.id},data:{
   prompt:input.prompt,topic:input.topic,options:input.options,
   correctAnswer:input.correctAnswer,explanation:input.explanation,
   active:reviewStatus==='APPROVED',reviewStatus,
   reviewedAt:reviewStatus==='PENDING'?null:new Date(),
   reviewedByUserId:reviewStatus==='PENDING'?null:admin.id,reviewNote:input.note
 }});
 await writeAudit({actorUserId:admin.id,action:'KEKS_MATH_QUESTION_REVIEW',entityType:'QuestionBankItem',entityId:updated.id,
  summary:'Matematik sorusu '+reviewStatus+' durumuna alındı.',metadata:{sourceKind:updated.sourceKind,reviewStatus,note:input.note}});
 return NextResponse.json({ok:true,item:updated});
}
export const GET=withApiErrors(GET__handler);
export const POST=withApiErrors(POST__handler);
export const PATCH=withApiErrors(PATCH__handler);
