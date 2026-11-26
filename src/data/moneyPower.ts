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

/** Markowsky & Beblo (2022), meta-regression: how much smaller the gender gap in entering competition is in verbal tasks than in lab maths contests among students, in percentage points. */
export const VERBAL_SHIFT = '7–8'

/** Morgenroth et al. (2022), Study 4: share choosing the risky pay again after each kind of feedback. */
export const RISK_AGAIN = { positive: 94, negative: 64, analysed: 398 } as const

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
    id: 'mp-negotiate-outcome',
    kind: 'choice',
    short: 'Negotiation',
    question: 'Who achieves better outcomes when negotiating — men or women?',
    prompt: 'Thousands of people negotiated with each other: face to face in a business school course, and in anonymous online chats. What happened?',
    options: [
      { id: 'men', label: 'Men achieve better financial outcomes.' },
      { id: 'women', label: 'Women achieve better financial outcomes.' },
      { id: 'similar', label: 'Both achieve similar financial outcomes, but people prefer negotiating with women.' },
    ],
    answer: 'similar',
    finding: 'Similar deals. But people preferred negotiating with women.',
    takeaway: 'The researchers found no significant gender difference in the deals people reached. But partners said they liked women more, and more often wanted to negotiate with them again, even in anonymous chats where they didn’t know, and couldn’t guess, the other person’s gender.',
    visual: 'negotiate',
    evidence: {
      citation: 'Townsend, Kray & Delecourt (2026), PNAS',
      url: 'https://doi.org/10.1073/pnas.2523202123',
      sample: 'Five studies, 2,401 participants: 231 MBA students over a 10-week negotiation course; 1,030 anonymous online chat negotiations between 846 US adults; 773 and 371 US adults who rated real chat transcripts; and an analysis of the transcripts.',
      method: 'Financial outcomes are the points each side won in the deal. Interpersonal outcomes are partners’ own ratings: how much they liked the other person, how satisfied they were and whether they wanted to negotiate with them again. A separate group of 180 students guessed the chat negotiators’ gender no better than chance.',
      limitation: 'A non-significant difference is not proof that outcomes are identical. Liking and wanting to negotiate again are self-reported. The negotiations were role-plays and chats over fictional resources, not real salaries.',
    },
  },
  {
    id: 'mp-compete-verbal',
    kind: 'choice',
    short: 'Competition',
    question: 'Are men more competitive at everything?',
    prompt: 'In experiments with maths tasks, men are generally more likely than women to enter a competition. What happens when the task involves verbal skills instead?',
    options: [
      { id: 'same', label: 'The gender gap stays roughly the same.' },
      { id: 'negligible', label: 'The gender gap becomes almost negligible.' },
      { id: 'women', label: 'Women become substantially more competitive than men.' },
    ],
    answer: 'negligible',
    finding: 'It almost disappears.',
    takeaway: 'Willingness to compete depends on what the competition is about and how it is set up. Gaps were largest in lab maths contests among students, and almost negligible in verbal tasks.',
    visual: 'compete',
    evidence: {
      citation: 'Markowsky & Beblo (2022), Journal of Economic Behavior & Organization',
      url: 'https://doi.org/10.1016/j.jebo.2022.03.030',
      sample: '110 studies and 409 estimates of the gender gap in choosing to compete (a tournament) rather than a fixed pay per correct answer.',
      method: 'Meta-regression. Verbal tasks are compared with otherwise similar lab maths contests among students.',
      limitation: 'About two-thirds of the experiments used maths tasks and only 7% verbal ones. The 7–8 points are a difference between study designs, not separately measured gaps. The research doesn’t show whether any gender difference is innate.',
    },
  },
  {
    id: 'mp-risk-feedback',
    kind: 'choice',
    short: 'Risk',
    question: 'Are women really more risk-averse at work?',
    prompt: 'Researchers offered men and women a choice between guaranteed pay and a potentially higher, riskier payment. They then gave participants positive or negative feedback before offering them another choice. How did men and women respond?',
    options: [
      { id: 'men', label: 'Men were more willing to take risks regardless of previous outcomes.' },
      { id: 'women', label: 'Women were more discouraged by negative feedback.' },
      { id: 'similar', label: 'Men and women responded similarly to feedback.' },
    ],
    answer: 'similar',
    finding: 'Feedback mattered. Gender didn’t.',
    takeaway: 'After positive feedback, 94% chose the risky pay again. After negative feedback, 64% did. The experiment found no statistically significant difference between men and women, either in the first choice or in how they responded to feedback.',
    visual: 'risk',
    evidence: {
      citation: 'Morgenroth, Ryan & Fine (2022), Psychology of Women Quarterly',
      url: 'https://doi.org/10.1177/03616843221084048',
      sample: 'Study 4: 677 US adults recruited online, most of them employed. The 398 who first chose the risky pay (199 women, 199 men) were analysed. The paper has five studies with 2,280 participants in total.',
      method: 'Participants coded text for 10 minutes, paid either $0.01 a word or $0.05 a word only if their work was above average. A video “supervisor” then told each risk-taker, at random, that they had or hadn’t earned the bonus, before the next choice. The separate surveys asked people about risks they had taken at work and what happened.',
      limitation: 'An online task, not a real job. No significant gender difference is not proof of none. The paper gives 94.12% and 63.98% but not the number of people in each feedback group. The survey outcomes are people’s own accounts, not independently verified.',
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
    id: 'mp-week-ideal',
    kind: 'week',
    short: 'Working week',
    question: 'Do men and women want the same work–family balance?',
    prompt: 'Imagine you and your partner have a young child. How many days a week would you ideally want each of you to work?',
    finding: 'For themselves, men and women wanted similar hours. For their partner, they didn’t.',
    takeaway: 'On average, men wanted to work more hours than their partner, while women wanted their partner to work more hours than themselves. Both leaned towards the father working more.',
    visual: 'week',
    evidence: {
      citation: 'Begall (2024), European Sociological Review. Survey conducted 2015/16',
      url: 'https://doi.org/10.1093/esr/jcad054',
      sample: '678 employed men and women aged 18–39 (328 men, 350 women) in Sweden, the UK and the Netherlands, from the European Sustainable Workforce Survey, 2015/16. Published in 2024.',
      method: 'A factorial survey: in 2,493 fictional scenarios about a couple after a birth, varying who earned more, respondents gave their preferred weekly hours for themselves and their partner. Averages are weighted (Table 3). Calendars convert hours to 8-hour days.',
      limitation: 'Hypothetical preferences, not how much people actually work. Respondents couldn’t choose more hours than they already worked. Only male–female couples. Data Detective players are not part of the study.',
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
    id: 'mp-power-match',
    kind: 'choice',
    short: 'Power',
    question: 'Are some gender differences really power differences?',
    prompt: 'Giving people power can change how they behave. For example, they may become more assertive and more willing to take risks. Researchers compared these changes with 102 psychological differences between men and women. How often did the two patterns match?',
    options: [
      { id: 'quarter', label: 'About a quarter of the time.' },
      { id: 'half', label: 'About half the time.' },
      { id: 'three-quarters', label: 'About three-quarters of the time.' },
    ],
    answer: 'three-quarters',
    finding: '71% of the time: 72 of the 102. Only 8 pointed the opposite way.',
    takeaway: 'Many characteristics associated with men, such as more assertiveness and more positive self-evaluations, also appeared in people given more power. That suggests differences in power may partly explain some psychological gender differences. It doesn’t show that power causes 71% of them, or that giving women power would remove them.',
    visual: 'power',
    evidence: {
      citation: 'Galinsky et al. (2024), PNAS Nexus',
      url: 'https://doi.org/10.1093/pnasnexus/pgae025',
      sample: '102 meta-analytic sex/gender differences and 59 experimental effects of power.',
      method: 'Two separate comparisons: differences observed between men and women, and differences between people randomly given more or less power in experiments. A gender difference matched when both effects exceeded d = 0.10 in the same direction. The remaining 22 showed no meaningful gender difference.',
      limitation: 'It compares separate bodies of research. Matching direction doesn’t establish that power causes these differences.',
    },
  },
]

export const MONEY_CHAPTER = {
  id: 'money-ambition-power',
  title: 'Money, ambition & power',
  summary: 'Who negotiates harder, who takes more risks, and how do couples divide work?',
  minutes: '6–8',
  scoring: 'One point per question, 8 in total. Leadership: ⅓ point per correct prediction. Free time: ½ point per estimate within 2 hours, ¼ within 5. Working week is a personal discovery and isn’t scored.',
}
