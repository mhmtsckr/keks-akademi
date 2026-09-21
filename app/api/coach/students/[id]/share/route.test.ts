import { SignJWT } from 'jose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => import('@/test/helpers/db'));
vi.mock('next/headers', () => import('@/test/helpers/cookies'));

import { db, jsonRequest, resetMocks, setCookie } from '@/test/helpers';
import { PATCH } from './route';

const U = 'http://localhost/api/coach/students/ogrenci-1/share';
const KOC = 'koc-1';
const ctx = { params: Promise.resolve({ id: 'ogrenci-1' }) };

async function kocOlarakGir() {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('kullanici-1')
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + 3600)
    .sign(new TextEncoder().encode(process.env.AUTH_SECRET!));
  setCookie('keks_session', token);
  db.user.findUnique.mockResolvedValue({
    id: 'kullanici-1',
    role: 'COACH',
    coachProfile: { id: KOC },
  });
}

beforeEach(async () => {
  resetMocks();
  db.progressShare.findFirst.mockResolvedValue(null);
  db.progressShare.update.mockResolvedValue({ id: 'paylasim-1', revokedAt: new Date() });
  await kocOlarakGir();
});

describe('PATCH share — paylaşım iptali', () => {
  it('geçerli shareId ile paylaşımı iptal eder', async () => {
    db.progressShare.findFirst.mockResolvedValue({ id: 'paylasim-1' });

    const yanit = await PATCH(jsonRequest(U, { shareId: 'paylasim-1' }, { method: 'PATCH' }), ctx);

    expect(yanit.status).toBe(200);
    // Sorgu hem paylaşım kimliğine hem de koçun öğrencisine daraltılmalı
    expect(db.progressShare.findFirst).toHaveBeenCalledWith({
      where: { id: 'paylasim-1', student: { id: 'ogrenci-1', coachId: KOC } },
    });
    expect(db.progressShare.update).toHaveBeenCalledWith({
      where: { id: 'paylasim-1' },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it('paylaşım bulunamazsa 404 döner', async () => {
    const yanit = await PATCH(jsonRequest(U, { shareId: 'yok' }, { method: 'PATCH' }), ctx);
    expect(yanit.status).toBe(404);
    expect(db.progressShare.update).not.toHaveBeenCalled();
  });

  // --- Regresyon --------------------------------------------------------
  // shareId yokken Prisma id filtresini düşürüyor, findFirst öğrencinin
  // rastgele bir paylaşımını döndürüyor ve o paylaşım iptal ediliyordu.
  it.each([
    ['shareId yok', {}],
    ['shareId boş', { shareId: '' }],
    ['shareId null', { shareId: null }],
    ['shareId sayı', { shareId: 7 }],
  ])('%s ise hiçbir paylaşımı iptal etmeden 400 döner', async (_ad, govde) => {
    db.progressShare.findFirst.mockResolvedValue({ id: 'rastgele-paylasim' });

    const yanit = await PATCH(jsonRequest(U, govde, { method: 'PATCH' }), ctx);

    expect(yanit.status).toBe(400);
    expect(db.progressShare.findFirst).not.toHaveBeenCalled();
    expect(db.progressShare.update).not.toHaveBeenCalled();
  });

  it('bozuk JSON gövdesinde 400 döner', async () => {
    const yanit = await PATCH(jsonRequest(U, '{bozuk', { method: 'PATCH' }), ctx);
    expect(yanit.status).toBe(400);
    expect(db.progressShare.update).not.toHaveBeenCalled();
  });
});
