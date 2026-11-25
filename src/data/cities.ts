// "The surprising science of cities". Every figure is checked against the cited source; see the PR's source audit.
import type { ChapterQuestion } from './menWomen'

/** Applied Geography (2026), Barcelona pedestrianized vs matched streets, 2014–2022. Directions only: the abstract gives no magnitudes. */
export const PEDESTRIAN = [
  { id: 'closures', label: 'Shop closures', effect: 'up' },
  { id: 'diversity', label: 'Variety of shops', effect: 'down' },
  { id: 'openings', label: 'New openings', effect: 'none' },
  { id: 'leisure', label: 'Bars, cafés and leisure', effect: 'none' },
] as const
/** Free-transit preprint (OSF, 2025), older adults in 7 Brazilian metro areas: relative change in trips at the eligibility age. */
export const FREEFARE = { transit: 9.4, walking: -9.3, car: 0, transitShorter: 8.2 } as const
/** Building and Environment (2026), Hong Kong: emissions per person fall with height, then plateau. */
export const HEIGHT = { plateauLow: 36, plateauHigh: 55, storeysLow: 10, storeysHigh: 15, buildings: 172_530 } as const
/** Journal of Economic Geography (2022), Dutch widenings: regional elasticities 6 years after a widening. */
export const ROADS = { capacity: 10, flowElasticity: 0.5, timeElasticity: 0.7, years: 6, lanesBefore: 4.4, lanesAfter: 6.5, peakTime: -25, dayTime: -10 } as const
/** Bike-lane studies: what each city measured. */
export const BIKE_CITIES = [
  { id: 'bogota', city: 'Bogotá', what: 'Bike lanes on main corridors, 2020', stat: '−19%', statLabel: 'car speed on modified roads, at most (−4.5 km/h)', also: 'Some parallel roads got faster.' },
  { id: 'berlin', city: 'Berlin', what: 'Pop-up bike lanes replacing car lanes', stat: '−8 to −12 pts', statLabel: 'average car speed, percentage points (up to −16 at peak)', also: 'No significant change in car volume in most specifications. Accident results were inconclusive.' },
  { id: 'paris', city: 'Paris', what: 'Over 1,000 km of bike paths plus wider road-space reforms', stat: 'up to −53%', statLabel: 'car traffic on the network, 2010–2023', also: 'Congestion rose in the centre and fell in the outer zone studied, with no gridlock.' },
] as const
/** NBER w34503 (2025): share of within-country wage differences between cities explained by the city itself. */
export const CITY_WAGES = { low: 45, high: 73, workers: 513, countries: 191 } as const
/** Geophysical Research Letters (2024): modelled change in London's average 2 m air temperature on two hot days in 2018. */
export const COOLING = [
  { id: 'cool', label: 'Cool (reflective) roofs', change: -1.2 },
  { id: 'solar', label: 'Solar panels on roofs', change: -0.5 },
  { id: 'trees', label: 'Street-level vegetation', change: -0.3 },
  { id: 'green', label: 'Green roofs', change: 0 },
  { id: 'ac', label: 'Air conditioning everywhere', change: 0.15 },
] as const
/** Journal of Regional Science (2025): income per person in 2019 for a municipality with median tourism growth. */
export const TOURISM = { low: 18, high: 21, year: 2019 } as const

const PEDESTRIAN_URL = 'https://doi.org/10.1016/j.apgeog.2026.103947'

export const CITIES_QUESTIONS: readonly ChapterQuestion[] = [
  {
    id: 'ct-pedestrian',
    kind: 'choice',
    short: 'Car-free streets',
    question: 'Are car-free streets good for local shops?',
    prompt: 'Barcelona pedestrianized dozens of streets. Researchers compared them with similar streets that kept their traffic, using the city’s commercial census from 2014 to 2022. What happened to the shops?',
    options: [
      { id: 'boom', label: 'More shops opened and the mix got richer' },
      { id: 'churn', label: 'More shops closed and the mix got narrower' },
      { id: 'bars', label: 'Bars and cafés replaced ordinary shops' },
      { id: 'none', label: 'Nothing much changed' },
    ],
    answer: 'churn',
    finding: 'More shops closed and the variety of shops fell.',
    takeaway: 'But there was no wave of new openings and no rise in bars and leisure businesses, so it wasn’t a full “commercial gentrification”. The authors found tourist pressure mattered more than pedestrianization in pushing streets towards leisure shops.',
    visual: 'pedestrian',
    evidence: {
      citation: 'The effects of pedestrianization on commercial dynamics: a quasi-experimental study in Barcelona (2026), Applied Geography',
      url: PEDESTRIAN_URL,
      sample: 'Pedestrianized streets in Barcelona matched with comparable streets that weren’t, using commercial census data from 2014 to 2022.',
      method: 'Quasi-experimental comparison of closures, openings, retail diversity and the share of leisure businesses on treated and control streets.',
      limitation: 'One city, and the published abstract reports directions rather than sizes. It looks at shop turnover, not sales or footfall, which other studies find can rise.',
    },
  },
  {
    id: 'ct-freefare',
    kind: 'choice',
    short: 'Free transit',
    question: 'Does free public transport get people out of their cars?',
    prompt: 'In Brazil, older adults ride buses and trains for free once they reach an age threshold. Comparing people just above and just below that age across seven metropolitan areas, where did the extra transit trips come from?',
    options: [
      { id: 'drivers', label: 'Mostly people who used to drive' },
      { id: 'walkers', label: 'Mostly people who used to walk' },
      { id: 'both', label: 'Drivers and walkers equally' },
      { id: 'none', label: 'Free fares didn’t increase transit use' },
    ],
    answer: 'walkers',
    finding: 'Mostly from walking. Car use didn’t change significantly.',
    takeaway: 'Transit trips rose by about 9% and walking trips fell by about 9%, while car trips and car ownership showed no significant change. That’s one group, older adults, in one country. Other fare policies, cities and age groups can behave differently.',
    visual: 'freefare',
    evidence: {
      citation: 'The effects of fare-free transit on the travel behavior of older adults (2025), Journal of Environmental Economics and Management',
      url: 'https://doi.org/10.1016/j.jeem.2025.103239',
      more: [{ citation: 'Open preprint with the figures shown (OSF, 2025)', url: 'https://doi.org/10.31219/osf.io/pywm7_v2' }],
      sample: '11 household travel surveys from seven Brazilian metropolitan areas, covering about a quarter of Brazil’s population.',
      method: 'Regression discontinuity around age-based eligibility thresholds, which vary by sex and city. In the preprint, transit trips rose 9.4% and walking trips fell 9.3% (relative changes), and transit trips became 8.2% shorter.',
      limitation: 'The figures come from the open preprint; the final journal version is paywalled and may report slightly different numbers. The result describes older adults, not commuters or the whole population.',
    },
  },
  {
    id: 'ct-height',
    kind: 'choice',
    short: 'Skyscrapers',
    question: 'Are taller buildings always greener?',
    prompt: 'Tall buildings cost a lot of carbon to build and run, but they put homes, jobs and shops close together, which cuts travel. Researchers estimated the full carbon footprint of all 172,530 buildings in Hong Kong. What happened as buildings got taller?',
    options: [
      { id: 'taller', label: 'The taller, the lower the carbon per person' },
      { id: 'plateau', label: 'Carbon fell with height, then stopped falling' },
      { id: 'worse', label: 'Taller buildings always meant more carbon' },
      { id: 'flat', label: 'Height made no difference' },
    ],
    answer: 'plateau',
    finding: 'Carbon per person fell with height, until about 10–15 storeys.',
    takeaway: 'Above roughly 36–55 metres, the extra carbon of building and running super-tall towers cancelled out the transport savings from living closer together. That’s an association in one very dense city, not a universal ideal height, and height isn’t the same thing as density.',
    visual: 'height',
    evidence: {
      citation: 'The life-cycle carbon footprint of tall buildings: Insights from a high-density city (2026), Building and Environment',
      url: 'https://doi.org/10.1016/j.buildenv.2026.114417',
      sample: 'All 172,530 buildings in Hong Kong, grouped into 1,622 street blocks and 209 planning units.',
      method: 'Simulated building carbon (construction and operation) checked against metered energy use, plus transport carbon from travel surveys and consumer goods, in regressions controlling for density, land use, street network and demographics.',
      limitation: 'Observational and a single, unusually dense city. The point where benefits level off may differ elsewhere.',
    },
  },
  {
    id: 'ct-roads',
    kind: 'choice',
    short: 'Wider roads',
    question: 'Do wider roads just fill up with more traffic?',
    prompt: 'The Netherlands widened many highways after 2000. Researchers tracked detector loops on the roads for six years after each widening. What happened?',
    options: [
      { id: 'more-slower', label: 'More traffic, and journeys got slower' },
      { id: 'more-same', label: 'More traffic, and journey times went back to before' },
      { id: 'more-faster', label: 'More traffic, and journeys got faster' },
      { id: 'less-faster', label: 'Less traffic, and journeys got faster' },
    ],
    answer: 'more-faster',
    finding: 'Traffic grew, and journeys still got faster for at least six years.',
    takeaway: 'Traffic rose, but by less than the added capacity, so travel times kept most of their gains throughout the six years studied. Theory predicts the gains may shrink over longer periods, which this study couldn’t observe. A British study of 2001–2020 also found more driving after capacity increases, without the cost of driving rising above where it started.',
    visual: 'roads',
    evidence: {
      citation: 'Do highway widenings reduce congestion? (2022), Journal of Economic Geography',
      url: 'https://doi.org/10.1093/jeg/lbac034',
      more: [{ citation: 'Highway Traffic in Britain: The Effect of Road Capacity Changes (2025), working paper', url: 'https://doi.org/10.2139/ssrn.5338566' }],
      sample: 'Detector-loop data from Dutch highways. A widening adds about 50% more lanes to a stretch of road and about 10% more road capacity to its 20 km region.',
      method: 'Before-and-after event study. Six years on, the regional elasticity of traffic flow was about 0.5 and of travel time about −0.7. On one example road, going from 4.4 to 6.5 lanes cut peak travel times by 25%. Welfare gains covered 40% of construction costs within six years.',
      limitation: 'Covers six years only. Traffic volume, congestion and journey time are different measures, and long-run effects may differ.',
    },
  },
  {
    id: 'ct-bikelanes',
    kind: 'choice',
    short: 'Bike lanes',
    question: 'Do bike lanes necessarily make citywide congestion worse?',
    prompt: 'When a city gives a car lane to bikes, cars on that street have less room. Looking across studies from Bogotá, Berlin and Paris, what happens beyond that street?',
    options: [
      { id: 'worse', label: 'Congestion always gets worse across the city' },
      { id: 'varies', label: 'Cars slow on that street, but the citywide effect varies' },
      { id: 'better', label: 'Traffic always flows faster across the city' },
      { id: 'nothing', label: 'Cars aren’t affected at all' },
    ],
    answer: 'varies',
    finding: 'Cars usually slow on the street itself. Citywide, it depends.',
    takeaway: 'In Bogotá, cars slowed on the modified roads but some parallel roads got faster. In Berlin, car speeds fell but the number of cars didn’t change significantly. In Paris, much less car traffic used a much smaller network, and congestion rose in the centre but fell further out. Local speed, citywide congestion, how many people travel and safety are different measures.',
    visual: 'bikelanes',
    evidence: {
      citation: 'Bogotá: Cities (2024)',
      url: 'https://www.sciencedirect.com/science/article/pii/S0264275124005109',
      more: [
        { citation: 'Berlin: The Causal Effect of Cycling Infrastructure on Traffic and Accidents (Schrauth, 2023), working paper', url: 'https://doi.org/10.2139/ssrn.4333192' },
        { citation: 'Paris: Effects of Paris’ Cycling Policies on Vehicular Flow (Natterer, Loder & Bogenberger, 2025), Transportation Research Record', url: 'https://doi.org/10.1177/03611981251356507' },
      ],
      sample: 'Bogotá: traffic speeds on modified and comparable roads, 2019 vs 2021. Berlin: geocoded traffic data around pop-up lanes. Paris: road detector data, 2010 vs 2023.',
      method: 'Bogotá: spatial statistical models, maximum fall of 4.5 km/h (19%). Berlin: difference-in-differences, average car speed down 8–12 percentage points, up to 16 at peak. Paris: network capacity analysis; per-lane capacity down 34–50% and traffic down by up to 53%.',
      limitation: 'Bogotá and Berlin are pandemic-era lanes; Berlin is a working paper. Paris reflects wider road-space reforms and other changes such as COVID and home working, not bike lanes alone. Its abstract says overall congestion didn’t increase, while its earlier versions found a rise in the centre. Results don’t generalize to every bike-lane project.',
    },
  },
  {
    id: 'ct-wages',
    kind: 'choice',
    short: 'City wages',
    question: 'Do big cities pay more, or do they just attract higher earners?',
    prompt: 'Workers in some cities earn far more than in others. Using the job histories of 513 million workers in 191 countries, and following people who moved, researchers split the gap into the city itself and the kind of people who live there. Within a country, how much of the wage gap between cities is due to the city itself?',
    options: [
      { id: 'little', label: 'Very little, under 10%' },
      { id: 'quarter', label: 'About a quarter' },
      { id: 'most', label: 'About half to three-quarters' },
      { id: 'all', label: 'Nearly all of it' },
    ],
    answer: 'most',
    finding: 'Between 45% and 73%, depending on the country.',
    takeaway: 'Place matters a lot, but the rest of the gap reflects who lives there. These are differences in pay, not in what money buys after housing and other costs, and they’re averages: moving doesn’t guarantee any individual a raise. Gaps between cities are much wider in poorer countries.',
    visual: 'citywage',
    evidence: {
      citation: 'The Global Value of Cities (2025), NBER Working Paper 34503',
      url: 'https://doi.org/10.3386/w34503',
      sample: 'Job histories of 513 million workers across 220,000 locations in 191 countries.',
      method: 'Event study of workers who moved between cities, separating place-based pay premiums from who sorts into each city.',
      limitation: 'A working paper. It measures earnings, not purchasing power or wellbeing, and the share varies across countries.',
    },
  },
  {
    id: 'ct-cooling',
    kind: 'choice',
    short: 'Cooling',
    question: 'What cools a city best on a hot day?',
    prompt: 'Researchers simulated London on two hot days in summer 2018 and tested nine ways of cooling it. Which one lowered the city’s average outdoor air temperature the most?',
    options: [
      { id: 'cool', label: 'Painting roofs white or reflective' },
      { id: 'green', label: 'Covering roofs with plants' },
      { id: 'solar', label: 'Putting solar panels on roofs' },
      { id: 'trees', label: 'More vegetation at street level' },
    ],
    answer: 'cool',
    finding: 'Reflective roofs: about 1.2°C cooler on average.',
    takeaway: 'Solar panels came next at about 0.5°C, then street-level vegetation at 0.3°C. Green roofs made almost no difference to the average air temperature, and air conditioning everywhere warmed the air outside by about 0.15°C. This is citywide air temperature only. Trees also give shade, comfort and habitat that this measure doesn’t capture.',
    visual: 'cooling',
    evidence: {
      citation: 'Cool Roofs Could Be Most Effective at Reducing Outdoor Urban Temperatures in London (2024), Geophysical Research Letters',
      url: 'https://doi.org/10.1029/2024gl109634',
      sample: 'The Greater London Authority area on two hot days in summer 2018.',
      method: 'WRF BEP-BEM urban climate model of air temperature 2 metres above the ground, comparing nine roof-top, street and building interventions.',
      limitation: 'A model, not measurements, for one city and two days. The authors note today’s practicable deployments of green roofs and solar panels are too small to cool the city much.',
    },
  },
  {
    id: 'ct-tourism',
    kind: 'choice',
    short: 'Tourism',
    question: 'Does tourism make a town richer?',
    prompt: 'Since the 1960s many Spanish towns have built their economies around tourists. Researchers estimated how tourism growth changed income per person by 2019. For a town whose tourism grew at the typical (median) rate, what was the estimated effect?',
    options: [
      { id: 'much-higher', label: 'Much higher' },
      { id: 'higher', label: 'A little higher' },
      { id: 'same', label: 'About the same' },
      { id: 'lower', label: 'Lower' },
    ],
    answer: 'lower',
    finding: '18–21% lower income per person, at median tourism growth.',
    takeaway: 'Tourist towns ended up with more temporary contracts, less industry, faster population growth and fewer residents with higher education. That’s income per person, not GDP: a study of Spanish provinces found tourism raised economic growth, though the boost faded where tourist stays per resident were highest. It doesn’t mean every resident got poorer.',
    visual: 'tourism',
    evidence: {
      citation: 'A Country of Waiters: The Economic Consequences of Tourism Specialization (2025), Journal of Regional Science',
      url: 'https://doi.org/10.1111/jors.70029',
      more: [
        { citation: 'Do More Tourists Promote Local Employment? (2025), Journal of Human Resources', url: 'https://doi.org/10.3368/jhr.0423-12851r2' },
        { citation: 'How does tourism specialization affect regional growth paths? (2026), The Annals of Regional Science', url: 'https://doi.org/10.1007/s00168-026-01574-8' },
      ],
      sample: 'Spanish municipalities, comparing tourism exposure since the 1960s and tourism growth in the 1990s and 2000s.',
      method: 'Two strategies: natural amenities such as beaches and climate, and a shift-share design based on foreign residents from tourist-sending countries. A regional study found more tourists added tourism and service jobs but no net jobs or higher wages, as manufacturing shrank.',
      limitation: 'Compares places, not individuals. The provincial study measures GDP growth, a different outcome, for 2002–2018.',
    },
  },
]

export const CITIES_CHAPTER = {
  id: 'science-of-cities',
  title: 'The surprising science of cities',
  summary: 'From traffic and tourism to skyscrapers and shopping streets. How much of what we believe about cities holds up against the evidence?',
  minutes: 7,
  scoring: 'One point per question.',
}
