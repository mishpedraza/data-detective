// Estimates and counts transcribed from the figures or tables cited in each story.
export const happinessEstimates = [
  { label: '4–5 years before', value: 0, time: -4.5 },
  { label: '1 year before', value: 0.30, time: -1 },
  { label: 'Birth year', value: 0.32, time: 0 },
  { label: '1–2 years after', value: 0.05, time: 1.5 },
] as const // Myrskylä & Margolis, Table 2, German fixed-effects estimates.

export const permitCrime = { baseline: 1.1, reduction: 0.6 } // Pinotti, abstract.
/** Kleven, Landais & Søgaard (2021), Table 2: earnings penalty for mothers relative to fathers, %, averaged over years 0–5 and 6–10. */
export const adoptionPenalties = {
  birth: { short: 19.0, long: 17.0 },
  adopted: { short: 15.3, long: 18.1 },
} as const
/** FBI, 2025 Reported Crimes in the Nation: estimated change in the violent crime rate, 2024 to 2025. */
export const violentCrime2025 = { change: -9.3, since: 1936 } as const
/** Gallup, October polls: share of U.S. adults saying there is more crime in the U.S. than a year ago. */
export const gallupMoreCrime = [
  { year: 2023, value: 77 }, { year: 2024, value: 64 }, { year: 2025, value: 49 }, { year: 2026, value: 46 },
] as const
export const danishEarnings = [
  { label: 'Mothers', value: -20, display: 'About 20% lower' },
  { label: 'Fathers', value: 0, display: 'Little change' },
] as const // Kleven et al., Figure 3A. Approximate effects, ten years after first birth.

export const cohortWealth = [
  { label: 'Baby boomers · 1989', net: 113.9, debt: 59.3 },
  { label: 'Generation X · 2001', net: 148, debt: 79.4 },
  { label: 'Millennials · 2016', net: 91.7, debt: 84.6 },
] as const // Kurz et al., Table 4, mean amounts in thousands of 2016 US dollars.

export const usCrime = { decline: 49, pollsAboveThreshold: 23, polls: 27, publicThreshold: 60 } // Pew's FBI and Gallup comparisons.

export const fertilityRates = [
  { label: 'France', value: 1.9 },
  { label: 'Germany', value: 1.4 },
] as const // Doepke et al., Figure 8b, approximate 2000 rates.

const battleDeaths = 122000
export const conflictDeaths = {
  total: battleDeaths,
  groups: [
    { label: 'War in Ukraine', value: 71000 },
    { label: 'Israel–Palestine conflict', value: 23000 },
    { label: 'All other conflicts', value: battleDeaths - 71000 - 23000 },
  ],
} // PRIO, executive summary; rounded counts of battle-related deaths in 2023.
