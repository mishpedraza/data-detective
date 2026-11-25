// "What actually helps us live longer?" Every figure is checked against the cited source; see the PR's source audit.
import type { ChapterQuestion } from './menWomen'

type Ci = readonly [number, number]

/** Weeldreyer et al. (2025): all-cause mortality hazard ratios against fit people of normal weight. */
export const FIT_FAT = [
  { id: 'nf', bmi: 'Normal weight', fit: true, hr: 1, ci: undefined },
  { id: 'of', bmi: 'Overweight', fit: true, hr: 0.96, ci: [0.61, 1.5] as Ci },
  { id: 'bf', bmi: 'Obesity', fit: true, hr: 1.11, ci: [0.88, 1.4] as Ci },
  { id: 'nu', bmi: 'Normal weight', fit: false, hr: 1.92, ci: [1.43, 2.57] as Ci },
  { id: 'ou', bmi: 'Overweight', fit: false, hr: 1.82, ci: [1.47, 2.24] as Ci },
  { id: 'bu', bmi: 'Obesity', fit: false, hr: 2.04, ci: [1.54, 2.71] as Ci },
] as const
/** Windred et al. (2024): most vs least regular fifth of sleepers. */
export const SLEEP = { people: 60_977, full: { hr: 0.7, ci: [0.59, 0.83] as Ci }, minimal: { hr: 0.52, ci: [0.45, 0.6] as Ci } } as const
/** Illustrative weeks: bedtime and hours asleep, both averaging 8 hours. */
export const SLEEP_WEEKS = {
  regular: [[23, 8], [23, 8], [23, 8], [23, 8], [23, 8], [23, 8], [23, 8]],
  irregular: [[22, 9], [1, 6], [23.5, 8], [21.5, 10], [2, 6.5], [0.5, 7], [22.5, 9.5]],
} as const
/** Kim et al. (2025): relative risk of dying against inactive people; Lu et al. (2026): direct comparison. */
export const WARRIOR = { weekend: { rr: 0.76, ci: [0.66, 0.87] as Ci }, regular: { rr: 0.71, ci: [0.63, 0.8] as Ci }, direct: { hr: 1.019, ci: [0.851, 1.221] as Ci, people: 452_513 } } as const
/** Stamatakis et al. (2022): non-exercisers' all-cause mortality against no bursts. */
export const BURSTS = { people: 25_241, deaths: 852, years: 6.9, few: [24, 26], median: [38, 40], minutes: 4.4, minutesCut: [26, 30] } as const
/** Paluch et al. (2022): median steps in each quarter of participants and the hazard ratio against the lowest. */
export const STEPS = [
  { steps: 3553, hr: 1 },
  { steps: 5801, hr: 0.6, ci: [0.51, 0.71] as Ci },
  { steps: 7842, hr: 0.55, ci: [0.49, 0.62] as Ci },
  { steps: 10_901, hr: 0.47, ci: [0.39, 0.57] as Ci },
] as const
/** Ding et al. (2025): 7,000 vs 2,000 steps a day. */
export const STEPS_7K = { hr: 0.53, ci: [0.46, 0.6] as Ci } as const
/** Loftfield et al. (2024): daily multivitamin users vs non-users. */
export const VITAMINS = { people: 390_124, deaths: 164_762, years: 27, early: { hr: 1.04, ci: [1.02, 1.07] as Ci }, late: { hr: 1.04, ci: [0.99, 1.08] as Ci }, smokers: { users: 11.0, non: 13.0 } } as const
/** Zhao et al. (2023), Table 2: relative risk against lifetime non-drinkers, unadjusted and fully adjusted. */
export const ALCOHOL = [
  { id: 'occasional', label: 'Occasional', grams: 'under 1.3 g a day', raw: { rr: 0.92, ci: [0.84, 1.01] as Ci }, adjusted: { rr: 0.96, ci: [0.86, 1.06] as Ci } },
  { id: 'low', label: 'Low', grams: '1.3–24 g', raw: { rr: 0.85, ci: [0.81, 0.88] as Ci }, adjusted: { rr: 0.93, ci: [0.85, 1.01] as Ci } },
  { id: 'medium', label: 'Medium', grams: '25–44 g', raw: { rr: 1.02, ci: [0.96, 1.08] as Ci }, adjusted: { rr: 1.05, ci: [0.96, 1.14] as Ci } },
  { id: 'high', label: 'High', grams: '45–64 g', raw: { rr: 1.07, ci: [0.99, 1.16] as Ci }, adjusted: { rr: 1.19, ci: [1.07, 1.32] as Ci } },
  { id: 'higher', label: 'Higher', grams: '65 g or more', raw: { rr: 1.35, ci: [1.26, 1.46] as Ci }, adjusted: { rr: 1.35, ci: [1.23, 1.47] as Ci } },
] as const

export const HEALTH_QUESTIONS: readonly ChapterQuestion[] = [
  {
    id: 'hl-fitfat', kind: 'choice', short: 'Fit or thin',
    question: 'Who is more likely to live longer: a fit person with obesity or an unfit person of normal weight?',
    prompt: 'Researchers pooled studies that measured fitness on a treadmill or bike test and followed people for years. Compared with fit people of normal weight, which group had the higher risk of dying?',
    options: [
      { id: 'obese', label: 'Fit people with obesity' },
      { id: 'unfit', label: 'Unfit people of normal weight' },
      { id: 'same', label: 'Both about the same' },
    ],
    answer: 'unfit',
    finding: 'Unfit people of normal weight: about twice the risk, while fit people with obesity showed no clear difference.',
    takeaway: 'In every weight group, low fitness went with roughly double the risk. Fitness doesn’t erase every risk linked to obesity, and these are group averages from observational studies, not anyone’s life expectancy.',
    visual: 'fitfat',
    evidence: {
      citation: 'Weeldreyer et al. (2025), British Journal of Sports Medicine',
      url: 'https://doi.org/10.1136/bjsports-2024-108748',
      sample: '20 prospective cohort studies with 398,716 observations, published 1980–2023.',
      method: 'Fitness measured with a maximal exercise test and BMI measured directly. Hazard ratios for death from any cause, against fit people of normal weight. Fit with obesity: 1.11 (95% CI 0.88–1.40). Unfit, normal weight: 1.92 (1.43–2.57).',
      limitation: 'Observational: fitter people may differ in other ways. Most studies were from the US and Europe, with more men than women. BMI is a rough measure of body fat.',
    },
  },
  {
    id: 'hl-sleep', kind: 'choice', short: 'Sleep regularity',
    question: 'What matters more for longevity: how long you sleep, or how regularly?',
    prompt: 'Two people both average eight hours a night. One goes to bed and wakes at the same time every day; the other’s timing changes from night to night. In a study of 60,977 people wearing activity trackers, which predicted risk of dying more strongly?',
    options: [
      { id: 'duration', label: 'How long people slept' },
      { id: 'regular', label: 'How regular their sleep was' },
      { id: 'same', label: 'Both about equally' },
    ],
    answer: 'regular',
    finding: 'Regularity. The most regular sleepers had about 30% lower risk than the least regular.',
    takeaway: 'Regularity predicted risk better than duration, even after accounting for activity, income, smoking and shift work. That doesn’t make short sleep healthy: duration still mattered, with the lowest risk around the middle.',
    visual: 'sleepweek',
    evidence: {
      citation: 'Windred et al. (2024), Sleep',
      url: 'https://doi.org/10.1093/sleep/zsad253',
      sample: '60,977 UK Biobank participants (average age 63) who wore a wrist accelerometer for a week, followed for about 6 years; 1,859 died.',
      method: 'A sleep regularity score from more than 10 million hours of recordings. Most vs least regular fifth: hazard ratio 0.70 (95% CI 0.59–0.83) in the fully adjusted model, 0.52 adjusting only for age, sex and ethnicity.',
      limitation: 'One week of sleep, in older, mostly white UK adults. Observational: illness can disrupt sleep, not only the other way round. The two weeks shown here are illustrations.',
    },
  },
  {
    id: 'hl-warrior', kind: 'choice', short: 'Weekend warriors',
    question: 'Is exercising only at the weekend as good as exercising through the week?',
    prompt: 'Both weeks below add up to the same 150 minutes. Compared with inactive people, does squeezing the activity into one or two days substantially reduce its benefit?',
    options: [
      { id: 'much', label: 'Yes, much smaller benefit' },
      { id: 'similar', label: 'No, a similar benefit' },
      { id: 'none', label: 'It brings no benefit at all' },
    ],
    answer: 'similar',
    finding: 'A similar benefit. Weekend warriors had 24% lower risk of dying; regularly active people, 29%.',
    takeaway: 'Both patterns were linked to lower risk of heart disease and cancer deaths too. The few studies that compared the two directly found no clear difference, but that evidence is thin, so they aren’t proven equivalent. The total amount and intensity seem to matter most.',
    visual: 'warrior',
    evidence: {
      citation: 'Kim et al. (2025), Public Health',
      url: 'https://doi.org/10.1016/j.puhe.2025.105977',
      more: [
        { citation: 'Lu et al. (2026), Journal of Science and Medicine in Sport', url: 'https://doi.org/10.1016/j.jsams.2026.10.004' },
        { citation: 'Zhang et al. (2025), BMC Public Health', url: 'https://doi.org/10.1186/s12889-025-25062-4' },
      ],
      sample: '18 publications (8 cohorts) for the main review; three direct comparisons covering 452,513 people for the second.',
      method: 'Against inactive people: weekend warriors RR 0.76 (95% CI 0.66–0.87), regularly active RR 0.71 (0.63–0.80). Weekend warriors vs regularly active: HR 1.02 (0.85–1.22), rated very low certainty.',
      limitation: 'Mostly self-reported activity, and studies defined the patterns differently. The open abstracts don’t say whether total activity was matched. The calendars are illustrations.',
    },
  },
  {
    id: 'hl-bursts', kind: 'choice', short: 'Short bursts',
    question: 'Can a few minutes of vigorous activity a day make a difference?',
    prompt: 'Among people who said they never exercised, trackers picked up short bursts of vigorous everyday activity: rushing up stairs, walking fast uphill, carrying heavy shopping. What went with three bursts of 1–2 minutes a day?',
    options: [
      { id: 'none', label: 'No measurable difference' },
      { id: 'small', label: 'About 5% lower risk of dying' },
      { id: 'large', label: 'About 40% lower risk of dying' },
    ],
    answer: 'large',
    finding: 'About 40% lower risk of dying over the next seven years, compared with no bursts.',
    takeaway: 'Even fewer than two bursts a day went with about a quarter lower risk. Activity doesn’t only count as a workout. But this is one observational study, so it doesn’t prove the bursts caused the difference, and it doesn’t replace other exercise advice.',
    visual: 'bursts',
    evidence: {
      citation: 'Stamatakis et al. (2022), Nature Medicine',
      url: 'https://doi.org/10.1038/s41591-022-02100-x',
      more: [{ citation: 'Koemel et al. (2026), International Journal of Behavioral Nutrition and Physical Activity', url: 'https://doi.org/10.1186/s12966-026-01876-2' }],
      sample: '25,241 UK Biobank adults (average age 62) who reported no leisure exercise, followed for 6.9 years; 852 died.',
      method: 'A week of wrist tracker data. Three bursts a day: 38–40% lower all-cause and cancer mortality, 48–49% lower heart disease mortality. 4.4 minutes a day: 26–30% lower. A 2026 US study found a similar pattern.',
      limitation: 'Observational, one week of tracking, older UK adults. The day shown is an illustration.',
    },
  },
  {
    id: 'hl-steps', kind: 'choice', short: '10,000 steps',
    question: 'Do we really need 10,000 steps a day?',
    prompt: 'Large studies with step counters followed people for years. Where did the benefit of extra steps start to level off?',
    options: [
      { id: 'three', label: 'Around 3,000 steps' },
      { id: 'seven', label: 'Around 5,000–7,000 steps' },
      { id: 'ten', label: 'Around 10,000 steps' },
      { id: 'never', label: 'It never levels off' },
    ],
    answer: 'seven',
    finding: 'Around 5,000–7,000 steps. Most of the benefit came well before 10,000.',
    takeaway: '7,000 steps went with about half the risk of dying of 2,000 steps. More steps still helped a little, and the curve flattened later for adults under 60, at about 8,000–10,000. There is no single magic number: 10,000 began as a marketing slogan.',
    visual: 'steps',
    evidence: {
      citation: 'Ding et al. (2025), The Lancet Public Health',
      url: 'https://doi.org/10.1016/S2468-2667(25)00164-1',
      more: [{ citation: 'Paluch et al. (2022), The Lancet Public Health', url: 'https://doi.org/10.1016/S2468-2667(21)00302-9' }],
      sample: '57 studies from 35 cohorts; the curve shown is from 15 cohorts with 47,471 adults.',
      method: 'For all-cause mortality the benefit levelled off at about 5,000–7,000 steps. 7,000 vs 2,000 steps: HR 0.53 (95% CI 0.46–0.60). By quarter of steps, against the lowest (about 3,550): 0.60, 0.55 and 0.47.',
      limitation: 'Observational: healthier people can walk more. Studies used different devices and populations. Other outcomes, like heart disease deaths, kept improving with more steps.',
    },
  },
  {
    id: 'hl-vitamins', kind: 'choice', short: 'Multivitamins',
    question: 'Does a daily multivitamin help you live longer?',
    prompt: 'Almost 400,000 healthy US adults were followed for up to 27 years. Compared with people who didn’t take them, how likely were daily multivitamin users to die during follow-up?',
    options: [
      { id: 'less', label: 'Less likely' },
      { id: 'same', label: 'About as likely, or slightly more' },
      { id: 'more', label: 'Much more likely' },
    ],
    answer: 'same',
    finding: 'About as likely, or slightly more: 4% higher risk early on, and no clear difference later.',
    takeaway: 'This is despite users looking healthier on paper: fewer smoked and more had a degree. It’s about general use by healthy adults, not treating a diagnosed deficiency or advice from a doctor, such as folic acid in pregnancy.',
    visual: 'vitamins',
    evidence: {
      citation: 'Loftfield et al. (2024), JAMA Network Open',
      url: 'https://doi.org/10.1001/jamanetworkopen.2024.18729',
      sample: '390,124 adults without cancer or chronic disease in three US cohorts; 164,762 died during follow-up.',
      method: 'Multivitamin use reported at two points, with extensive adjustment for lifestyle. Daily users vs non-users: HR 1.04 (95% CI 1.02–1.07) in the first half of follow-up, 1.04 (0.99–1.08) in the second.',
      limitation: 'Self-reported use, mostly white participants, and observational. Trials have looked at other outcomes, such as memory, which aren’t the same as living longer.',
    },
  },
  {
    id: 'hl-alcohol', kind: 'choice', short: 'Alcohol',
    question: 'Is a small amount of alcohol actually good for longevity?',
    prompt: 'Many studies found that light drinkers outlived non-drinkers. But “non-drinkers” often included people who quit because they were ill. After separating out former drinkers and other biases, which shape best fits?',
    options: [
      { id: 'j', label: 'Light drinkers still live longest' },
      { id: 'flat', label: 'No clear benefit, then risk rises' },
      { id: 'line', label: 'Risk rises steeply from the first drink' },
    ],
    answer: 'flat',
    finding: 'No clear benefit at low levels; risk rises with heavier drinking, sooner for women.',
    takeaway: 'Comparing with lifetime non-drinkers, the apparent benefit shrank until it was no longer significant. No significant difference isn’t proof that a level is safe: a 2026 Korean study found even light drinkers had 15% higher risk than occasional ones, and alcohol is linked to cancer.',
    visual: 'alcohol',
    evidence: {
      citation: 'Zhao et al. (2023), JAMA Network Open',
      url: 'https://doi.org/10.1001/jamanetworkopen.2023.6185',
      more: [{ citation: 'Heo et al. (2026), Addiction', url: 'https://doi.org/10.1111/add.70704' }],
      sample: '107 cohort studies with 4,838,825 people and 425,564 deaths, published 1980–2021.',
      method: 'Relative risk of dying against lifetime non-drinkers. Low volume (1.3–24 g a day): 0.85 unadjusted, 0.93 (95% CI 0.85–1.01) after adjusting for former-drinker bias and study quality. 45–64 g: 1.19; 65 g or more: 1.35. For women, risk rose from 25 g.',
      limitation: 'Observational studies of self-reported drinking. All-cause mortality only; heart disease and cancer risks differ. A standard drink is roughly 10–14 g.',
    },
  },
]

export const HEALTH_CHAPTER = {
  id: 'live-longer',
  title: 'What actually helps us live longer?',
  description: 'Exercise, sleep and everyday habits. How much of what we believe about living longer is actually true?',
  summary: 'Exercise, sleep and everyday habits. How much of what we believe about living longer is actually true?',
  minutes: 6,
  scoring: 'One point per prediction. This quiz is educational, not a health assessment or medical advice.',
} as const
