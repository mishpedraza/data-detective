import { motion } from 'framer-motion'
import { COUNTRIES } from '../data/countries'
import { INDICATORS } from '../data/indicators'
import { REFERENCES } from '../data/references'
import type { Claim, Relationship } from '../data/types'
import { describeCorrelation, describeSeries } from '../lib/narrative'

interface Props {
  rel: Relationship
  a: string
  b: string
  compare: string | null
  from: number
  to: number
}

export function Evidence({ rel, a, b, compare, from, to }: Props) {
  const happened: Claim[] = []
  for (const id of [a, b]) {
    const s = describeSeries(id, 'ES', from, to)
    if (s) happened.push(s)
    if (compare) {
      const c = describeSeries(id, compare, from, to)
      if (c) happened.push(c)
    }
  }
  const corr = describeCorrelation(a, b, 'ES', from, to)
  if (corr) happened.push(corr)

  const cannot: Claim[] = [...rel.cannot]
  for (const id of [a, b]) {
    const ind = INDICATORS[id]
    const bs = ind.breaks.filter((x) => x.year > from && x.year <= to)
    if (bs.length) cannot.push({ text: `${ind.short}: the series has ${bs.length === 1 ? 'a break' : `${bs.length} breaks`} in this period (${bs.map((x) => x.year).join(', ')}), so values on either side are not fully comparable.`, refs: [`data:${id}`] })
  }
  if (compare && [a, b].some((id) => INDICATORS[id].dimension === 'crime'))
    cannot.push({ text: `Comparing crime levels between Spain and ${COUNTRIES[compare].name} is unreliable because legal definitions and recording practices differ. Compare the direction of trends, not the levels.`, refs: ['eurostatCrime'] })
  if (corr == null) cannot.push({ text: 'There are fewer than four overlapping years in this period, which is too few to measure any relationship.' })

  const order: string[] = []
  const num = (r: string) => {
    if (!order.includes(r)) order.push(r)
    return order.indexOf(r) + 1
  }
  const cols: { title: string; claims: Claim[] }[] = [
    { title: 'What happened', claims: happened },
    { title: 'What might explain it', claims: rel.explain },
    { title: 'What we cannot conclude', claims: cannot },
  ]
  const rendered = cols.map((c) => ({ ...c, items: c.claims.map((cl) => ({ text: cl.text, nums: (cl.refs ?? []).map(num) })) }))

  return (
    <section className="evidence" aria-labelledby="evidence-title">
      <h2 id="evidence-title">What does the evidence tell us?</h2>
      <div className="evidence-cols">
        {rendered.map((c, i) => (
          <motion.div key={c.title} className="evidence-col" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, duration: 0.5 }}>
            <h3>
              <span className="evidence-num">0{i + 1}</span>
              {c.title}
            </h3>
            <ul>
              {c.items.map((it, j) => (
                <li key={j}>
                  {it.text}
                  {it.nums.map((n) => (
                    <a key={n} className="fn" href={`#ref-${n}`} onClick={(e) => { e.preventDefault(); document.getElementById(`ref-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }}>
                      {n}
                    </a>
                  ))}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
      <ol className="footnotes">
        {order.map((r, i) => {
          if (r.startsWith('data:')) {
            const ind = INDICATORS[r.slice(5)]
            return (
              <li key={r} id={`ref-${i + 1}`}>
                <span className="fn-num">{i + 1}</span>
                <span>Data: {ind.label}. {ind.source.org}, <a href={ind.source.url} target="_blank" rel="noreferrer">{ind.source.dataset}</a>
                {ind.source.upstream ? `; original source ${ind.source.upstream}` : ''}. Retrieved {ind.retrieved}.</span>
              </li>
            )
          }
          const ref = REFERENCES[r]
          return (
            <li key={r} id={`ref-${i + 1}`}>
              <span className="fn-num">{i + 1}</span>
              <span>{ref.authors} ({ref.year}). <a href={ref.url} target="_blank" rel="noreferrer">{ref.title}</a>. <em>{ref.outlet}</em>.</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
