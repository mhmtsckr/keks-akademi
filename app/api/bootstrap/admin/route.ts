import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashSecret } from '@/lib/security';

export async function POST(req: Request) {
  const expected = process.env.ADMIN_BOOTSTRAP_SECRET;
  const provided = req.headers.get('x-bootstrap-secret');
  const email = (process.env.ADMIN_EMAIL || '').toLowerCase();
  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD;

  if (!expected || !initialPassword || !email) {
    return NextResponse.json({ error: 'Bootstrap değişkenleri yapılandırılmamış.' }, { status: 503 });
  }
  if (!provided || provided !== expected) {
    return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Yönetici hesabı bulunamadı.' }, { status: 404 });
  }
  if (user.passwordHash) {
    return NextResponse.json({ error: 'Yönetici parolası zaten oluşturulmuş.' }, { status: 409 });
  }

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashSecret(initialPassword), status: 'ACTIVE' },
  });

  return NextResponse.json({ ok: true, message: 'Yönetici parolası oluşturuldu. Bootstrap secret artık kaldırılabilir.' });
}
