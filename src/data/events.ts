import type { DimensionId } from './types'

export interface HistoricalEvent {
  id: string
  start: number
  end: number
  label: string
  detail: string
  only?: DimensionId[]
}

export const EVENTS: HistoricalEvent[] = [
  { id: 'regularisation', start: 2005, end: 2005, label: '2005 regularisation', detail: 'Spain ran an extraordinary regularisation of undocumented workers with a job contract.', only: ['immigration'] },
  { id: 'gfc', start: 2008, end: 2009, label: 'Financial crisis', detail: 'The global financial crisis ends Spain’s housing and construction boom.' },
  { id: 'euro', start: 2010, end: 2013, label: 'Euro debt crisis', detail: 'Sovereign-debt stress, austerity and a 2012 bank rescue; unemployment peaks in 2013.' },
  { id: 'covid', start: 2020, end: 2020, label: 'COVID-19', detail: 'Lockdowns cut activity, mobility and many kinds of street crime in 2020.' },
  { id: 'inflation', start: 2022, end: 2023, label: 'Inflation surge', detail: 'Energy and food prices push inflation to multi-decade highs.' },
]
