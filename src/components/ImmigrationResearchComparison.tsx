import { studyById } from '../data/research'

// Qualitative summaries of different estimands. Blank cells make no claim about the outcome.
const studies = [
  {
    id: 'ousey2018', place: 'Research review', span: 'Studies published 1994–2014',
    citation: 'Ousey & Kubrin (2018)',
    overall: 'Very weak negative association on average',
    specific: 'Results varied substantially across settings and measures.',
  },
  {
    id: 'alonso2012', place: 'Spain', span: 'Provinces, 1999–2009',
    citation: 'Alonso-Borrego et al. (2012)',
    overall: 'Positive link in several models',
    specific: 'The result varied by migrant group and model. Homicide was excluded.',
  },
  {
    id: 'bianchi2012', place: 'Italy', span: 'Provinces, 1990–2003',
    citation: 'Bianchi et al. (2012)',
    overall: 'No statistically clear change',
    specific: 'Robbery increased in the study’s estimates.',
  },
  {
    id: 'bell2013', place: 'United Kingdom', span: 'Late-1990s asylum and post-2004 EU waves',
    citation: 'Bell et al. (2013)',
    overall: null,
    specific: 'Property crime rose slightly for the asylum wave. The EU wave showed no increase. Neither showed a detectable change in violent crime.',
  },
] as const

export function ImmigrationResearchComparison() {
  return (
    <figure className="immigration-research" aria-labelledby="immigration-research-title">
      <figcaption>
        <h2 id="immigration-research-title">What the studies found</h2>
      </figcaption>
      <table>
        <thead>
          <tr><th scope="col">Study</th><th scope="col">Overall crime</th><th scope="col">Offences and context</th></tr>
        </thead>
        <tbody>
          {studies.map(({ id, place, span, citation, overall, specific }) => (
            <tr key={id}>
              <th scope="row"><strong>{place}</strong><span>{span}</span><a href={studyById(id)!.url}>{citation}</a></th>
              <td>{overall ? <strong>{overall}</strong> : 'Not summarised for these waves'}</td>
              <td>{specific}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="tell-text research-takeaway">An increase in one offence or migration wave can coexist with a different result for overall crime. “No statistically clear change” means the study could not distinguish the result from no change.</p>
    </figure>
  )
}
