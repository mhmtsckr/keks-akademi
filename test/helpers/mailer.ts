import { vi } from 'vitest';

/** lib/mailer yerine geçer: testlerde gerçekten e-posta gönderilmez. */
export const sendStudentCredentials = vi.fn();
export const sendAssessmentReport = vi.fn();

export function applyMailerDefaults() {
  sendStudentCredentials.mockResolvedValue(undefined);
  sendAssessmentReport.mockResolvedValue(undefined);
}

applyMailerDefaults();
