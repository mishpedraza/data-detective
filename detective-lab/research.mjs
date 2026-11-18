import { catalog } from './catalog.mjs'

const housing = 'https://sdmx.oecd.org/public/rest/v1/data/OECD.ECO.MPD,DSD_AN_HOUSE_PRICES@DF_HOUSE_PRICES,1.0/ESP.A.RHP.?startPeriod=2007&endPeriod=2025&format=csvfile'
const claims = [
  {
    story: 'housing-affordability', claim: 'Spain’s national real house-price index was about 13% lower in 2025 than in 2007.',
    url: housing,
    assess(text, story) {
      if (!text.startsWith('DATAFLOW,')) return
      const points = new Map(text.split(/\r?\n/).slice(1).map((line) => {
        const parts = line.split(',')
        return [parts[5], Number(parts[6])]
      }))
      if (!points.get('2007') || !points.get('2025')) return
      const percent = Math.round((points.get('2025') / points.get('2007') - 1) * 100)
      return {
        matches: percent === -13 && story.interaction.reveal.finding.includes('13% below'),
        evidence: `OECD annual real-price observations: 2007 = ${points.get('2007')}, 2025 = ${points.get('2025')}; rounded change ${percent}%.`,
      }
    },
  },
  {
    story: 'immigration-crime', claim: 'The estimated drop near the Italian residence-permit cutoff was 0.6 percentage points from a 1.1% baseline.',
    url: 'https://www.aeaweb.org/articles?id=10.1257/aer.20150355',
    assess: excerpt(/reduces the crime rate of legalized immigrants by 0\.6 percentage points on average, on a baseline crime rate of 1\.1 percent/i, (story) => {
      const values = story.interaction.reveal.comparison?.map(({ amount }) => amount)
      return values?.length === 2 && values[0] === 1.1 && Math.abs(values[1] - 0.5) < 0.001
    }),
  },
  {
    story: 'crime-perceptions', claim: 'In October 2023 Gallup reported 77% saying crime rose nationally and 55% saying it rose in their own area.',
    url: 'https://news.gallup.com/poll/544442/americans-crime-problem-serious.aspx',
    assess: excerpt(/77%, believe there is more crime in the U\.S\. than a year ago, and a majority, 55%, say the same about crime in their local area/i, (story) => {
      const values = story.interaction.reveal.comparison?.map(({ amount }) => amount)
      return values?.length === 2 && values[0] === 77 && values[1] === 55
    }),
  },
]

function excerpt(pattern, repoMatches) {
  return (html, story) => {
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
    const match = text.match(pattern)
    return match ? { matches: repoMatches(story), evidence: match[0] } : undefined
  }
}

export async function reviewResearch({ external = false, request = fetch } = {}) {
  const findings = []
  for (const story of catalog) {
    const invalid = story.sources.filter(({ url }) => !url?.startsWith('https://'))
    findings.push({
      id: story.id, status: invalid.length || !story.sources.length ? 'PROBLEM' : 'SUPPORTED BY REPOSITORY',
      claim: 'Displayed investigation and quiz have identifiable research sources.',
      evidence: invalid.length ? `Unresolved references: ${invalid.map(({ ref }) => ref).join(', ')}`
        : story.sources.length ? `${story.sources.length} source IDs resolve in the repository. This checks attribution, not factual validity.`
          : 'No sources resolved for this investigation.',
      sources: story.sources,
    })
    for (const claim of claims.filter(({ story: id }) => id === story.id)) {
      const row = { id: story.id, claim: claim.claim, url: claim.url, status: 'UNVERIFIED',
        evidence: external ? 'The retrieved source did not expose the expected evidence.' : 'External primary-source retrieval is disabled.' }
      if (external) {
        try {
          const response = await request(claim.url, { signal: AbortSignal.timeout(12000) })
          if (!response.ok) row.evidence = `Primary source returned HTTP ${response.status}.`
          else {
            const result = claim.assess(await response.text(), story)
            if (result) {
              row.status = result.matches ? 'VERIFIED' : 'PROBLEM'
              row.evidence = result.evidence
            }
          }
        } catch { row.evidence = 'Could not retrieve the primary source within the review budget.' }
      }
      findings.push(row)
    }
    findings.push({ id: story.id, status: 'UNVERIFIED', claim: 'Independent claim-by-claim review of the remaining numbers, causal interpretation and limitations.',
      evidence: 'No source-specific verification rule covers these claims. A primary-source reading is still required.' })
  }
  const gate = findings.some(({ status }) => status === 'PROBLEM') ? 'BLOCKED'
    : findings.some(({ status }) => status === 'UNVERIFIED') ? 'OPEN' : 'PASS'
  return { gate, external, findings }
}
