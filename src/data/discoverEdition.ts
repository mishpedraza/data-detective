import { discoveryEvidence, predictionOptions, predictions } from './discoveries'
import { storyComparison } from '../lib/storyComparison'
import { REVIEWED_ANSWERS } from './reviewedAnswers'
import { workingHours } from './workingHours'

type Reveal = {
  finding: string
  note: string
  next: string
  refs: string[]
  facts?: { label: string; value: string }[]
  comparison?: { label: string; value: string; amount: number }[]
}

export type Interaction =
  | { kind: 'prediction'; label: string; choices: readonly string[]; answer?: string; reveal: Reveal }
  | { kind: 'contrast'; label: string; reveal: Reveal }

interface Teaser {
  hook: string
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
const hourCountries = ['Spain', 'United States'] as const
const hourChanges = hourCountries.map((country) => {
  const { earlier, later } = workingHours[country]
  return { country, earlier, later, drop: earlier - later }
})
const [spain, us] = hourChanges
export const DISCOVER_TEASERS: Readonly<Partial<Record<string, Teaser>>> = {
  'housing-affordability': {
    years: { from: housing.comparison.from, to: housing.comparison.to },
    hook: 'Spain’s housing boom set a high benchmark. See how today’s prices look once you take inflation out.',
    interaction: housingEvidence ? {
      kind: 'prediction',
      label: housing.comparisonLabel,
      choices: predictionOptions(housing),
      answer: housingEvidence.answer,
      reveal: {
        finding: housingEvidence.result,
        comparison: housingBars,
        note: 'That compares national purchase prices. A buyer’s monthly budget also depends on income and the cost of borrowing.',
        next: 'See what the price index leaves out',
        refs: ['data:house_price_real'],
      },
    } : undefined,
  },
  'children-and-happiness': {
    hook: 'The weeks around a first birth and the years that follow can tell different stories.',
    interaction: {
      kind: 'prediction',
      label: 'Several years after a first birth, how does average happiness compare with before?',
      choices: ['Higher', 'Back where it was', 'Lower'],
      reveal: {
        finding: 'The lift in happiness was temporary on average.',
        facts: [
          { label: 'Around the first birth', value: 'Average happiness rose' },
          { label: 'Later on', value: 'Ratings returned to roughly their earlier level' },
        ],
        note: 'In the British and German surveys, the rise began before birth. The study leaves open how much of the change came from parenthood itself.',
        next: 'Follow the story before and after birth',
        refs: ['myrskyla2014'],
      },
    },
  },
  'working-hours': {
    hook: 'Compare two countries over a generation. Then consider the work that never makes it onto a payslip.',
    interaction: {
      kind: 'prediction',
      label: 'Where was the drop in annual hours per worker larger, from 1970 to 2023?',
      choices: [...hourCountries, 'About the same'],
      answer: Math.round(spain.drop) === Math.round(us.drop) ? 'About the same' : spain.drop > us.drop ? 'Spain' : 'United States',
      reveal: {
        finding: 'The annual hours that disappeared',
        comparison: hourChanges.map(({ country, earlier, later, drop }) => ({
          label: country,
          value: `${hours.format(earlier)} → ${hours.format(later)} hours`,
          amount: Math.abs(drop),
        })),
        note: 'The bars show the drop in hours per worker. They leave unpaid household work outside the comparison.',
        next: 'See where the working week went',
        refs: ['pwt11'],
      },
    },
  },
  'immigration-crime': {
    hook: 'If one offence rises, what does that tell you about crime overall?',
    interaction: {
      kind: 'contrast',
      label: 'Compare robbery with overall crime',
      reveal: {
        finding: 'One offence rose even though the change in overall crime was unclear.',
        facts: [
          { label: 'Robbery', value: 'The study estimated an increase' },
          { label: 'Overall crime', value: 'The study found no statistically clear change' },
        ],
        note: 'These results come from one study of Italian provinces, 1990–2003. Robbery made up a small share of recorded offences, and this estimate tells us about that place and period.',
        next: 'See how results vary across settings',
        refs: ['bianchi2012'],
      },
    },
  },
  'education-and-pay': {
    hook: 'Qualifications are one thing employers reward. Being available at a particular hour can be another.',
    interaction: {
      kind: 'contrast',
      label: 'Look at the two measures',
      reveal: {
        finding: 'An advantage in education can coexist with a gap in pay.',
        facts: [
          { label: 'Tertiary qualifications · EU ages 25–34, 2024', value: '49.8% of women and 38.6% of men' },
          { label: 'Overall hourly pay gap · EU, 2022', value: '12.2%' },
        ],
        note: 'These figures cover different groups and years. They show why education alone leaves part of the pay story open.',
        next: 'See why degrees and earnings can diverge',
        refs: ['eurostatGender'],
      },
    },
  },
  'global-danger': {
    hook: 'A tally of wars and a measure of child survival can send different signals about the same world.',
    interaction: {
      kind: 'contrast',
      label: 'Reveal two measures of danger',
      reveal: {
        finding: 'More active conflicts can coexist with better child survival.',
        facts: [
          { label: 'Active state-based conflicts · 2023', value: '59, the most in the 1946–2023 series' },
          { label: 'Deaths before age five · 2024', value: '37.4 per 1,000 live births, less than half the 2000 rate' },
        ],
        note: 'The count of conflicts and the risk of dying in childhood answer different questions. Neither is a score for how dangerous the world is.',
        next: 'Follow the two trends',
        refs: ['rustad2024', 'whoChildMortality'],
      },
    },
  },
  'generational-wealth': {
    hook: 'Compare generations at the same age and a balance sheet can tell a different story from a payslip.',
    interaction: {
      kind: 'contrast',
      label: 'Open the generational balance sheet',
      reveal: {
        finding: 'US millennials had fewer assets at comparable ages.',
        facts: [
          { label: 'Assets', value: 'Fewer than earlier generations' },
          { label: 'Debt', value: 'Similar to Generation X and above baby boomers' },
        ],
        note: 'The comparison was published in 2018. Looking at similar ages accounts for the extra years older people have had to save, and leaves open whether millennials caught up later.',
        next: 'See what the age-matched comparison can tell us',
        refs: ['kurz2018'],
      },
    },
  },
  'crime-perceptions': {
    hook: 'Americans often felt crime was rising. What does the longer record show?',
    interaction: {
      kind: 'prediction',
      label: 'How did the US police-recorded violent crime rate change from 1993 to 2022?',
      choices: ['It rose', 'It fell', 'It barely changed'],
      answer: 'It fell',
      reveal: {
        finding: 'Recorded violent crime fell while the sense of rising crime kept returning.',
        facts: [
          { label: 'The record · 1993–2022', value: '49% lower recorded violent crime rate' },
          { label: 'The perception · Gallup polls since 1993', value: 'In 23 of 27 polls, at least 60% said crime had risen from the year before' },
        ],
        note: 'The annual opinion polls and the long-run crime series tell different stories. The long-run decline doesn’t tell us whether any single year felt safer locally.',
        next: 'Compare public perceptions with recorded trends',
        refs: ['pewCrime2024', 'gallupCrime'],
      },
    },
  },
  'wealth-and-fertility': {
    hook: 'Having a child can change what you can do at work. That trade-off varies even among rich countries.',
    interaction: {
      kind: 'contrast',
      label: 'Reveal the trade-off',
      reveal: {
        finding: 'The career cost of having children can vary even at similar incomes.',
        facts: [
          { label: 'When care and work clash', value: 'Parents may have to cut hours or pass up opportunities' },
          { label: 'When care and work fit together', value: 'Childcare, flexible schedules and shared care can ease that choice' },
        ],
        note: 'The fertility review identifies these as possible reasons countries with similar incomes can have different birth rates. It leaves room for other explanations.',
        next: 'See why income tells only part of the story',
        refs: ['doepke2022'],
      },
    },
  },
}
