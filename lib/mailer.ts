import { Resend } from 'resend';

export async function sendAssessmentReport(input: { studentCode: string; studentName: string; assessmentId: string; report: unknown }) {
  if (!process.env.RESEND_API_KEY) return { skipped: true };
  const resend = new Resend(process.env.RESEND_API_KEY);
  const recipient = process.env.REPORT_RECIPIENT || 'mhmtsckr029@gmail.com';
  const from = process.env.REPORT_FROM || 'KEKS Akademi <onboarding@resend.dev>';
  const body = `<h1>KEKS Test Raporu</h1><p><strong>Öğrenci:</strong> ${escapeHtml(input.studentName)} (${escapeHtml(input.studentCode)})</p><p><strong>Kayıt:</strong> ${escapeHtml(input.assessmentId)}</p><pre>${escapeHtml(JSON.stringify(input.report, null, 2))}</pre>`;
  return resend.emails.send({ from, to: recipient, subject: `KEKS Test Raporu | Öğrenci ${input.studentCode}`, html: body });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]!));
}
