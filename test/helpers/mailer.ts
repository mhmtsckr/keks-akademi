import { vi } from 'vitest';

/** lib/mailer yerine geçer: testlerde gerçekten e-posta gönderilmez. */
export const sendAssessmentReport = vi.fn();
export const sendStudentRegistrationNotice = vi.fn();
export const sendEmailVerificationCode = vi.fn();
export const sendAdminTwoFactorCode = vi.fn();
export const sendPasswordResetCode = vi.fn();

export function applyMailerDefaults() {
  sendAssessmentReport.mockResolvedValue(undefined);
  sendStudentRegistrationNotice.mockResolvedValue(undefined);
  sendEmailVerificationCode.mockResolvedValue(undefined);
  sendAdminTwoFactorCode.mockResolvedValue(undefined);
  sendPasswordResetCode.mockResolvedValue(undefined);
}

applyMailerDefaults();
