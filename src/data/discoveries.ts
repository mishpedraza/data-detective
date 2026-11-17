import { INDICATORS, series } from './indicators'

type EndpointComparison = { indicator: string; from: number; to: number; subject: string; precision: number; benchmark?: string }

const directionOptions = ['Higher', 'Lower', 'About the same'] as const
const yesNoOptions = ['Yes', 'No', 'About the same'] as const
export type Prediction = typeof directionOptions[number] | typeof yesNoOptions[number]

export function predictionOptions(discovery: Discovery) {
  const comparison = discovery.comparison
  return comparison.benchmark ? yesNoOptions : directionOptions
}

function answerFor(change: number, options: readonly Prediction[]): Prediction {
  const [higher, lower, same] = options
  return change === 0 ? same : change > 0 ? higher : lower
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
    comparison: { indicator: 'house_price_real', from: 2007, to: 2025, subject: 'home prices', precision: 0 },
    context: 'The 2007 boom is a high bar. Whether a home is affordable today also depends on income, mortgage rates and where you live.',
  },
  {
    id: 'growth-wages',
    question: 'Has pay kept up with Spain’s economy?',
    prompt: 'From 2006 to 2022, did typical hourly pay in Spain grow faster than GDP per person, after inflation?',
    comparison: { indicator: 'median_earnings_real', from: 2006, to: 2022, subject: 'median hourly pay', precision: 1, benchmark: 'gdp_pc_real' },
    context: 'Typical hourly pay bought a little more. What a household can afford also depends on hours worked and other sources of income.',
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
  const options = predictionOptions(discovery)
  const { from, to, precision } = comparison
  const changeFor = (id: string) => {
    const indicator = INDICATORS[id]
    const points = series(id, 'ES')
    const first = points.find(({ year }) => year === from)
    const last = points.find(({ year }) => year === to)
    if (!indicator || !first?.value || !last || from >= to) return null
    if (indicator.breaks.some(({ year }) => year > from && year <= to)) return null
    return Number(((last.value / first.value - 1) * 100).toFixed(precision))
  }
  const change = changeFor(comparison.indicator)
  if (change === null) return null
  const { url: source, org: publisher } = INDICATORS[comparison.indicator].source
  if (comparison.benchmark) {
    const benchmark = changeFor(comparison.benchmark)
    if (benchmark === null) return null
    const showChange = (value: number) => value === 0 ? 'was unchanged' : `${value > 0 ? 'rose' : 'fell'} ${Math.abs(value)}%`
    return {
      result: `After inflation, typical hourly pay ${showChange(change)}, while GDP per person ${showChange(benchmark)}.`,
      answer: answerFor(change - benchmark, options),
      source,
      publisher,
    }
  }

  const difference = change === 0 ? 'about the same as' : `${Math.abs(change)}% ${change < 0 ? 'below' : 'above'}`
  const result = `After inflation, ${comparison.subject} in ${to} were ${difference} the ${from} level.`
  return { result, answer: answerFor(change, options), source, publisher }
}
