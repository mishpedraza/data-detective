import type { Relationship } from './types'

const IMMIGRATION = ['foreign_born_share', 'imm_rate', 'net_migration_rate', 'foreign_born', 'imm_inflow']
const CRIME = ['crime_homicide_long', 'crime_homicide', 'crime_robbery', 'crime_theft', 'crime_burglary', 'crime_assault', 'crime_sexual', 'crime_fraud', 'crime_cyber', 'crime_drugs']
const HOUSING = ['house_price_real', 'rent_real', 'price_to_income', 'house_price_nominal', 'rent_nominal', 'price_to_rent']
const GROWTH = ['gdp_real', 'gdp_pc_real', 'productivity']
const JOBS = ['unemployment', 'employment_rate', 'employment']
const LIVING = ['real_wage', 'median_income_real', 'disp_income_real', 'consumption_pps', 'deprivation']

const correlation = { text: 'Two lines moving together, or apart, does not show that one causes the other. Both can be driven by a third factor, such as the business cycle, or the timing can be coincidental.' }

export const RELATIONSHIPS: Relationship[] = [
  {
    id: 'immigration-crime',
    question: 'Does immigration increase crime?',
    shortQuestion: 'Immigration ↔ Crime',
    kicker: 'Immigration and crime',
    left: { dimension: 'immigration', options: IMMIGRATION, default: 'foreign_born_share' },
    right: { dimension: 'crime', options: CRIME, default: 'crime_homicide_long' },
    explain: [
      { text: 'Reviews of the international research find that, on average, places with more immigration do not have more crime: across studies from 1994 to 2014 the association is negative but very weak, and results vary a lot between settings.', refs: ['ousey2018'] },
      { text: 'Studies that try to isolate cause and effect find small, crime-specific effects. In Italy, immigration raised robberies but not overall crime; in the UK, one migration wave led to a modest rise in property crime and another to a small fall, with no effect on violent crime.', refs: ['bianchi2012', 'bell2013'] },
      { text: 'For Spain in 1999–2009, researchers found a significant relationship between immigration and crime, but explained it by the characteristics of different immigrant groups, particularly their human capital, and noted that Spain’s crime rates rose less than in other European countries with similar migration waves.', refs: ['alonso2012'] },
      { text: 'Recorded crime is concentrated among young men in every population. Migrant populations are often younger and more male than the population as a whole, so raw comparisons mix up age with origin.', refs: ['hirschi1983'] },
    ],
    cannot: [
      correlation,
      { text: 'These charts show totals for the whole country. They cannot tell us who committed offences, or whether crime changed in the places where migrants settled.' },
      { text: 'Police-recorded crime depends on how often victims report and how police record offences. Changes in how often victims report offences, or in how police record them, can look like changes in crime.', refs: ['eurostatCrime'] },
    ],
  },
  {
    id: 'immigration-housing',
    question: 'Does immigration make housing more expensive?',
    shortQuestion: 'Immigration ↔ Housing',
    kicker: 'Immigration and housing',
    left: { dimension: 'immigration', options: IMMIGRATION, default: 'imm_rate' },
    right: { dimension: 'housing', options: HOUSING, default: 'house_price_real' },
    explain: [
      { text: 'More people need more homes. For Spain’s 2000–2010 boom, one study estimates that immigration accounted for about a quarter of the rise in house prices and about half of construction activity.', refs: ['gonzalez2013'] },
      { text: 'In US cities, an immigrant inflow equal to 1% of the population was associated with rents and house values about 1% higher.', refs: ['saiz2007'] },
      { text: 'Credit conditions matter a great deal too: cheap mortgages after joining the euro fed the boom, and the 2008–2014 banking crisis followed its collapse.', refs: ['bde2017'] },
    ],
    cannot: [
      correlation,
      { text: 'National averages hide large regional differences. Prices in Madrid, Barcelona, the Balearics or the coast can move very differently from the rest of Spain.' },
      { text: 'Spain’s official rent index covers rents on all existing contracts, so it rises more slowly than the rents new tenants are actually offered.' },
      { text: 'Housing supply (construction, land, regulation) and demand from investors and tourist lets are not shown here, but affect prices.' },
    ],
  },
  {
    id: 'immigration-growth',
    question: 'Has immigration contributed to economic growth?',
    shortQuestion: 'Immigration ↔ Economic growth',
    kicker: 'Immigration and the economy',
    left: { dimension: 'immigration', options: IMMIGRATION, default: 'imm_rate' },
    right: { dimension: 'economy', options: GROWTH, default: 'gdp_real' },
    explain: [
      { text: 'More workers produce more output, so total GDP tends to grow when the working-age population grows. Whether average living standards rise depends on GDP per person and productivity. Switch the right-hand chart to compare them.' },
      { text: 'Surveys of the research find that immigration’s effects on natives’ wages and employment are small on average, while effects on public finances depend on migrants’ age and employment.', refs: ['kerr2011'] },
      { text: 'Migration to Spain also responds to the economy: arrivals rose during booms and fell sharply after 2008, so causality can run in both directions.' },
    ],
    cannot: [
      correlation,
      { text: 'Because migrants move to where jobs are, a positive association partly reflects growth attracting migrants, not only migrants creating growth.' },
      { text: 'These figures cannot separate the contribution of immigrants from that of other factors such as tourism, EU funds or interest rates.' },
    ],
  },
  {
    id: 'immigration-employment',
    question: 'Does immigration take jobs from locals?',
    shortQuestion: 'Immigration ↔ Employment',
    kicker: 'Immigration and jobs',
    left: { dimension: 'immigration', options: IMMIGRATION, default: 'imm_rate' },
    right: { dimension: 'economy', options: JOBS, default: 'unemployment' },
    explain: [
      { text: 'Studying Spain’s late-1990s immigration surge, researchers found no significant negative effect of immigration on native workers’ employment rates.', refs: ['carrasco2008'] },
      { text: 'Immigration to Spain shifted natives towards different tasks and occupations rather than simply displacing them.', refs: ['amuedo2011'] },
      { text: 'Spain’s unemployment is dominated by the business cycle: the construction bust after 2008 and the euro crisis pushed it to 26% in 2013, as immigration fell.' },
    ],
    cannot: [
      correlation,
      { text: 'National unemployment mixes natives and migrants. These charts cannot show effects on specific groups, such as low-skilled or young workers.' },
      { text: 'Migrants respond to job opportunities, so immigration tends to fall when unemployment rises. That makes simple correlations misleading about causes.' },
    ],
  },
  {
    id: 'growth-wages',
    question: 'Is the economy growing while ordinary people get poorer?',
    shortQuestion: 'Economic growth ↔ Real wages',
    kicker: 'Growth and living standards',
    left: { dimension: 'economy', options: ['gdp_pc_real', 'gdp_real', 'productivity'], default: 'gdp_pc_real' },
    right: { dimension: 'living', options: LIVING, default: 'real_wage' },
    defaultCompare: 'PT',
    explain: [
      { text: 'In many OECD countries, wages for the typical worker have grown more slowly than productivity since the 1990s, partly because of technology, globalisation and weaker worker bargaining power.', refs: ['oecd2018'] },
      { text: 'Average wages can rise during a recession simply because lower-paid jobs disappear first. This composition effect can make 2009–2010 look better for workers than it was.' },
      { text: 'Spain raised its minimum wage by 22% in 2019 and further in later years, which lifts pay at the bottom more than the average.', refs: ['rd2018'] },
    ],
    cannot: [
      correlation,
      { text: 'Average wages, median income and household income measure different things. A rising average can coexist with stagnant pay for many workers.' },
      { text: 'Inflation measures are national averages. Households that spend more on rent or energy may have lost more purchasing power than these figures show.' },
    ],
  },
  {
    id: 'productivity-wages',
    question: 'Have wages kept pace with productivity?',
    shortQuestion: 'Productivity ↔ Real wages',
    kicker: 'Productivity and pay',
    left: { dimension: 'economy', options: ['productivity', 'gdp_pc_real'], default: 'productivity' },
    right: { dimension: 'living', options: LIVING, default: 'real_wage' },
    explain: [
      { text: 'Economic theory links pay to productivity over the long run, but in many OECD countries median wages have grown more slowly than productivity.', refs: ['oecd2018'] },
      { text: 'Spain’s productivity growth has been slow by European standards, which limits how fast real wages can grow sustainably.' },
    ],
    cannot: [
      correlation,
      { text: 'Productivity is measured per hour worked for the whole economy, while wages are averages per full-time employee. Hours, prices used for deflation and the self-employed are treated differently.' },
    ],
  },
  {
    id: 'unemployment-crime',
    question: 'Does unemployment drive crime?',
    shortQuestion: 'Unemployment ↔ Crime',
    kicker: 'Jobs and crime',
    left: { dimension: 'economy', options: ['unemployment', 'employment_rate'], default: 'unemployment' },
    right: { dimension: 'crime', options: CRIME, default: 'crime_robbery' },
    explain: [
      { text: 'US evidence finds that higher unemployment raises property crime.', refs: ['raphael2001'] },
      { text: 'During Sweden’s 1990s crisis, unemployment affected some property crimes such as burglary and car theft, but not all crime.', refs: ['oster2007'] },
      { text: 'In Spain, unemployment tripled between 2007 and 2013 while recorded homicide kept falling. Property crime was more mixed.' },
    ],
    cannot: [
      correlation,
      { text: 'Crime data by category for Spain starts only in 2008, so the boom years cannot be compared directly.' },
      { text: 'Recession also changes policing budgets, opportunities for theft and reporting behaviour.' },
    ],
  },
  {
    id: 'inequality-crime',
    question: 'Does inequality increase crime?',
    shortQuestion: 'Inequality ↔ Crime',
    kicker: 'Inequality and crime',
    left: { dimension: 'living', options: ['gini'], default: 'gini' },
    right: { dimension: 'crime', options: CRIME, default: 'crime_robbery' },
    explain: [
      { text: 'Across countries, higher income inequality is associated with higher rates of homicide and robbery, even after accounting for other factors.', refs: ['fajnzylber2002'] },
      { text: 'Within one country over time, inequality changes slowly, so year-to-year links are hard to detect.' },
    ],
    cannot: [
      correlation,
      { text: 'Spain’s Gini coefficient moves within a narrow band. Small changes in a survey measure are hard to link to crime trends.' },
    ],
  },
]

export const CUSTOM_RELATIONSHIP: Relationship = {
  id: 'custom',
  question: 'How do these move together?',
  shortQuestion: 'Your own comparison',
  kicker: 'Your comparison',
  left: { dimension: 'immigration', options: [], default: 'foreign_born_share' },
  right: { dimension: 'crime', options: [], default: 'crime_homicide_long' },
  explain: [{ text: 'No curated research summary for this pairing yet. Use the charts and data notes to explore it, and treat any pattern as a starting point for questions.' }],
  cannot: [correlation],
}

export const relationshipById = (id: string) => RELATIONSHIPS.find((r) => r.id === id) ?? CUSTOM_RELATIONSHIP
