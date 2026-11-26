// "How good are you with money?" Figures checked against the cited sources; see the PR's source audit.
import type { ChapterQuestion } from './menWomen'

/** Vanguard (2023), Figure 2: MSCI World 1976–2022, rolling 12-month periods, three-month cost averaging. */
export const LUMP = { lumpBeatsAveraging: 68, averagingBeatsCash: 69, lumpBeatsCash: 70 } as const
/** SPIVA US Persistence Scorecard, year-end 2024 (Report 1): all domestic funds in the top quartile in December 2020. */
export const FUNDS = {
  start: 512,
  years: [{ year: 2021, share: 5.27 }, { year: 2022, share: 0 }, { year: 2023, share: 0 }, { year: 2024, share: 0 }],
  categories: [
    { label: 'Large-cap', funds: 162 }, { label: 'Mid-cap', funds: 65 },
    { label: 'Small-cap', funds: 127 }, { label: 'Multi-cap', funds: 130 },
  ],
} as const
/** Hypothetical: fees subtracted from a steady gross return, compounded yearly. */
export const FEES = { amount: 100_000, gross: 7, cheap: 0.1, dear: 1, years: 30 } as const
export const finalValue = (amount: number, grossPct: number, feePct: number, years: number) =>
  amount * Math.pow(1 + (grossPct - feePct) / 100, years)
/** Morningstar Mind the Gap 2026, Exhibit 4 (10 years to 31 Dec 2025), and Fulkerson et al. (2026) on timing costs. */
export const GAP = { total: 9.9, investor: 8.7, stocks: { total: 13.3, investor: 12.8 }, funds: '23,000', timing: 0.1 } as const
/** Simion & Sulka (2023), Table 7 column 7: standardised coefficients on (inverse hyperbolic sine) financial wealth. */
export const WEALTH = { n: 3743, planning: 0.222, selfControl: 0.106, numeracy: 0.101, planners: 54 } as const

const feeGap = Math.round((finalValue(FEES.amount, FEES.gross, FEES.cheap, FEES.years) - finalValue(FEES.amount, FEES.gross, FEES.dear, FEES.years)) / 1000)

export const MM_QUESTIONS: readonly ChapterQuestion[] = [
  {
    id: 'mm-lumpsum',
    kind: 'estimate',
    short: 'All at once',
    visual: 'lumpsum',
    question: 'Invest it all now, or bit by bit?',
    prompt: 'You have €100,000 to invest for the long term. You can invest it all today, or in three equal parts over three months. Looking back at global stock markets since 1976, how often did investing it all at once come out ahead a year later?',
    label: 'Share of periods where investing at once won',
    actual: LUMP.lumpBeatsAveraging,
    near: 5,
    far: 15,
    finding: `About ${LUMP.lumpBeatsAveraging}% of the time. Investing at once won roughly two times in three.`,
    takeaway: 'Markets rose more often than they fell, so money waiting in cash usually missed out. Spreading it out still won about a third of the time, and it spares you the regret of investing everything just before a fall. This is history, not a promise. It is also about money you already have; investing part of every pay cheque is a different situation.',
    evidence: {
      citation: 'Vanguard (2023), Cost averaging: Invest now or temporarily hold your cash?',
      url: 'https://corporate.vanguard.com/content/dam/corp/research/pdf/cost_averaging_invest_now_or_temporarily_hold_your_cash.pdf',
      sample: 'Global stocks (MSCI World index), 1976–2022, every rolling one-year period.',
      method: 'Historical back-test: invest a lump sum at once, or in equal parts over three months with the rest in cash, then compare the value after 12 months. Vanguard also ran forward-looking simulations.',
      limitation: 'A historical comparison, not a forecast, and not specific to €100,000. Results vary by market and period. Vanguard notes that cost averaging can suit investors who would be badly upset by an early loss.',
    },
  },
  {
    id: 'mm-funds',
    kind: 'estimate',
    short: 'Winning funds',
    visual: 'funds',
    question: "Do last year's winning funds keep winning?",
    prompt: `At the end of 2020, ${FUNDS.start} actively managed US stock funds ranked in the top quarter of their category. What share of them stayed in the top quarter in each of the next four years?`,
    label: 'Share still in the top quarter every year',
    actual: 0,
    near: 3,
    far: 10,
    finding: `None. Not one of the ${FUNDS.start} funds stayed in the top quarter for all four years.`,
    takeaway: `After one year, only ${FUNDS.years[0].share}% were still in the top quarter. From the second year on, none were. A strong recent record was a poor guide to which funds would beat their peers next.`,
    evidence: {
      citation: 'S&P Dow Jones Indices (2025), SPIVA U.S. Persistence Scorecard, Year-End 2024',
      url: 'https://www.spglobal.com/spdji/en/spiva/article/us-persistence-scorecard/',
      sample: `Actively managed US domestic equity funds in the top quartile of their category in December 2020: ${FUNDS.start} funds across large-, mid-, small- and multi-cap.`,
      method: 'Follows each top-quartile fund and checks whether it is still in the top quartile at the end of each following year, counting funds that closed or merged.',
      limitation: 'US stock funds over one four-year window; other periods and categories can look slightly different. For comparison, if rankings were pure luck, about 0.4% (1 in 256) would stay on top four years running: our calculation, not S&P\'s.',
    },
  },
  {
    id: 'mm-fees',
    kind: 'estimate',
    short: 'Fees',
    visual: 'fees',
    question: 'How much can a small fee cost?',
    prompt: 'Two funds both earn 7% a year before fees. You put €100,000 into each and leave it for 30 years. One charges 0.1% a year, the other 1%. How much more does the cheaper fund end up with?',
    label: 'Difference, in thousands of euros',
    actual: feeGap,
    near: 20,
    far: 50,
    max: 400,
    unit: '',
    finding: `About €${feeGap},000 (€740,169 against €574,349).`,
    takeaway: 'A 0.9-point fee difference looks tiny in any one year, but it compounds: the dearer fund ends up with about 22% less. This is a hypothetical illustration, not a forecast. It assumes a steady 7% a year and ignores taxes, inflation and further contributions.',
    evidence: {
      citation: 'Hypothetical calculation by Data Detective',
      url: 'https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator',
      sample: '€100,000 invested once, left for 30 years, 7% a year before fees.',
      method: 'Final value = €100,000 × (1 + 7% − fee)³⁰, so 1.069³⁰ against 1.06³⁰. Charging the fee on the balance after growth instead gives €738,717 against €563,079, a gap of about €176,000. You can repeat the calculation with the US SEC\'s compound interest calculator.',
      limitation: 'Real returns go up and down and are not guaranteed. Taxes, inflation, trading costs and regular contributions are left out.',
    },
  },
  {
    id: 'mm-gap',
    kind: 'choice',
    short: 'Investor returns',
    visual: 'gap',
    question: 'Do investors earn what their funds earn?',
    prompt: `Over the 10 years to 2025, US mutual funds and ETFs returned ${GAP.total}% a year. How did the average dollar invested in them do?`,
    options: [
      { id: 'higher', label: `Better than ${GAP.total}% a year` },
      { id: 'same', label: `About ${GAP.total}% a year` },
      { id: 'lower', label: `Worse than ${GAP.total}% a year` },
    ],
    answer: 'lower',
    finding: `Worse: about ${GAP.investor}% a year, 1.2 points less than the funds themselves.`,
    takeaway: `A fund's published return assumes you invested once at the start and never touched it. Real investors add and withdraw money along the way, so their result depends on when the money went in. That gap is not proof of bad decisions: a 2026 re-analysis estimated that poor timing cost only about ${GAP.timing} points a year.`,
    evidence: {
      citation: 'Morningstar (2026), Mind the Gap 2026',
      url: 'https://www.morningstar.com/business/insights/research/mind-the-gap',
      more: [{ citation: 'Fulkerson, Jordan, Riley & Yan (2026), Financial Analysts Journal', url: 'https://doi.org/10.1080/0015198X.2026.2657253' }],
      sample: `Nearly ${GAP.funds} US open-end mutual funds and ETFs, 10 years to 31 December 2025.`,
      method: "Compares each fund's time-weighted total return with its dollar-weighted return, which reflects when money flowed in and out, then adds them up across funds.",
      limitation: `For US stock funds alone the gap was smaller: ${GAP.stocks.investor}% against ${GAP.stocks.total}%. Morningstar says the gap can reflect return chasing but also ordinary saving and withdrawals. Fulkerson and colleagues argue that bad timing explains only about ${GAP.timing} points a year of it.`,
    },
  },
  {
    id: 'mm-cashless',
    kind: 'choice',
    short: 'Card or cash',
    visual: 'cashless',
    question: 'Does paying without cash make us spend more?',
    warmup: {
      kind: 'choice',
      prompt: "First, picture it. You're buying a €3.50 coffee, paying by phone, and there's a €4 pastry by the till. Do you add it?",
      options: [{ id: 'yes', label: 'Yes, why not' }, { id: 'no', label: 'No, just the coffee' }],
    },
    prompt: 'Researchers pooled studies comparing what people spend with cash and with cards, phones and other cashless payments. What did they find?',
    options: [
      { id: 'cash', label: 'People spend more with cash' },
      { id: 'cashless', label: 'People spend more without cash' },
      { id: 'same', label: 'Payment method makes no real difference' },
    ],
    answer: 'cashless',
    finding: 'People spend a little more when they pay without cash.',
    takeaway: 'Across 71 papers the effect was small but real. It was stronger for things other people see, and weaker for spending on others, like donations. It has shrunk over the years, perhaps as cards became normal. It is not just about borrowing: the features of the payment method did not explain the effect, so paying by debit card or phone is not the same as spending on credit.',
    evidence: {
      citation: 'Schomburgk, Belli & Hoffmann (2024), Journal of Retailing',
      url: 'https://doi.org/10.1016/j.jretai.2024.05.003',
      sample: '392 effect sizes from 71 papers.',
      method: 'Meta-analysis of studies comparing spending with cash and with cashless payments, and of what makes the difference larger or smaller.',
      limitation: 'The average effect is small, and studies vary widely. Many are experiments with imagined purchases. The coffee question above is just for you and is not part of the research.',
    },
  },
  {
    id: 'mm-wealth',
    kind: 'choice',
    short: 'Wealth',
    visual: 'predictors',
    question: 'What best predicts building wealth?',
    prompt: `A study of ${WEALTH.n.toLocaleString('en-GB')} adults in England aged 50 to 70 compared three traits. Which was most strongly linked to how much financial wealth they had?`,
    options: [
      { id: 'numeracy', label: 'Being good with numbers' },
      { id: 'selfcontrol', label: 'Self-control' },
      { id: 'planning', label: 'Planning finances years ahead' },
      { id: 'equal', label: 'All three equally' },
    ],
    answer: 'planning',
    finding: 'Planning ahead. Its link with wealth was about twice as strong as numeracy or self-control.',
    takeaway: 'People who planned their spending and saving years ahead had more financial wealth, even when compared with people of similar numeracy, memory, health and social class. That is an association in one study of older adults in England, not proof that planning causes wealth. Knowing about finance is not the same as planning, either.',
    evidence: {
      citation: 'Simion & Sulka (2023), DICE Discussion Paper 401',
      url: 'https://hdl.handle.net/10419/270956',
      more: [
        { citation: 'Núñez-Letamendia, Sánchez-Ruiz & Silva (2024), International Journal of Consumer Studies', url: 'https://doi.org/10.1111/ijcs.13097' },
        { citation: 'Marley-Payne, Valdes, Mottola & Fontes (2025), Journal of Financial Literacy and Wellbeing', url: 'https://doi.org/10.1017/flw.2025.10004' },
      ],
      sample: `${WEALTH.n.toLocaleString('en-GB')} adults aged 50–70 in the English Longitudinal Study of Ageing (2002–03).`,
      method: `Regression of financial wealth on numeracy, memory, literacy, planning and self-control, with demographic controls. Standardised coefficients: planning ${WEALTH.planning}, self-control ${WEALTH.selfControl}, numeracy ${WEALTH.numeracy}.`,
      limitation: 'A working paper, not yet peer reviewed. Self-control was measured by how often people do moderate exercise. The coefficients compare strength of association; they are not percentage changes in wealth. Newer studies link knowledge, confidence and budgeting with saving, a different outcome.',
    },
  },
]

export const MM_CHAPTER = {
  id: 'good-with-money',
  title: 'How good are you with money?',
  summary: 'From everyday spending to building wealth. How many of your financial instincts hold up against the evidence?',
  minutes: '5–6',
  scoring: 'One point per question. Investing at once and winning funds: 1 point within 5 and 3 points of the real share, ½ within 15 and 10. Fees: 1 point within €20,000, ½ within €50,000.',
} as const
