import { EDITORIAL_QUESTIONS } from '../data/editorial'
import { hrefFor } from '../lib/route'

export function EditorialNavigation({ active, current }: {
  active?: string
  current?: { id: string; label: string }
}) {
  const selected = active ?? current?.id ?? ''
  return (
    <nav className="editorial-navigation" aria-label="Editorial investigations">
      <a className="tell-more" href={hrefFor('discover')}>← All questions</a>
      <label>
        <span>Browse questions</span>
        <select value={selected} onChange={(event) => {
          if (event.target.value) window.location.hash = hrefFor('investigate', { r: event.target.value })
        }}>
          {!active && current && <option value={current.id}>{current.label}</option>}
          {!selected && <option value="">Choose a question</option>}
          {EDITORIAL_QUESTIONS.map(({ id, question }) => <option key={id} value={id}>{question}</option>)}
        </select>
      </label>
    </nav>
  )
}
