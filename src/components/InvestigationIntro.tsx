import type { ReactNode } from 'react'
import { EditorialNavigation } from './EditorialNavigation'

export function InvestigationIntro({ active, current, headline, note, children }: {
  active?: string
  current?: { id: string; label: string }
  headline: string
  note?: string
  children?: ReactNode
}) {
  return (
    <>
      <EditorialNavigation active={active} current={current} />
      <header className="question-block investigation-intro">
        <h1 className="question finding">{headline}</h1>
        {note && <p className="finding-dek">{note}</p>}
        {children}
      </header>
    </>
  )
}
