export type DiscoveryVisit = { pick: string; edition?: string; correct?: boolean; closed?: boolean; reactionVariant?: 0 | 1 }
export type DiscoveryProgress = Partial<Record<string, DiscoveryVisit>>

export const DISCOVERY_PROGRESS_KEY = 'data-detective.discovery-progress.v1'

export function readDiscoveryProgress(key = DISCOVERY_PROGRESS_KEY): DiscoveryProgress {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(key) ?? '{}')
    if (!saved || typeof saved !== 'object') return {}
    return Object.fromEntries(Object.entries(saved).filter(([, visit]) =>
      visit && typeof visit.pick === 'string' &&
      (visit.edition === undefined || typeof visit.edition === 'string') &&
      (visit.correct === undefined || typeof visit.correct === 'boolean') &&
      (visit.reactionVariant === undefined || visit.reactionVariant === 0 || visit.reactionVariant === 1) &&
      (visit.closed === undefined || typeof visit.closed === 'boolean'),
    ))
  } catch {
    return {}
  }
}

export function revealDiscovery(progress: DiscoveryProgress, id: string, pick: string, answer?: string, edition?: string, reactionVariant?: 0 | 1): DiscoveryProgress {
  const prior = progress[id]
  const first = prior?.edition === edition ? prior : undefined
  return {
    ...progress,
    [id]: first ? { ...first, closed: false } : { pick, edition, reactionVariant, correct: answer === undefined ? undefined : pick === answer },
  }
}
