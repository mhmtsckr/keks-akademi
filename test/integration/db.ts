// Route'lar '@/lib/db' uzerinden gercek Prisma istemcisini kullanir; testler de
// ayni istemciyi kullanir ki ayri bir baglanti havuzu ve gorunurluk sorunu olmasin.
import { db } from '@/lib/db';

export { db };

let tablolar: string[] | null = null;

/** Testler arasi izolasyon: public semadaki tum tablolari bosaltir. */
export async function resetDb() {
  if (!tablolar) {
    const satirlar = await db.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `;
    tablolar = satirlar.map(s => `"public"."${s.tablename}"`);
  }
  if (!tablolar.length) return;
  await db.$executeRawUnsafe(`TRUNCATE TABLE ${tablolar.join(', ')} RESTART IDENTITY CASCADE`);
}

/** CoachAlert'e INSERT'i patlatan gecici trigger: transaction'in son adimini bozar. */
export async function coachAlertPatlat() {
  await db.$executeRawUnsafe(
    `CREATE OR REPLACE FUNCTION test_coach_alert_patlat() RETURNS trigger AS $fn$
     BEGIN RAISE EXCEPTION 'TEST_ZORLANAN_HATA'; END;
     $fn$ LANGUAGE plpgsql`,
  );
  await db.$executeRawUnsafe(
    `CREATE TRIGGER test_coach_alert_patlat BEFORE INSERT ON "CoachAlert"
     FOR EACH ROW EXECUTE FUNCTION test_coach_alert_patlat()`,
  );
}

export async function coachAlertDuzelt() {
  await db.$executeRawUnsafe(`DROP TRIGGER IF EXISTS test_coach_alert_patlat ON "CoachAlert"`);
}
