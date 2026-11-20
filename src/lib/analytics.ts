// Anonymous, opt-in analytics for Data Detective in the shared PostHog project.
const HOST = 'https://us.i.posthog.com'
const KEY = 'phc_rhsWGC8njjjUxLax5ijeP39pZjWG965E2qgLBsNfD66P'
const CONSENT = 'data-detective.analytics-consent.v1'
const VISITOR = 'data-detective.analytics-id.v1'

export function analyticsConsent(): 'yes' | 'no' | null {
  try {
    const value = localStorage.getItem(CONSENT)
    return value === 'yes' || value === 'no' ? value : null
  } catch { return null }
}

export function setAnalyticsConsent(allowed: boolean) {
  try {
    localStorage.setItem(CONSENT, allowed ? 'yes' : 'no')
    if (!allowed) localStorage.removeItem(VISITOR)
  } catch { /* Browsing still works without storage. */ }
}

export function track(event: string, properties: Record<string, string | number | boolean> = {}) {
  if (analyticsConsent() !== 'yes') return
  try {
    let id = localStorage.getItem(VISITOR)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(VISITOR, id)
    }
    void fetch(`${HOST}/e/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: KEY, event, distinct_id: id,
        properties: { ...properties, app_name: 'data_detective', $current_url: location.href } }),
      keepalive: true,
    }).catch(() => { /* Never interrupt the quiz if analytics is blocked. */ })
  } catch { /* Tracking is optional. */ }
}
