export type Outcome = 'total' | 'property' | 'violent' | 'robbery' | 'victimisation' | 'reoffending'
export type Status = 'peer-reviewed' | 'review'
export type Design = 'causal' | 'association' | 'review'

export interface Study {
  id: string
  authors: string
  year: number
  title: string
  outlet: string
  url: string
  status: Status
  design: Design
  scope: 'Spain' | 'Europe' | 'Review'
  place: string
  period: string
  outcomes: Outcome[]
  headline: string
  finding: string
  method: string
  limitations: string
}

export const OUTCOME_LABEL: Record<Outcome, string> = {
  total: 'Total recorded crime',
  property: 'Property crime',
  violent: 'Violent crime',
  robbery: 'Robbery',
  victimisation: 'Survey-reported victimisation',
  reoffending: 'Reoffending by immigrants',
}

export const STATUS_LABEL: Record<Status, string> = {
  'peer-reviewed': 'Peer-reviewed article',
  review: 'Invited review article',
}

export const DESIGN_LABEL: Record<Design, string> = {
  causal: 'Designed to estimate cause and effect',
  association: 'Association with statistical controls',
  review: 'Summary of many studies',
}

const doi = (d: string) => `https://doi.org/${d}`

export const SYNTHESIS: { lead: string; text: string }[] = [
  { lead: 'Mostly little or no effect on overall crime.', text: 'Studies designed to separate cause from coincidence mostly find that immigration does not raise overall local crime rates, or changes them only slightly and for particular offences.' },
  { lead: 'But there are exceptions.', text: 'The main study of Spain (1999–2009) found that recorded crime rose with the immigrant share, depending on immigrants’ origin. In Germany, crime rose slightly a year after the 2015–16 refugee inflow.' },
  { lead: 'Who migrates, and on what terms, matters.', text: 'Effects differ with migrants’ education, language and job prospects. In Italy, gaining legal status lowered immigrants’ offending.' },
  { lead: 'Not about homicide.', text: 'None of these studies looks at homicide on its own; the Spanish study left it out because numbers per province were too small. Results for property or total crime should not be assumed to hold for homicide or other offences.' },
]

export const STUDIES: Study[] = [
  {
    id: 'alonso2012',
    authors: 'César Alonso-Borrego, Nuno Garoupa & Pablo Vázquez',
    year: 2012,
    title: 'Does Immigration Cause Crime? Evidence from Spain',
    outlet: 'American Law and Economics Review 14(1): 165–191',
    url: doi('10.1093/aler/ahr019'),
    status: 'peer-reviewed',
    design: 'causal',
    scope: 'Spain',
    place: 'Spain, 50 provinces',
    period: '1999–2009',
    outcomes: ['total', 'property'],
    headline: 'Recorded crime rose with immigration, but the link depended on who the immigrants were.',
    finding: 'Provinces where the immigrant share grew more saw more recorded crime in most models. Spanish-speaking immigrants, mostly from Latin America, and to a lesser extent EU15 immigrants were associated with lower crime than other groups. The authors link this to education and cultural proximity, and note that Spain’s crime rose less than in other European countries with similar migration.',
    method: 'Compares how crime and the immigrant share changed together across Spain’s provinces year by year, controlling for the economy, education, urbanisation and population make-up. Uses earlier years of the same data to try to deal with immigration and crime influencing each other.',
    limitations: 'The effect disappears in one of the authors’ own specifications (fixed effects), and the approach relies on internal rather than external instruments. It covers total, property and other crime groupings but excludes homicide, and can only distinguish a few immigrant groups. It covers 1999–2009, so not the post-2015 period.',
  },
  {
    id: 'buonanno2008',
    authors: 'Paolo Buonanno & Daniel Montolio',
    year: 2008,
    title: 'Identifying the socio-economic and demographic determinants of crime across Spanish provinces',
    outlet: 'International Review of Law and Economics 28: 89–97',
    url: doi('10.1016/j.irle.2008.02.005'),
    status: 'peer-reviewed',
    design: 'association',
    scope: 'Spain',
    place: 'Spain, provinces',
    period: '1993–1999',
    outcomes: ['total', 'property'],
    headline: 'Before the main immigration wave, the share of foreigners was one of several factors correlated with crime.',
    finding: 'Past crime, clearance rates, urbanisation and the fraction of foreigners were positively correlated with crime rates. Property crime was better explained by youth unemployment and education.',
    method: 'Statistical model of crime across Spanish provinces over seven years, using the data’s own time structure to address measurement error and two-way influence.',
    limitations: 'Immigration was one of many variables rather than the focus. The authors describe the result as a correlation. It covers the 1990s, when the foreign-born population was a small fraction of today’s.',
  },
  {
    id: 'bianchi2012',
    authors: 'Milo Bianchi, Paolo Buonanno & Paolo Pinotti',
    year: 2012,
    title: 'Do Immigrants Cause Crime?',
    outlet: 'Journal of the European Economic Association 10(6): 1318–1347',
    url: doi('10.1111/j.1542-4774.2012.01085.x'),
    status: 'peer-reviewed',
    design: 'causal',
    scope: 'Europe',
    place: 'Italy, provinces',
    period: '1990–2003',
    outcomes: ['total', 'property', 'robbery', 'violent'],
    headline: 'A correlation with crime appeared in the raw data, but mostly vanished when isolating cause and effect.',
    finding: 'Immigrant population size was positively correlated with property crime and total crime. Once the authors isolated the effect of immigration, only robberies increased, and the effect on total crime was not significantly different from zero.',
    method: 'Uses migration to other destination countries as a stand-in for the part of Italy’s immigration that was not driven by local conditions such as crime itself.',
    limitations: 'Based on police records, which depend on reporting. Results are for Italian provinces in 1990–2003 and may not transfer to other countries or periods.',
  },
  {
    id: 'bell2013',
    authors: 'Brian Bell, Francesco Fasani & Stephen Machin',
    year: 2013,
    title: 'Crime and Immigration: Evidence from Large Immigrant Waves',
    outlet: 'Review of Economics and Statistics 95(4): 1278–1290',
    url: doi('10.1162/rest_a_00337'),
    status: 'peer-reviewed',
    design: 'causal',
    scope: 'Europe',
    place: 'United Kingdom',
    period: 'Late-1990s asylum wave; post-2004 EU accession wave',
    outcomes: ['property', 'violent'],
    headline: 'Two migration waves, two different effects on property crime, and no effect on violent crime.',
    finding: 'The asylum-seeker wave of the late 1990s and early 2000s led to a modest rise in property crime. The post-2004 wave from new EU member states had a small negative effect. Neither changed violent crime.',
    method: 'Studies how crime changed as each wave arrived, and checks whether differences in arrest rates or crimes against immigrants could explain the results.',
    limitations: 'Specific to the UK and to these two groups. The authors attribute the difference to labour-market opportunities, an interpretation rather than a direct test.',
  },
  {
    id: 'nunziata2015',
    authors: 'Luca Nunziata',
    year: 2015,
    title: 'Immigration and crime: evidence from victimization data',
    outlet: 'Journal of Population Economics 28: 697–736',
    url: doi('10.1007/s00148-015-0543-2'),
    status: 'peer-reviewed',
    design: 'causal',
    scope: 'Europe',
    place: 'Western European regions',
    period: 'European Social Survey rounds, 2000s',
    outcomes: ['victimisation'],
    headline: 'Immigration did not change how often natives were victims of crime, but it did increase fear of crime.',
    finding: 'Higher immigration did not affect crime victimisation among natives, but it was associated with more fear of crime, which in turn went with less favourable attitudes towards immigrants.',
    method: 'Uses the European Social Survey and Labour Force Survey across regions, with methods that address migrants settling in particular places and errors in survey measures.',
    limitations: 'Victimisation surveys capture only some offences and rely on what respondents recall and report. Results are regional averages for the 2000s.',
  },
  {
    id: 'mastrobuoni2015',
    authors: 'Giovanni Mastrobuoni & Paolo Pinotti',
    year: 2015,
    title: 'Legal Status and the Criminal Activity of Immigrants',
    outlet: 'American Economic Journal: Applied Economics 7(2): 175–206',
    url: doi('10.1257/app.20140039'),
    status: 'peer-reviewed',
    design: 'causal',
    scope: 'Europe',
    place: 'Italy',
    period: '2006–2007',
    outcomes: ['reoffending'],
    headline: 'Gaining legal status cut reoffending by about half.',
    finding: 'Legal status reduced reoffending by about 50%, and explained one half to two thirds of the gap in crime rates between legal and undocumented immigrants.',
    method: 'Follows foreign prisoners released in Italy’s August 2006 mass clemency. It compares those whose countries joined the EU in January 2007, and so gained legal status, with those from countries that were still candidates.',
    limitations: 'About a specific group, people released from prison. It measures individual reoffending, not overall crime in an area.',
  },
  {
    id: 'pinotti2017',
    authors: 'Paolo Pinotti',
    year: 2017,
    title: 'Clicking on Heaven’s Door: The Effect of Immigrant Legalization on Crime',
    outlet: 'American Economic Review 107(1): 138–168',
    url: doi('10.1257/aer.20150355'),
    status: 'peer-reviewed',
    design: 'causal',
    scope: 'Europe',
    place: 'Italy',
    period: 'Residence-permit “click days”',
    outcomes: ['reoffending'],
    headline: 'Immigrants who obtained a residence permit committed less crime afterwards.',
    finding: 'Legalisation reduced the crime rate of legalised immigrants by 0.6 percentage points, from a baseline of 1.1%.',
    method: 'Permits were granted first come, first served on set “click days” until quotas ran out. Applicants who applied just before and just after the cut-off are otherwise very similar, which gives a near-experimental comparison.',
    limitations: 'Measures crime by the applicants themselves, not total crime. Specific to Italy’s permit system and to people who applied.',
  },
  {
    id: 'lange2024',
    authors: 'Martin Lange & Katrin Sommerfeld',
    year: 2024,
    title: 'Do refugees impact crime? Causal evidence from large-scale refugee immigration to Germany',
    outlet: 'Labour Economics 86: 102466',
    url: doi('10.1016/j.labeco.2023.102466'),
    status: 'peer-reviewed',
    design: 'causal',
    scope: 'Europe',
    place: 'Germany, regions',
    period: 'Refugee inflow peaking 2015–16',
    outcomes: ['total', 'property', 'violent'],
    headline: 'Crime did not change in the year refugees arrived, but rose a little a year later.',
    finding: 'No effect on crime rates in the year of arrival, then an increase one year later. The effect is small per refugee but large in absolute terms, and strongest for property and violent crime. The authors also find some sign of over-reporting.',
    method: 'Uses the official quotas that assigned refugees to German regions to separate the effect of refugee arrivals from where refugees chose to go.',
    limitations: 'Refugees are a distinct group from most migrants to Spain. Possible over-reporting means part of the rise may reflect recording rather than offending.',
  },
  {
    id: 'marie2024',
    authors: 'Olivier Marie & Paolo Pinotti',
    year: 2024,
    title: 'Immigration and Crime: An International Perspective',
    outlet: 'Journal of Economic Perspectives 38(1): 181–200',
    url: doi('10.1257/jep.38.1.181'),
    status: 'review',
    design: 'review',
    scope: 'Review',
    place: 'Several host countries',
    period: 'Recent decades',
    outcomes: ['total'],
    headline: 'Immigrants are over-represented among offenders, yet immigration does not significantly change local crime rates.',
    finding: 'Immigrants, who are often younger, more often male and less educated than natives, are over-represented among offenders in many host countries. But research, including new international data, consistently finds that immigration does not significantly affect local crime rates. Legal status reduces immigrants’ involvement in crime.',
    method: 'Reviews the research and analyses new cross-country data.',
    limitations: 'A summary rather than a single new study. It weighs evidence across countries, so national differences such as Spain’s are averaged out.',
  },
  {
    id: 'ousey2018',
    authors: 'Graham Ousey & Charis Kubrin',
    year: 2018,
    title: 'Immigration and Crime: Assessing a Contentious Issue',
    outlet: 'Annual Review of Criminology 1: 63–84',
    url: doi('10.1146/annurev-criminol-032317-092026'),
    status: 'review',
    design: 'review',
    scope: 'Review',
    place: 'Studies of places (cities, regions)',
    period: 'Studies published 1994–2014',
    outcomes: ['total'],
    headline: 'Across two decades of studies, the average link between immigration and crime is negative but very weak.',
    finding: 'Combining results from many studies, the average association between immigration and crime is negative but very weak, with large variation depending on how studies measured crime, the places studied and the time frame.',
    method: 'Narrative review plus meta-analysis, a statistical pooling of results across studies.',
    limitations: 'Pools mostly associational studies rather than cause-and-effect designs. An average across very different settings may not describe any one country.',
  },
]

export function outcomesFor(indicatorId: string): Outcome[] {
  if (/homicide/.test(indicatorId)) return []
  if (/assault|sexual/.test(indicatorId)) return ['violent']
  if (/robbery/.test(indicatorId)) return ['robbery', 'violent', 'property']
  if (/theft|burglary/.test(indicatorId)) return ['property']
  return []
}
