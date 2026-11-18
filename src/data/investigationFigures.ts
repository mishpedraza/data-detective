import { cohortWealth, conflictDeaths, danishEarnings, fertilityRates, happinessEstimates, permitCrime, usCrime } from './studyEvidence'
import { workingHours } from './workingHours'

type Point = { label: string; display: string; value: number }
type Range = { label: string; start: number; end: number }
type Figure = { caption: string; refs: readonly string[]; context?: string }

export type EvidenceFigure = Figure & (
  | { kind: 'timeline'; points: readonly (Point & { time: number })[] }
  | { kind: 'ranges'; rows: readonly Range[]; domain: readonly [number, number]; endpoints: readonly [string, string]; unit?: string }
  | { kind: 'dots'; points: readonly Point[]; domain: readonly [number, number]; unit: string }
  | { kind: 'composition'; rows: readonly { label: string; points: readonly Point[]; total: string }[]; maximum: number }
  | { kind: 'polls'; count: number; total: number; note: string; rate: Range }
)

const figures = {
  'children-and-happiness': {
    kind: 'timeline',
    caption: 'Change in happiness around a first birth · German panel · points on a 0–10 scale',
    refs: ['myrskyla2014'],
    points: happinessEstimates.map((point) => ({
      ...point, display: point.value === 0 ? 'Baseline' : `+${point.value.toFixed(2)}`,
    })),
  },
  'working-hours': {
    kind: 'ranges',
    caption: 'Annual hours per worker · 1970 and 2023',
    refs: ['pwt11'],
    endpoints: ['1970', '2023'],
    domain: [1200, 2100],
    rows: Object.entries(workingHours).map(([label, { earlier, later }]) => ({
      label, start: Math.round(earlier), end: Math.round(later),
    })),
  },
  'immigration-crime': {
    kind: 'ranges',
    caption: 'One mechanism tested in Italy · estimated crime rates near the residence-permit cutoff',
    context: 'Across two decades of published studies, the average association between immigration and crime was very weak and varied by setting. The Italian study tested a narrower question about residence permits.',
    refs: ['ousey2018', 'pinotti2017'],
    endpoints: ['Baseline', 'Estimated with legal status'],
    domain: [0, 1.2],
    unit: '%',
    rows: [{ label: 'Applicants near the cutoff', start: permitCrime.baseline, end: Number((permitCrime.baseline - permitCrime.reduction).toFixed(1)) }],
  },
  'education-and-pay': {
    kind: 'dots',
    caption: 'Estimated change in gross earnings ten years after a first birth · Denmark, 1980–2013 data',
    refs: ['kleven2019'],
    domain: [-25, 0],
    unit: '%',
    points: danishEarnings,
  },
  'global-danger': {
    kind: 'composition',
    caption: 'Where battle deaths occurred in 2023 · state-based conflicts · approximate',
    context: 'There were 59 active conflicts in 2023, up from 2022. The battle death toll more than halved, yet was still the third highest since 1989.',
    refs: ['rustad2024'],
    maximum: conflictDeaths.total,
    rows: [{
      label: 'Global toll', total: '122,000',
      points: conflictDeaths.groups.map(({ label, value }) => ({ label, value, display: value.toLocaleString('en-GB') })),
    }],
  },
  'generational-wealth': {
    kind: 'composition',
    caption: 'What US households owned and owed at ages 25–34 · averages in 2016 US dollars',
    refs: ['kurz2018'],
    maximum: Math.max(...cohortWealth.map(({ net, debt }) => net + debt)),
    rows: cohortWealth.map(({ label, net, debt }) => ({
      label, total: `$${(net + debt).toFixed(1)}k in assets`,
      points: [
        { label: 'Net worth', value: net, display: `$${net.toFixed(1)}k` },
        { label: 'Debt', value: debt, display: `$${debt.toFixed(1)}k` },
      ],
    })),
  },
  'crime-perceptions': {
    kind: 'polls',
    caption: 'American perceptions of crime and the long-run record',
    refs: ['pewCrime2024', 'gallupCrime'],
    count: usCrime.pollsAboveThreshold, total: usCrime.polls,
    note: `polls in which at least ${usCrime.publicThreshold}% said US crime had risen in the previous year`,
    rate: { label: 'FBI violent crime rate · 1993 = 100', start: 100, end: 100 - usCrime.decline },
  },
  'wealth-and-fertility': {
    kind: 'dots',
    caption: 'Fertility in France and Germany, 2000 · births per woman (approximate)',
    refs: ['doepke2022', 'oecdFertility'],
    domain: [0, 2],
    unit: '',
    points: fertilityRates.map(({ label, value }) => ({ label, value, display: value.toFixed(1) })),
  },
} satisfies Record<string, EvidenceFigure>

export const INVESTIGATION_FIGURES: Readonly<Partial<Record<string, EvidenceFigure>>> = figures
