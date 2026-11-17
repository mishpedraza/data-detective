// Structured evidence library. Two separate questions, two separate mappings:
//   TREND        why did this outcome change? (outcome indicator x geography)
//   RELATIONSHIP did the comparison variable contribute? (driver dimension x outcome indicator)
// Every study id must exist in research.ts and has been checked against the original publication.
// New investigations add entries here; the Interpretation component needs no changes.

export type ExplStatus = 'evidence' | 'documented' | 'method' | 'hypothesis' | 'insufficient'
export type Direction = 'rise' | 'fall' | 'any'
export type Note = { text: string; refs?: string[] }

export interface Explanation {
  lead: string
  /** What changed, when, the mechanism, the evidence and how confident we can be. */
  text: string
  status: ExplStatus
  /** Which movement it explains; shown only when the selected data moves that way. */
  explains: Direction
  /** Shown only when the selection has observations before the end year and from the start year. */
  years?: [number, number]
  refs?: string[]
}

export interface StudyLink {
  id: string
  /** direct: same place and outcome. indirect: informative, but another place, period or outcome. */
  relevance: 'direct' | 'indirect'
  /** What the study covers and, for indirect studies, why it may not transfer. */
  note: string
  /** List under broader evidence, not as the closest research. */
  broader?: boolean
}

export interface TrendEvidence {
  geo: string
  noun: string
  measurement: Note[]
  explanations: Explanation[]
  studies: StudyLink[]
  /** What is missing to explain the trend. */
  gap: string
  /** One-sentence synthesis for the conclusion. */
  summary: string
  /** The movement the summary describes; other selections get a neutral statement. */
  summaryDir: Direction
}

export interface RelationshipEvidence {
  confounders: (Note & { years?: [number, number] })[]
  synthesis: { lead: string; text: string }[]
  studies: StudyLink[]
  gap: string
  causal: string
  uncertain: Note[]
  periods?: [number, number][]
}

const LO2015 = (v: string) => ({ lead: 'The 2015 Criminal Code reform.', text: `The reform abolished minor offences (“faltas”) and reclassified some as minor crimes. The series ${v} Changes that sudden are more likely to reflect recording than behaviour.`, status: 'documented' as const, explains: 'any' as const, years: [2015, 2015] as [number, number], refs: ['lo2015'] })
const REC2010 = (v: string) => ({ lead: 'A recording change in 2010.', text: `The ${v} between 2009 and 2010 is too large to be a real change in behaviour and most likely reflects how offences were classified. Years before 2010 are not comparable with later ones.`, status: 'documented' as const, explains: 'any' as const, years: [2010, 2010] as [number, number] })
const COVID_DROP: Explanation = { lead: 'COVID-19 restrictions in 2020.', text: 'Across 27 cities, including Barcelona, stay-at-home orders went with large falls in most police-recorded crime, and stricter limits on movement predicted larger falls. A 45-city study finds strict lockdowns caused extra falls in robbery, burglary and vehicle theft. These are city estimates for the first months of the pandemic, not a measure of Spain’s national figures.', status: 'evidence', explains: 'any', years: [2020, 2020], refs: ['nivette2021', 'trajtenberg2024'] }
const SECURITY: Explanation = { lead: 'Better security may have reduced opportunities.', text: 'In England and Wales, the spread of effective home security caused much of the fall in burglary from the 1990s, and immobilisers and central locking cut car theft. This “security hypothesis” has not been tested for Spain, so it is a plausible but unconfirmed explanation here.', status: 'hypothesis', explains: 'fall', refs: ['tseloni2017', 'farrell2011'] }
const ECONOMY: Explanation = { lead: 'Economic conditions.', text: 'In Spanish provinces in the 1990s, property crime was better explained by youth unemployment and education than by other factors. Whether the same holds for recent years has not been tested here, and the study measures association, not cause.', status: 'hypothesis', explains: 'any', refs: ['buonanno2008'] }
const EUROPE_PROPERTY: StudyLink = { id: 'aebi2010', relevance: 'indirect', note: 'Western Europe 1988–2007; ends before the period shown.' }
const COVID_STUDIES: StudyLink[] = [
  { id: 'nivette2021', relevance: 'indirect', note: 'Includes Barcelona; 2020 only.' },
  { id: 'trajtenberg2024', relevance: 'indirect', note: 'Cities worldwide; 2020 only.' },
]

export const TREND: Record<string, TrendEvidence> = {
  crime_sexual: {
    geo: 'ES',
    noun: 'sexual violence',
    measurement: [
      { text: 'Counts rape and sexual assault offences recorded by police, mostly after a victim reported them; not victims, arrests, prosecutions or convictions.' },
      { text: 'Most sexual violence is never reported: in Spain’s 2019 survey, 11.1% of women who had experienced non-partner sexual violence said it had been reported to police or courts (8% counting only their own reports). Changes in reporting can therefore move recorded figures a lot.', refs: ['macro2019'] },
    ],
    explanations: [
      { lead: 'More victims reported after #MeToo.', text: 'A causal study of 31 countries, including Spain, finds that the #MeToo movement, from October 2017, raised the number of sex crimes reported to police by roughly 8–10%, and that this reflected more reporting rather than more offences. A US study reaches the same conclusion. Neither gives a separate estimate for Spain, and neither covers the years after 2019.', status: 'evidence', explains: 'rise', years: [2017, 2019], refs: ['levy2026', 'chen2024'] },
      { lead: 'Spain’s victim survey shows no rise from 2015 to 2019.', text: 'In Spain’s national survey of women, 0.57% reported non-partner sexual violence in the previous 12 months in 2015 and 0.51% in 2019, a difference within the margin of error. Over the same years police-recorded sexual violence rose by about 70%. The survey changed some questions and its sampling between editions and covers only women aged 16 and over, so the comparison is approximate.', status: 'evidence', explains: 'rise', years: [2015, 2019], refs: ['macro2019'] },
      { lead: 'The legal definition changed in October 2022.', text: 'Organic Law 10/2022 removed the distinction between sexual “abuse” and sexual “aggression”: every non-consensual sexual act became aggression. Offences previously recorded as abuse can now fall under sexual assault or rape, which can raise these categories without any change in behaviour. No study we found measures how much of the change this explains.', status: 'documented', explains: 'any', years: [2022, 2022], refs: ['lo2022'] },
      { lead: 'The age of consent rose to 16 in 2015.', text: 'The 2015 Criminal Code reform raised the age of sexual consent to 16, so acts that were previously legal became offences. Its size in these figures is unknown.', status: 'documented', explains: 'rise', years: [2015, 2015], refs: ['lo2015'] },
      { lead: 'Whether actual incidence changed after 2019 is unknown.', text: 'We found no comparison of victim surveys covering the post-2019 rise, so part of it could reflect more sexual violence. Comparable repeated surveys would be needed to tell.', status: 'insufficient', explains: 'rise' },
      { lead: 'Population growth alone does not explain it.', text: 'The figures are rates per 100,000 residents, so a larger population does not by itself raise them.', status: 'method', explains: 'rise' },
      { lead: 'No verified explanation for the fall.', text: 'We found no study explaining the decline in recorded sexual violence before 2015. Changes in reporting or recording are possible but untested.', status: 'insufficient', explains: 'fall' },
    ],
    studies: [
      { id: 'levy2026', relevance: 'direct', note: 'Includes Spain’s police data; reporting, not incidence.' },
      { id: 'chen2024', relevance: 'indirect', note: 'United States; may not transfer to Spain.' },
    ],
    gap: 'No study measures how much of Spain’s post-2019 rise, or the 2023 jump in recorded rape, comes from reporting, legal reclassification or actual incidence.',
    summary: 'Research and Spain’s victim survey suggest more reporting contributed to the rise up to 2019; how much, and what drove the later rise, is not established.',
    summaryDir: 'rise',
  },

  crime_homicide: {
    geo: 'ES',
    noun: 'homicide',
    measurement: [
      { text: 'Homicides are hard to conceal, so recorded figures depend less on victims choosing to report than most offences. Numbers are small, a few hundred a year in Spain, so movements of a tenth of a point per 100,000 can be noise.' },
    ],
    explanations: [
      { lead: 'Part of a Western European decline.', text: 'Across 15 Western European countries, homicide rose from the mid-1960s to the early 1990s and has fallen since, for victims of both sexes and all ages. Spain’s fall is consistent with this pattern.', status: 'evidence', explains: 'fall', refs: ['aebi2014', 'aebi2010'] },
      { lead: 'The cause of that decline is not established.', text: 'The same research finds that homicide trends were not related to the usual economic and demographic predictors, and were not driven by young men killed in public places. That weighs against simple explanations such as population ageing. The authors propose changing lifestyles as an explanation, which remains untested.', status: 'insufficient', explains: 'fall', refs: ['aebi2014'] },
      { lead: 'Lockdowns did not reduce homicide.', text: 'In studies of cities worldwide, homicide was the main offence that did not fall under 2020 stay-at-home orders.', status: 'evidence', explains: 'any', years: [2020, 2020], refs: ['nivette2021', 'trajtenberg2024'] },
      { lead: 'Small numbers.', text: 'With a few hundred cases a year, short-term rises and falls can be random variation. We found no study explaining recent movements.', status: 'method', explains: 'rise' },
    ],
    studies: [
      { id: 'aebi2014', relevance: 'indirect', note: '15 Western European countries, 1960–2010; ends before most of the period shown.' },
      { id: 'aebi2010', relevance: 'indirect', note: 'Western Europe 1988–2007.' },
      ...COVID_STUDIES,
    ],
    gap: 'No study explains Spain’s homicide trend specifically, and the drivers of the wider European decline are not established.',
    summary: 'Spain’s homicide decline matches a long Western European fall whose causes researchers have not established.',
    summaryDir: 'fall',
  },

  crime_assault: {
    geo: 'ES',
    noun: 'serious assault',
    measurement: [{ text: 'Recorded when victims report an assault and police classify the injury as serious, so classification practice matters.' }],
    explanations: [
      REC2010('fall'),
      LO2015('spikes in 2015 and falls back in 2016.'),
      { lead: 'COVID-19 restrictions in 2020.', text: 'Evidence for assault is weaker than for property crime: across 27 cities the association between stricter lockdowns and falling assault was not statistically significant, and a 45-city study found strict lockdowns did not reduce assault more than lighter restrictions.', status: 'insufficient', explains: 'any', years: [2020, 2020], refs: ['nivette2021', 'trajtenberg2024'] },
      { lead: 'No verified explanation for the recent rise.', text: 'Recorded violent offences also rose across Western Europe in 1988–2007, which researchers linked to several factors such as young people’s leisure, demographics and heavy drinking. That is an interpretation for an earlier period; we found no study of Spain’s post-2020 rise.', status: 'insufficient', explains: 'rise', refs: ['aebi2010'] },
    ],
    studies: [...COVID_STUDIES, EUROPE_PROPERTY],
    gap: 'No study explains Spain’s recent rise in recorded serious assault, and recording changes in 2010 and 2015 limit comparisons over time.',
    summary: 'Recorded serious assault is dominated by recording changes before 2016; the recent rise has no verified explanation.',
    summaryDir: 'any',
  },

  crime_robbery: {
    geo: 'ES',
    noun: 'robbery',
    measurement: [{ text: 'Recorded when victims report robbery to police. The 2015 Criminal Code reform may affect comparability around that year.', refs: ['lo2015'] }],
    explanations: [
      COVID_DROP,
      ECONOMY,
      { ...SECURITY, text: 'Across Western Europe, property crime fell from the mid-1990s, which researchers linked to socioeconomic change and more household and private security. This has not been tested for Spain’s more recent decline.', refs: ['aebi2010'] },
    ],
    studies: [...COVID_STUDIES, { id: 'buonanno2008', relevance: 'indirect', note: 'Spain, 1993–1999; association only.' }, EUROPE_PROPERTY],
    gap: 'No study explains Spain’s robbery trend after 2010; only the 2020 fall has direct evidence.',
    summary: 'The 2020 fall is well explained by lockdowns; the longer decline has plausible but untested explanations.',
    summaryDir: 'fall',
  },

  crime_burglary: {
    geo: 'ES',
    noun: 'burglary',
    measurement: [{ text: 'Recorded when victims report burglary to police. The 2015 Criminal Code reform may affect comparability around that year.', refs: ['lo2015'] }],
    explanations: [COVID_DROP, SECURITY, ECONOMY],
    studies: [...COVID_STUDIES, { id: 'tseloni2017', relevance: 'indirect', note: 'England and Wales; not tested for Spain.' }, { id: 'buonanno2008', relevance: 'indirect', note: 'Spain, 1993–1999; association only.' }],
    gap: 'Whether better security explains Spain’s burglary decline has not been tested.',
    summary: 'Better security is a plausible but untested explanation for the longer decline; city studies show lockdowns cut burglary in 2020, though Spain’s national rate did not fall that year.',
    summaryDir: 'fall',
  },

  crime_theft: {
    geo: 'ES',
    noun: 'theft',
    measurement: [{ text: 'Recorded when victims report a theft and police record it.' }],
    explanations: [
      REC2010('jump'),
      LO2015('spikes in 2015.'),
      { lead: 'COVID-19 restrictions in 2020.', text: 'In Barcelona, police-recorded thefts fell from an average of 385.2 to 38.1 a day under the 2020 stay-at-home order. Across cities, stay-at-home orders went with large falls in theft, although a 45-city study found strict lockdowns did not reduce theft more than lighter ones.', status: 'evidence', explains: 'any', years: [2020, 2020], refs: ['nivette2021', 'trajtenberg2024'] },
      ECONOMY,
    ],
    studies: [{ id: 'nivette2021', relevance: 'direct', note: 'Reports Barcelona’s thefts in 2020.' }, { id: 'trajtenberg2024', relevance: 'indirect', note: 'Cities worldwide; 2020 only.' }, { id: 'buonanno2008', relevance: 'indirect', note: 'Spain, 1993–1999; association only.' }],
    gap: 'Apart from 2020, no study explains Spain’s theft trend, and recording changes in 2010 and 2015 limit comparisons.',
    summary: 'Recording changes and the 2020 lockdown explain the sharpest movements; the underlying trend has no verified explanation.',
    summaryDir: 'any',
  },

  crime_fraud: {
    geo: 'ES',
    noun: 'fraud',
    measurement: [{ text: 'Recorded when victims or banks report fraud. Much fraud is never reported, so police figures understate it.', refs: ['kemp2020'] }],
    explanations: [
      { lead: 'Fraud has moved online.', text: 'Research using Spanish police, central-bank and victim-survey data finds cyber fraud rising while other property crime falls, with much lower reporting rates. This documents the shift online; it does not measure how much of the recorded rise it explains.', status: 'evidence', explains: 'rise', refs: ['kemp2020'] },
      { lead: 'Lockdowns pushed more activity online.', text: 'In the UK, reported online shopping fraud and hacking rose sharply during the strictest 2020 lockdown months. Spain was not studied.', status: 'hypothesis', explains: 'rise', years: [2020, 2020], refs: ['builgil2021'] },
    ],
    studies: [{ id: 'kemp2020', relevance: 'direct', note: 'Spain; documents the cyber-fraud rise.' }, { id: 'builgil2021', relevance: 'indirect', note: 'United Kingdom, 2019–2020.' }],
    gap: 'No study estimates how much of Spain’s recorded fraud rise reflects more fraud versus more reporting.',
    summary: 'The rise reflects fraud moving online, documented for Spain, though its exact size and drivers are not measured.',
    summaryDir: 'rise',
  },

  crime_cyber: {
    geo: 'ES',
    noun: 'cybercrime',
    measurement: [{ text: 'Recorded when victims notice and report an attack; many never do. Spain’s series starts in 2017.' }],
    explanations: [
      { lead: 'More life online.', text: 'Researchers argue that crime opportunities have shifted from physical space to cyberspace. Spanish data show cyber fraud rising while other property crime falls. How much this explains the recorded rise in attacks on computer systems is not measured.', status: 'hypothesis', explains: 'rise', refs: ['kemp2020'] },
      { lead: 'Lockdowns.', text: 'In the UK, reported cybercrime rose sharply during the strictest 2020 lockdown months. Spain was not studied.', status: 'hypothesis', explains: 'rise', years: [2020, 2020], refs: ['builgil2021'] },
    ],
    studies: [{ id: 'kemp2020', relevance: 'indirect', note: 'Spain; about fraud rather than attacks on computer systems.' }, { id: 'builgil2021', relevance: 'indirect', note: 'United Kingdom, 2019–2020.' }],
    gap: 'No study explains Spain’s recorded rise in attacks on computer systems.',
    summary: 'The rise is consistent with more activity moving online, but its drivers in Spain are not established.',
    summaryDir: 'rise',
  },

  crime_drugs: {
    geo: 'ES',
    noun: 'drug offences',
    measurement: [{ text: 'Mostly detected by police rather than reported by victims, so recorded figures largely reflect police activity and priorities.' }],
    explanations: [
      { lead: 'Police activity.', text: 'Changes in enforcement can move recorded drug offences without any change in drug use or trafficking. We found no study measuring this for Spain.', status: 'insufficient', explains: 'any' },
      { lead: 'A Western European pattern.', text: 'Recorded drug offences also rose across Western Europe in 1988–2007.', status: 'evidence', explains: 'rise', refs: ['aebi2010'] },
    ],
    studies: [EUROPE_PROPERTY],
    gap: 'No study explains Spain’s recorded drug offences, which mainly reflect enforcement.',
    summary: 'Recorded drug offences mostly measure police activity; we found no study explaining Spain’s trend.',
    summaryDir: 'any',
  },
}
TREND.crime_homicide_long = TREND.crime_homicide

const AGE = { text: 'Age and sex: recorded crime is concentrated among young men in every population, and migrant populations are often younger and more male, so raw comparisons mix age and sex with origin.', refs: ['hirschi1983'] }
const ECON = { text: 'The economy: unemployment and incomes changed over the same years as immigration, and can affect both.' }
const CITIES = { text: 'Where people live: migrants settle disproportionately in large cities, where recorded crime is usually higher for reasons unrelated to migration.' }
const COVID_CONF = { text: '2020: lockdowns cut most recorded crime while immigration kept rising, which mechanically weakens or reverses correlations in years that include 2020.', refs: ['nivette2021'], years: [2020, 2020] as [number, number] }
const NATIONAL = { text: 'These are national totals. They cannot show where offences happened, who committed them, or whether crime changed in the places where migrants settled. Population-level patterns say nothing about the behaviour of individuals.' }
const NO_SPAIN_RECENT = 'The only causal study of Spain covers 1999–2009 and does not report this offence separately.'
const BROAD: StudyLink[] = [
  { id: 'alonso2012', relevance: 'indirect', note: 'Spain; total and property crime, not this offence.' },
  { id: 'bianchi2012', relevance: 'indirect', note: 'Italy; total, property, violent crime and robbery.' },
  { id: 'lange2024', relevance: 'indirect', note: 'Germany; total, property and violent crime.' },
  { id: 'marie2024', relevance: 'indirect', note: 'Review of the evidence on overall crime.' },
  { id: 'ousey2018', relevance: 'indirect', note: 'Review of studies of overall crime.' },
]
const BELL: StudyLink = { id: 'bell2013', relevance: 'indirect', note: 'UK; property and violent crime.' }
/** Studies shown under “broader evidence” rather than as the closest research. */
export const BROADER = new Set<StudyLink>([...BROAD, BELL])
const without = (ids: string[]) => BROAD.filter((s) => !ids.includes(s.id))
const PROPERTY_SYNTH = [
  { lead: 'The clearest evidence of any effect is for property crime, and it depends on the group.', text: 'In the UK, the late-1990s asylum wave raised property crime modestly while the post-2004 EU wave lowered it slightly. In Germany, recognised refugees were linked to more theft and fraud, but asylum seekers were not.' },
  { lead: 'Other studies find no effect.', text: 'In Italy the link with property crime disappeared once the authors isolated cause and effect. For Spain in 1999–2009, recorded crime rose with the immigrant share in most models, depending on immigrants’ origin.' },
]
const PROPERTY_LINKS: StudyLink[] = [
  { id: 'alonso2012', relevance: 'direct', note: 'Spain 1999–2009: property crime as a group.' },
  { id: 'bell2013', relevance: 'indirect', note: 'UK: property crime as a group.' },
  { id: 'bianchi2012', relevance: 'indirect', note: 'Italy: property crime as a group.' },
  { id: 'lange2024', relevance: 'indirect', note: 'Germany: property crime as a group.' },
  { id: 'dehos2021', relevance: 'indirect', note: 'Germany: theft and other non-violent offences.' },
]

export const RELATIONSHIP: Record<string, RelationshipEvidence> = {
  'immigration->crime_sexual': {
    confounders: [
      { text: 'Reporting: research links the post-2017 rise in reported sex crimes to more reporting, which happened while immigration was also rising, so the two would move together without one causing the other.', refs: ['levy2026'], years: [2017, 2019] },
      { text: 'Legal changes: the 2022 reform came as immigration was rising quickly, so any rise in recorded offences it caused would line up with immigration by coincidence.', refs: ['lo2022'], years: [2022, 2022] },
      AGE,
      CITIES,
    ],
    synthesis: [
      { lead: 'Very little causal research isolates sexual offences.', text: 'We found two causal studies that report sexual offences separately, both about refugees arriving in Germany, and none for Spain.' },
      { lead: 'Neither finds a clear effect.', text: 'One finds no rise in Germans being victimised in rape and sexual coercion by refugee suspects. The other cannot rule out a zero effect for sexual abuse, and its estimate changes sign across specifications. Not finding an effect is not proof that none exists.' },
      { lead: 'Studies of overall crime do not answer this.', text: 'Results for total, property or violent crime should not be read as evidence about sexual violence in either direction.' },
    ],
    studies: [
      { id: 'huang2026', relevance: 'indirect', note: 'Reports rape and sexual coercion separately; Germany, refugees.' },
      { id: 'dehos2021', relevance: 'indirect', note: 'Reports “sexual abuse”, which includes rape; Germany, refugees.' },
      BELL,
      ...BROAD,
    ],
    gap: 'No causal study of immigration and sexual offences in Spain was found.',
    causal: 'Causal evidence on immigration and sexual offences is scarce: two German studies of refugees find no clear effect, and none covers Spain. The data here cannot show whether immigration contributed.',
    uncertain: [
      { text: 'Whether immigration had any effect in Spain: no causal study exists, and national totals cannot show where offences occurred or who committed them.' },
      { text: 'Who the offenders are. Spain’s published statistics generally do not cross offence type with suspects’ nationality. The exception, an Interior Ministry report on sexual offences published since 2019, counts suspects rather than convictions, by nationality rather than birthplace, without adjusting for age and sex.', refs: ['fernandez2026'] },
    ],
    periods: [[2008, 2015], [2016, 2024]],
  },
  'immigration->crime_homicide': {
    confounders: [AGE, ECON, COVID_CONF],
    synthesis: [
      { lead: 'No study isolates homicide.', text: 'None of the causal studies we verified reports homicide on its own; the Spanish study left it out because numbers per province were too small.' },
      { lead: 'Broader results may not apply.', text: 'Studies of overall crime mostly find little or no effect of immigration, with exceptions for particular groups and offences. That should not be assumed to hold for homicide.' },
    ],
    studies: [{ id: 'huang2026', relevance: 'indirect', note: 'Germany; bodily injury, robbery and sex crimes, not homicide.', broader: true }, BELL, ...BROAD],
    gap: 'No causal study of immigration and homicide in Spain or elsewhere in Europe was found.',
    causal: 'No causal study isolates homicide: research cannot say whether immigration affected Spain’s homicide rate either way.',
    uncertain: [NATIONAL],
  },
  'immigration->crime_assault': {
    confounders: [AGE, ECON, CITIES, COVID_CONF],
    synthesis: [
      { lead: 'Evidence on violent crime is mixed.', text: 'In the UK neither migration wave changed violent crime, and in Germany one study found no rise in Germans being victimised by refugee suspects in bodily injury, while another found violent crime rose slightly a year after refugees arrived.' },
      { lead: 'None covers Spain or serious assault specifically.', text: 'These studies measure violent crime or bodily injury, which are broader than this series.' },
    ],
    studies: [
      { id: 'huang2026', relevance: 'indirect', note: 'Germany: bodily injury, no effect found.' },
      { id: 'bell2013', relevance: 'indirect', note: 'UK: violent crime, no effect found.' },
      { id: 'lange2024', relevance: 'indirect', note: 'Germany: violent crime rose a year after arrival.' },
      { id: 'dehos2021', relevance: 'indirect', note: 'Germany: violent crime, no significant effect.' },
      ...without(['lange2024']),
    ],
    gap: NO_SPAIN_RECENT,
    causal: 'Causal studies of violent crime outside Spain are mixed: most find no effect, one German study finds a small lagged increase. None covers serious assault in Spain.',
    uncertain: [NATIONAL],
  },
  'immigration->crime_robbery': {
    confounders: [AGE, ECON, CITIES, COVID_CONF],
    synthesis: [
      { lead: 'The evidence conflicts.', text: 'In Italy, robbery was the one offence that rose with immigration once cause and effect were isolated. In Germany, one study found fewer robbery suspects with more recognised refugees, and another found no rise in Germans being robbed by refugee suspects.' },
    ],
    studies: [
      { id: 'bianchi2012', relevance: 'indirect', note: 'Italy: robbery rose with immigration.' },
      { id: 'dehos2021', relevance: 'indirect', note: 'Germany: fewer robbery suspects.' },
      { id: 'huang2026', relevance: 'indirect', note: 'Germany: no rise in Germans robbed by refugee suspects.' },
      BELL,
      ...without(['bianchi2012']),
    ],
    gap: NO_SPAIN_RECENT,
    causal: 'The causal evidence on robbery conflicts: an Italian study finds an increase, German studies find none or a decrease. None covers Spain after 2009.',
    uncertain: [NATIONAL],
  },
  'immigration->crime_burglary': {
    confounders: [AGE, ECON, CITIES, COVID_CONF],
    synthesis: PROPERTY_SYNTH,
    studies: [...PROPERTY_LINKS, ...without(['alonso2012', 'bianchi2012', 'lange2024'])],
    gap: 'No study reports burglary separately; the closest evidence is for property crime as a group.',
    causal: 'Causal studies of property crime are mixed: some find modest increases for particular migrant groups, others none or decreases. None reports burglary separately or covers Spain after 2009.',
    uncertain: [NATIONAL],
  },
  'immigration->crime_theft': {
    confounders: [AGE, ECON, CITIES, COVID_CONF],
    synthesis: PROPERTY_SYNTH,
    studies: [{ id: 'dehos2021', relevance: 'indirect', note: 'Germany: theft reported separately.' }, ...PROPERTY_LINKS.filter((s) => s.id !== 'dehos2021'), ...without(['alonso2012', 'bianchi2012', 'lange2024'])],
    gap: NO_SPAIN_RECENT,
    causal: 'Causal studies of property crime and theft are mixed: some find modest increases for particular migrant groups, others none or decreases. None covers Spain after 2009.',
    uncertain: [NATIONAL],
  },
  'immigration->crime_fraud': {
    confounders: [{ text: 'Online activity: fraud moved online over the same years as immigration rose, so the two trends can move together without being connected.', refs: ['kemp2020'] }],
    synthesis: [{ lead: 'Almost no research.', text: 'Only one causal study reports fraud separately: in Germany up to 2015, recognised refugees were associated with more non-violent offences including fraud, while asylum seekers were not. Much fraud is committed remotely, so local migrant populations are a poor proxy for who commits it.' }],
    studies: [{ id: 'dehos2021', relevance: 'indirect', note: 'Germany: fraud reported separately.' }, BELL, ...BROAD],
    gap: 'No study of immigration and fraud in Spain was found.',
    causal: 'Only one study, from Germany, reports fraud separately: it finds a positive association, not proof of cause. No study covers Spain.',
    uncertain: [NATIONAL],
  },
  'immigration->crime_cyber': {
    confounders: [{ text: 'Online activity: cybercrime grows with internet use, which rose over the same years as immigration.' }],
    synthesis: [{ lead: 'No research found.', text: 'We found no study of immigration and cybercrime. Offenders need not live in the country where victims are.' }],
    studies: BROAD,
    gap: 'No study of immigration and cybercrime was found.',
    causal: 'There is no research on immigration and cybercrime. A shared upward trend over a few years is expected for unrelated series.',
    uncertain: [NATIONAL],
  },
  'immigration->crime_drugs': {
    confounders: [{ text: 'Policing: where and whom police check affects recorded drug offences, and can differ between groups.' }, AGE, CITIES],
    synthesis: [{ lead: 'Very little research.', text: 'One German study reports drug offences separately and finds a positive but statistically insignificant association with recognised refugees.' }],
    studies: [{ id: 'dehos2021', relevance: 'indirect', note: 'Germany: drug offences, not significant.' }, BELL, ...BROAD],
    gap: 'No study of immigration and drug offences in Spain was found.',
    causal: 'One German study finds no significant effect on drug offences. No study covers Spain, and these figures mostly measure enforcement.',
    uncertain: [NATIONAL],
  },
}
RELATIONSHIP['immigration->crime_homicide_long'] = RELATIONSHIP['immigration->crime_homicide']

import { STUDIES, type Outcome } from './research'

export interface CountryEvidence {
  /** Studies of this country that report this offence. */
  direct: StudyLink[]
  /** Studies of this country on broader crime categories: context only. */
  context: StudyLink[]
  gap: string | null
}

/** Research on one country, split by whether it reports the selected offence. */
export const countryEvidence = (outcomeId: string, geo: string, countryName: string, noun: string): CountryEvidence => {
  const outcome = outcomeId.replace('crime_', '').replace('_long', '') as Outcome
  const mine = STUDIES.filter((s) => s.geo?.includes(geo))
  const direct = mine.filter((s) => s.outcomes.includes(outcome)).map((s) => ({ id: s.id, relevance: 'direct' as const, note: `${s.place}; reports ${noun}.` }))
  const context = mine.filter((s) => !s.outcomes.includes(outcome)).map((s) => ({ id: s.id, relevance: 'indirect' as const, note: `${s.place}; does not report ${noun} separately, so it is context only.` }))
  const gap = direct.length ? null : mine.length ? `No verified study of ${countryName} reports immigration and ${noun} separately.` : `No verified study of immigration and crime in ${countryName} was found.`
  return { direct, context, gap }
}

export const trendEvidence = (indicatorId: string, geo = 'ES'): TrendEvidence | null => {
  const t = TREND[indicatorId]
  return t && t.geo === geo ? t : null
}
export const relationshipEvidence = (driverDimension: string, outcomeId: string): RelationshipEvidence | null =>
  RELATIONSHIP[`${driverDimension}->${outcomeId}`] ?? null

/** Research for investigations outside crime, keyed by relationship id. */
export interface TopicEvidence {
  /** Findings as reported by researchers, each tied to a source. */
  /** `years` marks the period a finding covers; findings covering the selected years come first. */
  findings: (Note & { lead: string; years?: [number, number] })[]
  international: StudyLink[]
  spain: StudyLink[]
  gap: string
  /** Research on a comparison country, shown when that country is selected; `years` limits a finding to periods it covers. */
  byCountry?: Record<string, { findings: (Note & { lead: string; years?: [number, number] })[]; studies: StudyLink[] }>
  /** Research tied to phases of the trend; only phases inside the selected years are shown. */
  phases?: Phase[]
  /** Shown when the comparison country has no research covering the selected years. */
  cmpGap?: string
}

/** A phase of a trend, e.g. a boom, and the research explaining it. `span` runs from the year before the phase to its last year. */
export interface Phase {
  span: [number, number]
  /** Explanation when this is the only phase selected, followed by `context`. */
  lead: string
  context: string
  /** Part of a combined sentence when several phases are selected, e.g. "the boom before 2008 to cheap credit". */
  clause: string
  /** Supporting sentence in the combined paragraph when several phases are selected. */
  summary: string
  refs: string[]
  findings: (Note & { lead: string })[]
  gap: string
}

const DECOUPLING: TopicEvidence = {
  findings: [
    { lead: 'In Spain, labour costs kept pace with productivity; what pay could buy did not.', text: 'From 2007 to 2024, real labour cost per employee rose about 15% and output per employee about 14%. Consumer prices rose about 10 points more than the prices of what Spain produces, so pay bought less than output grew.', refs: ['bosca2025'], years: [2007, 2024] },
    { lead: 'Across rich countries, pay has lagged productivity because workers’ share of income fell and the middle lost ground to the top.', text: 'An OECD study of about 1995–2013 finds both forces in most member countries, with the gap between median and average pay driven by very high earners. It includes Spain but does not explain Spain’s figures separately.', refs: ['oecd2018', 'schwellnus2017'], years: [1995, 2013] },
    { lead: 'The size of the gap depends on the measures.', text: 'Comparing productivity with average pay deflated by the same price index shows a small gap; comparing it with median wages deflated by consumer prices shows a much larger one.', refs: ['pessoa2013'] },
    { lead: 'The link has weakened, not vanished (US evidence).', text: 'In the United States, faster productivity growth still went with faster pay growth, but other factors held typical pay down.', refs: ['stansbury2017'] },
  ],
  international: [
    { id: 'schwellnus2017', relevance: 'indirect', note: 'OECD countries; measures the gap and its two components.' },
    { id: 'pessoa2013', relevance: 'indirect', note: 'UK and US; explains why different wage and price measures give different gaps.' },
    { id: 'stansbury2017', relevance: 'indirect', note: 'United States only.' },
    { id: 'autor2020', relevance: 'indirect', note: 'United States; one explanation for falling labour shares.' },
  ],
  spain: [
    { id: 'bosca2025', relevance: 'direct', note: 'Spain, 2007–2024; policy note.' },
    { id: 'cuadrado2018', relevance: 'direct', note: 'Spain, the recovery to 2018.' },
  ],
  gap: 'The Spanish evidence starts in 2007 and uses average pay; no study compares median pay with productivity in Spain.',
}

const EUROPE_US: TopicEvidence = {
  findings: [
    { years: [2000, 2023], lead: 'Since 2000, the EU has fallen behind the US mainly because its productivity growth slowed more.', text: 'The European Commission’s Draghi report finds US real disposable income per person grew almost twice as much, and traces most of the productivity gap to the tech sector. It covers the EU as a whole, not Spain.', refs: ['draghi2024'] },
    { years: [1970, 2003], lead: 'Europe chose more leisure.', text: 'By the early 2000s output per hour was close to US levels; Europeans took more of the gains as shorter hours than as higher incomes.', refs: ['blanchard2004'] },
    { years: [1970, 1996], lead: 'Hours worked diverged after the 1970s.', text: 'Americans went from working less than Western Europeans in the early 1970s to about 50% more by the mid-1990s; the author attributes most of this to higher taxes on labour income in Europe.', refs: ['prescott2004'] },
    { years: [1980, 2007], lead: 'Beyond GDP the gap is smaller.', text: 'Counting leisure, life expectancy and inequality as well as consumption puts Western Europe considerably closer to the US than GDP per person does.', refs: ['jonesklenow2016'] },
  ],
  international: [
    { id: 'draghi2024', relevance: 'indirect', note: 'EU as a whole, since 2000.' },
    { id: 'jonesklenow2016', relevance: 'indirect', note: 'Includes Spain, France, Germany, Italy and the US; data end in the 2000s.' },
    { id: 'blanchard2004', relevance: 'indirect', note: 'EU as a whole; written before the 2008 crisis.' },
    { id: 'prescott2004', relevance: 'indirect', note: 'G-7 countries; Spain and Portugal not included.' },
  ],
  spain: [],
  gap: 'No verified study explains Spain’s own position relative to the US since 2000.',
}

const IMM_HOUSING: TopicEvidence = {
  findings: [
    { lead: 'In Spain’s 2000s boom, immigration accounted for about a quarter of the house-price rise.', text: 'It added about 2% a year to prices and about half of new construction.', refs: ['gonzalez2013'], years: [2000, 2010] },
    { lead: 'Since 2014, population growth, mostly from immigration, has met a housing supply that barely grew.', text: 'Banco de España names net immigration and buyers from abroad as key sources of demand, while labour shortages, costs and scarce land held back building. It does not estimate how much each factor raised prices.', refs: ['bde2024'], years: [2014, 2023] },
    { lead: 'In US cities, rents rose with immigrant inflows.', text: 'An inflow equal to 1% of a city’s population went with roughly 1% higher average rents and house values.', refs: ['saiz2007'] },
    { lead: 'In the UK, local prices fell instead.', text: 'House prices fell where immigrants arrived, because higher-earning residents moved away.', refs: ['sa2015'] },
  ],
  international: [
    { id: 'saiz2007', relevance: 'indirect', note: 'United States; may not transfer to Spain.' },
    { id: 'sa2015', relevance: 'indirect', note: 'United Kingdom; may not transfer to Spain.' },
  ],
  spain: [{ id: 'gonzalez2013', relevance: 'direct', note: 'Spain, 2000–2010.' }, { id: 'bde2024', relevance: 'direct', note: 'Spain, 2014–2023; descriptive.' }],
  gap: 'No study measures how much immigration raised Spanish house prices or rents after 2010.',
}

const IMM_EMPLOYMENT: TopicEvidence = {
  findings: [
    { lead: 'From 2009 to 2018, immigration had no measurable overall effect on Spanish-born workers’ jobs or pay.', text: 'Comparing workers with similar education and experience, the most robust estimates find no significant effect; year-by-year estimates show a negative effect on native employment in 2013–2014 and a positive one in 2017.', refs: ['atienza2020'], years: [2009, 2018] },
    { lead: 'In Spain, immigrant and native workers were not perfect substitutes.', text: 'Native workers appear to have shifted to different tasks, with effects differing by sex.', refs: ['amuedo2011'], years: [1999, 2008] },
  ],
  international: [],
  spain: [{ id: 'amuedo2011', relevance: 'direct', note: 'Spain, 2000s.' }, { id: 'atienza2020', relevance: 'direct', note: 'Spain, 2009–2018.' }],
  gap: 'The Spanish studies measure associations, not proven causes, and none covers the years since 2018.',
}

const AFFORDABILITY: TopicEvidence = {
  findings: [],
  phases: [
    {
      span: [1995, 2007],
      lead: 'Cheaper credit and looser borrowing limits fuelled the boom.',
      clause: 'the boom to cheap credit',
      summary: 'Foreign capital made borrowing cheap and limits loose.',
      context: 'Capital flowed in from the rest of the euro area, and investors accepted lower returns on Spanish housing.',
      refs: ['intveld2014'],
      findings: [
        { lead: 'Banks lent loosely during the boom.', text: 'Banks charged non-employed borrowers the same mortgage spreads as employed ones, and appraisals appear to have been inflated to meet loan-to-value limits.', refs: ['akin2014'] },
        { lead: 'Immigration accounted for about a quarter of the 2000s price rise.', text: 'Estimates for 2000–2010 attribute about 2% a year of price growth, and about half of new construction, to population growth from immigration.', refs: ['gonzalez2013'] },
      ],
      gap: 'No verified study splits the whole boom-era price rise between credit, interest rates, immigration and incomes.',
    },
    {
      span: [2007, 2013],
      lead: 'Credit tightened sharply as prices fell.',
      clause: 'the 2008–2013 fall to a credit crunch',
      summary: 'After 2008, banks cut lending, to households most.',
      context: 'Borrowing limits tightened as prices fell, and households were hit hardest.',
      refs: ['intveld2014'],
      findings: [
        { lead: 'Banks lent more cautiously after the boom.', text: 'A study of individual Spanish mortgages finds lending standards were softer in the boom than in the bust.', refs: ['akin2014'] },
      ],
      gap: 'No verified study measures how much the credit crunch, unemployment and unsold homes each contributed to the 2008–2013 price fall.',
    },
    {
      span: [2013, 2025],
      lead: 'Since 2014, demand has outpaced a slow-growing supply of homes.',
      clause: 'the rise since 2014 to demand outpacing supply',
      summary: 'Since 2014, population growth, mostly from immigration, and foreign buyers have met a supply held back by labour shortages, costs and scarce land.',
      context: 'Population growth, mostly from immigration, and foreign buyers raised demand; labour shortages, rising costs and scarce land held back building.',
      refs: ['bde2024'],
      findings: [
        { lead: 'Unlike before 2008, banks kept lending prudently.', text: 'Lower-income households who could not get a mortgage turned to a small rental market, where rents are high relative to prices.', refs: ['bde2024'] },
        { lead: 'Tourist rentals raised rents in Barcelona, most in hotspots.', text: 'Airbnb raised rents by about 2% in the average neighbourhood and about 7% in the tenth of neighbourhoods with the most listings.', refs: ['garcialopez2020'] },
        { lead: 'Renting grew where incomes are low and supply is rigid.', text: 'Rental demand rose among young households, immigrants and temporary workers, concentrated in Madrid, Catalonia and the islands, where supply responds slowly.', refs: ['lopezrodriguez2019'] },
      ],
      gap: 'No study measures how much immigration, foreign buyers, limited building, tourism and incomes each added to prices and rents since 2014.',
    },
  ],
  cmpGap: 'No verified study in Data Detective explains house prices there in these years.',
  international: [
    { id: 'glaeser2008', relevance: 'indirect', note: 'US cities; on why supply flexibility matters.' },
  ],
  spain: [
    { id: 'intveld2014', relevance: 'direct', note: 'Spain, 1995–2013; boom and bust; model-based.' },
    { id: 'akin2014', relevance: 'direct', note: 'Spain, 2000s credit boom.' },
    { id: 'bde2024', relevance: 'direct', note: 'Spain, 2014–2023; descriptive.' },
    { id: 'garcialopez2020', relevance: 'direct', note: 'Barcelona only.' },
    { id: 'lopezrodriguez2019', relevance: 'direct', note: 'Spain, mid-2010s; descriptive.' },
    { id: 'monras2023', relevance: 'direct', note: 'Catalonia; working paper.' },
    { id: 'gonzalez2013', relevance: 'direct', note: 'Spain, 2000–2010; immigration’s share of the boom.' },
  ],
  gap: 'No verified study measures how much credit, supply, tourism, immigration and incomes each contributed to Spain’s price and rent rises since 2015.',
  byCountry: {
    US: {
      findings: [
        { years: [2002, 2007], lead: 'Easier mortgage credit drove the mid-2000s price boom.', text: 'From 2002 to 2005, lending grew fastest in neighbourhoods with many subprime borrowers, even though their incomes grew relatively slowly; prices, and later defaults, rose most there.', refs: ['miansufi2009'] },
        { lead: 'Limits on building keep prices far above construction costs.', text: 'In Manhattan and other expensive markets, homes sell far above what they cost to build; the authors attribute much of the gap to rules restricting new housing.', refs: ['glaeser2005'] },
      ],
      studies: [
        { id: 'miansufi2009', relevance: 'direct', note: 'United States, 2002–2007.' },
        { id: 'glaeser2005', relevance: 'direct', note: 'United States, to the early 2000s.' },
        { id: 'glaeser2008', relevance: 'direct', note: 'US cities; supply flexibility and booms.' },
      ],
    },
    PT: {
      findings: [
        { years: [2013, 2016], lead: 'House prices rose most where Airbnb expanded, especially in tourist areas.', text: 'A 1 percentage point rise in a municipality’s Airbnb share went with 3.7% higher prices; by early 2016, prices in high-tourism parishes of Lisbon and Porto had risen about 32% relative to low-tourism ones.', refs: ['franco2021'] },
      ],
      studies: [{ id: 'franco2021', relevance: 'direct', note: 'Portugal, 2014–early 2016.' }],
    },
  },
}

const GROWTH_WAGES: TopicEvidence = {
  findings: [
    { lead: 'Spanish employers’ labour costs kept pace with productivity, but workers’ purchasing power grew more slowly.', text: 'From 2007 to 2024, average pay bought about the same. Consumer prices rose faster than the prices of what Spain produced, and higher employer social contributions added to labour costs without adding directly to wages. The study measures average pay per employee.', refs: ['bosca2025'], years: [2007, 2024] },
    { lead: 'After 2013, high unemployment and low expected inflation held pay down.', text: 'Banco de España estimates link Spain’s weak wage growth in the recovery to labour-market slack, including involuntary part-time and discouraged workers, and to low inflation expectations.', refs: ['cuadrado2018'], years: [2014, 2018] },
    { lead: 'Unlike the OECD pattern, workers’ share of Spain’s income did not fall.', text: 'Compensation of employees was 47.0% of GDP in 2006 and 47.7% in 2022. Output per hour rose 15% over those years, but hours worked per resident fell 9%, which is why GDP per person rose only 5% (our calculation from Eurostat national accounts).', refs: ['eurostatNA'] },
    { lead: 'Across rich countries, typical pay has lagged growth because workers’ share of income fell and the middle lost ground to the top.', text: 'An OECD study of about 1995–2013 finds both forces in most member countries, with very high earners pulling average pay away from the median. It includes Spain but does not explain Spain’s figures separately.', refs: ['schwellnus2017'], years: [1995, 2013] },
    { lead: 'In Spain, wages respond little to booms and busts.', text: 'Real pay barely tracked the economy, least in recessions; new hires’ pay moved most, long-serving workers’ least.', refs: ['font2015'], years: [1987, 2013] },
  ],
  international: DECOUPLING.international,
  spain: [
    { id: 'bosca2025', relevance: 'direct', note: 'Spain, 2007–2024; average pay per employee; policy note.' },
    { id: 'cuadrado2018', relevance: 'direct', note: 'Spain, the recovery to 2018.' },
    { id: 'font2015', relevance: 'direct', note: 'Spain, 1987–2013.' },
    { id: 'barcelo2021', relevance: 'direct', note: 'Spain; employment effects of the 2019 minimum-wage rise.' },
  ],
  gap: 'The studies here leave open why typical pay or household income changed over these years.',
  byCountry: {
    US: {
      findings: [{ lead: 'Pay still follows productivity, but other forces held typical pay down.', text: 'From 1973 to 2016, each extra percentage point of productivity growth went with roughly 0.7 to 1 point more growth in median pay; the gap opened because of other factors, not because the link broke.', refs: ['stansbury2017'] }],
      studies: [{ id: 'stansbury2017', relevance: 'direct', note: 'United States, 1973–2016; working paper.' }],
    },
  },
}

const IMM_GROWTH: TopicEvidence = {
  findings: [
    { lead: 'Immigrants subtracted from Spain’s growth in output per person in the 2008–2013 slump and added to it in the recovery, mainly through jobs.', text: 'In a Banco de España accounting exercise, foreign residents took away about 0.9 points a year in 2008–2013, mostly as their employment fell, and added 0.2–0.5 points a year in 2014–2019.', refs: ['cuadrado2025'], years: [2006, 2019] },
    { lead: 'Since 2022, immigrants have added 0.4–0.7 points a year to Spain’s growth in output per person.', text: 'A Banco de España accounting exercise links this mainly to employment, to the progress of immigrants who arrived in the early 2000s and to the higher education of recent arrivals.', refs: ['cuadrado2025'], years: [2022, 2024] },
  ],
  international: [],
  spain: [{ id: 'cuadrado2025', relevance: 'direct', note: 'Spain, 2006–2024; accounting decomposition.' }],
  gap: 'These are accounting contributions, not causal effects; whether immigration raises output per hour is uncertain.',
}

export const TOPIC: Record<string, TopicEvidence> = {
  'immigration-growth': IMM_GROWTH,
  'housing-affordability': AFFORDABILITY,
  'immigration-housing': IMM_HOUSING,
  'immigration-employment': IMM_EMPLOYMENT,
  'europe-us': EUROPE_US,
  'growth-wages': GROWTH_WAGES,
  'productivity-wages': DECOUPLING,
}

/** Research on whether a non-immigration driver affects a given offence, shown first in 02. */
export interface DriverFinding { lead: string; text: string; refs: string[]; outcomes: string[]; design: 'causal' | 'association' }
export const DRIVER_RESEARCH: Record<string, { findings: DriverFinding[]; none: (noun: string) => { lead: string; text: string } }> = {
  'unemployment-crime': {
    findings: [
      { outcomes: ['crime_burglary', 'crime_theft'], design: 'causal', lead: 'Higher unemployment raised property crime in US states.', text: 'The study isolates job losses caused by defence spending and oil prices; effects on violent crime are much weaker.', refs: ['raphael2001'] },
      { outcomes: ['crime_burglary', 'crime_theft'], design: 'causal', lead: 'In Sweden’s 1990s crisis, unemployment raised burglary and car theft.', text: 'Across Swedish municipalities, unemployment affected burglary and car theft, but not most other offences.', refs: ['oster2007'] },
    ],
    none: (n) => ({ lead: `No study shows whether unemployment affects ${n}.`, text: 'Causal studies find effects on property crime such as burglary and theft, and much weaker ones on violent crime.' }),
  },
  'inequality-crime': {
    findings: [
      { outcomes: ['crime_homicide', 'crime_homicide_long', 'crime_robbery'], design: 'association', lead: 'Across countries, more unequal societies have more homicide and robbery.', text: 'The link holds after accounting for other factors, but it compares countries and does not test changes within Spain.', refs: ['fajnzylber2002'] },
    ],
    none: (n) => ({ lead: `No study shows whether inequality affects ${n}.`, text: 'The research we checked covers only homicide and robbery.' }),
  },
}
