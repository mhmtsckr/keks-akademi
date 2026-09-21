import { execSync } from 'node:child_process';

/**
 * Migration dosyasi yok; sema dogrudan push ediliyor. Tum test dosyalari icin
 * bir kez calisir. execFileSync yerine execSync: Windows'ta .cmd dosyalari
 * ancak bir kabuk uzerinden calistirilabiliyor.
 */
export default function setup() {
  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    stdio: 'inherit',
    env: process.env,
  });
}
