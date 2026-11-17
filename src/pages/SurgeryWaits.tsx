import { useState } from 'react'
import { InvestigationStory } from '../components/InvestigationStory'
import { InvestigationIntro } from '../components/InvestigationIntro'
import { surgeryQuestion, surgeryRegions, surgerySource, surgeryTrend } from '../data/surgeryWaits'

export function SurgeryTrendChart({ compact = false }: { compact?: boolean }) {
  const x = (i: number) => 37 + i * 45
  const y = (days: number) => 124 - (days - 100) * 2.8

  return (
    <svg className="surgery-chart" viewBox="0 0 333 153" width={compact ? 175 : 600} role="img" aria-label="Average days on Spain’s planned surgery waiting list, 120 in December 2022, peaking at 128 in December 2023, and 122 in December 2025">
      {[100, 110, 120, 130].map((days) => (
        <g key={days}>
          <text x="28" y={y(days)} dy=".33em" textAnchor="end">{days}</text>
          <line x1="37" x2="307" y1={y(days)} y2={y(days)} />
        </g>
      ))}
      <polyline points={surgeryTrend.map(({ days }, i) => `${x(i)},${y(days)}`).join(' ')} />
      {surgeryTrend.map(({ date, days }, i) => (
        <circle key={date} cx={x(i)} cy={y(days)} r="3">
          <title>{date} · {days} days</title>
        </circle>
      ))}
      <text x="37" y="142" textAnchor="middle">Dec ’22</text>
      <text x="172" y="142" textAnchor="middle">Jun ’24</text>
      <text x="307" y="142" textAnchor="middle">Dec ’25</text>
    </svg>
  )
}

export function SurgeryWaits() {
  const [region, setRegion] = useState('Madrid')
  const days = surgeryRegions.find(([name]) => name === region)?.[1]

  return (
    <article className="investigate surgery-story">
      <InvestigationIntro
        current={{ id: 'surgery-waits', label: surgeryQuestion }}
        headline="Patients on Spain’s planned surgery list had waited an average of 122 days at the end of 2025."
        note="That’s four days shorter than a year earlier and two days longer than at the end of 2022."
      />
      <InvestigationStory
        evidence={<figure>
          <figcaption>Average days already waited by patients on the planned surgery list</figcaption>
          <SurgeryTrendChart />
          <ul className="story-sources"><li><a href={surgerySource}>Ministry of Health waiting-list report</a></li></ul>
        </figure>}
        explanation={<>
          <h2>Where you live makes a big difference</h2>
          <p>In December 2025, the average ranged from 50 days in Madrid to 173 in Andalusia. Nationwide, about one in five people on the list had waited more than six months.</p>
        </>}
        exploration={<>
          <label>Region <select value={region} onChange={(event) => setRegion(event.target.value)}>
            {surgeryRegions.map(([name]) => <option key={name}>{name}</option>)}
          </select></label>
          <p className="tell-text" aria-live="polite">{region} · {days} days. Spain overall · 122 days.</p>
        </>}
        research={<>
          <p className="tell-text">These are twice-yearly snapshots of how long people still on the public health system’s planned surgery list had already waited. A patient’s eventual wait can be longer. The averages combine different procedures.</p>
          <a href={surgerySource}>Ministry of Health · corrected December 2025 report (PDF)</a>
        </>}
      />
    </article>
  )
}
