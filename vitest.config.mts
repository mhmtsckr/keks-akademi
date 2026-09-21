import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  // tsconfig.json'daki "@/*" takma adı Vite tarafından doğrudan okunur.
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    include: ['lib/**/*.test.ts', 'app/**/*.test.ts', 'test/**/*.test.ts'],
    // Entegrasyon testleri gercek Postgres ister; kendi konfigurasyonuyla calisir.
    exclude: [...configDefaults.exclude, 'test/integration/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['lib/**/*.ts', 'app/api/**/*.ts'],
      exclude: ['**/*.test.ts', 'lib/db.ts'],
      // Taban cizgi: bugun olculen degerlerin hemen altinda. Amac hedef degil,
      // gerilemeyi engellemek — kapsam arttikca bu sayilar yukari cekilir.
      thresholds: { statements: 15, branches: 9, functions: 17, lines: 15 },
    },
  },
});
