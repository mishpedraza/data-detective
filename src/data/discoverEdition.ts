import { discoveryEvidence, predictions } from './discoveries'
import { storyComparison } from '../lib/storyComparison'
import { REVIEWED_ANSWERS } from './reviewedAnswers'
import { cohortWealth, happinessEstimates, permitCrime, usCrime } from './studyEvidence'
import { workingHours } from './workingHours'

type Reveal = {
  finding: string
  lead?: string
  note: string
  measure?: string
  refs: string[]
  facts?: { label: string; value: string }[]
  comparison?: { label: string; value: string; amount: number }[]
}

export type Interaction =
  { label: string; choices: readonly string[]; choiceLabels?: Readonly<Record<string, string>>; answer: string; reveal: Reveal }

interface Teaser {
  context?: string
  years?: { from: number; to: number }
  interaction?: Interaction
}

const housing = predictions.find(({ id }) => id === 'housing-affordability')!
const housingEvidence = discoveryEvidence(housing)
const housingVisual = REVIEWED_ANSWERS['housing-affordability']?.visual
const housingBars = housingVisual && storyComparison(housingVisual)?.rows.map(({ label, display, value }) => ({
  label, value: `${display} · 2007 = 100`, amount: value,
}))
const hours = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 })
export const DISCOVERY_QUIZ_EDITION = 'finalized-nine-v1'

const hourCountries = ['Spain', 'United States'] as const
const hourChanges = hourCountries.map((country) => {
  const { earlier, later } = workingHours[country]
  return { country, earlier, later, drop: earlier - later }
})
const [spain, us] = hourChanges
export const DISCOVER_TEASERS: Readonly<Partial<Record<string, Teaser>>> = {
  'housing-affordability': {
    context: 'Spain · National home prices after inflation',
    years: { from: housing.comparison.from, to: housing.comparison.to },
    interaction: housingEvidence ? {
      label: 'How did Spain’s home prices in 2025 compare with the 2007 boom?',
      choices: ['Higher', 'About the same', 'Lower'],
      choiceLabels: { Higher: `About ${Math.abs(housingEvidence.change) || 13}% higher`, Lower: `About ${Math.abs(housingEvidence.change) || 13}% lower` },
      answer: housingEvidence.answer,
      reveal: {
        lead: housingEvidence.answer === 'Lower' ? 'Actually, lower.'
          : housingEvidence.answer === 'Higher' ? 'Yes, higher.' : 'About the same.',
        finding: housingEvidence.result,
        comparison: housingBars,
        note: 'That compares national purchase prices. A buyer’s monthly budget also depends on income and the cost of borrowing.',
        refs: ['data:house_price_real'],
      },
    } : undefined,
  },
  'children-and-happiness': {
    context: 'Germany · Compared with their own happiness four to five years before the birth',
    interaction: {
      label: 'A year or two after their first child, were parents still happier?',
      choices: ['Still noticeably happier', 'Back near their earlier level', 'Less happy than before'],
      answer: 'Back near their earlier level',
      reveal: {
        finding: 'Happiness rose before the first birth, then returned close to its earlier level.',
        measure: 'Change in reported happiness on a 0–10 scale · German panel',
        comparison: happinessEstimates.slice(1).map(({ label, value }) => ({
          label, value: `+${value.toFixed(2)}`, amount: value,
        })),
        note: 'The baseline was four to five years before birth. The survey tracks changes over time without isolating the effect of parenthood.',
        refs: ['myrskyla2014'],
      },
    },
  },
  'working-hours': {
    context: '1970–2023 · Annual hours worked per worker',
    interaction: {
      label: 'Where did annual working hours fall more, in Spain or in the U.S.?',
      choiceLabels: { 'United States': 'The U.S.' },
      choices: [...hourCountries, 'About the same'],
      answer: Math.round(spain.drop) === Math.round(us.drop) ? 'About the same' : spain.drop > us.drop ? 'Spain' : 'United States',
      reveal: {
        finding: Math.round(spain.drop) === Math.round(us.drop)
          ? `Both countries saw a drop of about ${hours.format(spain.drop)} hours per worker a year.`
          : `${spain.drop > us.drop ? 'Spain' : 'The U.S.'} saw the larger decline: ${hours.format(Math.max(spain.drop, us.drop))} fewer annual hours per worker, compared with ${hours.format(Math.min(spain.drop, us.drop))} in ${spain.drop > us.drop ? 'the U.S.' : 'Spain'}.`,
        comparison: hourChanges.map(({ country, earlier, later, drop }) => ({
          label: country === 'United States' ? 'U.S.' : country,
          value: `${hours.format(earlier)} → ${hours.format(later)} hours`,
          amount: Math.abs(drop),
        })),
        note: 'Spain went from working slightly more hours per worker than the U.S. to working fewer. The comparison leaves out unpaid household work.',
        refs: ['pwt11'],
      },
    },
  },
  'immigration-crime': {
    context: 'Italy · Applicants who narrowly qualified versus those who narrowly missed out',
    interaction: {
      label: 'How much did getting a residence permit change the recorded crime rate among applicants near the cutoff?',
      choices: ['Little or none', 'The rate was about a quarter lower', 'The rate was about half as high'],
      answer: 'The rate was about half as high',
      reveal: {
        finding: 'Getting a residence permit roughly halved the recorded crime rate among applicants near the cutoff.',
        measure: 'Estimated crime rates near Italy’s permit cutoff',
        comparison: [
          { label: 'Baseline rate', value: `${permitCrime.baseline}%`, amount: permitCrime.baseline },
          { label: 'With legal status', value: `≈${(permitCrime.baseline - permitCrime.reduction).toFixed(1)}%`, amount: permitCrime.baseline - permitCrime.reduction },
        ],
        note: 'The study estimated a drop of 0.6 percentage points. It measures crime among these applicants, leaving the effect of immigration on national crime open.',
        refs: ['pinotti2017'],
      },
    },
  },
  'education-and-pay': {
    context: 'Denmark · Earnings ten years after a first birth',
    interaction: {
      label: 'What drove the earnings gap after a first child?',
      choices: ['Mostly fewer hours', 'Mostly lower hourly pay', 'Mostly fewer mothers in work', 'All three contributed roughly equally'],
      answer: 'All three contributed roughly equally',
      reveal: {
        finding: 'All three contributed roughly equally.',
        note: 'Mothers were less likely to be working, worked fewer hours when employed, and earned less per hour. Each factor accounted for roughly a third of the long-run earnings effect in the Danish study.',
        refs: ['kleven2019'],
      },
    },
  },
  'global-danger': {
    context: 'Worldwide · State-based conflicts, 2022 to 2023',
    interaction: {
      label: 'More armed conflicts were active in 2023. What happened to battle deaths?',
      choices: ['They rose too', 'They stayed about the same', 'They fell by more than half'],
      answer: 'They fell by more than half',
      reveal: {
        finding: 'There were more armed conflicts in 2023, and battle deaths more than halved.',
        measure: 'Global state-based conflicts · change from 2022 to 2023',
        facts: [
          { label: 'Conflicts ↑', value: '59 active conflicts' },
          { label: 'Battle deaths ↓', value: 'About 122,000' },
        ],
        note: 'Even with the decline, 2023 had the third-highest battle death toll since 1989. Counting conflicts and counting deaths capture different aspects of war.',
        refs: ['rustad2024'],
      },
    },
  },
  'generational-wealth': {
    context: 'U.S. households headed by adults aged 25–34 · Average assets after inflation',
    interaction: {
      label: 'At the same age, did U.S. millennials own less than baby boomers before subtracting debt?',
      choices: ['Substantially less', 'About as much', 'Substantially more'],
      answer: 'About as much',
      reveal: {
        finding: 'They owned about as much, but millennials owed more.',
        measure: 'Average assets before subtracting debt · 2016 dollars',
        comparison: [cohortWealth[0], cohortWealth[2]].map(({ label, net, debt }) => ({
          label, value: `$${hours.format(Math.round(net + debt) * 1000)}`, amount: net + debt,
        })),
        note: 'Average net worth was about $92,000 for millennials and $114,000 for boomers at the same age. This historical comparison ends in 2016.',
        refs: ['kurz2018'],
      },
    },
  },
  'crime-perceptions': {
    context: 'Gallup · Perceptions of crime over the previous year',
    interaction: {
      label: 'Where are people in the U.S. more likely to say crime is rising: across the country or in their own area?',
      choices: ['Across the country', 'In their own area', 'About equally likely'],
      answer: 'Across the country',
      reveal: {
        finding: 'People more often say crime is rising nationally than in their own area.',
        measure: 'Share who said crime had risen · Gallup, October 2023',
        comparison: [
          { label: 'Across the country', value: '77%', amount: 77 },
          { label: 'In their own area', value: '55%', amount: 55 },
        ],
        note: `Over a different time frame, the recorded U.S. violent crime rate fell ${usCrime.decline}% from 1993 to 2022, even though crime rose in some years.`,
        refs: ['pewCrime2024', 'gallupCrime2023'],
      },
    },
  },
  'wealth-and-fertility': {
    context: '13 OECD countries · GDP per person and births per woman',
    interaction: {
      label: 'In 1980, the richer countries in this group tended to have fewer babies. Did that pattern still hold in 2000?',
      choices: ['The pattern held', 'The pattern disappeared', 'The pattern flipped'],
      answer: 'The pattern flipped',
      reveal: {
        finding: 'By 2000, richer countries in this sample tended to have slightly higher fertility.',
        facts: [
          { label: '1980', value: 'Higher income went with lower fertility ↘' },
          { label: '2000', value: 'Higher income went with slightly higher fertility ↗' },
        ],
        note: 'That reversal is one reason researchers look beyond income to factors like childcare and how easily parents can combine work and family.',
        refs: ['doepke2022'],
      },
    },
  },
}
