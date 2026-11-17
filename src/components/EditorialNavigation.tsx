import { EDITORIAL_QUESTIONS } from '../data/editorial'
import { hrefFor } from '../lib/route'

export function EditorialNavigation({ active }: { active?: string }) {
  return (
    <nav className="editorial-navigation" aria-label="Editorial investigations">
      <a className="tell-more" href={hrefFor('discover')}>← All questions</a>
      <label>
        <span>Browse questions</span>
        <select value={active ?? ''} onChange={(event) => {
          if (event.target.value) window.location.hash = hrefFor('investigate', { r: event.target.value })
        }}>
          {!active && <option value="">Choose a question</option>}
          {EDITORIAL_QUESTIONS.map(({ id, question }) => <option key={id} value={id}>{question}</option>)}
        </select>
      </label>
    </nav>
  )
}
