import type { ReviewedAnswer } from './reviewedAnswers'

type EditorialStory = ReviewedAnswer & { readingNote: string }

export const EDITORIAL_STORIES: Readonly<Partial<Record<string, EditorialStory>>> = {
  'children-and-happiness': {
    headline: 'The lift in happiness around a first birth didn’t last on average',
    scope: 'Long-running household surveys in Britain and Germany.',
    finding: {
      text: 'The same people reported greater happiness around the birth of their first child than they had several years earlier. Later, their ratings returned to roughly where they started.',
      refs: ['myrskyla2014'],
    },
    explanationTitle: 'The story starts before the baby arrives',
    explanation: [{
      text: 'Happiness was already rising before the birth. That makes it hard to separate the arrival of a child from other changes, such as forming a partnership or looking forward to becoming a parent. The average also hides differences by age and education.',
      refs: ['myrskyla2014'],
    }],
    limitation: { text: 'The same people are observed over time, but the study cannot say what their lives would have been like without a child. It measures reported happiness and leaves other experiences, such as meaning or the stress of a particular day, open.', refs: ['myrskyla2014'] },
    readingNote: 'Read the time pattern in the study from left to right: several years before birth, around birth, then several years after. This compares changes in people’s own reports over time.',
  },
  'working-hours': {
    headline: 'The average worker in Spain puts in fewer hours than in 1970',
    scope: 'Paid work in Spain, 1970–2023, with US time diaries for the unpaid side of work.',
    finding: {
      text: 'In Spain, average annual hours per worker fell from about 1,993 in 1970 to 1,638 in 2023, an 18% reduction. Germany and the United States also recorded declines over those years.',
      refs: ['pwt11'],
    },
    explanationTitle: 'Some work never shows up on a payslip',
    explanation: [{
      text: 'If you only count time on the job, you miss what happens at home. In US time diaries from 1965 to 2003, men gained leisure mainly by spending less time in paid work. Women gained it mainly by spending less time on unpaid household work.',
      refs: ['aguiarhurst2007'],
    }],
    limitation: { text: 'Paid hours per worker exclude people outside employment. The US diaries use a different denominator and period. Neither measures how rushed or demanding work felt.', refs: ['pwt11', 'aguiarhurst2007'] },
    readingNote: 'The comparison shows hours per employed person. The historical US time-diary study instead includes people outside paid employment, so its hours cannot be placed on the same scale.',
  },
  'education-and-pay': {
    headline: 'More women have degrees. The hourly pay gap persists',
    scope: 'EU education and pay statistics, with research on how employers reward working time.',
    finding: {
      text: 'In the EU in 2024, 49.8% of women aged 25–34 had tertiary qualifications, compared with 38.6% of men. In a separate analysis for 2022, Eurostat reports a 12.2% overall hourly pay gap and a larger gap among managers.',
      refs: ['eurostatGender'],
    },
    explanationTitle: 'The value of being available at the right time',
    explanation: [{
      text: 'In some professions, an hour at a time the employer needs you can pay more than an hour you can schedule yourself. Jobs that reward long or inflexible hours can pay differently even for people with similar qualifications. How much that flexibility costs varies by profession.',
      refs: ['goldin2014'],
    }],
    limitation: { text: 'The EU education and pay figures use different populations and years. The pay gap is an unadjusted average. Those statistics cannot isolate the shares due to scheduling, occupational choices, discrimination or other factors.', refs: ['eurostatGender', 'goldin2014'] },
    readingNote: 'Compare Figure 1 and Figure 7 in Eurostat’s report. The first measures educational attainment among young adults. The second measures hourly earnings gaps across a wider working population.',
  },
  'global-danger': {
    headline: 'The world counted more armed conflicts as the risk of dying in childhood fell',
    scope: 'Two global risks with different measures and time windows.',
    finding: {
      text: 'PRIO counted 59 active state-based conflicts in 2023, the most in its 1946–2023 series. Yet the global under-five mortality rate fell to 37.4 deaths per 1,000 live births in 2024, less than half its 2000 level.',
      refs: ['rustad2024', 'whoChildMortality'],
    },
    explanationTitle: 'Count conflicts and count deaths separately',
    explanation: [{
      text: 'A handful of wars can account for much of the death toll, as Ukraine and Gaza did in 2023. The child survival figures show a different kind of progress. Children in conflict-affected places still face much higher mortality, even as the global average has fallen.',
      refs: ['rustad2024', 'whoChildMortality'],
    }],
    limitation: { text: 'These indicators capture only two dimensions of danger. Conflict data and estimated child mortality have different units, and neither tells you how every risk changed in a specific country.', refs: ['rustad2024', 'whoChildMortality'] },
    readingNote: 'Follow the conflict report’s counts and deaths separately. The WHO report uses deaths per 1,000 live births, so its rate can fall even when progress in the total number of deaths stalls.',
  },
  'generational-wealth': {
    headline: 'US millennials started adulthood with less wealth than earlier generations',
    scope: 'An age-matched US comparison published in 2018.',
    finding: {
      text: 'Federal Reserve researchers compared millennials with earlier generations when they were young. Millennials had lower earnings, fewer assets and less wealth. Their debt was similar to Generation X’s and higher than baby boomers’ at comparable ages.',
      refs: ['kurz2018'],
    },
    explanationTitle: 'The comparison changes when you match people by age',
    explanation: [{
      text: 'Comparing people at the same age removes the extra years their parents had to save. It still compares people who started out under different conditions. Many millennials reached working age around the Great Recession, so this comparison describes the start they had and leaves their eventual wealth open.',
      refs: ['kurz2018'],
    }],
    limitation: { text: 'This study compares US cohorts at similar ages using data available in 2018. It leaves open whether they caught up later, whether younger cohorts follow the same path, and whether the pattern holds in other countries.', refs: ['kurz2018'] },
    readingNote: 'The study compares earnings, assets and debts separately. Two households can earn the same amount and have very different wealth if one owns more or owes more.',
  },
  'crime-perceptions': {
    headline: 'Americans often said crime was up during decades when recorded rates fell',
    scope: 'US public opinion and crime trends, 1993–2022.',
    finding: {
      text: 'Pew found that in 23 of 27 Gallup polls since 1993, at least 60% of US adults said national crime was higher than a year earlier. Across 1993–2022, the FBI’s recorded violent crime rate fell 49%. The national murder rate still had a sharp rise in 2020.',
      refs: ['pewCrime2024', 'gallupCrime'],
    },
    explanationTitle: 'National impressions and local experiences differ',
    explanation: [{
      text: 'Pew reports that Americans are generally more likely to say crime increased nationally than to say it increased where they live. A national trend also combines places and offences that can move in opposite directions, so a local experience may be very different from the national average.',
      refs: ['pewCrime2024', 'gallupCrime'],
    }],
    limitation: { text: 'The poll asks whether crime rose over one year. The FBI figure measures the long-run change in reported violent crime. They show a recurring disconnect over the period, while leaving open how accurate any one year’s impression was.', refs: ['pewCrime2024', 'gallupCrime'] },
    readingNote: 'In Gallup’s tables, compare “More Crime US” with “Crime Your Area.” Pew also compares the FBI’s police records with the federal victimisation survey, which captures many offences that were never reported.',
  },
  'wealth-and-fertility': {
    headline: 'The career cost of having children may help explain why birth rates differ across rich countries',
    scope: 'Long-run fertility trends and comparative research on high-income countries.',
    finding: {
      text: 'Fertility fell as countries industrialised. The old pattern became less reliable once countries were rich. Even as incomes rose, some stayed much closer than others to the birth rate needed for one generation to replace itself.',
      refs: ['doepke2022'],
    },
    explanationTitle: 'What would having a child mean for your career?',
    explanation: [{
      text: 'Where childcare is hard to arrange or work is inflexible, having a child may mean cutting back hours or passing up career opportunities. Mothers often face more of that trade-off. Childcare, flexible work and a more even share of care can ease it, which may help explain why similarly wealthy countries have different birth rates.',
      refs: ['doepke2022'],
    }],
    limitation: { text: 'The review offers several explanations and leaves room for financial constraints and changing preferences. An annual fertility rate can also fall because people are having children later, even if their eventual family size falls less.', refs: ['doepke2022'] },
    readingNote: 'Read the review’s long-run fertility series alongside its comparison of wealthy countries. The first shows the historical transition; the second shows why the old income pattern is a poor guide to differences between rich countries today.',
  },
}
