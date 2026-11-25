import { test as base, expect, type Page } from '@playwright/test'

export const CONSENT_KEY = 'data-detective.analytics-consent.v1'
export const POSTHOG = 'https://us.i.posthog.com/**'

export interface Captured {
  event: string
  api_key: string
  distinct_id: string
  properties: Record<string, unknown>
}

interface Fixtures {
  /** Analytics consent before the page loads; `null` leaves the choice unanswered. */
  consent: 'yes' | 'no' | null
  /** PostHog requests the page tried to send. They never leave the machine. */
  analytics: Captured[]
  /** Console and page errors; any entry fails the test. */
  browserErrors: string[]
  /** Messages the test expects and allows. */
  allowedErrors: RegExp[]
}

export const test = base.extend<Fixtures>({
  consent: ['no', { option: true }],
  allowedErrors: [[], { option: true }],
  analytics: async ({ page }, provide) => {
    const sent: Captured[] = []
    await page.route(POSTHOG, async (route) => {
      try { sent.push(JSON.parse(route.request().postData() ?? '{}')) } catch { sent.push({ event: '<unparseable>', api_key: '', distinct_id: '', properties: {} }) }
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"status":1}' })
    })
    await provide(sent)
  },
  browserErrors: async ({ page, allowedErrors }, provide) => {
    const errors: string[] = []
    const allowed = (text: string) => allowedErrors.some((pattern) => pattern.test(text))
    page.on('pageerror', (error) => { if (!allowed(error.message)) errors.push(`pageerror: ${error.message}`) })
    page.on('console', (message) => {
      if (message.type() === 'error' && !allowed(message.text())) errors.push(`console.error: ${message.text()} (${message.location().url})`)
    })
    page.on('requestfailed', (request) => {
      const failure = request.failure()?.errorText ?? ''
      // Aborted navigations and fonts cancelled by the next route are not app failures.
      if (!/ERR_ABORTED/.test(failure)) errors.push(`requestfailed: ${request.method()} ${request.url()} ${failure}`)
    })
    await provide(errors)
  },
  page: async ({ page, consent }, provide, testInfo) => {
    await page.addInitScript(([key, value]) => {
      if (value && localStorage.getItem(key) === null) localStorage.setItem(key, value)
    }, [CONSENT_KEY, consent] as const)
    await provide(page)
    if (testInfo.status !== testInfo.expectedStatus) await attachDiagnostics(page, testInfo)
  },
})

test.afterEach(async ({ browserErrors }, testInfo) => {
  if (browserErrors.length) await testInfo.attach('browser-errors.txt', { body: browserErrors.join('\n'), contentType: 'text/plain' })
  expect(browserErrors, 'Console errors, uncaught exceptions or failed requests').toEqual([])
})

async function attachDiagnostics(page: Page, testInfo: import('@playwright/test').TestInfo) {
  if (page.isClosed()) return
  const state = await page.evaluate(() => ({
    url: location.href,
    viewport: { width: innerWidth, height: innerHeight },
    question: document.querySelector('.discovery-kicker')?.textContent,
    headline: document.querySelector('h1')?.textContent,
    localStorage: Object.fromEntries(Object.entries(localStorage)),
  })).catch((error) => ({ error: String(error) }))
  await testInfo.attach('page-state.json', { body: JSON.stringify(state, null, 2), contentType: 'application/json' })
  await testInfo.attach('page.html', { body: await page.content().catch(() => ''), contentType: 'text/html' })
}

/** Fails if the page is wider than the screen. */
export async function expectNoHorizontalOverflow(page: Page, where: string) {
  const { scroll, width } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: window.innerWidth }))
  expect(scroll, `Horizontal overflow ${where}: page is ${scroll}px wide on a ${width}px screen`).toBeLessThanOrEqual(width + 1)
}

/** Writes saved answers before the app reads them. */
export async function seedStorage(page: Page, entries: Record<string, unknown>) {
  await page.goto('/')
  await page.evaluate((values) => { for (const [key, value] of Object.entries(values)) localStorage.setItem(key, JSON.stringify(value)) }, entries)
}

export { expect }
