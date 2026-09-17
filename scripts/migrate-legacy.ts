/**
 * NON-DESTRUCTIVE LEGACY MIGRATION
 *
 * Amaç: eski öğrenci kodlarını, planları, günlük kayıtları ve deneme sonuçlarını SİLMEDEN
 * yeni coachId ilişkisine taşımak. Gerçek eski veri bu public repoya konmamalıdır.
 *
 * Beklenen dosya: legacy-data/export.json (gitignore içinde)
 */
import fs from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import { db } from '../lib/db';

type LegacyStudent = {
  legacyId: string; studentCode: string; fullName: string; accessKey: string;
  plans?: Array<{ legacyId: string; title: string; payload: unknown }>;
  dailyLogs?: Array<{ legacyId: string; date: string; payload: unknown }>;
  examResults?: Array<{ legacyId: string; examType: string; payload: unknown }>;
};

async function main() {
  const raw = JSON.parse(await fs.readFile('legacy-data/export.json','utf8')) as { adminEmail: string; students: LegacyStudent[] };
  const admin = await db.user.findUnique({ where: { email: raw.adminEmail } });
  if (!admin) throw new Error('Önce yönetici hesabını oluşturun.');
  let coach = await db.coachProfile.findFirst({ where: { userId: admin.id } });
  if (!coach) coach = await db.coachProfile.create({ data: { userId: admin.id } });

  for (const s of raw.students) {
    const student = await db.student.upsert({
      where: { studentCode: s.studentCode },
      update: { coachId: coach.id, legacyExternalId: s.legacyId },
      create: { studentCode: s.studentCode, fullName: s.fullName, accessKeyHash: await bcrypt.hash(s.accessKey,12), coachId: coach.id, legacyExternalId: s.legacyId }
    });
    for (const p of s.plans ?? []) await db.studyPlan.upsert({ where:{legacyId:p.legacyId}, update:{studentId:student.id,title:p.title,payload:p.payload as object}, create:{studentId:student.id,title:p.title,payload:p.payload as object,legacyId:p.legacyId} });
    for (const l of s.dailyLogs ?? []) await db.dailyLog.upsert({ where:{legacyId:l.legacyId}, update:{studentId:student.id,date:new Date(l.date),payload:l.payload as object}, create:{studentId:student.id,date:new Date(l.date),payload:l.payload as object,legacyId:l.legacyId} });
    for (const e of s.examResults ?? []) await db.examResult.upsert({ where:{legacyId:e.legacyId}, update:{studentId:student.id,examType:e.examType,payload:e.payload as object}, create:{studentId:student.id,examType:e.examType,payload:e.payload as object,legacyId:e.legacyId} });
  }
  console.log(`Migrated ${raw.students.length} students without deleting legacy records.`);
}
main().finally(()=>db.$disconnect());
