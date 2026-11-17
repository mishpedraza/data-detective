import { useState } from 'react'
import { workingHours } from '../data/workingHours'
import { StorySources } from './StoryEvidence'

const hours = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 })

export function WorkingHoursComparison() {
  const [country, setCountry] = useState<keyof typeof workingHours>('Spain')
  const { earlier, later } = workingHours[country]
  return (
    <>
      <label>Country <select value={country} onChange={(event) => setCountry(event.target.value as keyof typeof workingHours)}>
        {Object.keys(workingHours).map((name) => <option key={name}>{name}</option>)}
      </select></label>
      <p className="tell-text" aria-live="polite">
        {country} · Annual hours per worker: {hours.format(earlier)} in 1970 and {hours.format(later)} in 2023.
      </p>
      <StorySources refs={['pwt11']} />
    </>
  )
}
