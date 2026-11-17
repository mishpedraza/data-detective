import type { StoryComparison } from '../lib/storyComparison'
import { INVESTIGATION_FIGURES, type EvidenceFigure } from './investigationFigures'
import type { Claim } from './types'

interface SourcedClaim extends Claim {
  refs: [string, ...string[]]
}

export interface ReviewedAnswer {
  headline: string
  scope: string
  finding: SourcedClaim
  explanation: SourcedClaim[]
  limitation: Claim
  explanationTitle: string
  visual?: StoryComparison
  figure?: EvidenceFigure
}

/** Question-level conclusions. Chart selections change descriptive context, not the scope of a study. */
export const REVIEWED_ANSWERS: Readonly<Partial<Record<string, ReviewedAnswer>>> = {
  'immigration-crime': {
    figure: INVESTIGATION_FIGURES['immigration-crime'],
    headline: 'Research finds no consistent rise in overall crime when immigration rises',
    scope: 'The strongest answer is about overall crime. Particular offences and migration waves can look different.',
    finding: {
      text: 'Across two decades of published research, places with more immigration tended to have slightly less crime on average. The link was very weak and varied substantially. The review mostly compares places, so it cannot isolate cause and effect.',
      refs: ['ousey2018'],
    },
    explanationTitle: 'Legal status can change the choices people have',
    explanation: [
      { text: 'In Italy, applicants who just qualified for a residence permit had lower recorded crime than similar applicants who just missed out. A permit opens up legal work, which may change the alternatives people have. Research on two UK migration waves also found different property-crime results under different labour-market conditions. Neither study isolates how much of the effect came from access to work.', refs: ['pinotti2017', 'bell2013'] },
    ],
    limitation: {
      text: 'Police records depend on what gets reported and recorded. The estimates apply to specific offences, places and migration waves. The studies cited here leave open what effect immigration had on homicide in Spain.',
      refs: ['eurostatCrime', 'alonso2012'],
    },
  },
  'housing-affordability': {
    headline: 'A cheaper home than in the 2007 boom can still be hard to afford',
    scope: 'Spain’s national prices, adjusted for inflation, compared with the 2007 boom.',
    finding: { text: 'Spain’s real home-price index was about 13% lower in 2025 than in 2007. Banco de España finds that demand grew against a slow supply response, with especially large pressures in cities and tourist areas.', refs: ['data:house_price_real', 'bde2024'] },
    visual: {
      caption: 'Spanish home prices after inflation · 2007 = 100',
      takeaway: 'This benchmark captures the purchase price before financing.',
      refs: ['data:house_price_real'], measure: 'index', from: 2007, to: 2025,
      rows: [{ indicator: 'house_price_real', label: '2007', endpoint: 'start' }, { indicator: 'house_price_real', label: '2025' }],
    },
    explanationTitle: 'The price is only one part of the monthly bill',
    explanation: [
      { text: 'A lower sale price can still mean a higher monthly payment if mortgage rates rise enough. And a buyer must save for a deposit before monthly payments even enter the picture.', refs: ['data:mortgage_rate'] },
      { text: 'You also have to find a home where you need one. Through 2023, new construction was slow to respond to demand, with especially acute pressure in cities and tourist areas. Households unable to get a mortgage faced a tight rental market too.', refs: ['bde2024'] },
    ],
    limitation: { text: 'A national average leaves out local prices and the deposit a buyer needs. A rental index covering existing contracts can move differently from asking rents for new lets.', refs: ['bde2024', 'data:rent_real'] },
  },
  'growth-wages': {
    headline: 'Spain’s economy grew faster than the buying power of typical hourly pay, 2006–2022',
    scope: 'What the economy produced per person and what an hour’s pay bought in Spain.',
    finding: { text: 'Over 2006–2022, real GDP per person rose 4.8% and median hourly pay rose 1.6%. Average annual wages rose 8.1% on a separately measured series.', refs: ['data:gdp_pc_real', 'data:median_earnings_real', 'data:real_wage'] },
    visual: {
      caption: 'Spain, 2006–2022 · Total change after inflation',
      takeaway: 'Hourly pay captures the middle of the wage distribution. It leaves out changes in hours worked.',
      refs: ['data:gdp_pc_real', 'data:median_earnings_real'], measure: 'change', from: 2006, to: 2022,
      rows: [{ indicator: 'gdp_pc_real', label: 'GDP per person' }, { indicator: 'median_earnings_real', label: 'Median hourly pay' }],
    },
    explanationTitle: 'Why average and typical pay can move apart',
    explanation: [
      { text: 'A rise in high earners’ pay can lift the average without moving the middle wage much. Annual pay also depends on hours worked. These Spanish series use different populations and units, so the figures cannot tell us which explanation accounts for the gap.', refs: ['eurostatNA', 'eurostatSes', 'oecdWages'] },
      { text: 'Boscá and Ferri explain a separate gap in 2007–2024. Employer social contributions added to labour costs, while consumer prices rose faster than the prices Spanish businesses received. Together those factors help explain why higher labour costs translated into little extra purchasing power for average pay per employee.', refs: ['bosca2025'] },
    ],
    limitation: { text: 'The Spanish labour-cost study does not isolate the reasons median hourly pay lagged. Household living standards also depend on hours worked, other earners, taxes and benefits.', refs: ['bosca2025'] },
  },
  'productivity-wages': {
    headline: 'In Spain, labour costs kept up with output per employee while average pay’s buying power barely grew',
    scope: 'Spain, 2007–2024 · The study compares averages per employee.',
    finding: { text: 'Employers’ labour costs rose about 15% and output per employee about 14%, when both were adjusted using the prices of Spanish output.', refs: ['bosca2025'] },
    explanationTitle: 'The pay packet and the employer’s bill measure different things',
    explanation: [{ text: 'Workers pay consumer prices, which rose faster than the prices of Spanish output. Employers’ costs also include social contributions. Those two differences help explain why similar growth in labour costs and output did not produce the same gain in what wages could buy.', refs: ['bosca2025'] }],
    limitation: { text: 'The accounting comparison uses average pay and output per employee. It leaves open how hourly productivity gains translated into median hourly pay.', refs: ['bosca2025'] },
  },
  'immigration-housing': {
    headline: 'Immigration added to Spain’s housing demand, and building responded during the 2000s boom',
    scope: 'The causal estimate covers 2000–2010. Banco de España’s later housing analysis is descriptive.',
    finding: { text: 'A study estimates immigration accounted for about a quarter of the increase in house prices and about half of construction activity in Spain in 2000–2010.', refs: ['gonzalez2013'] },
    explanationTitle: 'More buyers can mean more building, higher prices or both',
    explanation: [{ text: 'Spain built more homes during the earlier boom as demand rose. Where building responds slowly, as Banco de España describes in its later review, extra demand is more likely to push up the price of the homes already there.', refs: ['gonzalez2013', 'bde2024'] }],
    limitation: { text: 'The 2000s estimate does not quantify today’s price or rent effects. The later report does not separate immigration’s contribution from other sources of demand.', refs: ['gonzalez2013', 'bde2024'] },
  },
  'immigration-growth': {
    headline: 'Spain’s foreign population contributed to growth in output per person after the pandemic',
    scope: 'Banco de España’s accounting estimate covers 2022–2024. It measures the contribution of the foreign population, which differs from the annual flow of new arrivals.',
    finding: { text: 'Banco de España estimates a direct contribution of 0.4 to 0.7 percentage points a year to Spain’s 2.9% annual growth in GDP per person in 2022–2024.', refs: ['cuadrado2025'] },
    explanationTitle: 'New arrivals are only part of the story',
    explanation: [{ text: 'What matters for output per person includes how many people work, how many hours they work and what they produce in those hours. The recent contribution reflected both the changing employment circumstances of people who arrived in the early 2000s and the education and jobs of more recent arrivals.', refs: ['cuadrado2025'] }],
    limitation: { text: 'This calculation does not model what the economy would have done without immigration. It leaves the long-run effect on productivity open.', refs: ['cuadrado2025'] },
  },
  'immigration-employment': {
    headline: 'A Spanish study found no clear overall loss of native employment linked to immigration',
    scope: 'The study compares workers in Spain with similar education and experience, 2009–2018.',
    finding: { text: 'The study’s panel estimates found no statistically clear effect on native workers’ employment or wages. Separate yearly estimates gave different results, including negative employment estimates in 2013 and 2014 and a positive one in 2017.', refs: ['atienza2020'] },
    explanationTitle: 'The work people do can change before job totals do',
    explanation: [{ text: 'One reason the total can obscure real changes is that workers can switch tasks. A separate Spanish study found shifts in the kinds of tasks native workers did, with differences by gender, while finding little change in overall employment.', refs: ['amuedo2011'] }],
    limitation: { text: 'The estimates do not rule out losses for particular workers or identify what happened after 2018. National unemployment also includes both native and immigrant workers.', refs: ['atienza2020'] },
  },
  'unemployment-crime': {
    headline: 'Studies link joblessness more clearly to property crime than to violent crime',
    scope: 'The cited studies cover US states and French departments.',
    finding: { text: 'A US state study estimated increases in property crime when unemployment rose. It found much weaker evidence for violent crime.', refs: ['raphael2001'] },
    explanationTitle: 'Losing access to paid work changes the options',
    explanation: [{ text: 'When paid work is harder to find, some offences that bring in money may become more attractive. That is one possible explanation for why a French study linked youth unemployment to burglary, theft and drug offences in 1990–2000. The study estimates changes in offences and cannot tell us why someone committed one.', refs: ['fougere2009'] }],
    limitation: { text: 'Effects for young people or for particular property offences cannot be applied directly to Spain’s overall crime or homicide rates.', refs: ['raphael2001', 'fougere2009'] },
  },
  'inequality-crime': {
    headline: 'More unequal countries often have more violent crime, but the explanation is disputed',
    scope: 'International evidence on homicide, robbery and violent theft.',
    finding: { text: 'One cross-country study found a positive link between inequality, homicide and robbery. A later analysis of robbery and violent theft found that the result weakened when persistent differences across countries were taken into account.', refs: ['fajnzylber2002', 'neumayer2005'] },
    explanationTitle: 'A country comparison can pick up more than inequality',
    explanation: [{ text: 'If long-standing differences between countries affect both their income gaps and their crime rates, comparing them can make the link look stronger. Once a later study accounted for those persistent differences, the result for robbery and violent theft was weaker.', refs: ['fajnzylber2002', 'neumayer2005'] }],
    limitation: { text: 'These studies do not establish that a change in Spain’s national inequality would cause crime to rise or fall. Reporting differences also complicate cross-country comparisons.', refs: ['neumayer2005', 'eurostatCrime'] },
  },
  'europe-us': {
    headline: 'The EU fell behind the US in output per person as productivity growth slowed',
    scope: 'The Draghi report compares the EU as a whole with the US since 2000.',
    finding: { text: 'The Draghi report finds that real disposable income per person grew almost twice as much in the US as in the EU from 2000, alongside a widening output gap.', refs: ['draghi2024'] },
    explanationTitle: 'Technology helps explain the productivity gap',
    explanation: [{ text: 'The report points to technology as a major source of the productivity gap. An output gap still leaves a question about daily life. A pay comparison misses services that households use without buying them directly, such as publicly funded healthcare. The consumption measure includes them.', refs: ['draghi2024', 'data:aic_vs_us'] }],
    limitation: { text: 'The EU result does not establish what happened in each member country. A country can lose ground against the US while its own real income still rises.', refs: ['draghi2024'] },
  },
}
