import { vi } from 'vitest';

/**
 * Prisma istemcisinin test ikizi. Yalnızca testlerin dokunduğu modeller ve
 * metotlar tanımlıdır; tanımsız bir metot çağrılırsa test anlaşılır biçimde
 * patlar ve ikizi genişletmek gerektiği belli olur.
 *
 * ÖNEMLİ: $transaction gerçek bir işlem değildir, geri alma (rollback) simüle
 * EDİLMEZ. "Hata olunca hiçbir şey yazılmadı" türü bir iddiayı bu ikizle
 * doğrulamayın; yalnızca hangi çağrıların yapıldığını ve dönen yanıtı doğrulayın.
 */
export const db = {
  payment: { findUnique: vi.fn(), update: vi.fn() },
  testAccess: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  assessment: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  student: { findUnique: vi.fn(), findFirst: vi.fn() },
  user: { findUnique: vi.fn(), create: vi.fn() },
  academyCode: { create: vi.fn(), findMany: vi.fn(), update: vi.fn() },
  preInterviewForm: { findFirst: vi.fn() },
  preInterviewAssignment: { findFirst: vi.fn(), create: vi.fn() },
  coachAlert: { create: vi.fn(), findFirst: vi.fn() },
  progressShare: { findFirst: vi.fn(), update: vi.fn() },
  testQuestion: { findMany: vi.fn() },
  coachingSession: { findMany: vi.fn() },
  coachingAction: { findMany: vi.fn() },
  examAnalyticsRecord: { findMany: vi.fn() },
  calendarConnection: { findMany: vi.fn() },
  cohort: { findMany: vi.fn() },
  gameAttempt: { findMany: vi.fn() },
  badgeAward: { findMany: vi.fn() },
  taskSubmission: { findMany: vi.fn() },
  $transaction: vi.fn(),
};

/** Hem dizi hem geri çağırma biçimindeki $transaction kullanımını destekler. */
async function transactionUygula(arg: unknown) {
  if (typeof arg === 'function') return (arg as (tx: typeof db) => unknown)(db);
  if (Array.isArray(arg)) return Promise.all(arg);
  throw new Error('TEST: desteklenmeyen $transaction çağrısı');
}

/** vi.resetAllMocks() sonrası varsayılan davranışları geri yükler. */
export function applyDbDefaults() {
  db.$transaction.mockImplementation(transactionUygula);
}

applyDbDefaults();
