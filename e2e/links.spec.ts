import { test, expect } from '@playwright/test'
import { evidenceLinks } from './support/data'

// Checks every research link shown in a reveal. Run with `npm run test:links`; it needs internet access.
// Publishers often refuse automated requests (401/403/429), so those are reported as warnings, not failures.
const BLOCKED = new Set([401, 403, 405, 429, 451, 999])
const links = [...evidenceLinks()]

test.describe.configure({ mode: 'parallel' })

for (const [url, usedBy] of links) {
  test(`${url}`, async ({ request }) => {
    test.info().annotations.push({ type: 'used by', description: usedBy.join(', ') })
    let status = 0
    let error = ''
    for (const method of ['HEAD', 'GET'] as const) {
      try {
        const response = await request.fetch(url, { method, maxRedirects: 20, timeout: 30_000, failOnStatusCode: false,
          headers: { 'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36 DataDetectiveLinkCheck', accept: 'text/html,application/pdf,*/*' } })
        status = response.status()
        error = ''
        if (status < 400) break
      } catch (e) { error = String(e).split('\n')[0] }
    }
    if (BLOCKED.has(status)) {
      const doi = new URL(url).hostname === 'doi.org' && decodeURIComponent(new URL(url).pathname.slice(1))
      if (doi) {
        // The DOI registry confirms the DOI exists even when the publisher's page refuses bots.
        const handle = await request.get(`https://doi.org/api/handles/${encodeURIComponent(doi)}`, { timeout: 30_000, failOnStatusCode: false })
        const code = handle.ok() ? (await handle.json()).responseCode : handle.status()
        expect(code, `DOI ${doi} is not registered (used by ${usedBy.join(', ')})`).toBe(1)
        test.info().annotations.push({ type: 'note', description: `DOI registered; publisher page returned HTTP ${status} to the automated check` })
        return
      }
      test.info().annotations.push({ type: 'warning', description: `HTTP ${status}: the site blocked the automated check; check it by hand` })
      return
    }
    expect(error, `${url} could not be reached (used by ${usedBy.join(', ')})`).toBe('')
    expect(status, `${url} returned HTTP ${status} (used by ${usedBy.join(', ')})`).toBeLessThan(400)
  })
}
