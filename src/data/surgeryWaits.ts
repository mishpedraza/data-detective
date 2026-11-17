export const surgeryQuestion = 'Are people waiting longer for surgery in Spain?'
export const surgerySource = 'https://www.sanidad.gob.es/estadEstudios/estadisticas/inforRecopilaciones/docs/LISTAS_PUBLICACION_Dic_2025_rectificado.pdf'

// SISLE-SNS, corrected December 2025 report, printed pages 6 and 8.
export const surgeryTrend = [
  { date: 'Dec 2022', days: 120 },
  { date: 'Jun 2023', days: 112 },
  { date: 'Dec 2023', days: 128 },
  { date: 'Jun 2024', days: 121 },
  { date: 'Dec 2024', days: 126 },
  { date: 'Jun 2025', days: 118 },
  { date: 'Dec 2025', days: 122 },
]

export const surgeryRegions = [
  ['Andalusia', 173], ['Aragon', 132], ['Asturias', 91], ['Balearic Islands', 105],
  ['Basque Country', 64], ['Canary Islands', 106], ['Cantabria', 137],
  ['Castile and León', 87], ['Castilla-La Mancha', 117], ['Catalonia', 142],
  ['Ceuta', 94], ['Extremadura', 135], ['Galicia', 73], ['La Rioja', 78],
  ['Madrid', 50], ['Melilla', 82], ['Murcia', 103], ['Navarre', 96], ['Valencian Community', 88],
] as const
