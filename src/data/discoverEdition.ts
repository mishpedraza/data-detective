import { discoveryEvidence, predictionOptions, predictions } from './discoveries'
import { storyComparison } from '../lib/storyComparison'
import { REVIEWED_ANSWERS } from './reviewedAnswers'
import { cohortWealth, danishEarnings, fertilityRates, happinessEstimates, permitCrime, usCrime } from './studyEvidence'
import { workingHours } from './workingHours'

type Reveal = {
  finding: string
  note: string
  measure?: string
  refs: string[]
  facts?: { label: string; value: string }[]
  comparison?: { label: string; value: string; amount: number }[]
}

export type Interaction =
  | { kind: 'prediction'; label: string; choices: readonly string[]; answer: string; reveal: Reveal }
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
        refs: ['data:house_price_real'],
      },
    } : undefined,
  },
  'children-and-happiness': {
    hook: 'Follow the same people from five years before their first child to the years after.',
    interaction: {
      kind: 'contrast',
      label: 'Trace happiness around a first birth',
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
    hook: 'Compare two countries over a generation. Then consider the work that never makes it onto a payslip.',
    interaction: {
      kind: 'prediction',
      label: 'Where was the drop in annual hours per worker larger, from 1970 to 2023?',
      choices: [...hourCountries, 'About the same'],
      answer: Math.round(spain.drop) === Math.round(us.drop) ? 'About the same' : spain.drop > us.drop ? 'Spain' : 'United States',
      reveal: {
        finding: Math.round(spain.drop) === Math.round(us.drop)
          ? `Both countries saw a drop of about ${hours.format(spain.drop)} hours per worker a year.`
          : `${spain.drop > us.drop ? 'Spain' : 'The United States'} saw the larger decline: ${hours.format(Math.max(spain.drop, us.drop))} fewer annual hours per worker, compared with ${hours.format(Math.min(spain.drop, us.drop))} in ${spain.drop > us.drop ? 'the United States' : 'Spain'}.`,
        comparison: hourChanges.map(({ country, earlier, later, drop }) => ({
          label: country,
          value: `${hours.format(earlier)} → ${hours.format(later)} hours`,
          amount: Math.abs(drop),
        })),
        note: 'The bars show the drop in hours per worker. They leave unpaid household work outside the comparison.',
        refs: ['pwt11'],
      },
    },
  },
  'immigration-crime': {
    hook: 'In Italy, a permit deadline gave researchers an unusual way to compare otherwise similar applicants.',
    interaction: {
      kind: 'contrast',
      label: 'Compare applicants at the cutoff',
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
    hook: 'What happens to mothers’ and fathers’ earnings after a first child arrives?',
    interaction: {
      kind: 'contrast',
      label: 'Compare earnings ten years later',
      reveal: {
        finding: 'A decade after a first birth, Danish mothers faced a lasting earnings hit.',
        measure: 'Estimated effect on gross earnings after ten years · Denmark, 1980–2013 data',
        comparison: danishEarnings.map(({ label, value, display }) => ({ label, value: display, amount: -value })),
        note: 'Employment, hours and wage rates all contributed. This helps explain why qualifications alone cannot account for the earnings gap.',
        refs: ['kleven2019'],
      },
    },
  },
  'global-danger': {
    hook: 'A war count gives a small conflict and a deadly one the same weight. What happened when researchers counted the deaths too?',
    interaction: {
      kind: 'contrast',
      label: 'Compare conflicts and battle deaths',
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
    hook: 'If two generations own about as much at the same age, what could leave one with less wealth?',
    interaction: {
      kind: 'contrast',
      label: 'Compare wealth at ages 25–34',
      reveal: {
        finding: 'Millennials had the lowest average net worth of the three US cohorts at ages 25–34.',
        measure: 'Mean household net worth · US · in 2016 dollars',
        comparison: cohortWealth.map(({ label, net }) => ({ label, value: `$${hours.format(Math.round(net) * 1000)}`, amount: net })),
        note: 'Millennials owned about as much as boomers at that age, but owed more. The comparison ends in 2016.',
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
        finding: 'Recorded violent crime fell 49%, even as Americans frequently said crime was rising.',
        facts: [
          { label: 'The record · 1993–2022', value: `${usCrime.decline}% lower recorded violent crime rate` },
          { label: 'The perception · Gallup polls since 1993', value: `In ${usCrime.pollsAboveThreshold} of ${usCrime.polls} polls, at least ${usCrime.publicThreshold}% said crime had risen from the year before` },
        ],
        note: 'The annual opinion polls and the long-run crime series tell different stories. The long-run decline doesn’t tell us whether any single year felt safer locally.',
        refs: ['pewCrime2024', 'gallupCrime'],
      },
    },
  },
  'wealth-and-fertility': {
    hook: 'France and Germany had roughly similar GDP per person in 2000. Compare their birth rates.',
    interaction: {
      kind: 'prediction',
      label: 'Which country had the higher fertility rate?',
      choices: ['France', 'Germany'],
      answer: 'France',
      reveal: {
        finding: 'France had the higher fertility rate in 2000.',
        measure: 'Total fertility rate · births per woman · approximate',
        comparison: fertilityRates.map(({ label, value }) => ({ label, value: value.toFixed(1), amount: value })),
        note: 'Similar incomes can coexist with different fertility rates. Researchers point to childcare, work flexibility and how parents share care. Housing costs and family preferences may matter too.',
        refs: ['doepke2022'],
      },
    },
  },
}
