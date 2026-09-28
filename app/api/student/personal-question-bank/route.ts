import {NextResponse} from 'next/server';
import {z} from 'zod';
import {readJson,withApiErrors} from '@/lib/apiGuard';
import {requireRole} from '@/lib/auth';
import {db} from '@/lib/db';
import {buildPersonalQuestionBank,createPersonalBankQuiz} from '@/lib/personalQuestionBank';

const postSchema=z.discriminatedUnion('action',[
  z.object({action:z.literal('bookmark'),questionId:z.string().min(1),active:z.boolean().default(true)}),
  z.object({action:z.literal('generate'),kind:z.enum(['WEEKLY_WRONGS','MONTHLY_MIXED']),count:z.number().int().min(1).max(40).optional()})
]);

async function GET__handler(){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const items=await buildPersonalQuestionBank(user.student.id);
  return NextResponse.json({
    ok:true,
    items,
    stats:{
      total:items.length,
      wrong:items.filter(x=>x.reason==='WRONG'||x.reason==='UPLOADED_WRONG').length,
      marked:items.filter(x=>x.reason==='MARKED').length
    }
  });
}

async function POST__handler(req:Request){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});
  const input=await readJson(req,postSchema);

  if(input.action==='bookmark'){
    const q=await db.questionBankItem.findUnique({where:{id:input.questionId},select:{id:true}});
    if(!q)return NextResponse.json({error:'Soru bulunamadı.'},{status:404});
    await db.dailyLog.create({data:{
      studentId:user.student.id,
      date:new Date(),
      payload:{type:'QUESTION_BOOKMARK',questionId:input.questionId,active:input.active}
    }});
    return NextResponse.json({ok:true,active:input.active});
  }

  const generated=await createPersonalBankQuiz({
    studentId:user.student.id,
    userId:user.id,
    kind:input.kind,
    count:input.count
  });
  if(!generated)return NextResponse.json({
    error:input.kind==='WEEKLY_WRONGS'
      ?'Son 7 günde haftalık yanlışlar testi oluşturacak soru yok.'
      :'Son 30 günde aylık karma tekrar oluşturacak soru yok.'
  },{status:404});
  return NextResponse.json({ok:true,...generated});
}

export const GET=withApiErrors(GET__handler);
export const POST=withApiErrors(POST__handler);
