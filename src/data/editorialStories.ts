import { INVESTIGATION_FIGURES } from './investigationFigures'
import type { ReviewedAnswer } from './reviewedAnswers'

type EditorialStory = ReviewedAnswer & { readingNote: string }

export const EDITORIAL_STORIES: Readonly<Partial<Record<string, EditorialStory>>> = {
  'children-and-happiness': {
    figure: INVESTIGATION_FIGURES['children-and-happiness'],
    headline: 'The lift in happiness around a first birth didn’t last on average',
    scope: 'Long-running household surveys in Britain and Germany.',
    finding: {
      text: 'In the German panel, estimated happiness was 0.30 points above its earlier level a year before birth and 0.05 points above it one to two years afterward. The British data showed a similar short-lived rise.',
      refs: ['myrskyla2014'],
    },
    explanationTitle: 'The story starts before the baby arrives',
    explanation: [{
      text: 'Anticipation and changes such as forming a partnership can affect happiness before a child arrives. The study also found bigger increases around birth among older or more educated parents, so the average can hide very different experiences.',
      refs: ['myrskyla2014'],
    }],
    limitation: { text: 'The same people are observed over time, but the study cannot say what their lives would have been like without a child. It measures reported happiness and leaves other experiences, such as meaning or the stress of a particular day, open.', refs: ['myrskyla2014'] },
    readingNote: 'Read the time pattern in the study from left to right: several years before birth, around birth, then several years after. This compares changes in people’s own reports over time.',
  },
  'working-hours': {
    figure: INVESTIGATION_FIGURES['working-hours'],
    headline: 'The average worker in Spain puts in fewer hours than in 1970',
    scope: 'Paid work in Spain, 1970–2023, with US time diaries for the unpaid side of work.',
    finding: {
      text: 'In Spain, average annual hours per worker fell from about 1,993 in 1970 to 1,638 in 2023, an 18% reduction. Germany and the United States also recorded declines over those years.',
      refs: ['pwt11'],
    },
    explanationTitle: 'Some work never shows up on a payslip',
    explanation: [{
      text: 'An average can fall if more people work part time, even when a full-time schedule stays the same. Time diaries reveal a different blind spot. In the US from 1965 to 2003, men gained leisure mainly by spending less time in paid work. Women gained it mainly by spending less time on unpaid household work.',
      refs: ['pwt11', 'aguiarhurst2007'],
    }],
    limitation: { text: 'Paid hours per worker exclude people outside employment. The US diaries use a different denominator and period. Neither measures how rushed or demanding work felt.', refs: ['pwt11', 'aguiarhurst2007'] },
    readingNote: 'The comparison shows hours per employed person. The historical US time-diary study instead includes people outside paid employment, so its hours cannot be placed on the same scale.',
  },
  'education-and-pay': {
    figure: INVESTIGATION_FIGURES['education-and-pay'],
    headline: 'Earnings diverged after a first birth in Denmark',
    scope: 'Danish earnings records, with European education and hourly pay figures for context.',
    finding: {
      text: 'Ten years after a first birth, Danish mothers’ gross earnings were about 20% below their estimated path without the birth. The study found little change for fathers.',
      refs: ['kleven2019'],
    },
    explanationTitle: 'The value of being available at the right time',
    explanation: [{
      text: 'The Danish study traces the earnings gap after childbirth to three changes: whether mothers worked, how many hours they worked and what they earned per hour. Goldin’s work helps explain why the last part matters: some professions pay a premium for long hours or availability at particular times, even among workers with similar qualifications.',
      refs: ['kleven2019', 'goldin2014'],
    }],
    limitation: { text: 'The Danish comparison concerns earnings after childbirth. It cannot account for the full EU hourly pay gap. The EU education and hourly pay figures cover different populations and years.', refs: ['eurostatGender', 'goldin2014', 'kleven2019'] },
    readingNote: 'Eurostat reports that 49.8% of women and 38.6% of men aged 25–34 had tertiary qualifications in 2024. Its separate 2022 analysis reports a 12.2% unadjusted hourly pay gap across a wider working population.',
  },
  'global-danger': {
    figure: INVESTIGATION_FIGURES['global-danger'],
    headline: 'More armed conflicts, fewer battle deaths in 2023',
    scope: 'Global state-based conflicts, 2022–2023.',
    finding: {
      text: 'PRIO counted 59 active state-based conflicts in 2023, the most in its 1946–2023 series. Battle deaths more than halved from 2022, though 2023 still had the third-highest toll since 1989.',
      refs: ['rustad2024', 'whoChildMortality'],
    },
    explanationTitle: 'Count conflicts and count deaths separately',
    explanation: [{
      text: 'Where fighting happens matters more to the death toll than how many conflicts there are. PRIO identifies Ethiopia and Ukraine as the deadliest conflicts in 2022. As the toll in Ethiopia fell, global deaths fell too, even though fighting in Ukraine continued and deaths in the Israel–Palestine conflict rose.',
      refs: ['rustad2024'],
    }],
    limitation: { text: 'Battle deaths exclude many indirect deaths, including from disease or lack of care. War is one dimension of safety. WHO’s separate child mortality series answers a different question.', refs: ['rustad2024', 'whoChildMortality'] },
    readingNote: 'Compare Figures 3 and 6 in the PRIO report. For a separate measure of safety, WHO estimates global under-five mortality at 37.4 per 1,000 live births in 2024, less than half its 2000 level.',
  },
  'generational-wealth': {
    figure: INVESTIGATION_FIGURES['generational-wealth'],
    headline: 'US millennials started adulthood with less wealth than earlier generations',
    scope: 'An age-matched US comparison published in 2018.',
    finding: {
      text: 'At ages 25–34, US millennial households averaged $91,700 in net worth, compared with $113,900 for baby boomers and $148,000 for Generation X, in 2016 dollars.',
      refs: ['kurz2018'],
    },
    explanationTitle: 'A similar pile of assets can leave less wealth',
    explanation: [{
      text: 'Millennials owned about as much as boomers had at the same age, but owed more. Compared with Generation X, the bigger difference was in assets. The same headline about lower wealth can come from a different side of the balance sheet.',
      refs: ['kurz2018'],
    }],
    limitation: { text: 'This historical US comparison uses averages that can be pulled up by wealthy households. It leaves open whether they caught up later, whether younger cohorts follow the same path, and whether the pattern holds in other countries.', refs: ['kurz2018'] },
    readingNote: 'The study compares earnings, assets and debts separately. Two households can earn the same amount and have very different wealth if one owns more or owes more.',
  },
  'crime-perceptions': {
    figure: INVESTIGATION_FIGURES['crime-perceptions'],
    headline: 'Americans often said crime was up during decades when recorded rates fell',
    scope: 'US public opinion and crime trends, 1993–2022.',
    finding: {
      text: 'Pew found that in 23 of 27 Gallup polls since 1993, at least 60% of US adults said national crime was higher than a year earlier. Across 1993–2022, the FBI’s recorded violent crime rate fell 49%. The national murder rate still had a sharp rise in 2020.',
      refs: ['pewCrime2024', 'gallupCrime'],
    },
    explanationTitle: 'National impressions and local experiences differ',
    explanation: [{
      text: 'Pew found that Americans were generally more likely to report rising crime nationally than in their own area. The answer also depends on the year you have in mind: the long decline included a sharp rise in murder in 2020. That leaves room for real short-term increases alongside a long-term decline.',
      refs: ['pewCrime2024', 'gallupCrime'],
    }],
    limitation: { text: 'The poll asks whether crime rose over one year. The FBI figure measures the long-run change in reported violent crime. They show a recurring disconnect over the period, while leaving open how accurate any one year’s impression was.', refs: ['pewCrime2024', 'gallupCrime'] },
    readingNote: 'In Gallup’s tables, compare “More Crime US” with “Crime Your Area.” Pew also compares the FBI’s police records with the federal victimisation survey, which captures many offences that were never reported.',
  },
  'wealth-and-fertility': {
    figure: INVESTIGATION_FIGURES['wealth-and-fertility'],
    headline: 'France and Germany had similar incomes but different fertility rates in 2000',
    scope: 'An OECD comparison within a longer history of falling fertility.',
    finding: {
      text: 'In 2000, France’s fertility rate was about 1.9 births per woman and Germany’s about 1.4, despite roughly similar GDP per person.',
      refs: ['doepke2022'],
    },
    explanationTitle: 'What would having a child mean for your career?',
    explanation: [{
      text: 'As women’s career options expanded, leaving work to care for a child could cost families more in lost earnings. The research review considers why that trade-off varies: childcare, flexibility at work and how parents share care all matter. The France–Germany figures alone cannot tell us how much each factor contributed.',
      refs: ['doepke2022'],
    }],
    limitation: { text: 'Housing costs, other financial constraints and changing preferences may also matter. An annual fertility rate can also fall because people are having children later, even if their eventual family size falls less.', refs: ['doepke2022'] },
    readingNote: 'Compare Figure 1, which charts the long-run fertility decline, with Figure 8, which compares affluent countries in 1980 and 2000. In that sample, the income–fertility relationship had reversed by 2000.',
  },
}
