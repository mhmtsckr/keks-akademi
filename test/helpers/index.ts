import { vi } from 'vitest';
import { applyDbDefaults } from './db';
import { applyCookieDefaults } from './cookies';
import { applyMailerDefaults } from './mailer';

/**
 * beforeEach içinde çağrılır: tüm mock'ları (çağrı geçmişi ve döndürdükleri
 * değerler dahil) sıfırlar, sonra ikizlerin varsayılan davranışını geri yükler.
 */
export function resetMocks() {
  vi.resetAllMocks();
  applyDbDefaults();
  applyCookieDefaults();
  applyMailerDefaults();
}

export { db } from './db';
export { cookieJar, setCookie } from './cookies';
export { sendAssessmentReport, sendStudentCredentials } from './mailer';
export { formRequest, jsonRequest } from './request';
