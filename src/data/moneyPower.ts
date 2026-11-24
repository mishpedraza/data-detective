// "Money, ambition & power", chapter 2 of Men & Women. Figures are checked against the cited source; see the evidence notes.
import type { ChapterQuestion } from './menWomen'

const PEW_BREADWINNERS = 'https://www.pewresearch.org/social-trends/wp-content/uploads/sites/3/2023/04/Breadwinner-wives-full-report-FINAL.pdf'

/** Pew, wife-primary-breadwinner marriages: average hours a week. */
export const BREADWINNER_HOURS = [
  { label: 'Paid work', men: 40.4, women: 42.0 },
  { label: 'Caregiving', men: 5.0, women: 6.4 },
  { label: 'Housework', men: 2.8, women: 4.8 },
  { label: 'Leisure', men: 29.9, women: 21.1 },
] as const

/** Markowsky & Beblo (2022), meta-regression: how much smaller the gender gap in entering competition is, in percentage points. */
export const COMPETITION_SHIFTS = [
  { id: 'verbal', label: 'A verbal task instead of maths', smaller: '7–8', amount: 7.5 },
  { id: 'adults', label: 'Adults instead of students', smaller: '11–12', amount: 11.5 },
  { id: 'feedback', label: 'Players told how they rank', smaller: '6–8', amount: 7 },
  { id: 'quota', label: 'Affirmative action for women', smaller: 'about 26', amount: 26 },
] as const

/** Williams & Tiedens (2016): effect of dominance on evaluations of women relative to men (Cohen’s d). */
export const DOMINANCE_EFFECTS = [
  { id: 'competence', label: 'Perceived competence', d: 0.02, k: 31 },
  { id: 'likability', label: 'Likability', d: -0.19, k: 63 },
  { id: 'hiring', label: 'Recommended for a job', d: -0.58, k: 20 },
] as const

/** Berniell et al. (2024): probability of working, relative to the year before the first child (= 100). */
export const MOTHERHOOD_INDEX = [
  { label: 'Year before', year: -1, mothers: 100 },
  { label: '1 year after', year: 1, mothers: 75 },
  { label: '15 years after', year: 15, mothers: 79 },
] as const

/** Begall (2024), Table 3: preferred weekly work hours after a birth, survey 2015/16. */
export const WEEK_PREFERENCES = [
  { who: 'men', label: 'Men, for themselves', hours: 29.71 },
  { who: 'men', label: 'Men, for their partner', hours: 24.90 },
  { who: 'women', label: 'Women, for themselves', hours: 28.20 },
  { who: 'women', label: 'Women, for their partner', hours: 34.24 },
] as const

/** Galinsky et al. (2024): 102 meta-analytic gender differences compared with experimental effects of power. */
export const POWER_COMPARISONS = { total: 102, same: 72, opposite: 8, none: 22 } as const

export const MONEY_QUESTIONS: readonly ChapterQuestion[] = [
  {
    id: 'mp-leader',
    kind: 'rows',
    short: 'Leadership',
    question: 'Who makes a better leader?',
    prompt: 'A meta-analysis of 99 samples compared how effective male and female leaders were rated. Who came out ahead in each case?',
    rows: [
      { id: 'self', label: 'When leaders rate themselves', answer: 'men' },
      { id: 'others', label: 'When other people rate them', answer: 'women' },
      { id: 'all', label: 'All ratings combined', answer: 'similar' },
    ],
    labels: { similar: 'No difference' },
    finding: 'Men rated themselves higher. Others rated women higher. Overall, no difference.',
    takeaway: 'The gap is between confidence and how others see you. These are ratings of effectiveness, not measures of how well an organisation actually performed.',
    visual: 'leader',
    evidence: {
      citation: 'Paustian-Underdahl, Walker & Woehr (2014), Journal of Applied Psychology',
      url: 'https://doi.org/10.1037/a0036751',
      sample: '99 independent samples from 95 studies of leaders.',
      method: 'Meta-analysis of perceived leadership effectiveness, with self-ratings and ratings by others analysed separately and combined. Both separate differences were statistically significant; the combined one was not.',
      limitation: 'Ratings are perceptions, not objective results. A 2024 review of 50 years of research (Paustian-Underdahl et al., The Leadership Quarterly, doi.org/10.1016/j.leaqua.2024.101822) also found women’s leadership behaviours rated as more effective, but only one of its studies used an objective measure.',
    },
  },
  {
    id: 'mp-negotiate',
    kind: 'sliders',
    short: 'Negotiation',
    question: 'Do women really negotiate their salaries less?',
    prompt: 'A business school asked its graduating MBA students: “Did you negotiate your job offer?” What share said yes?',
    scenario: 'Imagine 100 graduating men and 100 graduating women.',
    actual: { men: 44, women: 54 },
    expected: { men: 64, women: 47 },
    finding: 'Women negotiated more: 54%, against 44% of men.',
    takeaway: 'The public guessed the opposite. Older studies found women negotiated slightly less often; in these recent MBA classes, the pattern reversed.',
    visual: 'negotiate',
    evidence: {
      citation: 'Kray, Kennedy & Lee (2024), Academy of Management Discoveries',
      url: 'https://doi.org/10.5465/amd.2022.0021',
      sample: '990 graduating MBA students (2015–2019) at one top US business school. The public’s guesses come from 296 US adults recruited online, paid a bonus for accurate estimates.',
      method: 'A yes/no question in the career office’s exit survey, about the job offer each student accepted.',
      limitation: 'Self-reported, and from MBA graduates of one school rather than the whole workforce. It doesn’t show how hard, or how successfully, people negotiated.',
    },
  },
  {
    id: 'mp-compete',
    kind: 'choice',
    short: 'Competition',
    question: 'Are men naturally more competitive?',
    prompt: 'In experiments like this, men choose the competition more often than women. What happens to that gap when the task is verbal instead of maths?',
    warmup: {
      kind: 'choice',
      prompt: 'First, just for you. You have five minutes to solve as many puzzles as you can. How do you want to be paid?',
      options: [
        { id: 'piece', label: '€1 for every correct answer' },
        { id: 'tournament', label: '€4 for every correct answer if you beat three other players. Otherwise nothing.' },
      ],
    },
    options: [
      { id: 'larger', label: 'The gap becomes larger' },
      { id: 'smaller', label: 'The gap becomes smaller' },
      { id: 'same', label: 'It stays about the same' },
    ],
    answer: 'smaller',
    finding: 'It shrinks, to almost nothing.',
    takeaway: 'Across 409 estimates, men chose to compete 13 points more often than women on average. How big the gap is depends on what people compete in, and how the contest is set up.',
    visual: 'compete',
    evidence: {
      citation: 'Markowsky & Beblo (2022), Journal of Economic Behavior & Organization',
      url: 'https://doi.org/10.1016/j.jebo.2022.03.030',
      sample: '110 studies and 409 estimates of the gender gap in choosing a tournament over a piece rate.',
      method: 'Meta-regression. Each change is compared with an otherwise similar lab maths contest among students, where gaps were largest.',
      limitation: 'About two-thirds of the experiments used maths tasks and only 7% verbal ones. The figures are differences between study designs, not separate gaps for each task.',
    },
  },
  {
    id: 'mp-risk',
    kind: 'rows',
    short: 'Risk',
    question: 'Are women less willing to take risks at work?',
    prompt: 'Five studies of 2,280 people looked at taking risks at work. Who came out ahead on each?',
    rows: [
      { id: 'new', label: 'Willing to take an unfamiliar risk', answer: 'similar' },
      { id: 'outcomes', label: 'Got good outcomes from past risks', answer: 'men' },
      { id: 'again', label: 'Willing to try again after the same outcome', answer: 'similar' },
    ],
    labels: { similar: 'No difference' },
    finding: 'Equally daring. The difference came afterwards.',
    takeaway: 'Men reported better outcomes from risks they had taken, so they were readier to take them again. When the outcomes were the same, so was the willingness.',
    visual: 'risk',
    evidence: {
      citation: 'Morgenroth, Ryan & Fine (2022), Psychology of Women Quarterly',
      url: 'https://doi.org/10.1177/03616843221084048',
      sample: 'Two correlational and three experimental studies, 2,280 participants in total.',
      method: 'Participants reported past workplace risks and their consequences, and responded to scenarios with fixed consequences.',
      limitation: 'Reported consequences are people’s own accounts. Willingness to take risks may reflect past experience and expected consequences, not an inborn trait.',
    },
  },
  {
    id: 'mp-assertive',
    kind: 'choice',
    short: 'Assertiveness',
    question: 'Does being assertive cost women more?',
    prompt: 'Two managers, a man and a woman, say exactly the same thing: “I expect this to be completed by Friday.” In research on dominant behaviour, where did women lose out most compared with men?',
    options: [
      { id: 'competence', label: 'Perceived competence' },
      { id: 'likability', label: 'Likability' },
      { id: 'hiring', label: 'Being recommended for a job' },
    ],
    answer: 'hiring',
    finding: 'Being recommended for a job. Women were seen as just as competent.',
    takeaway: 'Dominance cost women likability and, more, recommendations for a job, but not perceived competence. Direct demands hurt women’s likability; subtler signals such as eye contact didn’t.',
    visual: 'backlash',
    evidence: {
      citation: 'Williams & Tiedens (2016), Psychological Bulletin',
      url: 'https://doi.org/10.1037/bul0000039',
      sample: 'Meta-analysis: 63 effects for likability, 31 for competence and 20 for hireability.',
      method: 'Standardized differences (Cohen’s d) between reactions to dominant women and dominant men. Likability: explicit dominance −0.28, implicit 0.03.',
      limitation: 'Mostly experiments with written, audio or video scenarios. A recommendation is a rating, not an actual hiring decision. The managers here are an illustration.',
    },
  },
  {
    id: 'mp-week',
    kind: 'choice',
    short: 'Working week',
    question: 'What working week do men and women actually want?',
    prompt: 'Employed men and women in Sweden, the Netherlands and the UK answered the same kind of question in a survey experiment. What did they prefer?',
    warmup: {
      kind: 'week',
      prompt: 'First, just for you. You and your partner have a young child, and you can both work. How many days a week would you ideally want each of you to work?',
    },
    options: [
      { id: 'same', label: 'Both wanted their partner to work about as much as themselves' },
      { id: 'women-more', label: 'Women wanted their partner to work more; men wanted their partner to work less' },
      { id: 'men-more', label: 'Men wanted their partner to work more; women wanted their partner to work less' },
    ],
    answer: 'women-more',
    finding: 'For themselves, men and women wanted the same hours. For their partner, they didn’t.',
    takeaway: 'Both preferred the father to work more than the mother. Even when the woman earned more, women still wanted their partner to work about 2.5 hours more than themselves, while men chose equal hours.',
    visual: 'week',
    evidence: {
      citation: 'Begall (2024), European Sociological Review. Survey conducted 2015/16',
      url: 'https://doi.org/10.1093/esr/jcad054',
      sample: '678 employed men and women aged 18–39 (328 men, 350 women) in Sweden, the UK and the Netherlands, from the European Sustainable Workforce Survey, 2015/16. Published in 2024.',
      method: 'A factorial survey: in 2,493 fictional scenarios that varied who earned more, respondents gave their preferred weekly hours for themselves and their partner after a birth. Averages are weighted (Table 3); the earnings comparison uses model predictions (Figure 2). Calendars convert hours to 8-hour days.',
      limitation: 'Hypothetical preferences, not how much people actually work. Respondents couldn’t choose more hours than they already worked, so specialization may be understated. Only male–female couples.',
    },
  },
  {
    id: 'mp-leisure',
    kind: 'sliders',
    short: 'Free time',
    question: 'When women earn more, who gets more free time?',
    prompt: 'In US marriages where the wife earns more than 60% of the couple’s income, how many hours of leisure a week does each spouse get?',
    scenario: 'Leisure means activities such as socialising or relaxing.',
    labels: { men: 'Husband', women: 'Wife' },
    unit: 'h',
    max: 60,
    near: 2,
    far: 5,
    actual: { men: 29.9, women: 21.1 },
    sources: BREADWINNER_HOURS,
    finding: 'Husbands: 29.9 hours. Wives: 21.1.',
    takeaway: 'These wives did a little more paid work, and more care and housework. A gap of 8.8 hours a week adds up to about 19 full days a year.',
    visual: 'budget',
    evidence: {
      citation: 'Pew Research Center (2023), “In a Growing Share of U.S. Marriages, Husbands and Wives Earn About the Same”',
      url: PEW_BREADWINNERS,
      sample: '14,758 opposite-sex marriages in the American Time Use Survey, 2016–2021; spouses aged 25–64.',
      method: 'A wife is the primary breadwinner when she earns more than 60% of the couple’s joint earnings. Care, housework and leisure come from time diaries; paid work is usual weekly hours.',
      limitation: 'US averages. Paid work is measured differently from the other activities, so the hours shouldn’t be added up into a full week. Marriages where the wife is the only earner are counted separately.',
    },
  },
  {
    id: 'mp-motherhood',
    kind: 'choice',
    short: 'Motherhood',
    question: 'Does being more qualified protect women from the motherhood penalty?',
    prompt: 'When a woman is better educated than her partner, or was better at maths as a child, what happens to the drop in her employment after their first child?',
    options: [
      { id: 'disappears', label: 'It largely disappears' },
      { id: 'persists', label: 'It persists' },
      { id: 'reverses', label: 'It turns into a career advantage' },
    ],
    answer: 'persists',
    finding: 'It persists. Even the most qualified mothers stepped back. Fathers didn’t.',
    takeaway: 'Across 29 countries, mothers were 25% less likely to be working a year after their first child, and still 21% less likely 15 years later.',
    visual: 'timeline',
    evidence: {
      citation: 'Berniell et al. (2024), Applied Economics',
      url: 'https://doi.org/10.1080/00036846.2024.2387861',
      sample: '45,326 mothers and 33,683 fathers in 28 European countries and Israel, from life histories in the SHARE survey.',
      method: 'Event study around the birth of the first child, relative to the year before. Women were also compared with their partners by education and by maths at age 10.',
      limitation: 'The 25% and 21% are overall figures, not for women more qualified than their partners. Maths ability is people’s recollection of how they did at 10, asked in 15 countries. Employment doesn’t measure ambition, talent or preferences.',
    },
  },
  {
    id: 'mp-power',
    kind: 'estimate',
    short: 'Power',
    question: 'Are some gender differences really power differences?',
    prompt: 'Researchers compared 102 documented psychological differences between men and women with what happens when experiments give people more power. In what share did men differ from women in the same direction as high-power people differ from low-power people?',
    label: 'Same direction',
    actual: 71,
    near: 5,
    far: 15,
    finding: '71%: 72 of the 102. Only 8 pointed the opposite way.',
    takeaway: 'Men and people given power both tended to show more agency, less focus on others and more positive self-evaluations. This is agreement in direction. It doesn’t mean power causes 71% of gender differences.',
    visual: 'power',
    evidence: {
      citation: 'Galinsky et al. (2024), PNAS Nexus',
      url: 'https://doi.org/10.1093/pnasnexus/pgae025',
      sample: '102 meta-analytic sex/gender differences and 59 experimental effects of power.',
      method: 'A difference counted as the same direction when both effects exceeded d = 0.10 the same way. The remaining 22 showed no meaningful gender difference (d of 0.10 or less).',
      limitation: 'It compares separate bodies of research. Directional agreement doesn’t establish that power causes these differences.',
    },
  },
]

export const MONEY_CHAPTER = {
  id: 'money-ambition-power',
  title: 'Money, ambition & power',
  summary: 'Who negotiates harder, who takes more risks, and how do couples divide work?',
  minutes: '6–8',
  scoring: 'One point per question. Leadership and Risk: ⅓ point per correct prediction. Negotiation: ½ point per estimate within 5 points, ¼ within 15. Free time: ½ point per estimate within 2 hours, ¼ within 5. Power: 1 point within 5 points, ½ within 15.',
}
