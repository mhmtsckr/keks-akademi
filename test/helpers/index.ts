import { vi } from 'vitest';
import { applyDbDefaults } from './db';
import { applyCookieDefaults } from './cookies';
import { applyMailerDefaults } from './mailer';
import { applyAuditDefaults } from './audit';

/**
 * beforeEach içinde çağrılır: tüm mock'ları (çağrı geçmişi ve döndürdükleri
 * değerler dahil) sıfırlar, sonra ikizlerin varsayılan davranışını geri yükler.
 */
export function resetMocks() {
  vi.resetAllMocks();
  applyDbDefaults();
  applyCookieDefaults();
  applyMailerDefaults();
  applyAuditDefaults();
}

export { db } from './db';
export { cookieJar, setCookie } from './cookies';
export { sendAssessmentReport, sendStudentRegistrationNotice, sendEmailVerificationCode, sendAdminTwoFactorCode, sendPasswordResetCode } from './mailer';
export { writeAudit } from './audit';
export { formRequest, jsonRequest } from './request';
