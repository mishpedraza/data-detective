// Indicator-specific evidence for "Does immigration increase crime?".
// Every study listed here must exist in research.ts and has been checked against
// the original publication. Explanations carry an explicit evidence status.

export type ExplStatus = 'documented' | 'evidence' | 'method' | 'hypothesis'
export type Direction = 'rise' | 'fall' | 'any'

export interface Explanation {
  lead: string
  text: string
  status: ExplStatus
  /** Which movement this explains; shown only when the selected data moves that way. */
  explains: Direction
  /** Only shown when the selected period overlaps these years. */
  years?: [number, number]
  refs?: string[]
}

export interface StudyLink {
  id: string
  /** How this study relates to the selected offence. */
  note: string
}

export interface CrimeProfile {
  /** Plain noun for the underlying behaviour, e.g. "sexual violence". */
  noun: string
  /** Why recorded figures may differ from actual incidence. */
  recorded: { text: string; refs?: string[] }[]
  explanations: Explanation[]
  /** Research on why the recorded series itself changes, independent of immigration. */
  trend?: StudyLink[]
  /** `years` limits a factor to selections that span those years. */
  confounders: { text: string; refs?: string[]; years?: [number, number] }[]
  synthesis: { lead: string; text: string }[]
  /** Studies that report results for this offence or the closest category. */
  direct: StudyLink[]
  /** Broader studies that do not isolate this offence. */
  broader: StudyLink[]
  gap: string
  causal: string
  uncertain: { text: string; refs?: string[] }[]
  /** Sub-periods compared in the statistics, where meaningful. */
  periods?: [number, number][]
}

const AGE = { text: 'Age and sex: recorded crime is concentrated among young men in every population, and migrant populations are often younger and more male, so raw comparisons mix age and sex with origin.', refs: ['hirschi1983'] }
const ECON = { text: 'The economy: unemployment and incomes changed over the same years as immigration, and can affect both.' }
const CITIES = { text: 'Where people live: migrants settle disproportionately in large cities, where recorded crime is usually higher for reasons unrelated to migration.' }
const RECORDING = { text: 'Recording and reporting: changes in how offences are defined, reported and recorded can coincide with migration trends by chance.', refs: ['eurostatCrime'] }
const NATIONAL = { text: 'These are national totals. They cannot show where offences happened, who committed them, or whether crime changed in the places where migrants settled. Population-level patterns say nothing about the behaviour of individuals.' }
const NO_SPAIN_RECENT = 'The only causal study of Spain covers 1999–2009 and does not report this offence separately.'

const BROAD_STUDIES: StudyLink[] = [
  { id: 'alonso2012', note: 'Spain; total and property crime, not this offence.' },
  { id: 'bianchi2012', note: 'Italy; total, property, violent crime and robbery.' },
  { id: 'lange2024', note: 'Germany; total, property and violent crime.' },
  { id: 'marie2024', note: 'Review of the international evidence on overall crime.' },
  { id: 'ousey2018', note: 'Review of studies of overall crime.' },
]

const PROPERTY_SYNTH = [
  { lead: 'The clearest evidence of any effect is for property crime, and it depends on the group.', text: 'In the UK, the late-1990s asylum wave raised property crime modestly while the post-2004 EU wave lowered it slightly. In Germany, recognised refugees were linked to more theft and fraud, but asylum seekers were not.' },
  { lead: 'Other studies find no effect.', text: 'In Italy the link with property crime disappeared once the authors isolated cause and effect. For Spain in 1999–2009, recorded crime rose with the immigrant share in most models, depending on immigrants’ origin.' },
  { lead: 'Job prospects seem to matter.', text: 'Several authors link the differences to migrants’ labour-market opportunities and legal status, an interpretation rather than a direct test.' },
]

export const CRIME_PROFILES: Record<string, CrimeProfile> = {
  crime_sexual: {
    noun: 'sexual violence',
    recorded: [
      { text: 'This series counts offences of rape and sexual assault that police recorded, mostly after a victim reported them. It does not count victims, arrests, prosecutions or convictions.' },
      { text: 'Most sexual violence never reaches the police. In Spain’s 2019 national survey, only 11.1% of women who had experienced sexual violence by someone other than a partner said it had been reported to the police or courts, and 8% counting only reports made by the women themselves. When reporting changes, recorded figures can move even if actual incidence does not.', refs: ['macro2019'] },
      { text: 'These figures cannot separate changes in reporting, changes in the law and changes in actual incidence.' },
    ],
    explanations: [
      { lead: 'The legal definition changed in October 2022.', text: 'Organic Law 10/2022 removed the distinction between sexual “abuse” and sexual “aggression”: every non-consensual sexual act became aggression. Offences previously recorded under abuse can now fall under sexual assault or rape, which can raise these categories without any change in behaviour. The data cannot show how much of any change this explains.', status: 'documented', explains: 'any', years: [2022, 2022], refs: ['lo2022'] },
      { lead: 'The age of consent rose to 16 in 2015.', text: 'The 2015 Criminal Code reform raised the age of sexual consent to 16, so acts that were previously legal became offences. This can add recorded offences; its size in these figures is unknown.', status: 'documented', explains: 'rise', years: [2015, 2015], refs: ['lo2015'] },
      { lead: 'More victims reported after #MeToo.', text: 'A causal study of 31 countries, including Spain, finds that the #MeToo movement, from October 2017, raised the number of sex crimes reported to police by roughly 8–10%, and that this reflected more reporting rather than more offences. A US study reaches the same conclusion. Neither gives a separate estimate for Spain, and neither covers the years after 2019.', status: 'evidence', explains: 'rise', years: [2017, 2100], refs: ['levy2026', 'chen2024'] },
      { lead: 'Spain’s victim survey shows no rise from 2015 to 2019.', text: 'In Spain’s national survey of women, 0.57% reported non-partner sexual violence in the previous 12 months in 2015 and 0.51% in 2019, a difference within the margin of error. Over the same years police-recorded sexual violence rose by about 70%. The survey changed some questions and its sampling between editions and covers only women aged 16 and over, so the comparison is approximate.', status: 'evidence', explains: 'rise', years: [2015, 2019], refs: ['macro2019'] },
      { lead: 'Actual incidence may have changed.', text: 'Some of the change could still reflect more, or less, sexual violence, particularly in years not covered by the survey comparison. Police records alone cannot show this.', status: 'hypothesis', explains: 'any' },
      { lead: 'Population growth alone does not explain it.', text: 'The figures are rates per 100,000 residents, so a larger population does not by itself raise them.', status: 'method', explains: 'rise' },
      { lead: 'No verified explanation for the fall.', text: 'We found no study explaining the decline in recorded sexual violence before 2015. Changes in reporting or recording are possible but untested.', status: 'hypothesis', explains: 'fall' },
    ],
    trend: [
      { id: 'levy2026', note: 'Includes Spain; reporting, not incidence.' },
      { id: 'chen2024', note: 'United States; reporting, not incidence.' },
    ],
    confounders: [
      { text: 'Reporting and awareness: if willingness to report rose during years when immigration also rose, the two would move together without one causing the other.' },
      { text: 'Legal changes: the 2022 reform came as immigration was rising quickly, so any rise in recorded offences it caused would line up with immigration by coincidence.', refs: ['lo2022'], years: [2022, 2100] },
      AGE,
      CITIES,
    ],
    synthesis: [
      { lead: 'Very little causal research isolates sexual offences.', text: 'We found two studies designed to estimate cause and effect that report sexual offences separately, both about refugees arriving in Germany. We found none for Spain.' },
      { lead: 'Neither finds a clear effect.', text: 'One finds no rise in Germans being victimised in rape and sexual coercion by refugee suspects. The other cannot rule out a zero effect for sexual abuse, and its estimate changes sign across specifications.' },
      { lead: 'The evidence is narrow.', text: 'Both concern refugees in Germany in 2010–2016, a different population and period from Spain’s migration, and both rely on police records, which share the reporting problems above.' },
      { lead: 'Studies of overall crime do not answer this.', text: 'Results for total, property or violent crime should not be read as evidence about sexual violence in either direction.' },
    ],
    direct: [
      { id: 'huang2026', note: 'Reports rape and sexual coercion separately.' },
      { id: 'dehos2021', note: 'Reports “sexual abuse”, a police category that includes rape.' },
    ],
    broader: [{ id: 'bell2013', note: 'UK; property and violent crime.' }, ...BROAD_STUDIES],
    gap: 'No causal study of immigration and sexual offences in Spain was found.',
    causal: 'Causal evidence on sexual offences is scarce: two German studies of refugees find no clear effect, and none covers Spain. The data here cannot show whether immigration contributed to changes in recorded sexual violence.',
    uncertain: [
      { text: 'How much of any change in recorded sexual violence reflects reporting, legal redefinition, or actual incidence.' },
      { text: 'Whether immigration had any effect in Spain: no causal study exists, and national totals cannot show where offences occurred or who committed them.' },
      { text: 'Who the offenders are. Spain’s published statistics generally do not cross offence type with suspects’ nationality. The exception, an Interior Ministry report on sexual offences published since 2019, counts suspects rather than convictions, by nationality rather than birthplace, without adjusting for age and sex.', refs: ['fernandez2026'] },
      { text: 'Population-level correlations cannot tell us about the behaviour of individuals or groups.' },
    ],
    periods: [[2008, 2015], [2016, 2024]],
  },

  crime_homicide: {
    noun: 'homicide',
    recorded: [
      { text: 'Homicides are hard to conceal, so recorded figures depend less on victims choosing to report than for most offences.' },
      { text: 'Numbers are small, a few hundred a year in Spain, so movements of a tenth of a point per 100,000 can be noise.' },
    ],
    explanations: [
      { lead: 'No verified explanation for Spain.', text: 'We found no study that explains Spain’s homicide trend, and no explanation has been tested here.', status: 'hypothesis', explains: 'fall' },
      { lead: 'An older population.', text: 'Violent crime is concentrated among young adults, and Spain’s population has aged. Whether this contributed to the trend has not been tested here.', status: 'hypothesis', explains: 'fall', refs: ['hirschi1983'] },
      { lead: 'No verified explanation for this movement.', text: 'We found no study explaining a rise in Spain’s homicide rate over these years. With small numbers, short-term rises can be noise.', status: 'hypothesis', explains: 'rise' },
    ],
    confounders: [AGE, ECON, RECORDING],
    synthesis: [
      { lead: 'No study isolates homicide.', text: 'None of the causal studies we verified reports homicide on its own. The Spanish study left it out because numbers per province were too small.' },
      { lead: 'Broader results may not apply.', text: 'Studies of overall crime mostly find little or no effect of immigration, with exceptions for particular groups and offences. That should not be assumed to hold for homicide.' },
    ],
    direct: [],
    broader: [
      { id: 'bell2013', note: 'UK; violent crime as a group, no effect.' },
      { id: 'huang2026', note: 'Germany; bodily injury, robbery and sex crimes, not homicide.' },
      ...BROAD_STUDIES,
    ],
    gap: 'No causal study of immigration and homicide in Spain or elsewhere in Europe was found.',
    causal: 'No causal study isolates homicide, so research cannot tell us whether immigration affected Spain’s homicide rate. Broader studies mostly find little or no effect on overall crime.',
    uncertain: [
      { text: 'Why Spain’s homicide rate changed: no verified study explains it.' },
      { text: 'Whether immigration had any effect on homicide, in either direction.' },
      NATIONAL,
    ],
  },

  crime_assault: {
    noun: 'serious assault',
    recorded: [
      { text: 'Serious assault is recorded when victims report it and police classify the injury as serious, so classification practice matters.' },
      { text: 'Spain’s series drops abruptly between 2009 and 2010 and spikes in 2015, the year of the Criminal Code reform. Changes that sudden are more likely to reflect recording than behaviour.', refs: ['lo2015'] },
    ],
    explanations: [
      { lead: 'A recording change in 2010.', text: 'The fall between 2009 and 2010 is too large to be a real change and most likely reflects how offences were classified. Years before 2010 are not comparable with later ones.', status: 'documented', explains: 'any', years: [2010, 2010] },
      { lead: 'The 2015 Criminal Code reform.', text: 'The reform abolished minor offences (“faltas”) and reclassified some as minor crimes. The series spikes in 2015 and falls back in 2016.', status: 'documented', explains: 'any', years: [2015, 2016], refs: ['lo2015'] },
      { lead: 'COVID-19 restrictions in 2020.', text: 'Recorded assault was lowest in 2020, when movement was restricted. Part of the later rise may be a return to earlier patterns; this has not been tested here.', status: 'hypothesis', explains: 'rise', years: [2020, 2021] },
    ],
    confounders: [AGE, ECON, CITIES, RECORDING],
    synthesis: [
      { lead: 'Evidence on violent crime is mixed.', text: 'In the UK neither migration wave changed violent crime, and in Germany one study found no rise in Germans being victimised by refugee suspects in bodily injury. Another German study found violent crime rose slightly a year after refugees arrived.' },
      { lead: 'None covers Spain or serious assault specifically.', text: 'These studies measure violent crime or bodily injury, which are broader than the serious assault series shown here.' },
    ],
    direct: [
      { id: 'huang2026', note: 'Reports bodily injury separately: no effect.' },
      { id: 'bell2013', note: 'Violent crime as a group: no effect.' },
      { id: 'lange2024', note: 'Violent crime as a group: rise a year after arrival.' },
      { id: 'dehos2021', note: 'Violent crime as a group: no significant effect.' },
    ],
    broader: BROAD_STUDIES.filter((s) => s.id !== 'lange2024'),
    gap: NO_SPAIN_RECENT,
    causal: 'Causal studies of violent crime outside Spain are mixed: most find no effect, one German study finds a small increase a year after refugees arrived. None covers serious assault in Spain.',
    uncertain: [
      { text: 'How much of the series’ movement reflects recording changes, especially in 2010 and 2015.' },
      { text: 'Whether the German and UK results apply to Spain, whose migrants differ in origin, language and legal status.' },
      NATIONAL,
    ],
  },

  crime_robbery: {
    noun: 'robbery',
    recorded: [
      { text: 'Robbery is recorded when victims report it to police. The 2015 Criminal Code reform may affect comparability around that year.', refs: ['lo2015'] },
    ],
    explanations: [
      { lead: 'COVID-19 restrictions in 2020.', text: 'Recorded robbery fell sharply in 2020, when movement was restricted, and partly recovered afterwards. This is consistent with fewer opportunities, but has not been tested here.', status: 'hypothesis', explains: 'any', years: [2020, 2021] },
      { lead: 'No verified explanation for the longer trend.', text: 'We found no study explaining Spain’s robbery trend over these years.', status: 'hypothesis', explains: 'any' },
    ],
    confounders: [AGE, ECON, CITIES, RECORDING],
    synthesis: [
      { lead: 'The evidence conflicts.', text: 'In Italy, robbery was the one offence that rose with immigration once cause and effect were isolated. In Germany, one study found a higher share of recognised refugees went with fewer robbery suspects, and another found no rise in Germans being robbed by refugee suspects.' },
      { lead: 'None covers Spain after 2009.', text: 'Results from Italy and Germany may not transfer to Spain’s migration.' },
    ],
    direct: [
      { id: 'bianchi2012', note: 'Italy: robbery rose with immigration.' },
      { id: 'dehos2021', note: 'Germany: fewer robbery suspects with more recognised refugees.' },
      { id: 'huang2026', note: 'Germany: no rise in Germans robbed by refugee suspects.' },
    ],
    broader: [{ id: 'bell2013', note: 'UK; property and violent crime.' }, ...BROAD_STUDIES.filter((s) => s.id !== 'bianchi2012')],
    gap: NO_SPAIN_RECENT,
    causal: 'The causal evidence on robbery conflicts: an Italian study finds an increase, German studies find none or a decrease. None covers Spain after 2009.',
    uncertain: [{ text: 'Why recorded robbery changed in Spain.' }, { text: 'Which of the conflicting results, if any, applies to Spain.' }, NATIONAL],
  },

  crime_burglary: {
    noun: 'burglary',
    recorded: [
      { text: 'Burglary is recorded when victims report it to police. The 2015 Criminal Code reform may affect comparability around that year.', refs: ['lo2015'] },
    ],
    explanations: [
      { lead: 'COVID-19 restrictions in 2020.', text: 'With more people at home in 2020, there were fewer opportunities for burglary. This has not been tested here.', status: 'hypothesis', explains: 'any', years: [2020, 2021] },
      { lead: 'No verified explanation for the longer trend.', text: 'We found no study explaining Spain’s burglary trend over these years.', status: 'hypothesis', explains: 'any' },
    ],
    confounders: [AGE, ECON, CITIES, RECORDING],
    synthesis: PROPERTY_SYNTH,
    direct: [
      { id: 'alonso2012', note: 'Spain 1999–2009: property crime as a group.' },
      { id: 'bell2013', note: 'UK: property crime as a group.' },
      { id: 'bianchi2012', note: 'Italy: property crime as a group.' },
      { id: 'lange2024', note: 'Germany: property crime as a group.' },
      { id: 'dehos2021', note: 'Germany: theft and other non-violent offences.' },
    ],
    broader: BROAD_STUDIES.filter((s) => !['alonso2012', 'bianchi2012', 'lange2024'].includes(s.id)),
    gap: 'No study reports burglary separately; the closest evidence is for property crime as a group.',
    causal: 'Causal studies of property crime find modest increases for some migrant groups and none or decreases for others. None reports burglary separately, and none covers Spain after 2009.',
    uncertain: [{ text: 'Why recorded burglary changed in Spain.' }, { text: 'Whether results for property crime as a group apply to burglary.' }, NATIONAL],
  },

  crime_theft: {
    noun: 'theft',
    recorded: [
      { text: 'Recorded theft depends on victims reporting it and police recording it.' },
      { text: 'Spain’s series jumps between 2009 and 2010 and again in 2015, the year of the Criminal Code reform. Changes that sudden are more likely to reflect recording than behaviour.', refs: ['lo2015'] },
    ],
    explanations: [
      { lead: 'A recording change in 2010.', text: 'The jump between 2009 and 2010 is too large to be a real change and most likely reflects how offences were classified.', status: 'documented', explains: 'any', years: [2010, 2010] },
      { lead: 'The 2015 Criminal Code reform.', text: 'The reform abolished minor offences (“faltas”) and reclassified some as minor crimes. The series spikes in 2015.', status: 'documented', explains: 'any', years: [2015, 2016], refs: ['lo2015'] },
      { lead: 'COVID-19 restrictions in 2020.', text: 'Recorded theft fell sharply in 2020, when movement and tourism collapsed, and recovered by 2022. This has not been tested here.', status: 'hypothesis', explains: 'any', years: [2020, 2022] },
    ],
    confounders: [AGE, ECON, CITIES, RECORDING],
    synthesis: PROPERTY_SYNTH,
    direct: [
      { id: 'dehos2021', note: 'Germany: theft reported separately.' },
      { id: 'alonso2012', note: 'Spain 1999–2009: property crime as a group.' },
      { id: 'bell2013', note: 'UK: property crime as a group.' },
      { id: 'bianchi2012', note: 'Italy: property crime as a group.' },
      { id: 'lange2024', note: 'Germany: property crime as a group.' },
    ],
    broader: BROAD_STUDIES.filter((s) => !['alonso2012', 'bianchi2012', 'lange2024'].includes(s.id)),
    gap: NO_SPAIN_RECENT,
    causal: 'Causal studies of property crime and theft find modest increases for some migrant groups and none or decreases for others. None covers Spain after 2009.',
    uncertain: [{ text: 'How much of the series’ movement reflects recording changes in 2010 and 2015.' }, { text: 'Whether results from other countries apply to Spain.' }, NATIONAL],
  },

  crime_fraud: {
    noun: 'fraud',
    recorded: [
      { text: 'Recorded fraud depends on victims and banks reporting it. Spain’s series starts only in 2016.' },
    ],
    explanations: [
      { lead: 'Fraud moving online.', text: 'Recorded fraud and recorded cybercrime both rose over these years, consistent with more fraud committed online, which affects everyone regardless of where offenders live. This has not been tested here.', status: 'hypothesis', explains: 'rise' },
    ],
    confounders: [{ text: 'Online activity: the growth of online shopping and banking raised opportunities for fraud over the same years as immigration rose, so the two trends can move together without being connected.' }, RECORDING],
    synthesis: [
      { lead: 'Almost no research on fraud.', text: 'Only one causal study we verified reports fraud separately: in Germany up to 2015, recognised refugees were associated with more non-violent offences, including fraud, while asylum seekers were not.' },
      { lead: 'Online fraud can cross borders.', text: 'Much fraud is committed remotely, so local migrant populations are a poor proxy for who commits it.' },
    ],
    direct: [{ id: 'dehos2021', note: 'Germany: fraud reported separately.' }],
    broader: [{ id: 'bell2013', note: 'UK; property and violent crime.' }, ...BROAD_STUDIES],
    gap: 'No study of immigration and fraud in Spain was found.',
    causal: 'Only one German study reports fraud separately, and it describes its positive result as an association. No study covers Spain. The data here cannot establish cause.',
    uncertain: [{ text: 'How much of the rise reflects online fraud, more reporting, or other changes.' }, NATIONAL],
  },

  crime_cyber: {
    noun: 'cybercrime',
    recorded: [{ text: 'Recorded cybercrime depends on victims noticing and reporting attacks, and on police capacity to record them. Spain’s series starts only in 2017.' }],
    explanations: [
      { lead: 'More life online.', text: 'Recorded cybercrime has risen with the spread of online services. Offenders can be anywhere in the world. This has not been tested here.', status: 'hypothesis', explains: 'rise' },
    ],
    confounders: [{ text: 'Online activity: cybercrime grows with internet use, which rose over the same years as immigration.' }, RECORDING],
    synthesis: [{ lead: 'No research found.', text: 'We found no study of immigration and cybercrime. Offenders need not live in the country where victims are.' }],
    direct: [],
    broader: BROAD_STUDIES,
    gap: 'No study of immigration and cybercrime was found.',
    causal: 'There is no research on immigration and cybercrime, and the data here cannot establish cause. A shared upward trend over a few years is expected for unrelated series.',
    uncertain: [{ text: 'Whether any connection exists: offenders may be outside Spain.' }, NATIONAL],
  },

  crime_drugs: {
    noun: 'drug offences',
    recorded: [{ text: 'Drug offences are mostly detected by police rather than reported by victims, so recorded figures largely reflect police activity and priorities.' }],
    explanations: [
      { lead: 'Police activity.', text: 'Changes in enforcement priorities can move recorded drug offences without any change in drug use or trafficking. We found no study measuring this for Spain.', status: 'hypothesis', explains: 'any' },
    ],
    confounders: [{ text: 'Policing: where and whom police check affects recorded drug offences, and can differ between groups.' }, AGE, CITIES],
    synthesis: [{ lead: 'Very little research.', text: 'One German study reports drug offences separately and finds a positive but statistically insignificant association with recognised refugees. Because these offences are found by police, recorded figures may reflect policing as much as behaviour.' }],
    direct: [{ id: 'dehos2021', note: 'Germany: drug offences, positive but not significant.' }],
    broader: [{ id: 'bell2013', note: 'UK; property and violent crime.' }, ...BROAD_STUDIES],
    gap: 'No study of immigration and drug offences in Spain was found.',
    causal: 'One German study finds no significant effect on drug offences. No study covers Spain, and because police detect these offences, the data here mostly measures enforcement.',
    uncertain: [{ text: 'Whether recorded drug offences track drug crime or police activity.' }, NATIONAL],
  },
}
CRIME_PROFILES.crime_homicide_long = CRIME_PROFILES.crime_homicide

export const crimeProfile = (id: string): CrimeProfile | null => CRIME_PROFILES[id] ?? null
