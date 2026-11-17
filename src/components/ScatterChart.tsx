import { useMemo } from 'react'
import * as d3 from 'd3'
import { INDICATORS, formatValue, tickFormat } from '../data/indicators'
import { correlations, changeMode } from '../lib/narrative'
import { MIN_CORR_YEARS, describeR } from '../lib/stats'
import { useMeasure } from '../lib/useMeasure'
import { useTweenPath } from '../lib/useTweenPath'

interface Props {
  a: string
  b: string
  from: number
  to: number
  mode: 'levels' | 'changes'
  hoverYear: number | null
  onHover: (y: number | null) => void
}

const M = { top: 24, right: 24, bottom: 56, left: 64 }

export function ScatterChart({ a, b, from, to, mode, hoverYear, onHover }: Props) {
  const [ref, width] = useMeasure<HTMLDivElement>()
  const A = INDICATORS[a]
  const B = INDICATORS[b]
  const c = useMemo(() => correlations(a, b, 'ES', from, to), [a, b, from, to])
  const pts = mode === 'levels' ? c.levels : c.changes
  const rawR = mode === 'levels' ? c.rLevels : c.rChanges
  const nPts = mode === 'levels' ? c.levels.length : c.changes.length
  const r = nPts >= MIN_CORR_YEARS ? rawR : null
  const height = Math.min(520, Math.max(340, width * 0.62))
  const innerW = Math.max(10, width - M.left - M.right)
  const innerH = height - M.top - M.bottom

  const ext = (v: number[]) => {
    const [lo, hi] = d3.extent(v) as [number, number]
    const p = (hi - lo || 1) * 0.1
    return [lo - p, hi + p]
  }
  const x = d3.scaleLinear().domain(pts.length ? ext(pts.map((p) => p.x)) : [0, 1]).range([0, innerW]).nice(5)
  const y = d3.scaleLinear().domain(pts.length ? ext(pts.map((p) => p.y)) : [0, 1]).range([innerH, 0]).nice(5)
  const years = pts.map((p) => p.year)
  const color = d3.scaleSequential(d3.interpolateRgb('#d9cfc2', '#1a1a1f')).domain([d3.min(years) ?? 0, d3.max(years) ?? 1])
  const path = d3.line<(typeof pts)[number]>().x((p) => x(p.x)).y((p) => y(p.y)).curve(d3.curveCatmullRom.alpha(0.5))(pts) ?? ''
  const tPath = useTweenPath(path)

  const axisLabel = (id: string, m: 'levels' | 'changes') => {
    const ind = INDICATORS[id]
    if (m === 'levels') return `${ind.short} (${ind.unit})`
    return changeMode(id) === 'pct' ? `${ind.short}: % change on previous year` : `${ind.short}: change on previous year (points)`
  }
  const fx = mode === 'levels' ? tickFormat(A.format) : (v: number) => (changeMode(a) === 'pct' ? `${v > 0 ? '+' : ''}${v}%` : `${v > 0 ? '+' : ''}${v}`)
  const fy = mode === 'levels' ? tickFormat(B.format) : (v: number) => (changeMode(b) === 'pct' ? `${v > 0 ? '+' : ''}${v}%` : `${v > 0 ? '+' : ''}${v}`)
  const labelEvery = pts.length > 14 ? 4 : pts.length > 8 ? 2 : 1
  const hp = pts.find((p) => p.year === hoverYear)

  return (
    <figure className="scatter">
      <figcaption className="scatter-head">
        <div className="r-badge">
          <span className="r-value">{r == null ? '—' : `r = ${r.toFixed(2).replace('-', '−')}`}</span>
          <span className="r-text">
            {nPts < MIN_CORR_YEARS
              ? `Only ${nPts} ${mode === 'changes' ? 'year-to-year changes' : 'shared years'}: too few for a meaningful correlation`
              : <>{describeR(r)} across {pts.length} years{mode === 'changes' ? ' of year-to-year changes' : ''}</>}
          </span>
        </div>
        <p className="scatter-note">Each dot is one year. Lines join consecutive years, so you can trace the path through time. A correlation describes how closely the points follow a straight line — it says nothing about cause.</p>
      </figcaption>
      <div ref={ref} className="chart-wrap">
        {width > 0 && (
          <svg width={width} height={height} role="img" aria-label={`Scatterplot of ${A.short} against ${B.short}`}>
            <g transform={`translate(${M.left},${M.top})`}>
              {x.ticks(5).map((t) => (
                <g key={`x${t}`} className="grid" style={{ transform: `translateX(${x(t)}px)` }}>
                  <line y1={0} y2={innerH} />
                  <text y={innerH + 18} textAnchor="middle">{fx(t)}</text>
                </g>
              ))}
              {y.ticks(5).map((t) => (
                <g key={`y${t}`} className="grid" style={{ transform: `translateY(${y(t)}px)` }}>
                  <line x1={0} x2={innerW} />
                  <text x={-10} dy="0.32em" textAnchor="end">{fy(t)}</text>
                </g>
              ))}
              {mode === 'changes' && x.domain()[0] < 0 && x.domain()[1] > 0 && <line className="zero" x1={x(0)} x2={x(0)} y1={0} y2={innerH} />}
              {mode === 'changes' && y.domain()[0] < 0 && y.domain()[1] > 0 && <line className="zero" y1={y(0)} y2={y(0)} x1={0} x2={innerW} />}
              <text className="axis-label tone-a-text" x={innerW} y={innerH + 44} textAnchor="end">{axisLabel(a, mode)} →</text>
              <text className="axis-label tone-b-text" transform={`translate(${-50},0) rotate(-90)`} textAnchor="end">{axisLabel(b, mode)} →</text>
              <path d={tPath} className="trail" />
              {pts.map((p, i) => {
                const active = p.year === hoverYear
                const show = active || i === 0 || i === pts.length - 1 || i % labelEvery === 0
                return (
                  <g
                    key={p.year}
                    className={`pt${active ? ' active' : ''}`}
                    style={{ transform: `translate(${x(p.x)}px, ${y(p.y)}px)` }}
                    onPointerEnter={() => onHover(p.year)}
                    onPointerDown={() => onHover(p.year)}
                    onPointerLeave={(e) => e.pointerType === 'mouse' && onHover(null)}
                  >
                    <circle r={active ? 8 : 5.5} fill={color(p.year)} />
                    <circle r={14} className="pt-hit" />
                    {show && <text y={-11} textAnchor="middle">{p.year}</text>}
                  </g>
                )
              })}
              {hp && (
                <g className="scatter-tip" transform={`translate(${Math.min(innerW - 150, x(hp.x) + 14)},${Math.max(10, y(hp.y) + 20)})`}>
                  <rect width={150} height={46} rx={4} />
                  <text x={10} y={18} className="tone-a-text">{mode === 'levels' ? formatValue(hp.x, A.format) : `${hp.x > 0 ? '+' : ''}${hp.x.toFixed(1)}${changeMode(a) === 'pct' ? '%' : ''}`} · {A.short}</text>
                  <text x={10} y={36} className="tone-b-text">{mode === 'levels' ? formatValue(hp.y, B.format) : `${hp.y > 0 ? '+' : ''}${hp.y.toFixed(1)}${changeMode(b) === 'pct' ? '%' : ''}`} · {B.short}</text>
                </g>
              )}
            </g>
          </svg>
        )}
      </div>
    </figure>
  )
}
