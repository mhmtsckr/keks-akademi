import { execSync } from 'node:child_process';

/**
 * Database schema push can be destructive, so the safety gate MUST run before
 * globalSetup, not only inside the later Vitest setupFiles phase.
 * Real Postgres integration tests run against the disposable localhost database
 * named keks_test (or another explicitly named local test database).
 */
export default function setup() {
  const input=process.env.DATABASE_URL;
  if(!input)throw new Error('Integration DATABASE_URL is required before Prisma db push.');
  let target:URL;
  try{target=new URL(input);}catch{throw new Error('Invalid integration DATABASE_URL.');}
  const database=decodeURIComponent(target.pathname.replace(/^\//,''));
  const localHost=['localhost','127.0.0.1','::1'].includes(target.hostname.toLowerCase());
  if(!localHost||!/test/i.test(database)){
    throw new Error(
      'Integration schema push refused: only disposable local PostgreSQL test databases are allowed.'
    );
  }
  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    stdio: 'inherit',
    env: process.env,
  });
}
