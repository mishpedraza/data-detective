import { useRef } from 'react'
import * as d3 from 'd3'
import { useMeasure } from '../lib/useMeasure'

interface Props {
  min: number
  max: number
  from: number
  to: number
  onChange: (from: number, to: number) => void
  sparkA?: { year: number; value: number }[]
  sparkB?: { year: number; value: number }[]
}

export function RangeBrush({ min, max, from, to, onChange, sparkA = [], sparkB = [] }: Props) {
  const [ref, width] = useMeasure<HTMLDivElement>()
  const drag = useRef<{ kind: 'from' | 'to' | 'window'; startX: number; f: number; t: number } | null>(null)
  const H = 44
  const x = d3.scaleLinear().domain([min, max]).range([16, Math.max(32, width - 16)])
  const spark = (s: { year: number; value: number }[]) => {
    if (s.length < 2) return ''
    const yy = d3.scaleLinear().domain(d3.extent(s, (p) => p.value) as [number, number]).range([H - 8, 8])
    return d3.line<{ year: number; value: number }>().x((p) => x(p.year)).y((p) => yy(p.value)).curve(d3.curveMonotoneX)(s) ?? ''
  }

  const yearAt = (clientX: number) => {
    const r = ref.current!.getBoundingClientRect()
    return Math.round(x.invert(clientX - r.left))
  }

  function down(kind: 'from' | 'to' | 'window') {
    return (e: React.PointerEvent) => {
      e.stopPropagation()
      ;(e.target as Element).setPointerCapture(e.pointerId)
      drag.current = { kind, startX: e.clientX, f: from, t: to }
    }
  }
  function move(e: React.PointerEvent) {
    const d = drag.current
    if (!d) return
    const yr = yearAt(e.clientX)
    if (d.kind === 'from') onChange(Math.max(min, Math.min(yr, to - 3)), to)
    else if (d.kind === 'to') onChange(from, Math.min(max, Math.max(yr, from + 3)))
    else {
      const dy = Math.round(x.invert(e.clientX) - x.invert(d.startX))
      const span = d.t - d.f
      const nf = Math.max(min, Math.min(max - span, d.f + dy))
      onChange(nf, nf + span)
    }
  }
  const up = () => (drag.current = null)

  const ticks = d3.range(Math.ceil(min / 5) * 5, max + 1, 5)

  function key(which: 'from' | 'to') {
    return (e: React.KeyboardEvent) => {
      const d = e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : 0
      if (!d) return
      e.preventDefault()
      if (which === 'from') onChange(Math.max(min, Math.min(from + d, to - 3)), to)
      else onChange(from, Math.min(max, Math.max(to + d, from + 3)))
    }
  }

  return (
    <div className="brush" ref={ref} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      {width > 0 && (
        <svg width={width} height={H + 18}>
          <path d={spark(sparkA)} className="spark tone-a-stroke" />
          <path d={spark(sparkB)} className="spark tone-b-stroke" />
          <rect className="brush-shade" x={0} width={Math.max(0, x(from))} height={H} />
          <rect className="brush-shade" x={x(to)} width={Math.max(0, width - x(to))} height={H} />
          <rect className="brush-window" x={x(from)} width={x(to) - x(from)} height={H} onPointerDown={down('window')} />
          {ticks.map((t) => (
            <text key={t} x={x(t)} y={H + 14} textAnchor="middle" className="brush-tick">
              {t}
            </text>
          ))}
          {(['from', 'to'] as const).map((k) => {
            const yr = k === 'from' ? from : to
            return (
              <g
                key={k}
                className="brush-handle"
                transform={`translate(${x(yr)},0)`}
                onPointerDown={down(k)}
                tabIndex={0}
                role="slider"
                aria-label={k === 'from' ? 'Start year' : 'End year'}
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuenow={yr}
                onKeyDown={key(k)}
              >
                <rect x={-9} y={-2} width={18} height={H + 4} className="handle-hit" />
                <line y1={0} y2={H} />
                <rect x={-4} y={H / 2 - 9} width={8} height={18} rx={4} className="handle-grip" />
              </g>
            )
          })}
        </svg>
      )}
    </div>
  )
}
