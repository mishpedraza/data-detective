const COMPLETIONS = 'data-detective.completions.v1'
const SHARE_ORIGIN = 'data-detective.share-origin.v1'

/** Counts finished attempts per quiz or theme, so repeat scores can be told apart from first tries. */
export function nextAttempt(key: string): number {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(COMPLETIONS) ?? '{}')
    const counts = saved && typeof saved === 'object' ? saved as Record<string, unknown> : {}
    const count = (typeof counts[key] === 'number' ? counts[key] as number : 0) + 1
    localStorage.setItem(COMPLETIONS, JSON.stringify({ ...counts, [key]: count }))
    return count
  } catch { return 1 }
}

/** Remembers for this visit that the player arrived from a shared scorecard link. */
export function rememberShareOrigin(card: string) {
  try { sessionStorage.setItem(SHARE_ORIGIN, card) } catch { /* Attribution is optional. */ }
}

export function shareOrigin(): string | undefined {
  try { return sessionStorage.getItem(SHARE_ORIGIN) ?? undefined } catch { return undefined }
}

/** Analytics properties for events during a visit that began from a shared link. */
export const shareProps = (): Record<string, string | boolean> => {
  const card = shareOrigin()
  return card ? { from_share: true, share_card: card } : { from_share: false }
}
