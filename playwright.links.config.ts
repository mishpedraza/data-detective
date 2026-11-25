import { defineConfig } from '@playwright/test'

// Research links only: no browser pages or web server, needs internet. `npm run test:links`
export default defineConfig({
  testDir: 'e2e',
  testMatch: /links\.spec\.ts/,
  outputDir: 'test-results',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ...(process.env.CI ? [['github'] as ['github']] : []),
  ],
  projects: [{ name: 'links' }],
})
