export type DiscoveryVisit = { pick: string; edition?: string; correct?: boolean; closed?: boolean }
export type DiscoveryProgress = Partial<Record<string, DiscoveryVisit>>

export const DISCOVERY_PROGRESS_KEY = 'data-detective.discovery-progress.v1'

export function readDiscoveryProgress(): DiscoveryProgress {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(DISCOVERY_PROGRESS_KEY) ?? '{}')
    if (!saved || typeof saved !== 'object') return {}
    return Object.fromEntries(Object.entries(saved).filter(([, visit]) =>
      visit && typeof visit.pick === 'string' &&
      (visit.edition === undefined || typeof visit.edition === 'string') &&
      (visit.correct === undefined || typeof visit.correct === 'boolean') &&
      (visit.closed === undefined || typeof visit.closed === 'boolean'),
    ))
  } catch {
    return {}
  }
}

export function revealDiscovery(progress: DiscoveryProgress, id: string, pick: string, answer?: string, edition?: string): DiscoveryProgress {
  const prior = progress[id]
  const first = prior?.edition === edition ? prior : undefined
  return {
    ...progress,
    [id]: first ? { ...first, closed: false } : { pick, edition, correct: answer === undefined ? undefined : pick === answer },
  }
}
