import { defineConfig, devices } from '@playwright/test'

const PORT = 4330
const links = !!process.env.LINKS

export default defineConfig({
  testDir: 'e2e',
  outputDir: 'test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 90_000,
  expect: { timeout: 8_000 },
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ...(process.env.CI ? [['github'] as ['github']] : []),
  ],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    // Reveals animate; reduced motion keeps runs fast and deterministic. One project keeps full motion.
    contextOptions: { reducedMotion: 'reduce' },
  },
  projects: links
    ? [{ name: 'links', testMatch: /links\.spec\.ts/ }]
    : [
      { name: 'desktop', testIgnore: /(links|motion)\.spec\.ts/, use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } },
      { name: 'mobile', testIgnore: /(links|motion)\.spec\.ts/, use: { ...devices['Pixel 7'] } },
      { name: 'motion', testMatch: /motion\.spec\.ts/, use: { ...devices['Desktop Chrome'], contextOptions: { reducedMotion: 'no-preference' } } },
    ],
  webServer: links ? undefined : {
    command: `npm run build && npx vite preview --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
