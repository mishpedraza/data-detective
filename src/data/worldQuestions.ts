// "The World Around Us" questions in the chapter format, built from the reviewed Discover teasers.
import { DISCOVER_TEASERS } from './discoverEdition'
import { EDITORIAL_QUESTIONS } from './editorial'
import type { ChapterQuestion, Evidence, Visual } from './menWomen'

const SHORT: Readonly<Record<string, string>> = {
  'housing-affordability': 'Home prices',
  'children-and-happiness': 'Children and happiness',
  'working-hours': 'Working hours',
  'immigration-crime': 'Permits and crime',
  'education-and-pay': 'The motherhood gap',
  'global-danger': 'Conflict and deaths',
  'generational-wealth': 'Generational wealth',
  'crime-perceptions': 'Perceptions of crime',
  'wealth-and-fertility': 'Wealth and fertility',
}

/** Revised questions with their own visual and study notes; the rest show the shared bars or facts. */
const REVISED: Readonly<Record<string, { visual: Visual; evidence: Evidence }>> = {
  'immigration-crime': {
    visual: 'permitcards',
    evidence: {
      citation: 'Pinotti (2017), American Economic Review',
      url: 'https://doi.org/10.1257/aer.20150355',
      sample: 'Immigrants in Italy who applied for a residence permit on the government’s “click days”, when permits went first come, first served until each quota ran out.',
      method: 'Compares applicants just before and just after the quota ran out, matched to individual criminal records. Measure: recorded crime rate afterward, 1.1% at baseline and 0.6 points lower with a permit.',
      limitation: 'Applies to applicants near the cutoff. It measures crime by these applicants, not how immigration affects crime overall.',
    },
  },
  'education-and-pay': {
    visual: 'adoption',
    evidence: {
      citation: 'Kleven, Landais & Søgaard (2021), American Economic Review: Insights',
      url: 'https://doi.org/10.1257/aeri.20200260',
      sample: 'Danish biological and adoptive families whose first child arrived between 1980 and 2017, from administrative registers.',
      method: 'Event studies around the child’s arrival. Measure: the drop in mothers’ earnings relative to fathers’, averaged over years 0–5 and 6–10 (Table 2).',
      limitation: 'Denmark only. Adoptive parents tend to be older and better off, so the biological families are reweighted to match them.',
    },
  },
  'crime-perceptions': {
    visual: 'crimedrop',
    evidence: {
      citation: 'FBI, 2025 Reported Crimes in the Nation (2026)',
      url: 'https://www.fbi.gov/news/press-releases/fbi-releases-2025-reported-crimes-in-the-nation-statistics',
      more: [{ citation: 'Gallup, Views of U.S. Crime Remain Most Positive in 25 Years (2026)', url: 'https://news.gallup.com/poll/716657/views-crime-remain-positive-years.aspx' }],
      sample: 'FBI: national estimates from offences reported by law enforcement agencies, 2024 and 2025. Gallup: telephone polls of U.S. adults each October, 2023–2026; 1,200 adults on 1–19 October 2026.',
      method: 'FBI measure: estimated violent crime rate (murder, rape, robbery and aggravated assault). Gallup measure: share saying there is more crime in the U.S. than a year ago.',
      limitation: 'Recorded crime misses offences never reported to police. The polls record impressions, and neither source explains why opinion shifted.',
    },
  },
  'wealth-and-fertility': {
    visual: 'fertility',
    evidence: {
      citation: 'Doepke, Hannusch, Kindermann & Tertilt (2023), Handbook of the Economics of the Family, Figure 8',
      url: 'https://faculty.wcas.northwestern.edu/mdo738/research/Doepke_Hannusch_Kindermann_Tertilt_Handbook_23.pdf',
      more: [
        { citation: 'World Bank, births per woman', url: 'https://data.worldbank.org/indicator/SP.DYN.TFRT.IN' },
        { citation: 'World Bank, GDP per person', url: 'https://data.worldbank.org/indicator/NY.GDP.PCAP.CD' },
        { citation: 'World Bank, GDP per person (PPP)', url: 'https://data.worldbank.org/indicator/NY.GDP.PCAP.PP.CD' },
      ],
      sample: 'The study’s 13 countries: Australia, Canada, Finland, France, Germany, Italy, Japan, the Netherlands, Norway, Portugal, Spain, Sweden and the United States, compared with one another in each year.',
      method: 'The 1980 and 2000 findings come from Figure 8 (OECD data). The chart and the 2024 result use World Bank data: the correlation between births per woman and log GDP per person was −0.76 in 1980, +0.39 in 2000 and +0.58 in 2024 (+0.52 adjusted for purchasing power).',
      limitation: 'Thirteen countries in three years. A correlation across countries doesn’t show why fertility differs.',
    },
  },
}

export const WORLD_QUESTIONS: readonly ChapterQuestion[] = EDITORIAL_QUESTIONS.flatMap(({ id }) => {
  const teaser = DISCOVER_TEASERS[id]
  const interaction = teaser?.interaction
  if (!interaction) return []
  const { finding, note, measure, comparison, facts, refs } = interaction.reveal
  return [{
    id,
    kind: 'choice' as const,
    short: SHORT[id] ?? interaction.label,
    question: interaction.label,
    prompt: teaser.context ?? '',
    options: interaction.choices.map((choice) => ({ id: choice, label: interaction.choiceLabels?.[choice] ?? choice })),
    answer: interaction.answer,
    finding,
    takeaway: note,
    visual: REVISED[id]?.visual ?? (comparison ? 'bars' as const : 'facts' as const),
    evidence: REVISED[id]?.evidence,
    measure,
    bars: comparison,
    facts,
    refs,
    explore: { r: id, years: teaser.years },
  }]
})
