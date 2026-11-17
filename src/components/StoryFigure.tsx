import type { EvidenceFigure } from '../data/investigationFigures'

const format = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 })

function position(value: number, [minimum, maximum]: readonly [number, number]) {
  return (value - minimum) / (maximum - minimum) * 100
}

function FigureAxis({ domain, unit = '' }: { domain: readonly [number, number]; unit?: string }) {
  return <div className="story-figure-axis" aria-hidden="true">
    {domain.map((value) => <span key={value}>{format.format(value)}{unit}</span>)}
  </div>
}

export function StoryFigure({ figure }: { figure: EvidenceFigure }) {
  if (figure.kind === 'timeline') {
    const domain = [figure.points[0].time, figure.points.at(-1)!.time] as const
    const values = figure.points.map(({ value }) => value)
    const scale = [Math.min(0, ...values), Math.max(0.01, ...values)] as const
    const yAt = (value: number) => 100 - position(value, scale) * 0.72
    const points = figure.points.map(({ label, time, value, display }) => ({
      label, display,
      x: 8 + position(time, domain) * 3.04,
      y: yAt(value),
    }))
    return <>
      <svg className="story-trajectory" viewBox="0 0 320 124" aria-hidden="true">
        <line x1="8" x2="312" y1={yAt(0)} y2={yAt(0)} />
        <polyline points={points.map(({ x, y }) => `${x},${y}`).join(' ')} />
        {points.map(({ x, y, label, display }, index) => {
          const anchor = index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'
          return <g key={label} textAnchor={anchor}>
            <circle cx={x} cy={y} r="4" />
            <text className="story-trajectory-value" x={x} y={y - 9}>{display}</text>
            <text x={x} y="119">{label}</text>
          </g>
        })}
      </svg>
      <ol className="story-trajectory-labels">
        {figure.points.map(({ label, display }) => <li key={label}>{label}<strong>{display}</strong></li>)}
      </ol>
    </>
  }
  if (figure.kind === 'ranges' || figure.kind === 'dots') {
    const { domain, unit } = figure
    return <>
      <ul className="story-figure-list">
        {figure.kind === 'ranges' ? figure.rows.map(({ label, start, end }) => {
          const a = position(start, domain)
          const b = position(end, domain)
          return <li key={label}>
            <div className="story-figure-values"><strong>{label}</strong>
              <span>{figure.endpoints[0]} <b>{format.format(start)}{unit}</b> · {figure.endpoints[1]} <b>{format.format(end)}{unit}</b></span>
            </div>
            <div className="story-dot-track" aria-hidden="true">
              <span className="story-dot-range" style={{ left: `${Math.min(a, b)}%`, width: `${Math.abs(b - a)}%` }} />
              <span className="story-dot story-dot-start" style={{ left: `${a}%` }} />
              <span className="story-dot" style={{ left: `${b}%` }} />
            </div>
          </li>
        }) : figure.points.map(({ label, value, display }) => <li key={label}>
          <div className="story-figure-values"><strong>{label}</strong><span>{display}</span></div>
          <div className="story-dot-track" aria-hidden="true">
            <span className="story-dot" style={{ left: `${position(value, domain)}%` }} />
          </div>
        </li>)}
      </ul>
      <FigureAxis domain={domain} unit={unit} />
    </>
  }
  if (figure.kind === 'composition') {
    return <ul className="story-figure-list">
      {figure.rows.map(({ label, points, total }) => <li key={label}>
        <div className="story-figure-values"><strong>{label}</strong><span>{total}</span></div>
        <div className="story-segments" aria-hidden="true">
          {points.map(({ label: part, value }) => <span key={part} style={{ width: `${value / figure.maximum * 100}%` }} />)}
        </div>
        <ul className="story-segment-labels">
          {points.map(({ label: part, display }) => <li key={part}><span className="story-segment-swatch" aria-hidden="true" />{part} <strong>{display}</strong></li>)}
        </ul>
      </li>)}
    </ul>
  }
  return <>
    <div className="story-poll-marks" aria-hidden="true">
      {Array.from({ length: figure.total }, (_, index) => <span key={index} className={index < figure.count ? 'story-poll-mark-filled' : undefined} />)}
    </div>
    <p><strong>{figure.count} of {figure.total}</strong> {figure.note}.</p>
    <StoryFigure figure={{
      kind: 'ranges', caption: figure.rate.label, refs: figure.refs,
      domain: [0, 100], endpoints: ['1993', '2022'], rows: [figure.rate],
    }} />
  </>
}
