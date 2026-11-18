export type DiscoveryVisit = { pick: string; correct?: boolean; closed?: boolean }
export type DiscoveryProgress = Partial<Record<string, DiscoveryVisit>>

export const DISCOVERY_PROGRESS_KEY = 'data-detective.discovery-progress.v1'

export function readDiscoveryProgress(): DiscoveryProgress {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(DISCOVERY_PROGRESS_KEY) ?? '{}')
    if (!saved || typeof saved !== 'object') return {}
    return Object.fromEntries(Object.entries(saved).filter(([, visit]) =>
      visit && typeof visit.pick === 'string' &&
      (visit.correct === undefined || typeof visit.correct === 'boolean') &&
      (visit.closed === undefined || typeof visit.closed === 'boolean'),
    ))
  } catch {
    return {}
  }
}

export function revealDiscovery(progress: DiscoveryProgress, id: string, pick: string, answer?: string): DiscoveryProgress {
  const first = Object.hasOwn(progress, id) ? progress[id] : undefined
  return {
    ...progress,
    [id]: first ? { ...first, closed: false } : { pick, correct: answer === undefined ? undefined : pick === answer },
  }
}
