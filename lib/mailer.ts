import { db } from '@/lib/db';
import { decryptPrivateCode } from '@/lib/security';
import { sendGmailSmtp } from '@/lib/gmailSmtp';

const KEKS_CONTACT_EMAIL=process.env.KEKS_CONTACT_EMAIL||'keksakademi@gmail.com';
async function sendFromKeksGmail(to:string,subject:string,html:string){
  const envPassword=process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g,'');
  if(envPassword){
    return sendGmailSmtp({username:KEKS_CONTACT_EMAIL,appPassword:envPassword,to,subject,html});
  }
  const config=await db.emailSenderConfig.findUnique({where:{id:'gmail'}});
  if(!config?.enabled)return {skipped:true,error:'GMAIL_NOT_CONFIGURED'};
  try{
    const appPassword=decryptPrivateCode(config.appPasswordCiphertext);
    return await sendGmailSmtp({username:config.email,appPassword,to,subject,html});
  }catch(error){
    return {skipped:true,error:error instanceof Error?error.message:'GMAIL_SEND_FAILED'};
  }
}

export async function sendStudentCredentials(input:{email:string;studentName:string;studentCode:string;accessKey:string;accessKeyExpiresAt:Date;coachName:string}){
  const from=KEKS_CONTACT_EMAIL;
  const html=`
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#13243a">
      <h1>KEKS Akademi Öğrenci Başvurusu</h1>
      <p>Merhaba <strong>${escapeHtml(input.studentName)}</strong>,</p>
      <p>Başvurunuz alınmıştır ve seçtiğiniz koç <strong>${escapeHtml(input.coachName)}</strong> hesabınıza atanmıştır.</p>
      <p>KEKS Akademi öğrenci giriş bilgileriniz:</p>
      <div style="padding:16px;border:1px solid #e0c16b;border-radius:12px;background:#faf8f2">
        <p><strong>Öğrenci kodu:</strong> ${escapeHtml(input.studentCode)}</p>
        <p><strong>Giriş anahtarı:</strong> ${escapeHtml(input.accessKey)}</p>
        <p><strong>Son geçerlilik:</strong> ${escapeHtml(input.accessKeyExpiresAt.toLocaleString('tr-TR',{timeZone:'Europe/Istanbul'}))}</p>
      </div>
      <p>Giriş anahtarınız oluşturulduğu tarihten itibaren 1 yıl geçerlidir. Süre dolduğunda bu anahtarla sisteme giriş yapılamaz.</p>
      <p>Bu bilgileri güvenli bir yerde saklayın. Öğrenci paneline öğrenci kodu ve giriş anahtarıyla giriş yapabilirsiniz.</p>
      <p>KEKS Akademi</p>
    </div>`;
  return sendFromKeksGmail(input.email,'KEKS Akademi | Öğrenci giriş bilgileriniz',html);
}

export async function resendStudentAccessKey(input:{email:string;studentName:string;studentCode:string;accessKey:string;accessKeyExpiresAt:Date}){
  const from=KEKS_CONTACT_EMAIL;
  const html=`
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#13243a">
      <h1>KEKS Akademi Giriş Anahtarı</h1>
      <p>Merhaba <strong>${escapeHtml(input.studentName)}</strong>,</p>
      <p>Giriş bilgileriniz doğrulandı. Mevcut giriş anahtarınız değiştirilmeden yeniden gönderilmiştir.</p>
      <div style="padding:16px;border:1px solid #e0c16b;border-radius:12px;background:#faf8f2">
        <p><strong>Öğrenci kodu:</strong> ${escapeHtml(input.studentCode)}</p>
        <p><strong>Giriş anahtarı:</strong> ${escapeHtml(input.accessKey)}</p>
        <p><strong>Son geçerlilik:</strong> ${escapeHtml(input.accessKeyExpiresAt.toLocaleString('tr-TR',{timeZone:'Europe/Istanbul'}))}</p>
      </div>
      <p>Bu anahtar yalnızca kendi 1 yıllık geçerlilik süresinin sonuna kadar kullanılabilir.</p>
      <p>Bu talebi siz oluşturmadıysanız KEKS Akademi ile iletişime geçin.</p>
      <p>KEKS Akademi</p>
    </div>`;
  return sendFromKeksGmail(input.email,'KEKS Akademi | Giriş anahtarınız',html);
}

export async function sendStudentRegistrationNotice(input:{email:string;studentName:string;studentCode:string;coachName:string}){
  const html=`
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#13243a">
      <h1>KEKS Akademi Öğrenci Kaydı</h1>
      <p>Merhaba <strong>${escapeHtml(input.studentName)}</strong>,</p>
      <p>Kaydınız tamamlandı ve koçunuz <strong>${escapeHtml(input.coachName)}</strong> olarak tanımlandı.</p>
      <div style="padding:16px;border:1px solid #e0c16b;border-radius:12px;background:#faf8f2">
        <p><strong>Giriş e-postası:</strong> ${escapeHtml(input.email)}</p>
        <p><strong>Öğrenci kodu:</strong> ${escapeHtml(input.studentCode)}</p>
      </div>
      <p>Şifreniz e-posta ile gönderilmez ve KEKS Akademi tarafından görüntülenmez. Girişte kayıt sırasında oluşturduğunuz şifreyi kullanın.</p>
      <p>Şifrenizi unutursanız giriş ekranındaki “Şifremi unuttum” bağlantısından e-posta doğrulamasıyla yeni şifre oluşturabilirsiniz.</p>
      <p>KEKS Akademi</p>
    </div>`;
  return sendFromKeksGmail(input.email,'KEKS Akademi | Kaydınız tamamlandı',html);
}

export async function sendPasswordResetCode(input:{email:string;name:string;code:string}){
  const html=`
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#13243a">
      <h1>KEKS Akademi Şifre Yenileme</h1>
      <p>Merhaba <strong>${escapeHtml(input.name)}</strong>,</p>
      <p>Şifrenizi yenilemek için doğrulama kodunuz:</p>
      <div style="font-size:30px;font-weight:800;letter-spacing:8px;padding:18px;border:1px solid #e0c16b;border-radius:12px;background:#faf8f2;text-align:center">${escapeHtml(input.code)}</div>
      <p>Bu kod 10 dakika geçerlidir. Kodu hiç kimseyle paylaşmayın.</p>
      <p>Bu talebi siz oluşturmadıysanız e-postayı dikkate almayın; mevcut şifreniz değişmez.</p>
      <p>KEKS Akademi</p>
    </div>`;
  return sendFromKeksGmail(input.email,'KEKS Akademi | Şifre yenileme kodu',html);
}

export async function sendAssessmentReport(input: { studentCode: string; studentName: string; assessmentId: string; report: unknown }) {
  const recipient = KEKS_CONTACT_EMAIL;
  const body = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#13243a">
      <h1>KEKS Test Raporu</h1>
      <p><strong>Öğrenci:</strong> ${escapeHtml(input.studentName)} (${escapeHtml(input.studentCode)})</p>
      <p><strong>Kayıt:</strong> ${escapeHtml(input.assessmentId)}</p>
      <p>KEKS değerlendirme raporu aşağıdadır:</p>
      <pre style="white-space:pre-wrap;background:#faf8f2;border:1px solid #e0c16b;border-radius:12px;padding:16px">${escapeHtml(JSON.stringify(input.report, null, 2))}</pre>
      <p>KEKS Akademi</p>
    </div>`;
  return sendFromKeksGmail(recipient,`KEKS Test Raporu | Öğrenci ${input.studentCode}`,body);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]!));
}
