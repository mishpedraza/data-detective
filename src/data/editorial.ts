type EditorialQuestion = {
  id: string
  question: string
  featured?: true
} & (
  | { status: 'available'; relationship: string }
  | { status: 'research' }
)

export const EDITORIAL_QUESTIONS: readonly EditorialQuestion[] = [
  {
    id: 'housing-affordability', question: 'Are houses really more expensive than they used to be?', featured: true,
    status: 'available', relationship: 'housing-affordability',
  },
  {
    id: 'children-and-happiness', question: 'Does having children make people happier?', featured: true, status: 'research',
  },
  {
    id: 'working-hours', question: 'Are we actually working harder than our grandparents?', status: 'research',
  },
  {
    id: 'immigration-crime', question: 'Does immigration really increase crime?',
    status: 'available', relationship: 'immigration-crime',
  },
  {
    id: 'education-and-pay', question: 'Why do women earn less despite outperforming men in education?', status: 'research',
  },
  {
    id: 'global-danger', question: 'Is the world becoming more dangerous?', status: 'research',
  },
  {
    id: 'generational-wealth', question: 'Are younger generations poorer than their parents?', status: 'research',
  },
  {
    id: 'crime-perceptions', question: 'Is crime really rising as much as people think?', status: 'research',
  },
  {
    id: 'wealth-and-fertility', question: 'Why are wealthy countries having fewer children?', status: 'research',
  },
]

export const DEFAULT_INVESTIGATION = 'housing-affordability'

export function editorialQuestionById(id: string) {
  return EDITORIAL_QUESTIONS.find((entry) => entry.id === id)
}

export function editorialQuestionForRelationship(id: string) {
  return EDITORIAL_QUESTIONS.find((entry) => entry.status === 'available' && entry.relationship === id)
}
