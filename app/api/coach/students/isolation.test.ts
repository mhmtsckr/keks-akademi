import { SignJWT } from 'jose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => import('@/test/helpers/db'));
vi.mock('next/headers', () => import('@/test/helpers/cookies'));

import { db, jsonRequest, resetMocks, setCookie } from '@/test/helpers';

import * as alerts from './[id]/alerts/route';
import * as analysis from './[id]/analysis/route';
import * as library from './[id]/library/route';
import * as operations from './[id]/operations/route';
import * as preInterview from './[id]/pre-interview/route';
import * as ogrenciKaydi from './[id]/route';
import * as sessionWorkflow from './[id]/session-workflow/route';
import * as share from './[id]/share/route';
import * as smartPlan from './[id]/smart-plan/route';
import * as target from './[id]/target/route';
import * as targetSync from './[id]/target/sync/route';
import * as workspace from './[id]/workspace/route';

/**
 * README'nin değişmezi: "Koç yalnızca kendi öğrencilerini görür."
 *
 * Bu kural her route'ta ayrı ayrı, elle uygulanıyor. Buradaki tablo, kuralı
 * uygulamayı unutan tek bir route'u yakalamak için var.
 */

const U = 'http://localhost/api/coach/students/x';
const KOC_A = 'koc-a';
const KOC_B = 'koc-b';
const BENIM = 'ogrenci-a';
const BASKASININ = 'ogrenci-b';

const OGRENCILER = [
  {
    id: BENIM,
    coachId: KOC_A,
    studentCode: 'KEKS-AAAA1111',
    fullName: 'A Öğrenci',
    gradeLevel: '11',
    userId: null,
    user: null,
    parentProfiles: [],
  },
  {
    id: BASKASININ,
    coachId: KOC_B,
    studentCode: 'KEKS-BBBB2222',
    fullName: 'B Öğrenci',
    gradeLevel: '11',
    userId: null,
    user: null,
    parentProfiles: [],
  },
];

/**
 * Prisma anlambilimini taklit eder: `where` içindeki `undefined` alanlar
 * filtreye DAHİL EDİLMEZ. Bu ayrıntı önemli — `coachId: user.coachProfile?.id`
 * yazan bir route, coachProfile yokken sahiplik filtresini sessizce kaybeder.
 */
function prismaBul(where: Record<string, unknown> = {}) {
  return (
    OGRENCILER.find(o =>
      Object.entries(where).every(
        ([alan, deger]) => deger === undefined || (o as Record<string, unknown>)[alan] === deger,
      ),
    ) ?? null
  );
}

type Handler = (req: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;

const ROTALAR: Array<[string, Handler, () => Request]> = [
  ['GET alerts', alerts.GET as Handler, () => new Request(U)],
  [
    'PATCH alerts',
    alerts.PATCH as Handler,
    () => jsonRequest(U, { alertId: 'uyari-1', resolved: true }, { method: 'PATCH' }),
  ],
  ['POST analysis', analysis.POST as Handler, () => new Request(U, { method: 'POST' })],
  ['POST library', library.POST as Handler, () => jsonRequest(U, { title: 'Kaynak' })],
  ['GET operations', operations.GET as Handler, () => new Request(U)],
  [
    'POST operations',
    operations.POST as Handler,
    () => jsonRequest(U, { action: 'cohort-create', name: 'Kohort' }),
  ],
  ['GET pre-interview', preInterview.GET as Handler, () => new Request(U)],
  ['POST pre-interview', preInterview.POST as Handler, () => jsonRequest(U, {})],
  [
    'DELETE student',
    ogrenciKaydi.DELETE as Handler,
    () => jsonRequest(U, { confirmationCode: 'KEKS-BBBB2222' }, { method: 'DELETE' }),
  ],
  ['GET session-workflow', sessionWorkflow.GET as Handler, () => new Request(U)],
  [
    'POST session-workflow',
    sessionWorkflow.POST as Handler,
    () => jsonRequest(U, { sessionId: 'oturum-1' }),
  ],
  ['GET share', share.GET as Handler, () => new Request(U)],
  ['POST share', share.POST as Handler, () => jsonRequest(U, {})],
  [
    'PATCH share',
    share.PATCH as Handler,
    () => jsonRequest(U, { shareId: 'paylasim-1' }, { method: 'PATCH' }),
  ],
  ['POST smart-plan', smartPlan.POST as Handler, () => new Request(U, { method: 'POST' })],
  ['POST target', target.POST as Handler, () => jsonRequest(U, {})],
  ['POST target/sync', targetSync.POST as Handler, () => new Request(U, { method: 'POST' })],
  ['POST workspace', workspace.POST as Handler, () => jsonRequest(U, {})],
];

async function oturumAc(kullanici: Record<string, unknown>) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(kullanici.id))
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + 3600)
    .sign(new TextEncoder().encode(process.env.AUTH_SECRET!));
  setCookie('keks_session', token);
  db.user.findUnique.mockResolvedValue(kullanici);
}

const koc = { id: 'kullanici-a', role: 'COACH', coachProfile: { id: KOC_A } };
const kocProfilsiz = { id: 'kullanici-admin', role: 'ADMIN', coachProfile: null };

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  resetMocks();
  db.student.findFirst.mockImplementation(async (arg: { where?: Record<string, unknown> }) =>
    prismaBul(arg?.where),
  );
  db.student.findUnique.mockImplementation(async (arg: { where?: Record<string, unknown> }) =>
    prismaBul(arg?.where),
  );
  // Paylaşım kaydı öğrenci ilişkisi üzerinden daraltılıyor
  db.progressShare.findFirst.mockImplementation(
    async (arg: { where?: { id?: string; student?: Record<string, unknown> } }) =>
      prismaBul(arg?.where?.student) ? { id: arg?.where?.id } : null,
  );
  for (const model of [
    db.coachingSession,
    db.coachingAction,
    db.examAnalyticsRecord,
    db.calendarConnection,
    db.cohort,
    db.gameAttempt,
    db.badgeAward,
    db.taskSubmission,
  ]) {
    model.findMany.mockResolvedValue([]);
  }
  db.coachAlert.findFirst.mockResolvedValue(null);
});

describe('koç başka bir koçun öğrencisine erişemez', () => {
  it.each(ROTALAR)('%s', async (_ad, rota, istek) => {
    await oturumAc(koc);

    const yanit = await rota(istek(), ctx(BASKASININ));

    // Her route aynı yanıtı vermeli: 403 öğrencinin var olduğunu ele verir.
    expect(yanit.status).toBe(404);
    // Reddin gerçekten sahiplik kontrolünden geldiğini doğrula: route öğrenciyi
    // gerçekten sorgulamış olmalı, gövde doğrulamasında erkenden dönmüş olmamalı.
    expect(
      db.student.findFirst.mock.calls.length +
        db.student.findUnique.mock.calls.length +
        db.progressShare.findFirst.mock.calls.length,
    ).toBeGreaterThan(0);
  });
});

describe('koç profili olmayan kullanıcı hiçbir öğrenciye erişemez', () => {
  // ADMIN rolü requireRole(['COACH','ADMIN']) kapısından geçer ama koç profili
  // yoktur. Her route bunu temiz bir 4xx ile reddetmeli — 500 ile değil.
  it.each(ROTALAR)('%s', async (_ad, rota, istek) => {
    await oturumAc(kocProfilsiz);

    const yanit = await rota(istek(), ctx(BENIM));

    expect(yanit.status).toBeGreaterThanOrEqual(400);
    expect(yanit.status).toBeLessThan(500);
  });
});

describe('oturum ve rol kapısı', () => {
  it.each(ROTALAR)('%s oturum yoksa 401 döner', async (_ad, rota, istek) => {
    db.user.findUnique.mockResolvedValue(null);

    const yanit = await rota(istek(), ctx(BENIM));

    expect(yanit.status).toBe(401);
  });

  it.each(ROTALAR)('%s öğrenci rolüyle 403 döner', async (_ad, rota, istek) => {
    await oturumAc({ id: 'kullanici-ogrenci', role: 'STUDENT', coachProfile: null });

    const yanit = await rota(istek(), ctx(BENIM));

    expect(yanit.status).toBe(403);
  });
});
