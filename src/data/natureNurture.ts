// "Nature, nurture & society", chapter 3 of Men & Women. Figures are checked against the cited source; see the evidence notes.
import type { ChapterQuestion } from './menWomen'

/** Greenberg et al. (2023): countries by the sex difference on the English Eyes Test. */
export const EYES_COUNTRIES = { total: 57, women: 36, none: 21, men: 0 } as const

/** Atari, Lai & Dehghani (2020), Table 1 (Study 1, model 2): women minus men, in points on the 0–5 Moral Foundations scale. */
export const MORAL_GAPS = [
  { id: 'care', label: 'Care', detail: 'avoiding harm', gap: 0.45 },
  { id: 'purity', label: 'Purity', detail: 'sanctity, disgust', gap: 0.20 },
  { id: 'fairness', label: 'Fairness', detail: 'justice, rights', gap: 0.17 },
  { id: 'loyalty', label: 'Loyalty', detail: 'to the group', gap: 0.03 },
  { id: 'authority', label: 'Authority', detail: 'respect, tradition', gap: 0.003 },
] as const

/** Caviola et al. (2026): standardized sex differences in maths (positive favours boys). */
export const MATHS_GAPS = [
  { id: 'all', label: 'All 440 studies', d: 0.08 },
  { id: 'broad', label: 'Later grades, broad maths', d: 0.26 },
  { id: 'geometry', label: 'Later grades, geometry', d: 0.54 },
] as const

export const NATURE_QUESTIONS: readonly ChapterQuestion[] = [
  {
    id: 'nn-eyes',
    kind: 'choice',
    short: 'Reading eyes',
    question: 'Are women better at reading what others feel?',
    prompt: 'More than 300,000 people took the “Reading the Mind in the Eyes” test: look at a photo of someone’s eyes and pick the word for what they’re thinking or feeling. Researchers compared men and women in 57 countries. In how many did women score significantly higher?',
    options: [
      { id: '8', label: '8' },
      { id: '21', label: '21' },
      { id: '36', label: '36' },
      { id: '57', label: 'All 57' },
    ],
    answer: '36',
    finding: '36 of 57 countries. And in not one did men score significantly higher.',
    takeaway: 'In the other 21 countries the difference wasn’t significant. The average female advantage was small but appeared at every age. The test measures recognising what others think or feel, not sharing their feelings or wanting to help.',
    visual: 'eyes',
    evidence: {
      citation: 'Greenberg et al. (2023), PNAS',
      url: 'https://doi.org/10.1073/pnas.2022385119',
      sample: '312,739 people in four datasets. The country comparison used the largest one (305,726 people), with samples from 112 people (Vietnam) to 176,402 (United States).',
      method: 'English version of the Eyes Test, a measure of “theory of mind” or cognitive empathy. Bayesian multilevel models, controlling for age.',
      limitation: 'Online volunteers taking the English version, so fluency may matter outside English-speaking countries. A December 2025 correction concerns only a reliability statistic, not these results.',
    },
  },
  {
    id: 'nn-maths',
    kind: 'choice',
    short: 'Maths',
    question: 'Are men naturally better at maths?',
    prompt: 'A 2026 meta-analysis pooled 440 studies of maths performance covering more than 15 million students. What did it find?',
    options: [
      { id: 'men', label: 'Boys and men do substantially better' },
      { id: 'women', label: 'Girls and women do substantially better' },
      { id: 'similar', label: 'Average performance is remarkably similar' },
    ],
    answer: 'similar',
    finding: 'Remarkably similar. The average gap was just 0.08 standard deviations.',
    takeaway: 'That small gap favours boys and is dwarfed by differences among boys and among girls. It grows in later school years, most in geometry, and was larger in more gender-equal countries. Test scores alone can’t show whether any gap is natural, or explain career choices.',
    visual: 'maths',
    evidence: {
      citation: 'Caviola et al. (2026), Educational Psychology Review',
      url: 'https://doi.org/10.1007/s10648-026-10125-8',
      sample: '440 studies with 1,210 effect sizes and more than 15 million participants.',
      method: 'Random-effects multilevel meta-analysis of standardized differences (Cohen’s d): overall 0.08, later-grade broad maths 0.26, later-grade geometry 0.54. An earlier meta-analysis of 242 studies (Lindberg et al., 2010) found 0.05.',
      limitation: 'Averages across very different tests, ages and countries. It doesn’t describe the very top scorers, and the curves here are illustrative.',
    },
  },
  {
    id: 'nn-moral',
    kind: 'choice',
    short: 'Morality',
    question: 'Do men and women have different moral values?',
    prompt: 'People in 67 countries rated how much different things matter when they judge right and wrong. Which value showed the biggest average gap between men and women?',
    options: [
      { id: 'care', label: 'Care: preventing harm' },
      { id: 'fairness', label: 'Fairness' },
      { id: 'loyalty', label: 'Loyalty' },
      { id: 'authority', label: 'Respect for authority' },
    ],
    answer: 'care',
    finding: 'Care. Women rated preventing harm higher, by less than half a point out of five.',
    takeaway: 'Women also rated fairness and purity slightly higher. Loyalty and authority barely differed and varied from country to country. The gaps were larger in more individualist, gender-equal countries. These are values people report, not how they behave, and they don’t make either sex more moral.',
    visual: 'moral',
    evidence: {
      citation: 'Atari, Lai & Dehghani (2020), Proceedings of the Royal Society B',
      url: 'https://doi.org/10.1098/rspb.2020.1201',
      sample: 'Study 1: 336,691 people in 67 countries. Study 2: 11,969 people in 19 countries largely replicated it.',
      method: 'Moral Foundations Questionnaire, multilevel models. Average gaps on its 0–5 scale: Care 0.45, Purity 0.20, Fairness 0.17, Loyalty 0.03, Authority 0.003.',
      limitation: 'Online volunteers answering a questionnaire. The gaps are in self-reported values, not in moral behaviour.',
    },
  },
  {
    id: 'nn-paradox',
    kind: 'choice',
    short: 'Equality',
    question: 'Does more gender equality make men and women more different?',
    prompt: 'Some studies found bigger gender differences in more gender-equal countries, for example in who studies science and engineering. What can we conclude from that pattern?',
    options: [
      { id: 'cause', label: 'Equality causes men and women to choose more differently' },
      { id: 'other', label: 'Culture and how countries are compared could explain it' },
      { id: 'biology', label: 'It proves career preferences are biological' },
    ],
    answer: 'other',
    finding: 'Culture and how countries are compared could explain it.',
    takeaway: 'A 2025 reanalysis of several of these studies found the link shrank, vanished or reversed when countries were compared within cultural regions, and that data quality predicted the gaps as well as equality did. That doesn’t disprove every version of the “paradox”, but a pattern across countries can’t show cause, let alone biology.',
    visual: 'paradox',
    evidence: {
      citation: 'Berggren & Bergh (2025), PNAS',
      url: 'https://doi.org/10.1073/pnas.2422247122',
      sample: 'Country-level data from multiple published gender-equality-paradox studies, plus newly analysed data.',
      method: 'Regressions of country gender differences on gender equality, with and without controls for cultural region and data quality. The best-known STEM study is Stoet & Geary (2018), corrected in 2019 to clarify that it measures a relative “propensity” to graduate in STEM.',
      limitation: 'Both the original studies and the reanalysis compare countries, so neither can identify what drives individual choices.',
    },
  },
]

export const NATURE_CHAPTER = {
  id: 'nature-nurture-society',
  title: 'Nature, nurture & society',
  summary: 'How much of what makes men and women different is really universal?',
  minutes: 4,
  scoring: 'One point per question.',
}
