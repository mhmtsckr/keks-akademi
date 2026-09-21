import { defineConfig } from 'vitest/config';

// Gercek Postgres'e karsi calisan testler. Birim testlerden ayri tutuluyor:
// veritabani gerektirirler, yavastirlar ve birbirlerinin verisini bozmamalari
// icin paralel calismazlar.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'node',
    globalSetup: ['./test/integration/globalSetup.ts'],
    setupFiles: ['./test/integration/setup.ts'],
    include: ['test/integration/**/*.test.ts'],
    fileParallelism: false,
    sequence: { concurrent: false },
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
