import { discoveryEvidence, predictionOptions, predictions } from './discoveries'
import { storyComparison } from '../lib/storyComparison'
import { REVIEWED_ANSWERS } from './reviewedAnswers'
import { workingHours } from './workingHours'

type Reveal = {
  finding: string
  note: string
  next: string
  refs: string[]
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
// Gallup historical trends, October 2022, More Crime US and Crime Your Area tables.
const crimePerceptions = [
  { label: 'Across the US', share: 78 },
  { label: 'In their own area', share: 56 },
] as const

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
        finding: 'On average, happiness rose around a first birth and later returned to roughly where it started.',
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
    hook: 'A change in who arrives is only part of the story. The answer also depends on which offences a study measures and what people can do once they arrive.',
  },
  'education-and-pay': {
    hook: 'Qualifications are one thing employers reward. Being available at a particular hour can be another.',
    interaction: {
      kind: 'contrast',
      label: 'Look at the two measures',
      reveal: {
        finding: 'An advantage in education can coexist with a gap in pay.',
        note: 'In the EU in 2024, 49.8% of women aged 25–34 had tertiary qualifications, compared with 38.6% of men that age. Separately, the 2022 overall hourly pay gap was 12.2%. These figures cover different groups and years.',
        next: 'See why degrees and earnings can diverge',
        refs: ['eurostatGender'],
      },
    },
  },
  'global-danger': {
    hook: 'Put the world’s conflict figures next to a measure of child survival. The two tell very different stories about risk.',
  },
  'generational-wealth': {
    hook: 'Compare millennials and earlier generations at the same age. Then look at what each had earned, owned and owed.',
  },
  'crime-perceptions': {
    hook: 'Gallup asked Americans the same question about their own area and the country. The answers tell two different stories.',
    interaction: {
      kind: 'prediction',
      label: 'In 2022, which did more US adults say had more crime than a year earlier?',
      choices: ['Across the US', 'In their own area', 'About the same'],
      answer: crimePerceptions[0].share > crimePerceptions[1].share ? crimePerceptions[0].label : 'About the same',
      reveal: {
        finding: 'The view from across the country differed from the view closer to home.',
        comparison: crimePerceptions.map(({ label, share }) => ({ label, value: `${share}%`, amount: share })),
        note: 'These are the shares of Gallup respondents who thought crime was up. The survey measures perceptions.',
        next: 'Compare what people thought with what was recorded',
        refs: ['gallupCrime'],
      },
    },
  },
  'wealth-and-fertility': {
    hook: 'Two countries can be equally wealthy and offer very different answers to a practical question: who looks after the children while you work?',
  },
}
