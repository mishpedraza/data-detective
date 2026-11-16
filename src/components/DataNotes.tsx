import { COUNTRIES } from '../data/countries'
import { INDICATORS, coverage } from '../data/indicators'

export function DataNotes({ ids }: { ids: string[] }) {
  return (
    <section className="datanotes" aria-labelledby="notes-title">
      <h2 id="notes-title">About the data</h2>
      <div className="notes-grid">
        {ids.map((id, i) => {
          const ind = INDICATORS[id]
          const cov = coverage(id)
          const geos = Object.keys(ind.data).filter((g) => g !== 'ES').map((g) => COUNTRIES[g]?.name.replace('the ', '')).join(', ')
          return (
            <article key={id} className={`note tone-${i === 0 ? 'a' : 'b'}`}>
              <h3>{ind.label}</h3>
              <p>{ind.definition}</p>
              {ind.notes && <p className="note-caveat">{ind.notes}</p>}
              <dl>
                <dt>Source</dt>
                <dd>
                  {ind.source.org} · <a href={ind.source.url} target="_blank" rel="noreferrer">{ind.source.dataset}</a>
                  {ind.source.upstream && <> · from {ind.source.upstream}</>}
                </dd>
                <dt>Coverage</dt>
                <dd>Spain, {cov ? `${cov[0]}–${cov[1]}` : 'n/a'} · comparisons: {geos || 'none'}</dd>
                <dt>Last available</dt>
                <dd>{cov?.[1] ?? '—'} (retrieved {ind.retrieved})</dd>
                {ind.breaks.length > 0 && (
                  <>
                    <dt>Series breaks</dt>
                    <dd>
                      {ind.breaks.map((b) => (
                        <span key={b.year} className="note-break">
                          <strong>{b.year}</strong> {b.note}
                        </span>
                      ))}
                    </dd>
                  </>
                )}
                {ind.derived && (
                  <>
                    <dt>Calculation</dt>
                    <dd>Derived by Data Detective from the official tables listed above.</dd>
                  </>
                )}
              </dl>
            </article>
          )
        })}
      </div>
    </section>
  )
}
