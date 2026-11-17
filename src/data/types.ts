export type DimensionId = 'immigration' | 'crime' | 'economy' | 'housing' | 'living'

export type Format = 'count' | 'decimal1' | 'decimal2' | 'pct1' | 'bn' | 'mn' | 'eur' | 'index'

export interface SeriesBreak {
  year: number
  note: string
}

export interface Source {
  org: string
  dataset: string
  url: string
  upstream?: string
}

export interface Indicator {
  id: string
  dimension: DimensionId
  label: string
  short: string
  unit: string
  format: Format
  definition: string
  notes?: string
  source: Source
  breaks: SeriesBreak[]
  derived?: boolean
  parts?: { label: string; code: string; data: Record<string, number> }[]
  retrieved: string
  data: Record<string, Record<string, number>>
}

export interface Point {
  year: number
  value: number
}

export interface Reference {
  id: string
  authors: string
  year: number
  title: string
  outlet: string
  url: string
}

export interface Claim {
  text: string
  refs?: string[]
}

export interface Relationship {
  id: string
  question: string
  shortQuestion: string
  kicker: string
  left: { dimension: DimensionId; options: string[]; default: string }
  right: { dimension: DimensionId; options: string[]; default: string }
  explain: Claim[]
  cannot: Claim[]
  defaultCompare?: string
}
