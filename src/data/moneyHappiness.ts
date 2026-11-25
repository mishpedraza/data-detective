// "What actually makes us happy?" Figures checked against the cited sources; see the PR's source audit (and /home/ubuntu/mh/audit.md during the build).
import type { ChapterQuestion } from './menWomen'

/** Nature Communications (2026): share of 109 countries where income rank beat absolute income, and the two moderators. */
export const RANK = { countries: 109, people: '90,000', share: 80, materialism: 3, civic: 80 } as const
/** Bradshaw et al. (2023): meta-analytic correlations with well-being. */
export const ASPIRATIONS = { intrinsic: 0.24, extrinsic: 0.02, predominance: -0.22 } as const
/** World Happiness Report 2026: under-25 life evaluations, 2023–2025 vs 2006–2010. */
export const YOUTH = { higher: 85, countries: 136, nanzDrop: 0.86 } as const
/** Holiday destinations for the unscored choice exercise in Q9. */
export const DESTINATIONS = [
  'Lisbon', 'Kyoto', 'Cape Town', 'Reykjavík', 'Marrakech', 'Buenos Aires', 'Hanoi', 'Santorini',
  'Vancouver', 'Istanbul', 'Bali', 'Edinburgh', 'Oaxaca', 'Zanzibar', 'Dubrovnik', 'Queenstown',
] as const

export const MH_QUESTIONS: readonly ChapterQuestion[] = [
  {
    id: 'mh-income', kind: 'choice', short: 'Income ceiling',
    question: 'At what income does money stop buying happiness?',
    prompt: 'You may have heard that earning more stops making people happier at about $75,000 a year. What does the latest research suggest?',
    options: [
      { id: '75k', label: 'Happiness stops increasing at about $75,000' },
      { id: '100k', label: 'Happiness stops increasing at about $100,000' },
      { id: 'none', label: 'There is no universal income ceiling' },
      { id: 'nothing', label: 'Income has virtually no relationship with happiness' },
    ],
    answer: 'none',
    finding: 'There is no universal ceiling. Only the least happy people hit a plateau.',
    takeaway: 'For most people, everyday happiness kept rising with income, and for the happiest it rose fastest at the top. These are U.S. figures for emotional well-being, which is different from how people rate their lives overall.',
    visual: 'ceiling',
    evidence: {
      citation: 'Killingsworth, Kahneman & Mellers (2023), PNAS',
      url: 'https://doi.org/10.1073/pnas.2208661120',
      sample: 'U.S. adults reporting how they felt at random moments (experience sampling).',
      method: 'An adversarial collaboration that reanalysed the data by level of happiness. Measure: momentary emotional well-being against household income.',
      limitation: 'United States only, and about feelings in the moment rather than overall life satisfaction. A 2025 study of 2.05 million U.S. adults also found stress becomes more common above about $63,000.',
      more: [{ citation: 'Akkiraju & Rao (2025), Communications Psychology', url: 'https://doi.org/10.1038/s44271-025-00210-z' }],
    },
  },
  {
    id: 'mh-rank', kind: 'estimate', short: 'Income rank',
    question: 'Is it what you earn, or where you rank?',
    prompt: 'Researchers compared two things in 109 countries: how much people earn, and where their income ranks among others in their country. In what share of countries was rank more strongly linked to well-being?',
    label: 'Share of the 109 countries',
    actual: RANK.share, near: 5, far: 15,
    finding: 'About 80%. In four out of five countries, rank mattered more than the amount.',
    takeaway: 'Life satisfaction tracked where people stood compared with others in their country more closely than their actual income. These are associations from a survey, not an experiment, so they do not mean that earning less among poorer neighbours would make anyone happier.',
    visual: 'rank',
    evidence: {
      citation: 'Social status and the relationship between income rank and well-being in 109 nations (2026), Nature Communications',
      url: 'https://doi.org/10.1038/s41467-026-69729-x',
      sample: 'More than 90,000 people in 109 countries, Gallup World Poll 2023–2024.',
      method: 'Compared absolute income, income rank within the country and relative deprivation as predictors of life evaluations, then tested national materialism and civic engagement as moderators.',
      limitation: 'Cross-sectional and correlational. Rank effects were over three times larger in the most materialistic countries and about 80% smaller where civic engagement was highest.',
    },
  },
  {
    id: 'mh-aspirations', kind: 'choice', short: 'Life goals',
    question: 'Which life goals go with greater well-being?',
    prompt: 'Some people mostly aim for wealth, fame and good looks. Others mostly aim for personal growth, close relationships and helping their community. Which aims are linked to higher well-being?',
    options: [
      { id: 'extrinsic', label: 'Wealth, fame and good looks' },
      { id: 'intrinsic', label: 'Growth, relationships and community' },
      { id: 'both', label: 'Both, about equally' },
      { id: 'neither', label: 'Neither makes a difference' },
    ],
    answer: 'intrinsic',
    finding: 'Growth, relationships and community: these goals had a clear positive link.',
    takeaway: 'Wanting money or status was not harmful on its own: overall, those goals had almost no link with well-being. The negative link appeared when they outweighed the other goals. These are correlations about what people value, not about what they achieve.',
    visual: 'ambition',
    evidence: {
      citation: 'Bradshaw et al. (2023), Journal of Personality and Social Psychology',
      url: 'https://doi.org/10.1037/pspp0000431',
      sample: '105 studies in 92 reports, 1,808 effects, 70,110 participants.',
      method: 'Meta-analysis of correlations between valuing or pursuing intrinsic and extrinsic aspirations and well-being. Intrinsic r = 0.24, extrinsic r = 0.02 (not significant), extrinsic outweighing intrinsic r = −0.22.',
      limitation: 'Correlations, not causes. Measures valuing or pursuing goals, not attaining them.',
    },
  },
  {
    id: 'mh-youth', kind: 'choice', short: 'Young adults',
    question: 'Are young people less happy than they used to be?',
    prompt: 'The World Happiness Report compared how people under 25 rated their lives in 2023–2025 with 2006–2010, in 136 countries. What did it find?',
    options: [
      { id: 'down', label: 'Lower in most countries' },
      { id: 'mixed', label: 'Higher in most countries, but lower in a few regions' },
      { id: 'same', label: 'About the same almost everywhere' },
    ],
    answer: 'mixed',
    finding: 'Higher in 85 of 136 countries, but sharply lower in North America, Australia and New Zealand.',
    takeaway: 'Under-25s in the United States, Canada, Australia and New Zealand rated their lives 0.86 points lower on a 0–10 scale. Young people in Western Europe also fell. Elsewhere, most young people rated their lives higher than 15 years earlier.',
    visual: 'youth',
    evidence: {
      citation: 'World Happiness Report 2026, International evidence on happiness and social media',
      url: 'https://www.worldhappiness.report/ed/2026/international-evidence-on-happiness-and-social-media/',
      sample: 'Gallup World Poll respondents under 25 in 136 countries.',
      method: 'Compared average life evaluations (0–10 ladder) in 2006–2010 and 2023–2025.',
      limitation: 'Compares different young people in two periods, so it separates neither age from cohort nor causes. Life evaluation is different from day-to-day mood or mental health.',
    },
  },
  {
    id: 'mh-giving', kind: 'choice', short: 'Spending',
    question: 'Should you spend it on yourself?',
    prompt: 'You are given €20 to spend today. In experiments like this, which choice tended to leave people feeling happier afterwards?',
    options: [
      { id: 'self', label: 'Spending it on yourself' },
      { id: 'other', label: 'Spending it on someone else' },
      { id: 'same', label: 'Either, about the same' },
    ],
    answer: 'other',
    finding: 'Spending it on someone else, especially when giving felt freely chosen.',
    takeaway: 'Across preregistered experiments, spending on others tended to lift people’s mood more than spending on themselves. The boost was more likely when people chose to give and could see the difference they made. It is about short-term emotions, not lasting life satisfaction.',
    visual: 'giving',
    evidence: {
      citation: 'Aknin, Dunn, Whillans et al. (2022), Current Directions in Psychological Science',
      url: 'https://doi.org/10.1177/09637214221121100',
      more: [
        { citation: 'Chen et al. (2023), Scandinavian Journal of Psychology', url: 'https://doi.org/10.1111/sjop.12948' },
        { citation: 'Kim et al. (2022), PLOS ONE replication', url: 'https://doi.org/10.1371/journal.pone.0272434' },
      ],
      sample: 'All 15 published preregistered experiments on prosocial spending, plus a 2023 systematic review of 14 studies.',
      method: 'Reviews of randomised experiments that assigned people to spend money on themselves or on others.',
      limitation: 'The evidence is somewhat mixed: a 2022 replication with 133 people found no difference on the original measure but an effect on a direct happiness question. Measures short-term emotions.',
    },
  },
  {
    id: 'mh-choice', kind: 'choice', short: 'More choice',
    question: 'Does having more choices make us happier?',
    prompt: 'What can happen when people are given more options to choose from?',
    warmup: { kind: 'holiday', prompt: 'First, try it. Pick a holiday from a short list, then from a long one.' },
    options: [
      { id: 'more-more', label: 'They enjoy choosing more and value their selection more' },
      { id: 'less-less', label: 'They enjoy choosing less and value their selection less' },
      { id: 'less-more', label: 'They enjoy choosing less but value their selection more' },
      { id: 'more-less', label: 'They enjoy choosing more but value their selection less' },
    ],
    answer: 'less-more',
    finding: 'Choosing feels worse, but the pick feels more valuable.',
    takeaway: 'In 2025 experiments, choosing felt most pleasant and in control with about four options, and more options felt like more effort. Separate 2024 experiments found people valued what they picked more when it came from a larger set. Enjoying a decision, valuing its result and being happy overall are three different things.',
    visual: 'choiceset',
    evidence: {
      citation: 'Schwarz (2025), Current Research in Behavioral Sciences',
      url: 'https://doi.org/10.1016/j.crbeha.2025.100174',
      more: [
        { citation: 'Chan et al. (2024), Psychology & Marketing', url: 'https://doi.org/10.1002/mar.22150' },
        { citation: 'Srivastava et al. (2024), International Journal of Consumer Studies', url: 'https://doi.org/10.1111/ijcs.13029' },
      ],
      sample: 'Two separate sets of experiments: one on how choosing feels, four on how people value the option they picked. A 2024 review covers 92 articles.',
      method: 'Varied the number of options and measured pleasantness, sense of control and effort (2025), or the value placed on the chosen option (2024).',
      limitation: 'The two effects come from different studies, not one experiment. Whether more choice helps depends on how complex the options are, whether people already know what they like and how much the decision matters.',
    },
  },
]

export const MH_CHAPTER = {
  id: 'what-makes-us-happy',
  title: 'What actually makes us happy?',
  summary: 'Money, status, giving and choice. Do the things we chase actually make us happier?',
  minutes: 5,
  scoring: 'One point per question. Income rank: 1 point within 5 points of the real share, ½ within 15.',
}
