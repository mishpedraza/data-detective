import type { Indicator } from './types'

export const COUNTRIES: Record<string, { name: string; adjective: string }> = {
  ES: { name: 'Spain', adjective: 'Spanish' },
  PT: { name: 'Portugal', adjective: 'Portuguese' },
  IT: { name: 'Italy', adjective: 'Italian' },
  FR: { name: 'France', adjective: 'French' },
  DE: { name: 'Germany', adjective: 'German' },
  EU27_2020: { name: 'the EU average', adjective: 'EU' },
  US: { name: 'the United States', adjective: 'US' },
}
export const COMPARE_OPTIONS = ['none', 'PT', 'IT', 'FR', 'DE', 'US', 'EU27_2020']

/** Whether comparing this indicator with Spain is methodologically defensible, and what to say about it. */
export function comparability(ind: Indicator, geo: string): { ok: boolean; note?: string } {
  if (geo === 'none' || geo === 'ES') return { ok: true }
  const name = COUNTRIES[geo]?.name ?? geo
  const src = ind.geoSources?.[geo]?.note
  const br = ind.geoBreaks?.[geo]
  const brNote = br?.length ? `Eurostat flags a break in ${name}’s ${ind.short.toLowerCase()} series in ${br.join(', ')}: figures before and after are not fully comparable.` : undefined
  if (ind.dimension !== 'crime') return { ok: true, note: [src, brNote].filter(Boolean).join(' ') || undefined }
  const r = crimeRule(ind, name, brNote)
  return src && r.ok ? { ok: true, note: `${r.note} ${src}` } : r
}

function crimeRule(ind: Indicator, name: string, brNote?: string): { ok: boolean; note?: string } {
  if (ind.id === 'crime_homicide_long')
    return { ok: true, note: `Comparable with care: UNODC compiles these homicide rates from national police and health records using one international definition, the most comparable crime measure across countries.` }
  if (brNote) return { ok: false, note: brNote }
  if (ind.id === 'crime_sexual')
    return { ok: false, note: `Not compared across countries: legal definitions of rape and sexual assault changed during this period (in Spain in 2015 and 2022, in Germany in 2016), so even trends are not comparable.` }
  if (ind.id === 'crime_cyber')
    return { ok: false, note: `Not compared across countries: what police record as offences against computer systems varies widely and recording has changed quickly, so neither levels nor trends are comparable.` }
  if (ind.id === 'crime_homicide')
    return { ok: true, note: `Homicide is the most consistently defined offence across countries, but these are national police counts and Eurostat advises caution when comparing levels.` }
  return { ok: true, note: `Trends only: Spain and ${name} define and record ${ind.short.toLowerCase()} differently, so compare the direction of change, not the levels. Changes in either country’s law or recording practice can also distort trends; Spain’s are marked on the chart.` }
}
