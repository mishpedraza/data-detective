// "Why is housing so expensive?" Every figure is checked against the cited source; see the PR's source audit.
import type { ChapterQuestion } from './menWomen'

/** Bratu, Harjunen & Saarimaa (2023): vacancies per 100 new central market-rate homes, within six rounds of moves. */
export const CHAIN = { bottomHalf: 66, bottomFifth: 31, rounds: 6 } as const
/** Garcia-López et al. (2020), 2012–2016: estimated increases due to Airbnb activity. */
export const AIRBNB = [
  { id: 'rents', label: 'Rents', average: 1.9, top: 7 },
  { id: 'sales', label: 'Sale prices', average: 4.6, top: 17 },
] as const
/** Banco de España Annual Report 2025: price-to-income ratio, 1990s = 100. 2007 is derived from "18.1% below its 2007 peak". */
export const RATIO = [
  { year: '1990s', value: 100, note: 'benchmark' },
  { year: '2007', value: 171, note: 'boom peak' },
  { year: '2025', value: 140, note: 'latest' },
] as const
/** INE, 2021 census (June 2023 release). */
export const VACANT = [
  { id: 'small', label: 'Towns under 10,000 people', people: 20.3, vacant: 45.0 },
  { id: 'cities', label: 'Cities over 250,000 people', people: 23.8, vacant: 10.5 },
] as const
/** OECD Economic Survey of Spain 2025, 2022–2024. */
export const PERMITS = { households: 604_000, permits: 345_000, per100: 57 } as const

export const HOUSING_QUESTIONS: readonly ChapterQuestion[] = [
  {
    id: 'hs-chain',
    kind: 'choice',
    short: 'New homes',
    question: 'Can new market-rate apartments help poorer renters?',
    prompt: 'Helsinki built new, full-price apartment blocks near the city centre. When people moved in, they left their old homes empty for someone else. Who ended up benefiting from the extra housing?',
    options: [
      { id: 'rich', label: 'Only wealthier households' },
      { id: 'both', label: 'Both higher- and lower-income households' },
      { id: 'poor', label: 'Only lower-income households' },
    ],
    answer: 'both',
    finding: 'Both. For every 100 new homes, about 66 homes opened up in poorer-than-average neighbourhoods.',
    takeaway: 'People moving into new homes free up older ones, and those moves set off chains that quickly reached middle- and low-income areas. These were ordinary market-rate homes, not necessarily luxury ones, and the chains were measured in the short run.',
    visual: 'chain',
    evidence: {
      citation: 'Bratu, Harjunen & Saarimaa (2023), Journal of Urban Economics',
      url: 'https://doi.org/10.1016/j.jue.2022.103528',
      sample: '3,196 homes in 106 new market-rate buildings within 3 km of Helsinki Central Station, built 2010–2019, traced through population-wide register data.',
      method: 'Followed each chain of moves for six rounds. Per 100 new homes, about 66 vacancies were created in neighbourhoods with below-median income and 31 in the poorest fifth.',
      limitation: 'One city and short-run effects. It doesn’t show every development has the same benefits, or by how much rents change.',
    },
  },
  {
    id: 'hs-rentcontrol',
    kind: 'choice',
    short: 'Rent control',
    question: 'Can protecting today’s renters make life harder for tomorrow’s?',
    prompt: 'In 1994 San Francisco extended rent control to small apartment buildings built before 1980. Researchers compared them with similar buildings built just after. What happened to the number of homes for rent in the covered buildings?',
    options: [
      { id: 'up', label: 'It increased' },
      { id: 'same', label: 'It stayed about the same' },
      { id: 'down', label: 'It decreased' },
    ],
    answer: 'down',
    finding: 'It fell by 15%, while covered tenants became 20% less likely to move.',
    takeaway: 'Tenants who already had a covered flat gained stability and were less likely to be pushed out of the city. But landlords sold to owner-occupiers, converted or redeveloped, so fewer homes were left for future renters. The authors say this likely pushed market rents up in the long run.',
    visual: 'rentcontrol',
    evidence: {
      citation: 'Diamond, McQuade & Qian (2019), American Economic Review',
      url: 'https://doi.org/10.1257/aer.20181289',
      sample: 'Renters and landlords of small multi-family buildings in San Francisco, built before 1980 (covered) or 1980–1990 (not covered).',
      method: 'Compared otherwise similar buildings on either side of the 1980 construction cut-off, tracking people’s addresses over time.',
      limitation: 'One city and one type of rent control: it capped increases within a tenancy but not between tenants. Other rent-control designs can have different effects.',
    },
  },
  {
    id: 'hs-airbnb',
    kind: 'estimate',
    short: 'Airbnb',
    question: 'How much did Airbnb push up Barcelona’s rents?',
    prompt: 'Between 2012 and 2016 Airbnb spread quickly across Barcelona. By how much did researchers estimate it raised rents in the average neighbourhood?',
    label: 'Rent increase, average neighbourhood',
    actual: 1.9,
    max: 30,
    near: 2,
    far: 5,
    finding: '1.9% on average. But 7% in the neighbourhoods with the most Airbnb.',
    takeaway: 'The effect was small for the city as a whole and concentrated where listings clustered, where sale prices rose an estimated 17%. These are historical estimates for 2012–2016, not Airbnb’s effect today, its share of all rent rises, or what a ban would do.',
    visual: 'airbnb',
    evidence: {
      citation: 'Garcia-López, Jofre-Monseny, Martínez-Mazza & Segú (2020), Journal of Urban Economics',
      url: 'https://doi.org/10.1016/j.jue.2020.103278',
      sample: 'Rents, transaction and asking prices across Barcelona’s neighbourhoods, combined with scraped Airbnb listings.',
      method: 'Fixed-effects, instrumental-variable and event-study designs using where and when listings appeared. A 2026 study (Ouasbaa & Raya, Journal of Housing Economics) also finds short-term listings raise rents, while medium-term listings are linked to lower rents.',
      limitation: 'Covers 2012–2016. Airbnb activity, regulation and the rental market have changed since.',
    },
  },
  {
    id: 'hs-catalonia',
    kind: 'choice',
    short: 'Rent cap',
    question: 'Two studies, one rent cap. Did they agree?',
    prompt: 'In 2020 Catalonia capped rents in its tightest markets. Two research teams studied the same policy. What did they find?',
    options: [
      { id: 'both-same', label: 'Both: rents fell and supply was unaffected' },
      { id: 'both-down', label: 'Both: rents fell and supply fell' },
      { id: 'differ', label: 'Both found lower rents but disagreed about supply' },
    ],
    answer: 'differ',
    finding: 'Both found lower rents, by about 5%. They disagreed about supply.',
    takeaway: 'One found no drop in rental homes. The other found about 10% fewer new contracts as pricier homes left the market, while rents rose at the cheap end. They measured supply differently, and only the first has passed peer review. The law was struck down in 2022; later caps are a different policy.',
    visual: 'twostudies',
    evidence: {
      citation: 'Jofre-Monseny, Martínez-Mazza & Segú (2023), Regional Science and Urban Economics; Monràs & Montalvo (2023), FRBSF Working Paper 2023-28',
      url: 'https://doi.org/10.1016/j.regsciurbeco.2023.103916',
      sample: 'Both use Catalonia’s official register of rental deposits, comparing capped and uncapped municipalities.',
      method: 'Study A: rents paid fell 4–6%, with no fall in signed or ended contracts or the active stock. Study B (working paper, https://doi.org/10.24148/wp2023-28): rents fell about 5%, new contracts about 10%, mostly above the cap’s reference price.',
      limitation: 'The policy ran from September 2020 to March 2022, partly during Covid. Short periods and different supply measures make the evidence genuinely contested.',
    },
  },
  {
    id: 'hs-ratio',
    kind: 'choice',
    short: 'Affordability',
    question: 'Did your parents really have it easier buying a home?',
    prompt: 'Compare Spain’s house prices with household incomes. How much higher is that ratio in 2025 than in the 1990s?',
    options: [
      { id: 'same', label: 'About the same' },
      { id: '40', label: 'About 40% higher' },
      { id: '100', label: 'About twice as high' },
      { id: '200', label: 'About three times as high' },
    ],
    answer: '40',
    finding: '40% higher than in the 1990s, but 18% below the 2007 peak.',
    takeaway: 'Affordability hasn’t worsened in a straight line: it deteriorated sharply in the boom, improved after the crash, and has worsened again since 2015. The ratio leaves out interest rates, deposits and other financing conditions.',
    visual: 'ratio',
    evidence: {
      citation: 'Banco de España, Annual Report 2025 (2026), chapter 2',
      url: 'https://www.bde.es/f/webbe/SES/Secciones/Publicaciones/PublicacionesAnuales/InformesAnuales/25/InfAnual_2025_En.pdf',
      sample: 'OECD price-to-income indicator for Spain, 1980–2025.',
      method: 'House price index divided by household net disposable income per person. 2007 ≈ 171 is calculated from the report’s “18.1% below its 2007 peak”.',
      limitation: 'An average for the whole country; it doesn’t capture mortgage rates, deposits or big-city prices.',
    },
  },
  {
    id: 'hs-vacant',
    kind: 'choice',
    short: 'Empty homes',
    question: 'Millions of empty homes. So why is there a shortage?',
    prompt: 'Spain’s 2021 census counted about 3.8 million empty homes. Compared with where people live, where are they concentrated?',
    options: [
      { id: 'cities', label: 'In big cities, where demand is highest' },
      { id: 'small', label: 'In towns of under 10,000 people' },
      { id: 'even', label: 'Spread about evenly with the population' },
    ],
    answer: 'small',
    finding: 'In small towns: 45% of empty homes, but only 20% of the people.',
    takeaway: 'Cities of over 250,000 people hold almost a quarter of the population but about a tenth of the empty homes. Empty homes in shrinking villages don’t ease shortages in Madrid or Barcelona.',
    visual: 'vacant',
    evidence: {
      citation: 'INE, Censos de Población y Viviendas 2021 (2023)',
      url: 'https://www.ine.es/prensa/censo_2021_jun.pdf',
      sample: 'All 26.6 million homes in Spain on 1 January 2021, classified by a year of electricity consumption.',
      method: 'A home counts as empty with no electricity contract, or less use than an average home there would need for 15 days a year. Homes used occasionally (2.5 million) are counted separately.',
      limitation: 'The only official count, from 2021 during Covid. INE revised the total to 3,828,307 in November 2024; the shares come from the 2023 release.',
    },
  },
  {
    id: 'hs-permits',
    kind: 'estimate',
    short: 'Building',
    question: 'Is Spain building fast enough?',
    prompt: 'Between 2022 and 2024 Spain gained about 604,000 households. For every 100 new households, how many new homes got construction permits?',
    label: 'Permits per 100 new households',
    actual: 57,
    max: 150,
    unit: '',
    near: 5,
    far: 15,
    finding: '57 permits for every 100 new households.',
    takeaway: 'About 345,000 homes were permitted against 604,000 new households. Permits aren’t finished homes, and the gap isn’t a precise measure of the shortage: some households move into existing or empty homes.',
    visual: 'permits',
    evidence: {
      citation: 'OECD Economic Surveys: Spain 2025, chapter 1',
      url: 'https://doi.org/10.1787/abc5c435-en',
      sample: 'National construction permits and net household creation, 2022–2024.',
      method: '345,000 ÷ 604,000 = 57 permits per 100 additional households.',
      limitation: 'A national total. Shortages are concentrated in big cities and tourist areas, and some permitted homes are never built.',
    },
  },
  {
    id: 'hs-auckland',
    kind: 'choice',
    short: 'Zoning',
    question: 'What happens when a city lets more housing be built?',
    prompt: 'In 2016 Auckland, New Zealand, allowed denser housing on about three-quarters of its residential land, and a building boom followed. By 2024, how did rents for new tenancies compare with researchers’ estimate of rents without the reform?',
    options: [
      { id: '23h', label: '23% higher' },
      { id: 'same', label: 'About the same' },
      { id: '5l', label: '5% lower' },
      { id: '23l', label: '23% lower' },
    ],
    answer: '23l',
    finding: '23% lower than the estimated no-reform path.',
    takeaway: 'That doesn’t mean rents fell by 23%: they kept rising, but more slowly than in comparable New Zealand cities. The estimate is for one city and depends on how well other cities stand in for Auckland without the reform.',
    visual: 'auckland',
    evidence: {
      citation: 'Greenaway-McGrevy (2026), Economic Inquiry',
      url: 'https://doi.org/10.1111/ecin.70075',
      sample: 'Weekly rents on new tenancies from New Zealand’s rental bond records, 2017–2024.',
      method: 'Synthetic control: a weighted mix of other New Zealand urban areas estimates Auckland’s rents without the reform. About 127,000 homes were permitted in the 8 years after.',
      limitation: 'One treated city; the size of the gap varies with the specification. Earlier versions were criticised on blogs, and a Motu review found those critiques had little merit.',
    },
  },
]

export const HOUSING_CHAPTER = {
  id: 'why-so-expensive',
  title: 'Why is housing so expensive?',
  summary: 'Everyone has an opinion about housing. How many of those opinions survive the evidence?',
  minutes: 6,
  scoring: 'One point per question. Airbnb: 1 point within 2 points of the real figure, ½ within 5. Building: 1 point within 5 permits, ½ within 15.',
}
