import { INDICATORS, series } from './indicators'
import { surgeryQuestion, surgerySource, surgeryTrend } from './surgeryWaits'

type EndpointComparison =
  | { kind: 'series'; indicator: string; from: number; to: number; subject: string; precision: number }
  | { kind: 'surgery'; from: string; to: string }

export const predictionOptions = ['Higher', 'Lower', 'About the same'] as const
export type Prediction = typeof predictionOptions[number]

function direction(change: number): Prediction {
  if (change === 0) return 'About the same'
  return change > 0 ? 'Higher' : 'Lower'
}

interface Discovery {
  id: string
  question: string
  prompt: string
  comparison: EndpointComparison
  // Context adds an interpretation or boundary to the measured finding.
  context: string
}

export const featuredDiscoveries: Discovery[] = [
  {
    id: 'housing-affordability',
    question: 'Why has housing become so unaffordable?',
    prompt: 'In Spain, were home prices higher or lower in 2025 than in 2007, after inflation?',
    comparison: { kind: 'series', indicator: 'house_price_real', from: 2007, to: 2025, subject: 'home prices', precision: 0 },
    context: 'The 2007 boom is a high bar. Whether a home is affordable today also depends on income, mortgage rates and where you live.',
  },
  {
    id: 'growth-wages',
    question: 'Has pay kept up with Spain’s economy?',
    prompt: 'Could a typical hourly wage in Spain buy more in 2022 than in 2006?',
    comparison: { kind: 'series', indicator: 'median_earnings_real', from: 2006, to: 2022, subject: 'median hourly pay', precision: 1 },
    context: 'That was a small gain over 16 years. The economy grew faster per person, and household purchasing power also depends on hours worked and other sources of income.',
  },
  {
    id: 'surgery-waits',
    question: surgeryQuestion,
    prompt: 'Had people on Spain’s planned surgery list waited longer or less time in December 2025 than in December 2024?',
    comparison: { kind: 'surgery', from: 'Dec 2024', to: 'Dec 2025' },
    context: 'Where you live matters. In December 2025, the average ranged from 50 days in Madrid to 173 in Andalusia.',
  },
]

export const collection = [
  { id: 'growth-wages', question: 'Can Spanish households afford less than they used to?', params: { b: 'median_income_real', from: 2021, to: 2025 } },
  { id: 'europe-us', question: 'Are Europeans falling behind Americans?' },
  { id: 'productivity-wages', question: 'Have wages kept pace with productivity?' },
  { id: 'immigration-employment', question: 'Does immigration take jobs from locals?' },
  { id: 'immigration-crime', question: 'Does immigration increase crime?' },
]

export function discoveryEvidence(discovery: Discovery) {
  const comparison = discovery.comparison
  if (comparison.kind === 'surgery') {
    const first = surgeryTrend.find(({ date }) => date === comparison.from)
    const last = surgeryTrend.find(({ date }) => date === comparison.to)
    if (!first || !last) return null
    return {
      result: `The average was ${first.days} days in December 2024 and ${last.days} days in December 2025.`,
      answer: direction(last.days - first.days),
      source: surgerySource,
      publisher: 'Spain’s Ministry of Health',
    }
  }
  const indicator = INDICATORS[comparison.indicator]
  const points = series(comparison.indicator, 'ES')
  const first = points.find(({ year }) => year === comparison.from)
  const last = points.find(({ year }) => year === comparison.to)
  if (!indicator || !first || !last || comparison.from >= comparison.to) return null
  if (indicator.breaks.some(({ year }) => year > first.year && year <= last.year)) return null
  if (first.value === 0) return null

  const change = Number(((last.value / first.value - 1) * 100).toFixed(comparison.precision))
  const difference = change === 0 ? 'about the same as' : `${Math.abs(change)}% ${change < 0 ? 'below' : 'above'}`
  const result = `After inflation, ${comparison.subject} in ${last.year} ${comparison.indicator === 'house_price_real' ? 'were' : 'was'} ${difference} the ${first.year} level.`
  return { result, answer: direction(change), source: indicator.source.url, publisher: indicator.source.org }
}
