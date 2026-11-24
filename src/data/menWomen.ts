// Chapter 1 of "How well do you really understand men and women?". Every figure is checked against the cited source.

export type Side = 'men' | 'similar' | 'women'
export type Visual = 'age' | 'gauges' | 'rotation' | 'curves' | 'diverging' | 'dumbbell' | 'grids' | 'bars' | 'facts'
  | 'leader' | 'negotiate' | 'compete' | 'risk' | 'backlash' | 'week' | 'budget' | 'timeline' | 'power'
  | 'eyes' | 'maths' | 'moral' | 'paradox'

export interface Evidence {
  citation: string
  url: string
  sample: string
  method: string
  limitation: string
}

interface Base {
  id: string
  /** Short label for the progress rail and review. */
  short: string
  question: string
  prompt: string
  /** Large serif line shown once the answer is revealed. */
  finding: string
  /** One or two plain sentences under the visual. */
  takeaway: string
  visual: Visual
  /** A single study, or the shared source references of an investigation. */
  evidence?: Evidence
  refs?: readonly string[]
  /** Caption, bars and facts for the 'bars' and 'facts' visuals. */
  measure?: string
  bars?: readonly { label: string; value: string; amount: number }[]
  facts?: readonly { label: string; value: string }[]
  /** Investigation that explains the finding. */
  explore?: { r: string; years?: { from: number; to: number } }
}

/** An unscored personal exercise played before the scored question. */
export type Warmup =
  | { kind: 'choice'; prompt: string; options: readonly { id: string; label: string }[] }
  | { kind: 'week'; prompt: string }

export interface ChoiceQuestion extends Base {
  kind: 'choice'
  options: readonly { id: string; label: string }[]
  answer: string
  warmup?: Warmup
}

export interface RowsQuestion extends Base {
  kind: 'rows'
  rows: readonly { id: string; label: string; answer: Side; d?: number }[]
  /** Overrides the Men / Similar / Women button labels. */
  labels?: Partial<Record<Side, string>>
}

export interface SlidersQuestion extends Base {
  kind: 'sliders'
  scenario: string
  actual: { men: number; women: number }
  sources?: readonly { label: string; men: number; women: number }[]
  /** What other people guessed, shown between the player's guess and the real figures. */
  expected?: { men: number; women: number }
  labels?: { men: string; women: string }
  unit?: '%' | 'h'
  max?: number
  /** Distance for half and quarter points; 5 and 15 by default. */
  near?: number
  far?: number
}

/** A single percentage estimate: one point within `near`, half within `far`. */
export interface EstimateQuestion extends Base {
  kind: 'estimate'
  label: string
  actual: number
  near: number
  far: number
}

export type ChapterQuestion = ChoiceQuestion | RowsQuestion | SlidersQuestion | EstimateQuestion

const PEW_SUPPORT = 'https://www.pewresearch.org/social-trends/2025/01/16/where-men-and-women-turn-for-emotional-support-and-social-connection/'
const PEW_REPORT = 'https://www.pewresearch.org/social-trends/2025/01/16/men-women-and-social-connections/'

export const LOVE_QUESTIONS: readonly ChapterQuestion[] = [
  {
    id: 'mw-age-attraction',
    kind: 'choice',
    short: 'Age and attraction',
    question: 'Are women really more attracted to older men?',
    prompt: 'Researchers analyzed 4,542 real blind dates. Which pattern did they find?',
    options: [
      { id: 'mirror', label: 'Men prefer younger partners; women prefer older partners' },
      { id: 'younger', label: 'Both are slightly more attracted to younger partners' },
      { id: 'same', label: 'Both prefer partners their own age' },
      { id: 'older', label: 'Both prefer older partners' },
    ],
    answer: 'younger',
    finding: 'On the date itself, men and women felt the same slight pull toward youth.',
    takeaway: 'Women said they would accept much older partners than men did. But once they actually met, a partner’s age shaped initial attraction in the same way for both.',
    visual: 'age',
    evidence: {
      citation: 'Eastwick, Finkel, Meza & Ammerman (2025), PNAS',
      url: 'https://doi.org/10.1073/pnas.2416984122',
      sample: '6,262 clients of a US matchmaking service, 4,542 blind dates and 9,084 post-date ratings (Oct 2023 – Jan 2024).',
      method: 'Each person rated their date after meeting. The researchers tested whether the partner’s age predicted attraction, and whether that differed for men and women. The tests were preregistered.',
      limitation: 'Initial attraction is not long-term relationship success, and the sample was matchmaking clients looking for a long-term partner.',
    },
  },
  {
    id: 'mw-looks-money',
    kind: 'choice',
    short: 'Looks and money',
    question: 'Do men care more about looks and women about money?',
    prompt: 'Across 97 studies, researchers examined how physical attractiveness and earning prospects related to romantic evaluations.',
    options: [
      { id: 'split', label: 'Men value looks more; women value earning potential more' },
      { id: 'looks', label: 'Looks matter more for both, with similar associations for men and women' },
      { id: 'money', label: 'Earning potential matters more for both' },
    ],
    answer: 'looks',
    finding: 'When people judged real partners, men and women were far more alike than their stated preferences.',
    takeaway: 'Asked in the abstract, men rate looks higher and women rate earnings higher. In actual romantic evaluations, the associations were about the same for both sexes.',
    visual: 'gauges',
    evidence: {
      citation: 'Eastwick, Luchies, Finkel & Hunt (2014), Psychological Bulletin',
      url: 'https://doi.org/10.1037/a0032432',
      sample: 'Meta-analysis of 97 samples from attraction and relationship studies.',
      method: 'Correlations (r) between a partner’s attractiveness or earning prospects and romantic evaluations. The sex difference in these correlations was about .03 and not significant in any test.',
      limitation: 'Romantic evaluations are not the same as long-term partner choice; income may matter more in other decisions. A 2025 study of 10,358 people in 43 countries found that matching one’s ideals across many traits does predict evaluations a little.',
    },
  },
  {
    id: 'mw-first-move',
    kind: 'choice',
    short: 'The first move',
    question: 'Does making the first move change who you find attractive?',
    prompt: 'At 15 speed-dating events, researchers changed one rule: who stayed seated and who moved from table to table.',
    options: [
      { id: 'women', label: 'Women remained significantly more selective' },
      { id: 'gone', label: 'The gender gap in selectivity was no longer significant' },
      { id: 'men', label: 'Men became significantly more selective than women' },
    ],
    answer: 'gone',
    finding: 'Changing a simple social convention changed the result.',
    takeaway: 'Whoever walked from table to table became less picky. The people moving felt more confident, and that confidence explained much of the effect.',
    visual: 'rotation',
    evidence: {
      citation: 'Finkel & Eastwick (2009), Psychological Science',
      url: 'https://doi.org/10.1111/j.1467-9280.2009.02439.x',
      sample: '350 speed daters at 15 heterosexual events: men rotated at 8, women at 7.',
      method: 'Researchers compared how many dates each person said yes to, depending on whether they rotated or sat.',
      limitation: 'A relatively small experiment. It shows conventions can shape selectivity, not that they explain every dating difference. We found no direct replication.',
    },
  },
  {
    id: 'mw-desire',
    kind: 'choice',
    short: 'Sexual desire',
    question: 'How different is sexual desire?',
    prompt: 'Researchers combined 211 studies involving more than 621,000 people.',
    options: [
      { id: 'vanishes', label: 'Men report higher desire, but the difference disappears after adjusting for reporting bias' },
      { id: 'remains', label: 'Men report higher desire, and a meaningful difference remains after adjustment' },
      { id: 'women', label: 'Women report higher desire after adjustment' },
    ],
    answer: 'remains',
    finding: 'The difference remains, but averages don’t tell the whole story.',
    takeaway: 'Even with a meaningful average difference, the two distributions overlap heavily. Many individual women report more desire than many individual men.',
    visual: 'curves',
    evidence: {
      citation: 'Frankenbach, Weber, Loschelder, Kilger & Friese (2022), Psychological Bulletin',
      url: 'https://doi.org/10.1037/bul0000366',
      sample: '211 studies, 856 effect sizes, 621,463 people.',
      method: 'Standardized mean difference g = 0.69 [0.58, 0.81]; adjusting for biased responding reduced it to g = 0.54. The overlap is our calculation, assuming normal distributions with equal spread.',
      limitation: 'The curves are illustrative, not observed population data. The study does not establish how much of the difference is biological or cultural.',
    },
  },
  {
    id: 'mw-singlehood',
    kind: 'rows',
    short: 'Being single',
    question: 'Who enjoys being single more?',
    prompt: 'A study of 5,941 single adults compared men and women on four measures. Who scored higher on each?',
    rows: [
      { id: 'status', label: 'Satisfaction with being single', answer: 'women', d: 0.30 },
      { id: 'life', label: 'Overall life satisfaction', answer: 'women', d: 0.11 },
      { id: 'sex', label: 'Sexual satisfaction', answer: 'women', d: 0.09 },
      { id: 'desire', label: 'Desire to find a partner', answer: 'men', d: 0.21 },
    ],
    finding: 'Single women were happier with single life. Single men wanted a partner more.',
    takeaway: 'The biggest gap was satisfaction with being single. The other differences were real but small.',
    visual: 'diverging',
    evidence: {
      citation: 'Hoan & MacDonald (2024), Social Psychological and Personality Science',
      url: 'https://doi.org/10.1177/19485506241287960',
      sample: '5,941 single adults (50% men, average age 32), published online 24 October 2024.',
      method: 'Bars show standardized differences (Cohen’s d) between single men and single women. All four were statistically significant.',
      limitation: 'It compares single men with single women. It does not show whether women are happier single than in a relationship.',
    },
  },
  {
    id: 'mw-support',
    kind: 'sliders',
    short: 'Emotional support',
    question: 'Do men and women rely equally on their romantic partners?',
    prompt: 'How many would be extremely or very likely to turn to their partner for emotional support?',
    scenario: 'Imagine 100 men and 100 women with romantic partners.',
    actual: { men: 74, women: 74 },
    sources: [
      { label: 'Romantic partner', men: 74, women: 74 },
      { label: 'Mother', men: 42, women: 54 },
      { label: 'A friend', men: 38, women: 54 },
      { label: 'Other family member', men: 26, women: 44 },
      { label: 'Father', men: 27, women: 30 },
      { label: 'Mental health professional', men: 16, women: 22 },
    ],
    finding: 'Exactly the same: 74% of men and 74% of women.',
    takeaway: 'The difference is everywhere else. Women are more willing to turn to mothers, friends and other family.',
    visual: 'dumbbell',
    evidence: {
      citation: 'Pew Research Center (16 January 2025), “Men, Women and Social Connections”',
      url: PEW_SUPPORT,
      sample: 'Nationally representative survey of 6,204 US adults, 3–15 September 2024.',
      method: 'Shares saying they would be extremely or very likely to turn to each source if they needed emotional support.',
      limitation: 'These are stated intentions, not observed behaviour. Partner, parent and family figures exclude people for whom that relationship doesn’t apply.',
    },
  },
  {
    id: 'mw-loneliness',
    kind: 'choice',
    short: 'Loneliness',
    question: 'Is loneliness really a gender problem?',
    prompt: 'Among US adults, which divides people more on feeling lonely or isolated all or most of the time?',
    options: [
      { id: 'gender', label: 'Gender' },
      { id: 'age', label: 'Age' },
      { id: 'equal', label: 'Both show about equal differences' },
    ],
    answer: 'age',
    finding: 'Younger adults reported frequent loneliness more than twice as often as older adults.',
    takeaway: 'Men and women reported it at almost the same rate. Different ways of seeking support don’t necessarily mean different emotional outcomes.',
    visual: 'grids',
    evidence: {
      citation: 'Pew Research Center (16 January 2025), “Men, Women and Social Connections”',
      url: PEW_REPORT,
      sample: 'Nationally representative survey of 6,204 US adults, 3–15 September 2024.',
      method: 'Share saying they feel lonely or isolated all or most of the time: under 50, 22%; 50 and older, 9%; men, 16%; women, 15%. Pew reports no significant gender difference in any age group.',
      limitation: 'A snapshot of American adults, not evidence of how loneliness changes as individuals age.',
    },
  },
]

export const LOVE_CHAPTER = {
  id: 'love-attraction',
  title: 'Love, attraction & relationships',
  description: 'Think you understand love, dating and relationships? Put your assumptions to the test.',
  minutes: 5,
}

