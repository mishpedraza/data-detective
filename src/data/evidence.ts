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
    causal: 'No causal study isolates homicide, so research cannot tell us whether immigration affected Spain’s homicide rate in either direction.',
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
    causal: 'Causal studies of property crime find modest increases for some migrant groups and none or decreases for others. None reports burglary separately or covers Spain after 2009.',
    uncertain: [NATIONAL],
  },
  'immigration->crime_theft': {
    confounders: [AGE, ECON, CITIES, COVID_CONF],
    synthesis: PROPERTY_SYNTH,
    studies: [{ id: 'dehos2021', relevance: 'indirect', note: 'Germany: theft reported separately.' }, ...PROPERTY_LINKS.filter((s) => s.id !== 'dehos2021'), ...without(['alonso2012', 'bianchi2012', 'lange2024'])],
    gap: NO_SPAIN_RECENT,
    causal: 'Causal studies of property crime and theft find modest increases for some migrant groups and none or decreases for others. None covers Spain after 2009.',
    uncertain: [NATIONAL],
  },
  'immigration->crime_fraud': {
    confounders: [{ text: 'Online activity: fraud moved online over the same years as immigration rose, so the two trends can move together without being connected.', refs: ['kemp2020'] }],
    synthesis: [{ lead: 'Almost no research.', text: 'Only one causal study reports fraud separately: in Germany up to 2015, recognised refugees were associated with more non-violent offences including fraud, while asylum seekers were not. Much fraud is committed remotely, so local migrant populations are a poor proxy for who commits it.' }],
    studies: [{ id: 'dehos2021', relevance: 'indirect', note: 'Germany: fraud reported separately.' }, BELL, ...BROAD],
    gap: 'No study of immigration and fraud in Spain was found.',
    causal: 'Only one German study reports fraud separately, and it describes its positive result as an association. No study covers Spain.',
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
  findings: (Note & { lead: string })[]
  international: StudyLink[]
  spain: StudyLink[]
  gap: string
}

const DECOUPLING: TopicEvidence = {
  findings: [
    { lead: 'Across the OECD, typical pay fell behind productivity.', text: 'Over roughly two decades, real median compensation grew more slowly than productivity in most OECD countries, because labour’s share of income fell and median wages fell behind average wages.', refs: ['oecd2018', 'schwellnus2017'] },
    { lead: 'The size of the gap depends on the measures.', text: 'Comparing productivity with average pay deflated by the same price index shows a small gap; comparing it with median wages deflated by consumer prices shows a much larger one.', refs: ['pessoa2013'] },
    { lead: 'The link has weakened, not vanished (US evidence).', text: 'In the United States, faster productivity growth still went with faster pay growth, but other factors held typical pay down.', refs: ['stansbury2017'] },
  ],
  international: [
    { id: 'schwellnus2017', relevance: 'indirect', note: 'OECD countries; measures the gap and its two components.' },
    { id: 'pessoa2013', relevance: 'indirect', note: 'UK and US; explains why different wage and price measures give different gaps.' },
    { id: 'stansbury2017', relevance: 'indirect', note: 'United States only.' },
    { id: 'autor2020', relevance: 'indirect', note: 'United States; one explanation for falling labour shares.' },
  ],
  spain: [],
  gap: 'No verified peer-reviewed study of Spain’s wage–productivity gap since 2000 was found. Spain is included in the OECD comparisons, but country results are not reported separately here.',
}

const EUROPE_US: TopicEvidence = {
  findings: [
    { lead: 'Europe chose more leisure.', text: 'By the early 2000s European productivity per hour was close to the US level; Europeans took more of the gains as shorter working hours rather than higher incomes.', refs: ['blanchard2004'] },
    { lead: 'Hours worked diverged after the 1970s.', text: 'Americans went from working less than Western Europeans in the early 1970s to about 50% more by the mid-1990s; the author attributes most of this to higher taxes on labour income in Europe.', refs: ['prescott2004'] },
    { lead: 'Beyond GDP the gap is smaller.', text: 'Counting leisure, life expectancy and inequality as well as consumption puts Western Europe considerably closer to the US than GDP per person does.', refs: ['jonesklenow2016'] },
  ],
  international: [
    { id: 'jonesklenow2016', relevance: 'indirect', note: 'Includes Spain, France, Germany, Italy and the US; data end in the 2000s.' },
    { id: 'blanchard2004', relevance: 'indirect', note: 'EU as a whole; written before the 2008 crisis.' },
    { id: 'prescott2004', relevance: 'indirect', note: 'G-7 countries; Spain and Portugal not included.' },
  ],
  spain: [],
  gap: 'No verified peer-reviewed study explains why Spain’s GDP per person and wages fell further behind the US level after 2008.',
}

const IMM_HOUSING: TopicEvidence = {
  findings: [
    { lead: 'In Spain’s 2000s boom, immigration accounted for about a quarter of the house-price rise.', text: 'Estimates for 2000–2010 attribute about 2% a year of price growth, and about half of new construction, to population growth from immigration.', refs: ['gonzalez2013'] },
    { lead: 'In US cities, rents rose with immigrant inflows.', text: 'An inflow equal to 1% of a city’s population went with roughly 1% higher average rents and house values.', refs: ['saiz2007'] },
    { lead: 'In the UK, local prices fell instead.', text: 'House prices fell where immigrants arrived, because higher-earning residents moved away.', refs: ['sa2015'] },
  ],
  international: [
    { id: 'saiz2007', relevance: 'indirect', note: 'United States; may not transfer to Spain.' },
    { id: 'sa2015', relevance: 'indirect', note: 'United Kingdom; may not transfer to Spain.' },
  ],
  spain: [{ id: 'gonzalez2013', relevance: 'direct', note: 'Spain, 2000–2010.' }],
  gap: 'No verified study measures how immigration affected Spanish house prices or rents after 2010, including the rise since 2015.',
}

const IMM_EMPLOYMENT: TopicEvidence = {
  findings: [
    { lead: 'In Spain, immigrant and native workers were not perfect substitutes.', text: 'Immigration appears to have changed the tasks native workers specialise in, with effects differing by sex.', refs: ['amuedo2011'] },
  ],
  international: [],
  spain: [{ id: 'amuedo2011', relevance: 'direct', note: 'Spain, 2000s.' }],
  gap: 'Only one verified study of Spain is shown, and it covers the 2000s; none covers the period since the 2008 crisis.',
}

const AFFORDABILITY: TopicEvidence = {
  findings: [
    { lead: 'Loose lending fed Spain’s 2000s price boom.', text: 'During the boom, banks charged non-employed borrowers the same mortgage spreads as employed ones, and appraisals appear to have been inflated to meet loan-to-value limits.', refs: ['akin2014'] },
    { lead: 'Tourist rentals raised rents in Barcelona, most in hotspots.', text: 'Airbnb raised rents by about 2% in the average neighbourhood and about 7% in the tenth of neighbourhoods with the most listings.', refs: ['garcialopez2020'] },
    { lead: 'Renting grew where incomes are low and supply is rigid.', text: 'Rental demand rose among young households, immigrants and temporary workers, concentrated in Madrid, Catalonia and the islands, where supply responds slowly.', refs: ['lopezrodriguez2019'] },
  ],
  international: [
    { id: 'glaeser2008', relevance: 'indirect', note: 'US cities; on why supply flexibility matters.' },
  ],
  spain: [
    { id: 'akin2014', relevance: 'direct', note: 'Spain, 2000s credit boom.' },
    { id: 'garcialopez2020', relevance: 'direct', note: 'Barcelona only.' },
    { id: 'lopezrodriguez2019', relevance: 'direct', note: 'Spain, mid-2010s; descriptive.' },
    { id: 'monras2023', relevance: 'direct', note: 'Catalonia; working paper.' },
    { id: 'gonzalez2013', relevance: 'direct', note: 'Spain, 2000–2010; immigration’s share of the boom.' },
  ],
  gap: 'No verified study measures how much credit, supply, tourism, immigration and incomes each contributed to Spain’s price and rent rises since 2015.',
}

export const TOPIC: Record<string, TopicEvidence> = {
  'housing-affordability': AFFORDABILITY,
  'immigration-housing': IMM_HOUSING,
  'immigration-employment': IMM_EMPLOYMENT,
  'europe-us': EUROPE_US,
  'growth-wages': DECOUPLING,
  'productivity-wages': DECOUPLING,
}
