import { SignJWT } from 'jose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => import('@/test/helpers/db'));
vi.mock('@/lib/mailer', () => import('@/test/helpers/mailer'));
vi.mock('next/headers', () => import('@/test/helpers/cookies'));

import { db, jsonRequest, resetMocks, sendAssessmentReport, setCookie } from '@/test/helpers';
import { detectEducationBand } from '@/lib/taskEvaluation';
import { getScreeningForm } from '@/lib/screeningForms';
import { POST } from './route';

const U='http://localhost/api/student/test/submit';
const GRADE='11';
const EDUCATION_BAND=detectEducationBand(GRADE);
const FORM=getScreeningForm(EDUCATION_BAND);

async function oturumAc(kullanici:Record<string,unknown>){
  const token=await new SignJWT({})
    .setProtectedHeader({alg:'HS256'})
    .setSubject(String(kullanici.id))
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now()/1000)+3600)
    .sign(new TextEncoder().encode(process.env.AUTH_SECRET!));
  setCookie('keks_session',token);
  db.user.findUnique.mockResolvedValue(kullanici);
}

const ogrenci={
  id:'kullanici-1',
  role:'STUDENT',
  status:'ACTIVE',
  student:{
    id:'ogrenci-1',
    studentCode:'KEKS-AAAA1111',
    fullName:'Ayşe Yılmaz',
    gradeLevel:GRADE
  }
};

function gecerliGovde(overrides:Record<string,unknown>={}){
  return {
    formVersion:FORM.version,
    educationBand:EDUCATION_BAND,
    answers:FORM.questions.map(q=>({questionId:q.id,value:4})),
    ...overrides
  };
}

function mutluYol(){
  db.testAccess.findFirst.mockResolvedValue({
    id:'erisim-1',
    studentId:'ogrenci-1',
    source:'ACADEMY_CODE',
    status:'READY',
    createdAt:new Date('2026-09-01T10:00:00.000Z'),
    paymentId:null
  });
  db.assessment.findFirst.mockResolvedValue(null);
  db.student.findUnique.mockResolvedValue({coachId:null});
  db.preInterviewForm.findFirst.mockResolvedValue(null);
  db.testAccess.updateMany.mockResolvedValue({count:1});
  db.assessment.create.mockResolvedValue({id:'tarama-1'});
  db.coachAccessCode.updateMany.mockResolvedValue({count:0});
  db.coachAccessCode.create.mockResolvedValue({id:'koc-kod-1'});
  db.assessment.update.mockResolvedValue({id:'tarama-1'});
}

beforeEach(async()=>{
  resetMocks();
  db.testAccess.findFirst.mockResolvedValue(null);
  db.assessment.findFirst.mockResolvedValue(null);
  db.student.findUnique.mockResolvedValue({coachId:null});
  db.preInterviewForm.findFirst.mockResolvedValue(null);
  vi.spyOn(console,'error').mockImplementation(()=>{});
  await oturumAc(ogrenci);
});

describe('POST test/submit — girdi doğrulama',()=>{
  it.each([
    ['answers yok',{formVersion:FORM.version,educationBand:EDUCATION_BAND}],
    ['answers dizi değil',gecerliGovde({answers:'hepsi'})],
    ['answers boş',gecerliGovde({answers:[]})],
    ['formVersion yok',{educationBand:EDUCATION_BAND,answers:[{questionId:'x',value:3}]}],
    ['educationBand yok',{formVersion:FORM.version,answers:[{questionId:'x',value:3}]}],
    ['cevap değeri sıfır',gecerliGovde({answers:[{questionId:FORM.questions[0].id,value:0}]})],
    ['cevap değeri ölçek dışı',gecerliGovde({answers:[{questionId:FORM.questions[0].id,value:9}]})],
    ['cevap değeri ondalıklı',gecerliGovde({answers:[{questionId:FORM.questions[0].id,value:2.5}]})],
    ['questionId yok',gecerliGovde({answers:[{value:3}]})],
  ])('%s ise 500 değil 400 döner',async(_ad,icerik)=>{
    const yanit=await POST(jsonRequest(U,icerik));
    expect(yanit.status).toBe(400);
    expect(db.testAccess.findFirst).not.toHaveBeenCalled();
  });

  it('bozuk JSON gövdesinde 400 döner',async()=>{
    const yanit=await POST(jsonRequest(U,'{bozuk'));
    expect(yanit.status).toBe(400);
  });
});

describe('POST test/submit — erişim ve form kontrolü',()=>{
  it('aktif test erişimi yoksa 403 döner',async()=>{
    const yanit=await POST(jsonRequest(U,gecerliGovde()));
    expect(yanit.status).toBe(403);
    expect(db.assessment.create).not.toHaveBeenCalled();
  });

  it('form sürümü güncel değilse 409 döner',async()=>{
    mutluYol();
    const yanit=await POST(jsonRequest(U,gecerliGovde({formVersion:'ESKI_FORM'})));
    expect(yanit.status).toBe(409);
    expect((await yanit.json()).error).toContain('Tarama formu güncellendi');
  });

  it('eksik cevapla gönderim reddedilir',async()=>{
    mutluYol();
    const answers=FORM.questions.slice(0,-1).map(q=>({questionId:q.id,value:4}));
    const yanit=await POST(jsonRequest(U,gecerliGovde({answers})));
    expect(yanit.status).toBe(400);
    expect((await yanit.json()).error).toContain('Tüm tarama maddeleri cevaplanmalıdır');
    expect(db.assessment.create).not.toHaveBeenCalled();
  });
});

describe('POST test/submit — başarılı gönderim',()=>{
  it('taramayı kaydeder ve erişimi atomik olarak tüketir',async()=>{
    mutluYol();
    const yanit=await POST(jsonRequest(U,gecerliGovde()));

    expect(yanit.status).toBe(200);
    expect(db.testAccess.updateMany).toHaveBeenCalledWith({
      where:{id:'erisim-1',studentId:'ogrenci-1',status:'READY'},
      data:{status:'USED',usedAt:expect.any(Date)}
    });
    const veri=db.assessment.create.mock.calls[0][0].data;
    expect(veri.studentId).toBe('ogrenci-1');
    expect(veri.formVersion).toBe(FORM.version);
    expect(veri.report.disclaimer).toContain('psikolojik tanı koymaz');
    expect(db.coachAccessCode.create).toHaveBeenCalledTimes(1);
  });

  it('raporu e-postayla gönderir ve gönderim zamanını işler',async()=>{
    mutluYol();
    await POST(jsonRequest(U,gecerliGovde()));

    expect(sendAssessmentReport).toHaveBeenCalledWith(
      expect.objectContaining({studentCode:'KEKS-AAAA1111',assessmentId:'tarama-1'})
    );
    expect(db.assessment.update).toHaveBeenCalledWith({
      where:{id:'tarama-1'},
      data:{emailedAt:expect.any(Date)}
    });
  });

  it('e-posta gönderimi başarısız olsa bile tarama kaydı korunur',async()=>{
    mutluYol();
    sendAssessmentReport.mockRejectedValue(new Error('mail down'));

    const yanit=await POST(jsonRequest(U,gecerliGovde()));

    expect(yanit.status).toBe(200);
    expect(db.assessment.create).toHaveBeenCalledTimes(1);
  });
});
