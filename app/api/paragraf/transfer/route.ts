import {NextResponse} from 'next/server';
import {z} from 'zod';
import {publicIndependentTransfer,gradeIndependentTransfer} from '@/lib/paragrafIndependentTransfer';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const noStore={'Cache-Control':'private, no-store'} as const;
const query=z.object({
  testNo:z.coerce.number().int().min(1).max(50),
  encoded:z.string().regex(/^[A-EX]{30}$/),
  sourceQuestionNo:z.coerce.number().int().min(1).max(30)
}).strict();
const submission=query.extend({
  questionId:z.string().regex(/^\d{5}$/),
  answer:z.enum(['A','B','C','D','E'])
}).strict();
function error(){return NextResponse.json({error:'Bu test ve soru için uygun bağımsız çalışma bulunamadı.'},{status:404,headers:noStore});}
export async function GET(req:Request){
  const url=new URL(req.url);
  const parsed=query.safeParse({
    testNo:url.searchParams.get('testNo'),
    encoded:url.searchParams.get('encoded'),
    sourceQuestionNo:url.searchParams.get('sourceQuestionNo')
  });
  if(!parsed.success)return NextResponse.json({error:'Geçersiz test, işaretleme veya soru numarası.'},{status:400,headers:noStore});
  const transfer=publicIndependentTransfer(parsed.data.testNo,parsed.data.encoded,parsed.data.sourceQuestionNo);
  if(!transfer)return error();
  // Correct answer, explanation and private source record are intentionally omitted.
  return NextResponse.json({ok:true,question:transfer},{headers:noStore});
}
export async function POST(req:Request){
  let json:unknown;
  try{json=await req.json();}catch{return NextResponse.json({error:'Geçersiz JSON.'},{status:400,headers:noStore});}
  const parsed=submission.safeParse(json);
  if(!parsed.success)return NextResponse.json({error:'Yanıt alanları geçersiz.'},{status:400,headers:noStore});
  const p=parsed.data;
  const result=gradeIndependentTransfer(p.testNo,p.encoded,p.sourceQuestionNo,p.questionId,p.answer);
  if(!result)return error();
  return NextResponse.json({ok:true,result},{headers:noStore});
}
