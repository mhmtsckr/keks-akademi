import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';

const schema = z.object({
  sourceStudentCode: z.string().min(1).max(40),
  targetStudentCode: z.string().min(1).max(40),
  targetName: z.string().min(2).max(120).default('Elif Koçak'),
  targetGradeLevel: z.string().min(1).max(80).default('12. Sınıf/YKS'),
  backup: z.object({
    students: z.array(z.record(z.string(), z.unknown())),
    groups: z.array(z.record(z.string(), z.unknown())).optional().default([]),
    questions: z.array(z.record(z.string(), z.unknown())).optional().default([]),
    library: z.array(z.record(z.string(), z.unknown())).optional().default([]),
    teamChallenges: z.array(z.record(z.string(), z.unknown())).optional().default([]),
  }).passthrough(),
});

function arr(v: unknown): Record<string, unknown>[] {
  return Array.isArray(v) ? v.filter((x): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x)) : [];
}
function str(v: unknown): string {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}
function dateOf(v: unknown): Date {
  const raw = str(v);
  if (!raw) return new Date();
  const d = new Date(raw.length === 10 ? raw + 'T12:00:00.000Z' : raw);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}
function legacyId(source: string, category: string, item: Record<string, unknown>, index: number) {
  return `legacy:${source}:${category}:${str(item.id) || index}`;
}

export async function POST(req: Request) {
  await requireRole(['ADMIN']);
  const input = schema.parse(await req.json());
  const sourceCode = input.sourceStudentCode.trim();
  const targetCode = input.targetStudentCode.trim();

  const source = input.backup.students.find(s =>
    str(s.accessCode).trim().toUpperCase() === sourceCode.toUpperCase()
  );
  if (!source) {
    return NextResponse.json({ error: `Yedekte öğrenci kodu ${sourceCode} bulunamadı.` }, { status: 404 });
  }

  const target = await db.student.findUnique({ where: { studentCode: targetCode } });
  if (!target) {
    return NextResponse.json({ error: `Hedef öğrenci kodu ${targetCode} yeni sistemde bulunamadı.` }, { status: 404 });
  }

  const sourceId = str(source.id);
  const relatedGroups = input.backup.groups.filter(g => arr(g.members).length
    ? false
    : Array.isArray(g.members) && (g.members as unknown[]).map(str).includes(sourceId)
  );
  const relatedGroupIds = new Set(relatedGroups.map(g => str(g.id)));
  const relatedQuestions = input.backup.questions.filter(q => str(q.studentId) === sourceId);
  const relatedLibrary = input.backup.library.filter(x => str(x.studentId) === sourceId || str(x.scope) === 'all');
  const relatedChallenges = input.backup.teamChallenges.filter(x => relatedGroupIds.has(str(x.groupId)));

  const schedule = arr(source.schedule);
  const activities = arr(source.activities);
  const studySessions = arr(source.studySessions);
  const nets = arr(source.nets);
  const exams = arr(source.exams);
  const tests = arr(source.tests);

  await db.$transaction(async tx => {
    await tx.student.update({
      where: { id: target.id },
      data: {
        fullName: input.targetName,
        gradeLevel: input.targetGradeLevel,
      },
    });

    await tx.studyPlan.upsert({
      where: { legacyId: `legacy:${sourceCode}:archive` },
      create: {
        studentId: target.id,
        title: `Eski KEKS tam veri arşivi · kaynak ${sourceCode}`,
        active: false,
        legacyId: `legacy:${sourceCode}:archive`,
        payload: {
          importedFrom: 'ags-edebiyat-mizac.chatgpt.site',
          sourceStudentCode: sourceCode,
          sourceStudent: source,
          workspace: {
            groups: relatedGroups,
            questions: relatedQuestions,
            library: relatedLibrary,
            teamChallenges: relatedChallenges,
          },
        },
      },
      update: {
        studentId: target.id,
        payload: {
          importedFrom: 'ags-edebiyat-mizac.chatgpt.site',
          sourceStudentCode: sourceCode,
          sourceStudent: source,
          workspace: {
            groups: relatedGroups,
            questions: relatedQuestions,
            library: relatedLibrary,
            teamChallenges: relatedChallenges,
          },
        },
      },
    });

    await tx.studyPlan.upsert({
      where: { legacyId: `legacy:${sourceCode}:schedule` },
      create: {
        studentId: target.id,
        title: 'Eski Sistem Çalışma Programı',
        active: true,
        legacyId: `legacy:${sourceCode}:schedule`,
        payload: {
          schedule,
          targetNet: source.targetNet ?? null,
          targetSchool: source.targetSchool ?? null,
          processGoal: source.processGoal ?? null,
          intakeNote: source.intakeNote ?? null,
          nextReevalDate: source.nextReevalDate ?? null,
        },
      },
      update: {
        studentId: target.id,
        active: true,
        payload: {
          schedule,
          targetNet: source.targetNet ?? null,
          targetSchool: source.targetSchool ?? null,
          processGoal: source.processGoal ?? null,
          intakeNote: source.intakeNote ?? null,
          nextReevalDate: source.nextReevalDate ?? null,
        },
      },
    });

    for (const [category, items] of [['activity', activities], ['study-session', studySessions]] as const) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const lid = legacyId(sourceCode, category, item, i);
        await tx.dailyLog.upsert({
          where: { legacyId: lid },
          create: {
            studentId: target.id,
            date: dateOf(item.date ?? item.startAt),
            legacyId: lid,
            payload: { category, ...item },
          },
          update: {
            studentId: target.id,
            date: dateOf(item.date ?? item.startAt),
            payload: { category, ...item },
          },
        });
      }
    }

    for (const [category, items] of [['net', nets], ['exam', exams]] as const) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const lid = legacyId(sourceCode, category, item, i);
        await tx.examResult.upsert({
          where: { legacyId: lid },
          create: {
            studentId: target.id,
            examType: str(item.examType ?? item.type ?? item.name) || (category === 'net' ? 'Eski Sistem Net Kaydı' : 'Eski Sistem Sınavı'),
            legacyId: lid,
            payload: { category, ...item },
          },
          update: {
            studentId: target.id,
            examType: str(item.examType ?? item.type ?? item.name) || (category === 'net' ? 'Eski Sistem Net Kaydı' : 'Eski Sistem Sınavı'),
            payload: { category, ...item },
          },
        });
      }
    }

    for (let i = 0; i < tests.length; i++) {
      const item = tests[i];
      const version = `legacy-${sourceCode}-${str(item.id) || i}`;
      const existing = await tx.assessment.findFirst({
        where: { studentId: target.id, formVersion: version },
      });
      const data = {
        studentId: target.id,
        formVersion: version,
        answers: (item.answers ?? {}) as object,
        scores: (item.scores ?? item.result ?? {}) as object,
        report: item as object,
        completedAt: dateOf(item.date ?? item.completedAt),
      };
      if (existing) await tx.assessment.update({ where: { id: existing.id }, data });
      else await tx.assessment.create({ data });
    }
  });

  return NextResponse.json({
    ok: true,
    sourceStudentCode: sourceCode,
    targetStudentCode: targetCode,
    targetName: input.targetName,
    imported: {
      rawArchive: 1,
      schedule: schedule.length,
      activities: activities.length,
      studySessions: studySessions.length,
      nets: nets.length,
      exams: exams.length,
      tests: tests.length,
      guidance: arr(source.guidance).length,
      reevaluations: arr(source.reevaluations).length,
      methodSessions: arr(source.methodSessions).length,
      mastery: arr(source.mastery).length,
      wrongAnswers: arr(source.wrongAnswers).length,
      reviewItems: arr(source.reviewItems).length,
      selfAssessments: arr(source.selfAssessments).length,
      energyLogs: arr(source.energyLogs).length,
      goalContracts: arr(source.goalContracts).length,
      calendarEvents: arr(source.calendarEvents).length,
      portfolio: arr(source.portfolio).length,
      relatedQuestions: relatedQuestions.length,
      relatedGroups: relatedGroups.length,
      relatedLibrary: relatedLibrary.length,
      relatedChallenges: relatedChallenges.length,
    },
  });
}
