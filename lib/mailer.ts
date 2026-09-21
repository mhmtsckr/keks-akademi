import { Resend } from 'resend';

const KEKS_CONTACT_EMAIL=process.env.KEKS_CONTACT_EMAIL||'keksakademi@gmail.com';
const KEKS_FROM=()=>process.env.REPORT_FROM||'KEKS Akademi <onboarding@resend.dev>';

export async function sendStudentCredentials(input:{email:string;studentName:string;studentCode:string;accessKey:string;coachName:string}){
  if(!process.env.RESEND_API_KEY)return {skipped:true,error:'RESEND_API_KEY_MISSING'};
  const resend=new Resend(process.env.RESEND_API_KEY);
  const from=KEKS_FROM();
  const html=`
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#13243a">
      <h1>KEKS Akademi Öğrenci Başvurusu</h1>
      <p>Merhaba <strong>${escapeHtml(input.studentName)}</strong>,</p>
      <p>Başvurunuz alınmıştır ve seçtiğiniz koç <strong>${escapeHtml(input.coachName)}</strong> hesabınıza atanmıştır.</p>
      <p>KEKS Akademi öğrenci giriş bilgileriniz:</p>
      <div style="padding:16px;border:1px solid #e0c16b;border-radius:12px;background:#faf8f2">
        <p><strong>Öğrenci kodu:</strong> ${escapeHtml(input.studentCode)}</p>
        <p><strong>Giriş anahtarı:</strong> ${escapeHtml(input.accessKey)}</p>
      </div>
      <p>Bu bilgileri güvenli bir yerde saklayın. Öğrenci paneline öğrenci kodu ve giriş anahtarıyla giriş yapabilirsiniz.</p>
      <p>KEKS Akademi</p>
    </div>`;
  const result=await resend.emails.send({
    from,
    to:input.email,
    replyTo:KEKS_CONTACT_EMAIL,
    subject:'KEKS Akademi | Öğrenci giriş bilgileriniz',
    html
  });
  return result;
}

export async function sendAssessmentReport(input: { studentCode: string; studentName: string; assessmentId: string; report: unknown }) {
  if (!process.env.RESEND_API_KEY) return { skipped: true };
  const resend = new Resend(process.env.RESEND_API_KEY);
  const recipient = KEKS_CONTACT_EMAIL;
  const from = KEKS_FROM();
  const body = `<h1>KEKS Test Raporu</h1><p><strong>Öğrenci:</strong> ${escapeHtml(input.studentName)} (${escapeHtml(input.studentCode)})</p><p><strong>Kayıt:</strong> ${escapeHtml(input.assessmentId)}</p><pre>${escapeHtml(JSON.stringify(input.report, null, 2))}</pre>`;
  return resend.emails.send({ from, to: recipient, replyTo: KEKS_CONTACT_EMAIL, subject: `KEKS Test Raporu | Öğrenci ${input.studentCode}`, html: body });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]!));
}
