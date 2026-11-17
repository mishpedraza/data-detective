type EditorialQuestion = {
  id: string
  question: string
  featured?: true
} & (
  | { status: 'available'; relationship: string }
  | { status: 'preview'; needs: string; related?: { relationship: string; label: string } }
)

export const EDITORIAL_QUESTIONS: readonly EditorialQuestion[] = [
  {
    id: 'working-hours', question: 'Are we actually working harder than our grandparents?', status: 'preview',
    needs: 'We need comparable working-time records across generations, including unpaid work and changes in who was in paid employment.',
  },
  {
    id: 'education-and-pay', question: 'Why do women earn less despite outperforming men in education?', status: 'preview',
    needs: 'We need to verify the education and earnings patterns for the same population and review studies on careers, hours, occupations and parenthood.',
  },
  {
    id: 'immigration-crime', question: 'Does immigration really increase crime?', featured: true,
    status: 'available', relationship: 'immigration-crime',
  },
  {
    id: 'housing-affordability', question: 'Are houses really more expensive than they used to be?', featured: true,
    status: 'available', relationship: 'housing-affordability',
  },
  {
    id: 'generational-wealth', question: 'Are younger generations poorer than their parents?', status: 'preview',
    needs: 'We need income, wealth and housing costs for different generations measured at comparable ages.',
  },
  {
    id: 'children-and-happiness', question: 'Does having children make people happier?', status: 'preview',
    needs: 'We need research that follows people before and after parenthood and distinguishes daily well-being, life satisfaction and meaning.',
  },
  {
    id: 'wealth-and-fertility', question: 'Why are wealthy countries having fewer children?', status: 'preview',
    needs: 'We need comparable fertility and income trends and research that can weigh possible explanations across countries.',
  },
  {
    id: 'global-danger', question: 'Is the world becoming more dangerous?', status: 'preview',
    needs: 'We need comparable global records for specific risks, such as deaths from conflict and violent crime, over a clearly defined period.',
  },
  {
    id: 'crime-perceptions', question: 'Is crime really rising as much as people think?', status: 'preview',
    needs: 'We need surveys of perceived crime trends and comparable recorded or reported crime measures for the same places and years.',
  },
]

export const DEFAULT_INVESTIGATION = 'housing-affordability'

export function editorialQuestionById(id: string) {
  return EDITORIAL_QUESTIONS.find((entry) => entry.id === id)
}

export function editorialQuestionForRelationship(id: string) {
  return EDITORIAL_QUESTIONS.find((entry) => entry.status === 'available' ? entry.relationship === id : entry.related?.relationship === id)
}
