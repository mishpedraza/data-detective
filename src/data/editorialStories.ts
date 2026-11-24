import { INVESTIGATION_FIGURES } from './investigationFigures'
import { adoptionPenalties, violentCrime2025 } from './studyEvidence'
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
    explanationTitle: 'What was already changing before the birth?',
    explanation: [{
      text: 'Some of the lift was already there a year before birth. The researchers suggest that looking forward to a child or forming a partnership could contribute to that early rise. Accounting for changes such as income, work and partnership made little difference to the longer-run pattern, so the study leaves open why the lift faded.',
      refs: ['myrskyla2014'],
    }],
    limitation: { text: 'The same people are observed over time, but the study cannot say what their lives would have been like without a child. It measures reported happiness and leaves other experiences, such as meaning or the stress of a particular day, open.', refs: ['myrskyla2014'] },
    readingNote: 'Read the time pattern in the study from left to right: several years before birth, around birth, then several years after. This compares changes in people’s own reports over time.',
  },
  'working-hours': {
    figure: INVESTIGATION_FIGURES['working-hours'],
    headline: 'The average worker in Spain puts in fewer hours than in 1970',
    scope: 'Hours per worker in Spain, Germany and the US, 1970–2023.',
    finding: {
      text: 'In Spain, average annual hours per worker fell from about 1,993 in 1970 to 1,638 in 2023, an 18% reduction. Germany and the United States also recorded declines over those years.',
      refs: ['pwt11'],
    },
    explanationTitle: 'What made Spain’s working year shrink faster?',
    explanation: [{
      text: 'Spain’s working year shrank by about 355 hours per worker, compared with 142 in the US. Shorter full-time schedules, a shift toward part-time jobs or fewer weeks worked could all move that average. These data give us the size of the difference and leave its causes open.',
      refs: ['pwt11'],
    }, {
      text: 'Counting hours on the job also misses work at home. In US time diaries from 1965 to 2003, men gained leisure mainly by doing less paid work, while women gained it mainly by doing less unpaid household work. That puts the US figure in context without explaining why Spain’s hours fell further.',
      refs: ['aguiarhurst2007'],
    }],
    limitation: { text: 'The Penn World Table averages hours across people in employment. The US diaries use a different population and period. Neither measures how demanding the work felt.', refs: ['pwt11', 'aguiarhurst2007'] },
    readingNote: 'The country chart uses Penn World Table’s average annual hours worked per person engaged, variable avh. The time diaries follow a different population and measure paid and unpaid work separately.',
  },
  'education-and-pay': {
    figure: INVESTIGATION_FIGURES['education-and-pay'],
    headline: 'Earnings diverged after a first birth in Denmark',
    scope: 'Danish earnings records, with European education and hourly pay figures for context.',
    finding: {
      text: 'Ten years after a first birth, Danish mothers’ gross earnings were about 20% below their estimated path without the birth. The study found little change for fathers.',
      refs: ['kleven2019'],
    },
    explanationTitle: 'Why the earnings gap lasts',
    explanation: [{
      text: 'The Danish researchers found that three changes mattered about equally over the long run. Mothers were less likely to be working, worked fewer hours when employed and earned less per hour. That helps explain why qualifications can coexist with an earnings gap. Goldin’s research shows how jobs that pay a premium for long hours or availability at particular times can widen hourly pay differences. The Danish chart does not measure how much that premium mattered there.',
      refs: ['kleven2019', 'goldin2014'],
    }, {
      text: `Biology doesn’t explain the gap. A follow-up study by the same team found that six to ten years after a child arrived, adoptive mothers’ earnings penalty (${adoptionPenalties.adopted.long}%) was virtually identical to that of mothers who gave birth (${adoptionPenalties.birth.long}%).`,
      refs: ['kleven2021'],
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
      refs: ['rustad2024'],
    },
    explanationTitle: 'A few wars can drive the global toll',
    explanation: [{
      text: 'The end of the Tigray war cut the toll in Ethiopia, one of the deadliest places in 2022. In 2023, the war in Ukraine and the Israel–Palestine conflict together accounted for roughly three quarters of all battle deaths in state-based conflicts. Every active conflict adds one to the count, while a handful of especially deadly wars can drive the death toll.',
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
    explanationTitle: 'The gap with boomers was mostly on the debt side',
    explanation: [{
      text: 'On average, millennial households owed about $25,000 more than boomers at the same age, while their assets were only about $3,000 higher. Similar asset totals can hide a different mix of what people own. Roughly 34% of millennial households owned a home, compared with 48% of boomers. Against Generation X, the bigger shortfall was in assets.',
      refs: ['kurz2018'],
    }],
    limitation: { text: 'This historical US comparison uses averages that can be pulled up by wealthy households. It leaves open whether they caught up later, whether younger cohorts follow the same path, and whether the pattern holds in other countries.', refs: ['kurz2018'] },
    readingNote: 'The study compares earnings, assets and debts separately. Two households can earn the same amount and have very different wealth if one owns more or owes more.',
  },
  'crime-perceptions': {
    figure: INVESTIGATION_FIGURES['crime-perceptions'],
    headline: 'Americans often said crime was up during decades when recorded rates fell',
    scope: 'US public opinion and crime trends, 1993–2026.',
    finding: {
      text: 'Pew found that in 23 of 27 Gallup polls since 1993, at least 60% of US adults said national crime was higher than a year earlier. Across 1993–2022, the FBI’s recorded violent crime rate fell 49%. The national murder rate still had a sharp rise in 2020.',
      refs: ['pewCrime2024', 'gallupCrime'],
    },
    explanationTitle: 'Does the long decline prove people guessed wrong?',
    explanation: [{
      text: 'In October 2023, 77% of respondents said crime rose nationally over the previous year, compared with 55% who said it rose in their own area. To judge whether either group was right, we would need records for the same place, year and kinds of crime. The long decline in recorded violent crime included real short-term reversals, such as the sharp rise in murder in 2020.',
      refs: ['gallupCrime2023', 'pewCrime2024'],
    }, {
      text: `More recently, opinion followed the record down. The FBI estimates violent crime fell ${-violentCrime2025.change}% from 2024 to 2025, the largest one-year drop since its estimates began in ${violentCrime2025.since}. The share telling Gallup crime was rising nationally fell from 77% in 2023 to 46% in 2026.`,
      refs: ['fbi2025', 'gallupCrime2026'],
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
      refs: ['doepke2022', 'oecdFertility'],
    },
    explanationTitle: 'What made work and childcare different in France and Germany?',
    explanation: [{
      text: 'France had crèches and nursery schools that helped parents combine work and care. In a study published in 2002, Jeanne Fagnani found that West Germany had fewer childcare options for toddlers alongside stronger expectations that mothers would care for young children at home. That contrast helps explain why similar incomes could come with different choices about work and children. Eastern Germany had a different history of widespread public childcare, so the West German evidence covers only part of the national picture.',
      refs: ['toulemon2008', 'fagnani2002', 'dorbritz2008'],
    }],
    limitation: { text: 'The studies cannot tell us how much of the national gap in 2000 came from childcare, parental leave or other differences. The annual fertility rate can also fall when people postpone births, even if they eventually have similar-sized families.', refs: ['doepke2022'] },
    readingNote: 'Compare Figure 1, which charts the long-run fertility decline, with Figure 8, which compares affluent countries in 1980 and 2000. In that sample, the income–fertility relationship had reversed by 2000. Recalculated with World Bank data for the same 13 countries, it was still positive in 2024.',
  },
}
