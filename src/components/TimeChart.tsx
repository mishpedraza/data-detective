import { useMemo, useId } from 'react'
import * as d3 from 'd3'
import { COUNTRIES } from '../data/countries'
import { EVENTS } from '../data/events'
import { coverage, formatValue, series, tickFormat } from '../data/indicators'
import type { Indicator, Point } from '../data/types'
import { inRange } from '../lib/stats'
import { useMeasure } from '../lib/useMeasure'
import { useTweenPath } from '../lib/useTweenPath'

interface Props {
  indicator: Indicator
  compare: string | null
  from: number
  to: number
  hoverYear: number | null
  onHover: (y: number | null) => void
  tone: 'a' | 'b'
  showEventLabels?: boolean
  showEvents?: boolean
  height?: number
}

const MARGIN = { top: 28, right: 64, bottom: 28, left: 8 }

function segments(points: Point[], breaks: number[]) {
  const out: Point[][] = []
  let cur: Point[] = []
  for (const p of points) {
    const prev = cur[cur.length - 1]
    if (prev && (breaks.includes(p.year) || p.year !== prev.year + 1)) {
      out.push(cur)
      cur = []
    }
    cur.push(p)
  }
  if (cur.length) out.push(cur)
  return out
}

function Line({ d, className }: { d: string; className: string }) {
  const t = useTweenPath(d)
  return <path d={t} className={className} />
}

export function TimeChart({ indicator, compare, from, to, hoverYear, onHover, tone, showEventLabels, showEvents, height }: Props) {
  const [ref, width] = useMeasure<HTMLDivElement>()
  const compact = width > 0 && width < 640
  const h = height ?? (compact ? 210 : 300)
  const M = compact ? { ...MARGIN, top: 16, bottom: 24 } : MARGIN
  const cov = coverage(indicator.id)
  const uid = useId().replace(/:/g, '')
  const main = useMemo(() => inRange(series(indicator.id, 'ES'), from, to), [indicator.id, from, to])
  const comp = useMemo(() => (compare ? inRange(series(indicator.id, compare), from, to) : []), [indicator.id, compare, from, to])
  const breakYears = indicator.breaks.map((b) => b.year).filter((y) => y > from && y <= to)

  const innerW = Math.max(10, width - M.left - M.right)
  const innerH = h - M.top - M.bottom
  const x = d3.scaleLinear().domain([from, to]).range([0, innerW])
  const vals = [...main, ...comp].map((p) => p.value)
  const lo = d3.min(vals) ?? 0
  const hi = d3.max(vals) ?? 1
  const zeroBased = !['index', 'eur'].includes(indicator.format) && lo >= 0
  const pad = (hi - lo || Math.abs(hi) || 1) * 0.12
  const y = d3
    .scaleLinear()
    .domain([zeroBased ? 0 : lo - pad, hi + pad])
    .range([innerH, 0])
    .nice(4)
  const ticks = y.ticks(compact ? 3 : 4)
  const tf = tickFormat(indicator.format)
  const xTicks = d3.ticks(from, to, Math.max(2, Math.min(8, Math.floor(innerW / 90)))).filter(Number.isInteger)

  const line = d3.line<Point>().x((p) => x(p.year)).y((p) => y(p.value)).curve(d3.curveMonotoneX)
  const area = d3.area<Point>().x((p) => x(p.year)).y0(innerH).y1((p) => y(p.value)).curve(d3.curveMonotoneX)
  const segs = segments(main, breakYears)
  const mainD = segs.map((s) => line(s) ?? '').join('')
  const areaD = segs.map((s) => area(s) ?? '').join('')
  const bridges = segs.slice(1).map((s, i) => {
    const a = segs[i][segs[i].length - 1]
    const b = s[0]
    return { a, b }
  })
  const compD = segments(comp, []).map((s) => line(s) ?? '').join('')

  const dataStart = main[0]?.year
  const dataEnd = main[main.length - 1]?.year
  const events = !showEvents ? [] : EVENTS.filter((e) => (!e.only || e.only.includes(indicator.dimension)) && e.end >= from && e.start <= to)

  const hv = hoverYear != null ? main.find((p) => p.year === hoverYear) : undefined
  const hc = hoverYear != null ? comp.find((p) => p.year === hoverYear) : undefined
  const missing = hoverYear != null && !hv
  const readout = hoverYear != null ? hv : main[main.length - 1]
  const readoutYear = hoverYear ?? readout?.year
  const lastComp = comp[comp.length - 1]
  const lastMain = main[main.length - 1]

  function handleDown(e: React.PointerEvent<SVGRectElement>) {
    if (e.pointerType !== 'mouse') e.currentTarget.setPointerCapture(e.pointerId)
    handleMove(e)
  }

  function handleMove(e: React.PointerEvent<SVGRectElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    const yr = Math.round(x.invert(((e.clientX - r.left) / r.width) * innerW))
    onHover(Math.max(from, Math.min(to, yr)))
  }

  let endLabels: { key: string; y: number; text: string; cls: string }[] = []
  if (lastMain) endLabels.push({ key: 'm', y: y(lastMain.value), text: 'Spain', cls: 'end-label main' })
  if (lastComp && compare) endLabels.push({ key: 'c', y: y(lastComp.value), text: COUNTRIES[compare].name.replace('the ', ''), cls: 'end-label comp' })
  if (endLabels.length === 2 && Math.abs(endLabels[0].y - endLabels[1].y) < 14) {
    const [a, b] = endLabels
    const mid = (a.y + b.y) / 2
    const up = a.y <= b.y
    a.y = mid + (up ? -7 : 7)
    b.y = mid + (up ? 7 : -7)
  }
  endLabels = endLabels.map((l) => ({ ...l, y: Math.max(6, Math.min(innerH, l.y)) }))

  return (
    <figure className={`timechart tone-${tone}`}>
      <figcaption className="chart-head">
        <div>
          <div className="chart-title">{indicator.label}</div>
          <div className="chart-unit">
            {indicator.unit}
            {cov && <span className="chart-coverage"> · data {cov[0]}–{cov[1]}</span>}
          </div>
        </div>
        <div className="readout" aria-live="polite">
          <span className="readout-year">{hoverYear == null && readoutYear != null ? `Latest · ${readoutYear}` : (readoutYear ?? '—')}</span>
          {missing ? (
            <span className="readout-value unavailable">Data unavailable</span>
          ) : (
            <span className="readout-value">{formatValue(readout?.value, indicator.format)}</span>
          )}
          {compare && (
            <span className="readout-comp">
              {COUNTRIES[compare].name.replace('the ', '')} {(hoverYear != null ? hc : comp.find((p) => p.year === readoutYear)) ? formatValue((hoverYear != null ? hc : comp.find((p) => p.year === readoutYear))?.value, indicator.format) : 'data unavailable'}
            </span>
          )}
        </div>
      </figcaption>
      <div ref={ref} className="chart-wrap">
        {width > 0 && (
          <svg width={width} height={h} role="img" aria-label={`${indicator.label} in Spain, ${from}–${to}`}>
            <defs>
              <linearGradient id={`g${uid}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" className="grad-top" />
                <stop offset="100%" className="grad-bottom" />
              </linearGradient>
              <pattern id={`h${uid}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="6" className="hatch" />
              </pattern>
            </defs>
            <g transform={`translate(${M.left},${M.top})`}>
              {events.map((ev) => {
                const x0 = x(Math.max(from, ev.start - 0.5))
                const x1 = x(Math.min(to, ev.end + 0.5))
                return (
                  <g key={ev.id} className="event">
                    <rect x={x0} width={Math.max(1, x1 - x0)} y={0} height={innerH} />
                    {showEventLabels && width >= 640 && x1 - x0 > 0 && (
                      <text x={x0 + 4} y={-10} className="event-label">
                        {ev.label}
                      </text>
                    )}
                  </g>
                )
              })}
              {dataStart != null && dataStart > from && (
                <g className="nodata">
                  <rect x={0} width={x(dataStart) - 2} y={0} height={innerH} fill={`url(#h${uid})`} />
                  {x(dataStart) > 90 && (
                    <text x={x(dataStart) / 2} y={innerH / 2} textAnchor="middle">
                      No comparable data
                    </text>
                  )}
                </g>
              )}
              {dataEnd != null && dataEnd < to && (
                <g className="nodata">
                  <rect className="nodata-end" x={x(dataEnd) + 2} width={Math.max(0, innerW - x(dataEnd) - 2)} y={0} height={innerH} fill={`url(#h${uid})`} />
                  {innerW - x(dataEnd) > 56 && !(hoverYear != null && hoverYear > dataEnd) && (
                    <text x={(x(dataEnd) + innerW) / 2} y={innerH / 2} textAnchor="middle">
                      No data
                    </text>
                  )}
                </g>
              )}
              {ticks.map((t) => (
                <g key={t} className="ytick" style={{ transform: `translateY(${y(t)}px)` }}>
                  <line x1={0} x2={innerW} />
                  <text x={innerW + 8} dy="0.32em" style={{ display: hoverYear == null && endLabels.some((l) => Math.abs(l.y - y(t)) < 13) ? 'none' : undefined }}>
                    {tf(t)}
                  </text>
                </g>
              ))}
              {xTicks.map((t) => (
                <text key={t} className="xtick" x={x(t)} y={innerH + 20} textAnchor="middle">
                  {t}
                </text>
              ))}
              <Line d={areaD} className="area" />
              {compD && <Line d={compD} className="line comp" />}
              {bridges.map(({ a, b }) => (
                <line key={b.year} className="bridge" x1={x(a.year)} y1={y(a.value)} x2={x(b.year)} y2={y(b.value)} />
              ))}
              <Line d={mainD} className="line main" />
              {breakYears.map((by) => (
                <g key={by} className="break-mark" transform={`translate(${x(by - 0.5)},0)`}>
                  <line y1={0} y2={innerH} />
                  <text y={innerH - 6} x={4}>
                    break
                  </text>
                  <title>{indicator.breaks.find((b) => b.year === by)?.note}</title>
                </g>
              ))}
              {endLabels.map((l) => (
                <text key={l.key} className={l.cls} x={innerW + 8} y={l.y} dy="0.32em" style={{ display: hoverYear != null ? 'none' : undefined }}>
                  {l.text}
                </text>
              ))}
              {hoverYear != null && (
                <g className="hover" transform={`translate(${x(hoverYear)},0)`}>
                  <line y1={-4} y2={innerH} />
                  {hc && <circle className="dot comp" cy={y(hc.value)} r={4} />}
                  {hv && <circle className="dot main" cy={y(hv.value)} r={5.5} />}
                  {missing && (
                    <text className="hover-missing" y={innerH / 2} x={x(hoverYear) > innerW - 90 ? -6 : 6} textAnchor={x(hoverYear) > innerW - 90 ? 'end' : 'start'}>
                      Data unavailable
                    </text>
                  )}
                  {hv && (
                    <text className="hover-value" y={y(hv.value) - 12} textAnchor={x(hoverYear) > innerW - 40 ? 'end' : 'middle'}>
                      {formatValue(hv.value, indicator.format)}
                    </text>
                  )}
                </g>
              )}
              <rect
                className="hit"
                x={0}
                y={-M.top}
                width={innerW}
                height={innerH + M.top}
                onPointerMove={handleMove}
                onPointerDown={handleDown}
                onPointerLeave={(e) => e.pointerType === 'mouse' && onHover(null)}
              />
            </g>
          </svg>
        )}
      </div>
    </figure>
  )
}
