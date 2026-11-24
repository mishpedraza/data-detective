import { discoveryEvidence, predictions } from './discoveries'
import { storyComparison } from '../lib/storyComparison'
import { REVIEWED_ANSWERS } from './reviewedAnswers'
import { adoptionPenalties, cohortWealth, gallupMoreCrime, happinessEstimates, permitCrime, violentCrime2025 } from './studyEvidence'
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
export const DISCOVERY_QUIZ_EDITION = 'finalized-nine-v2'

const hourCountries = ['Spain', 'United States', 'Germany'] as const
const hourChanges = hourCountries.map((country) => {
  const { earlier, later } = workingHours[country]
  return { country, earlier, later, drop: earlier - later }
})
const biggestHoursDrop = [...hourChanges].sort((a, b) => b.drop - a.drop)[0]
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
      label: 'Where did annual working hours fall the most: Spain, the U.S. or Germany?',
      choiceLabels: { 'United States': 'The U.S.' },
      choices: [...hourCountries],
      answer: biggestHoursDrop.country,
      reveal: {
        finding: `Germany had the largest reduction: about ${hours.format(biggestHoursDrop.drop)} fewer hours per worker per year, compared with ${hours.format(hourChanges[0].drop)} in Spain and ${hours.format(hourChanges[1].drop)} in the U.S.`,
        comparison: hourChanges.map(({ country, earlier, later, drop }) => ({
          label: country === 'United States' ? 'U.S.' : country,
          value: `${hours.format(earlier)} → ${hours.format(later)} hours`,
          amount: Math.abs(drop),
        })),
        note: 'Germany also had the fewest annual hours per worker in 2023. These figures describe working time, not salaries or unpaid household work.',
        refs: ['pwt11'],
      },
    },
  },
  'immigration-crime': {
    context: 'Italy · Residence-permit applicants on either side of the cutoff',
    interaction: {
      label: 'Two people apply for an Italian residence permit. One just makes the cutoff. The other just misses it. Which group had a higher recorded crime rate afterward?',
      choices: ['The group that got permits', 'The group that missed out', 'The rates were about the same'],
      answer: 'The group that missed out',
      reveal: {
        finding: 'The group that missed out. Near the cutoff, getting a permit brought the recorded crime rate from about 11 in 1,000 to 5 in 1,000.',
        measure: 'Recorded crime rate afterward · applicants near the cutoff',
        comparison: [
          { label: 'Got a permit', value: `≈${Math.round((permitCrime.baseline - permitCrime.reduction) * 10)} in 1,000`, amount: permitCrime.baseline - permitCrime.reduction },
          { label: 'Just missed out', value: `≈${Math.round(permitCrime.baseline * 10)} in 1,000`, amount: permitCrime.baseline },
        ],
        note: 'Permits went first come, first served until the quota ran out, so applicants on either side of the cutoff were otherwise alike. The permit itself, which opens the door to legal work, roughly halved their recorded crime. The result applies to these applicants, not to how immigration affects crime overall.',
        refs: ['pinotti2017'],
      },
    },
  },
  'education-and-pay': {
    context: 'Denmark · Earnings after a child arrives',
    interaction: {
      label: 'If a mother adopts, is the long-term hit to her earnings smaller than if she gives birth?',
      choices: ['Smaller', 'About the same', 'Larger'],
      answer: 'About the same',
      reveal: {
        finding: `About the same. Six to ten years on, the estimated earnings penalties were virtually identical: ${adoptionPenalties.adopted.long}% for adoptive mothers and ${adoptionPenalties.birth.long}% for mothers who gave birth.`,
        measure: 'Mothers’ earnings penalty relative to fathers · years 6–10',
        comparison: [
          { label: 'Gave birth', value: `${adoptionPenalties.birth.long}%`, amount: adoptionPenalties.birth.long },
          { label: 'Adopted', value: `${adoptionPenalties.adopted.long}%`, amount: adoptionPenalties.adopted.long },
        ],
        note: 'Mothers who gave birth took a slightly larger hit at first, when pregnancy, recovery and breastfeeding matter most. Then the two paths converged. Adoptive mothers have none of those biological links, so biology can’t explain why mothers’ earnings stay lower.',
        refs: ['kleven2021'],
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
    context: 'U.S. households aged 25–34 · Inflation-adjusted assets',
    interaction: {
      label: 'At the same age, did millennials own more or less than baby boomers?',
      choices: ['More', 'Less', 'About the same'],
      answer: 'About the same',
      reveal: {
        lead: 'Plot twist: about the same.',
        finding: 'Millennials had approximately $176,000 in assets, compared with $173,000 for baby boomers. But here’s the catch: millennials had more debt.',
        measure: 'Average assets before subtracting debt · 2016 dollars',
        comparison: [cohortWealth[0], cohortWealth[2]].map(({ label, net, debt }) => ({
          label, value: `$${hours.format(Math.round(net + debt) * 1000)}`, amount: net + debt,
        })),
        note: 'Once debt was taken into account, millennials had approximately $92,000 in net worth, compared with $114,000 for baby boomers.',
        refs: ['kurz2018'],
      },
    },
  },
  'crime-perceptions': {
    context: 'United States · FBI national estimates, 2024 to 2025',
    interaction: {
      label: 'In 2025, did violent crime in the U.S. rise, fall a little, or record its biggest one-year drop in the FBI’s national estimates?',
      choices: ['It rose', 'It fell a little', 'It recorded the biggest one-year drop'],
      answer: 'It recorded the biggest one-year drop',
      reveal: {
        finding: `It recorded the biggest one-year drop in the FBI’s national estimates: violent crime fell ${-violentCrime2025.change}% from 2024 to 2025.`,
        measure: 'Said there was more crime in the U.S. than a year earlier · Gallup, October polls',
        comparison: gallupMoreCrime.map(({ year, value }) => ({ label: String(year), value: `${value}%`, amount: value })),
        note: 'Opinion shifted too. In separate Gallup polls, the share of Americans who said crime was rising nationally fell from 77% in 2023 to 46% in 2026. The FBI counts recorded crime and Gallup asks what people think, so the figures leave open what changed people’s minds.',
        refs: ['fbi2025', 'gallupCrime2026'],
      },
    },
  },
  'wealth-and-fertility': {
    context: 'The same 13 OECD countries, compared in 1980, 2000 and 2024',
    interaction: {
      label: 'Among rich countries today, do the richest still have the fewest babies?',
      choices: ['Richer countries tended to have fewer births per woman', 'There was no clear pattern', 'Richer countries tended to have more births per woman'],
      answer: 'Richer countries tended to have more births per woman',
      reveal: {
        finding: 'No. In this group, richer countries tended to have more births per woman in 2024.',
        facts: [
          { label: '1980', value: 'Richer countries had fewer births per woman ↘' },
          { label: '2000', value: 'The pattern had flipped ↗' },
          { label: '2024', value: 'Richer countries still had more births per woman ↗' },
        ],
        note: 'In 1980, the richer countries in this group tended to have fewer babies. By 2000, the pattern had flipped, and it still held in 2024. Births per woman fell in every one of these countries, so the flip is about where they fell least.',
        refs: ['doepke2023', 'worldBankFertility', 'worldBankGdp'],
      },
    },
  },
}
