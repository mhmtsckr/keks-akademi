import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { turkeyMonthWindow } from '@/lib/monthlyAccess';
import { createExternalAssessmentToken } from '@/lib/externalAssessment';

const SITE_URL='https://kazandiran-egitim-kocluk.mhmtsckr029.chatgpt.site/';

export async function GET(req:Request){
  const user=await requireRole(['STUDENT']);
  if(!user.student)return NextResponse.json({error:'Öğrenci profili yok.'},{status:400});

  const month=turkeyMonthWindow();
  const access=await db.testAccess.findFirst({
    where:{
      studentId:user.student.id,
      status:'READY',
      OR:[
        {source:{not:'ACADEMY_CODE'}},
        {source:'ACADEMY_CODE',createdAt:{gte:month.start,lt:month.end}}
      ]
    },
    orderBy:{createdAt:'asc'}
  });

  if(!access){
    const completed=await db.assessment.findFirst({
      where:{studentId:user.student.id,completedAt:{gte:month.start,lt:month.end}},
      orderBy:{completedAt:'desc'},
      select:{id:true,completedAt:true,formVersion:true}
    });
    if(completed)return NextResponse.json({ok:true,status:'COMPLETED',assessment:completed});
    return NextResponse.json({ok:true,status:'NO_ACCESS'});
  }

  const token=await createExternalAssessmentToken(user.student.id,access.id);
  const appOrigin=new URL(req.url).origin;
  const siteUrl=new URL(SITE_URL);
  siteUrl.searchParams.set('keks_session',token);
  siteUrl.searchParams.set('keks_callback',appOrigin+'/api/external/keks-assessment/submit');
  siteUrl.searchParams.set('keks_return',appOrigin+'/ogrenci#keks-egilim-taramasi');
  siteUrl.searchParams.set('keks_embed','1');

  return NextResponse.json({
    ok:true,
    status:'READY',
    url:siteUrl.toString(),
    expiresInSeconds:7200
  });
}
