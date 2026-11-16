export type Route = 'discover' | 'investigate' | 'explore'

export function hrefFor(route: Route, params?: Record<string, string | number | undefined>) {
  const q = new URLSearchParams()
  Object.entries(params ?? {}).forEach(([k, v]) => v != null && q.set(k, String(v)))
  const s = q.toString()
  return `#/${route}${s ? `?${s}` : ''}`
}
