import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { withApiErrors } from '@/lib/apiGuard';
import {
  buildReflectionComparison,
  buildWeeklyPerformanceSnapshot,
  getIstanbulWeekWindow
} from '@/lib/weeklyReflection';

const schema = z.object({
  bestThing: z.string().trim().min(1).max(800),
  biggestChallenge: z.string().trim().min(1).max(800),
  planRealistic: z.number().int().min(1).max(5),
  selfRating: z.number().int().min(1).max(5),
  nextWeekChange: z.string().trim().min(1).max(800)
});

async function GET__handler() {
  const user = await requireRole(['STUDENT']);
  if (!user.student) return NextResponse.json({ error: 'Öğrenci profili yok.' }, { status: 400 });

  const window = getIstanbulWeekWindow();
  const existing = await db.weeklyReflection.findUnique({
    where: {
      studentId_weekStart: {
        studentId: user.student.id,
        weekStart: window.weekStart
      }
    }
  });

  const snapshot = await buildWeeklyPerformanceSnapshot(user.student.id);

  return NextResponse.json({
    ok: true,
    isSunday: window.isSunday,
    weekStart: window.weekStart.toISOString(),
    existing,
    snapshot
  });
}

async function POST__handler(req: Request) {
  const user = await requireRole(['STUDENT']);
  if (!user.student) return NextResponse.json({ error: 'Öğrenci profili yok.' }, { status: 400 });

  const window = getIstanbulWeekWindow();
  if (!window.isSunday) {
    return NextResponse.json(
      { error: 'Haftalık öz değerlendirme yalnızca pazar günü gönderilebilir.' },
      { status: 409 }
    );
  }

  const body = schema.parse(await req.json());
  const snapshot = await buildWeeklyPerformanceSnapshot(user.student.id);
  const comparison = buildReflectionComparison({
    selfRating: body.selfRating,
    planRealistic: body.planRealistic,
    snapshot
  });

  const reflection = await db.weeklyReflection.upsert({
    where: {
      studentId_weekStart: {
        studentId: user.student.id,
        weekStart: window.weekStart
      }
    },
    update: {
      selfRating: body.selfRating,
      bestThing: body.bestThing,
      biggestChallenge: body.biggestChallenge,
      planRealistic: body.planRealistic,
      nextWeekChange: body.nextWeekChange,
      systemSnapshot: snapshot,
      comparison
    },
    create: {
      studentId: user.student.id,
      weekStart: window.weekStart,
      selfRating: body.selfRating,
      bestThing: body.bestThing,
      biggestChallenge: body.biggestChallenge,
      planRealistic: body.planRealistic,
      nextWeekChange: body.nextWeekChange,
      systemSnapshot: snapshot,
      comparison
    }
  });

  return NextResponse.json({ ok: true, reflection });
}

export const GET = withApiErrors(GET__handler);
export const POST = withApiErrors(POST__handler);
