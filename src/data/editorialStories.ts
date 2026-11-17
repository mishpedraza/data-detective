import type { ReviewedAnswer } from './reviewedAnswers'

type EditorialStory = ReviewedAnswer & { readingNote: string }

export const EDITORIAL_STORIES: Readonly<Partial<Record<string, EditorialStory>>> = {
  'children-and-happiness': {
    headline: 'Happiness rose around a first birth, then returned to its earlier level',
    scope: 'Long-running household surveys in Britain and Germany.',
    finding: {
      text: 'Researchers followed people on either side of a first birth. Average self-reported happiness was already rising before the birth, peaked around it, and later returned to its earlier level.',
      refs: ['myrskyla2014'],
    },
    explanationTitle: 'The story starts before the baby arrives',
    explanation: [{
      text: 'The rise before birth is a clue that these changes may reflect more than childcare or the birth itself. The authors point to the broader transition into parenthood, which can include forming a partnership. The pattern also differed by parents’ age and education.',
      refs: ['myrskyla2014'],
    }],
    limitation: { text: 'The same people are observed over time, but the study cannot say what their lives would have been like without a child. It measures reported happiness and leaves other experiences, such as meaning or the stress of a particular day, open.', refs: ['myrskyla2014'] },
    readingNote: 'Read the time pattern in the study from left to right: several years before birth, around birth, then several years after. This compares changes in people’s own reports over time.',
  },
  'working-hours': {
    headline: 'People in Spain work fewer paid hours per worker than in 1970',
    scope: 'Paid work in Spain, 1970–2023, with US time diaries for the unpaid side of work.',
    finding: {
      text: 'In Spain, average annual hours per worker fell from about 1,993 in 1970 to 1,638 in 2023, an 18% reduction. Germany and the United States also recorded declines over those years.',
      refs: ['pwt11'],
    },
    explanationTitle: 'The type of work that fell differed',
    explanation: [{
      text: 'Paid hours leave out household work. In US time diaries from 1965 to 2003, men gained leisure mostly through less paid work, and women mostly through less unpaid household work.',
      refs: ['aguiarhurst2007'],
    }],
    limitation: { text: 'Paid hours per worker exclude people outside employment. The US diaries use a different denominator and period. Neither measures how rushed or demanding work felt.', refs: ['pwt11', 'aguiarhurst2007'] },
    readingNote: 'The comparison shows hours per employed person. The historical US time-diary study instead includes people outside paid employment, so its hours cannot be placed on the same scale.',
  },
  'education-and-pay': {
    headline: 'Women’s education advantage can coexist with lower hourly pay',
    scope: 'EU education and pay statistics, with research on how employers reward working time.',
    finding: {
      text: 'In the EU in 2024, 49.8% of women aged 25–34 had tertiary qualifications, compared with 38.6% of men. In a separate analysis for 2022, Eurostat reports a 12.2% overall hourly pay gap and a larger gap among managers.',
      refs: ['eurostatGender'],
    },
    explanationTitle: 'The value of being available at the right time',
    explanation: [{
      text: 'Claudia Goldin points to jobs where working long hours or being available at particular times earns a disproportionate premium. When people with similar qualifications take jobs with different scheduling demands, their pay can diverge. Goldin finds that this feature varies across professions.',
      refs: ['goldin2014'],
    }],
    limitation: { text: 'The EU education and pay figures use different populations and years. The pay gap is an unadjusted average. Those statistics cannot isolate the shares due to scheduling, occupational choices, discrimination or other factors.', refs: ['eurostatGender', 'goldin2014'] },
    readingNote: 'Compare Figure 1 and Figure 7 in Eurostat’s report. The first measures educational attainment among young adults. The second measures hourly earnings gaps across a wider working population.',
  },
  'global-danger': {
    headline: 'Armed conflicts became more widespread while childhood became safer',
    scope: 'Two global risks with different measures and time windows.',
    finding: {
      text: 'PRIO counted 59 active state-based conflicts in 2023, the most in its 1946–2023 series. Yet the global under-five mortality rate fell to 37.4 deaths per 1,000 live births in 2024, less than half its 2000 level.',
      refs: ['rustad2024', 'whoChildMortality'],
    },
    explanationTitle: 'A global average can hide very different risks',
    explanation: [{
      text: 'The number of active conflicts says little about how many people each conflict kills. In 2023, the wars in Ukraine and Gaza accounted for much of the toll. At the same time, better child survival can improve the global average even while children in conflict-affected settings face much higher risks.',
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
    explanationTitle: 'A weaker start can show up on both sides of the balance sheet',
    explanation: [{
      text: 'Income is the money coming in. Wealth is assets minus debts. The two can move differently, and this study found a shortfall in both earnings and accumulated wealth. Millennials reached working age around the Great Recession, which gives the comparison important economic context.',
      refs: ['kurz2018'],
    }],
    limitation: { text: 'This study compares US cohorts at similar ages using data available in 2018. It leaves open whether they caught up later, whether younger cohorts follow the same path, and whether the pattern holds in other countries.', refs: ['kurz2018'] },
    readingNote: 'Use the study’s age-matched comparisons. Comparing a young buyer with their parents’ wealth today would mix a difference between generations with decades of extra time to save.',
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
    headline: 'Once countries are rich, income alone tells us little about how many children people have',
    scope: 'Long-run fertility trends and comparative research on high-income countries.',
    finding: {
      text: 'In the historical series reviewed by Doepke and colleagues, fertility fell as countries industrialised. But among wealthy countries since the late twentieth century, some remained much closer to replacement fertility than others even as incomes rose.',
      refs: ['doepke2022'],
    },
    explanationTitle: 'The cost of combining a family and a career',
    explanation: [{
      text: 'The review identifies several conditions that can make it easier to have children while keeping a career: family policies, more sharing of care, supportive social norms and flexible work. That helps explain why countries with similar incomes can have different fertility rates.',
      refs: ['doepke2022'],
    }],
    limitation: { text: 'The study identifies several possible drivers, with no single explanation for every wealthy country. An annual fertility rate can also fall when people postpone births, even if their eventual family size falls less.', refs: ['doepke2022'] },
    readingNote: 'Read the review’s long-run fertility series alongside its comparison of wealthy countries. The first shows the historical transition; the second shows why the old income pattern is a poor guide to differences between rich countries today.',
  },
}
