import { INDICATORS, series } from './indicators'
import { surgeryQuestion, surgerySource, surgeryTrend } from './surgeryWaits'

type EndpointComparison =
  | { kind: 'series'; indicator: string; from: number; to: number; display: 'percent-change' | 'rate-per-100k' }
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
    comparison: { kind: 'series', indicator: 'house_price_real', from: 2007, to: 2025, display: 'percent-change' },
    context: 'The 2007 boom is a high bar. Whether a home is affordable today also depends on income, mortgage rates and where you live.',
  },
  {
    id: 'immigration-crime',
    question: 'Does immigration increase crime?',
    prompt: 'Did Spain’s recorded homicide rate rise or fall between 2002 and 2023?',
    comparison: { kind: 'series', indicator: 'crime_homicide_long', from: 2002, to: 2023, display: 'rate-per-100k' },
    context: 'Spain’s foreign-born share rose over the same period. Homicide is one measure of serious violence. Other crimes can follow different trends, and this comparison alone leaves the role of immigration open.',
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
  { id: 'growth-wages', question: 'Has pay kept up with Spain’s economy?' },
  { id: 'europe-us', question: 'Are Europeans falling behind Americans?' },
]

const number = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 })

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
  if (comparison.display === 'percent-change' && first.value === 0) return null

  const change = Math.round((last.value / first.value - 1) * 100)
  const result = comparison.display === 'rate-per-100k'
    ? `Spain recorded ${number.format(first.value)} homicides per 100,000 people in ${first.year} and ${number.format(last.value)} in ${last.year}.`
    : `After inflation, home prices in ${last.year} were ${change === 0 ? 'about the same as' : `${Math.abs(change)}% ${change < 0 ? 'below' : 'above'}`} their ${first.year} level.`
  const displayedChange = comparison.display === 'rate-per-100k'
    ? Math.round(last.value * 100) - Math.round(first.value * 100)
    : change
  return { result, answer: direction(displayedChange), source: indicator.source.url, publisher: indicator.source.org }
}
