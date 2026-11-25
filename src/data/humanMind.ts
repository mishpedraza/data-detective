// "How easily can your brain fool you?" Every figure is checked against the cited source; see the PR's source audit.
import type { ChapterQuestion } from './menWomen'

/** Gehlbach, Robinson & Fletcher (2024): conditions, and each group's average guess of the share of people who would agree with them. */
export const HALF_STORY = {
  people: 1261,
  adequacy: { b: 0.0, low: -0.021, high: 0.022 },
  agree: [{ id: 'all', label: 'Read both sides', share: 62 }, { id: 'merge', label: 'Read only pro-merger', share: 68 }, { id: 'separate', label: 'Read only anti-merger', share: 65 }],
} as const
/** Arguments written for this quiz in the shape of the study's article: three each way, one neutral. */
export const MERGE_CASE = {
  neutral: 'Both schools are about the same size.',
  merge: ['The other school has a reliable water supply.', 'Pooling staff would keep every subject on the timetable.', 'Students would have more classmates and clubs to choose from.'],
  separate: ['Many children would face a long bus ride every day.', 'The school is the heart of a small community.', 'Wetter years could refill the aquifer.'],
} as const
/** Doshi & Hauser (2024): changes relative to stories written without AI. */
export const AI_STORIES = {
  writers: 293,
  evaluators: 600,
  novelty: { one: 5.4, five: 8.1 },
  lowCreative: { wellWritten: 26.6 },
  similarityOfRange: { one: 10.7, five: 8.9 },
} as const
/** Sultan et al. (2024): pooled accuracy across 31 experiments. */
export const NEWS = { experiments: 31, people: 11_561, judgments: 256_337, trueRight: 68.51, falseRight: 67.24, age: 0.38 } as const
/** Roediger & McDermott (1995), list for the critical word "sleep". */
export const SLEEP_LIST = ['bed', 'rest', 'awake', 'tired', 'dream', 'wake', 'snooze', 'blanket', 'doze', 'slumber', 'snore', 'nap', 'peace', 'yawn', 'drowsy'] as const
/** Recent recognition studies: share of studied words and of the missing related word that people said they had seen. */
export const LURE = { hits: 86, lure: 84, unrelated: 10, frontiers: 75 } as const
/** von Schenk et al. (2024): unaided human accuracy, the algorithm's accuracy, and how often people accused anyone. */
/** Who came out ahead on each outcome: direction only, because the open abstracts give no effect sizes. */
export const IDEAS = [
  { outcome: 'Number of ideas', winner: 'write', study: 2025 },
  { outcome: 'Original ideas', winner: 'write', study: 2025 },
  { outcome: 'Share of good ideas', winner: 'write', study: 2025 },
  { outcome: 'Building on each other’s ideas', winner: 'talk', study: 2026 },
  { outcome: 'Group cohesion', winner: 'talk', study: 2026 },
] as const
export const IDEAS_GROUPS = { online: 57, students: 157, cohesion: 54 } as const

export const LIES = { human: 46.47, algorithm: 66.86, accuse: 19.22, accuseRight: 40.82 } as const

export const MIND_QUESTIONS: readonly ChapterQuestion[] = [
  {
    id: 'hm-halfstory', kind: 'choice', short: 'Half the story',
    question: 'Can you know half the story and still feel fully informed?',
    warmup: {
      kind: 'choice',
      prompt: `First, just for you. A school’s local aquifer is drying up, and the board must decide whether to merge with a school nearby. Here is what you know: ${MERGE_CASE.merge.join(' ')} ${MERGE_CASE.neutral} What should the board do?`,
      options: [{ id: 'merge', label: 'Merge the schools' }, { id: 'separate', label: 'Keep them separate' }],
    },
    prompt: 'In the study, some people read every argument; others read only the case for one side. Compared with people who read everything, how well-informed did the one-sided readers feel?',
    options: [
      { id: 'less', label: 'Clearly less well-informed' },
      { id: 'bit', label: 'A little less well-informed' },
      { id: 'same', label: 'Just as well-informed' },
    ],
    answer: 'same',
    finding: 'Just as well-informed. Reading half the arguments made no measurable difference to how informed people felt.',
    takeaway: 'They also felt just as competent to decide, and the half they happened to read steered their choice. Feeling that you have enough information is not the same as having it: people rarely ask what they haven’t been told.',
    visual: 'halfstory',
    evidence: {
      citation: 'Gehlbach, Robinson & Fletcher (2024), PLOS ONE',
      url: 'https://doi.org/10.1371/journal.pone.0310216',
      sample: '1,261 US adults recruited online in June 2023 (preregistered): 252 read all seven points about the merger, 503 read only the pro-merger points and 506 only the anti-merger points.',
      method: 'Compared how adequate people rated their information and their competence to decide. The difference between one-sided and full readers was 0.00 on both (95% CI about ±0.02). Some then read the other side and could change their recommendation.',
      limitation: 'One fictional scenario with an online sample. The arguments shown here were written for this quiz in the same shape as the study’s article; they are not the study’s text.',
    },
  },
  {
    id: 'hm-aistory', kind: 'choice', short: 'AI and creativity',
    question: 'Does AI make our ideas more creative, or more alike?',
    prompt: 'Writers were asked to write a very short story. Some could ask an AI for story ideas first. Independent readers then rated the stories. What happened to stories written with AI ideas?',
    options: [
      { id: 'worse', label: 'Rated less creative, and more alike' },
      { id: 'varied', label: 'Rated more creative, and more varied' },
      { id: 'alike', label: 'Rated more creative, but more alike' },
      { id: 'none', label: 'No real difference' },
    ],
    answer: 'alike',
    finding: 'Rated more creative, but more alike. On average, stories were rated better, while the collection became less diverse.',
    takeaway: 'The gains were biggest for the least creative writers; the most creative gained little, which narrowed the gap between writers. But stories built on AI ideas resembled each other, and the AI ideas, more than human-only stories did. What helps each person can still shrink the variety of the whole.',
    visual: 'aistory',
    evidence: {
      citation: 'Doshi & Hauser (2024), Science Advances',
      url: 'https://doi.org/10.1126/sciadv.adn5290',
      sample: '293 writers, each writing one eight-sentence story, and 600 readers who each rated six stories without knowing who had used AI.',
      method: 'Writers were randomly given no AI, one AI idea or up to five AI ideas. With five ideas, novelty ratings rose 8.1%. Similarity to other stories rose by 10.7% (one idea) and 8.9% (five ideas) of the range seen among stories written without AI.',
      limitation: 'One short creative-writing task with one AI model in 2023. It doesn’t show the same for longer work, other tasks or people who use AI for months.',
    },
  },
  {
    id: 'hm-humble', kind: 'choice', short: 'Humble experts',
    question: 'Do we trust experts more when they admit what they don’t know?',
    prompt: 'Two scientists present the same study. Dr A: “Our results clearly show this works.” Dr B: “Our results suggest this works, but I could be wrong, and I’d change my mind with better evidence.” Who did people trust more?',
    options: [
      { id: 'confident', label: 'The confident scientist, Dr A' },
      { id: 'humble', label: 'The humble scientist, Dr B' },
      { id: 'same', label: 'Both equally' },
    ],
    answer: 'humble',
    finding: 'The humble one. Scientists seen as intellectually humble were trusted more, and so was their research.',
    takeaway: 'Humility here means being open about limits and willing to update, not lacking expertise. People were also more willing to follow a humble scientist’s recommendations and to look for more of their work.',
    visual: 'humble',
    evidence: {
      citation: 'Koetke, Schumann, Bowes & Vaupotič (2024), Nature Human Behaviour',
      url: 'https://doi.org/10.1038/s41562-024-02060-x',
      sample: '2,034 US adults across five preregistered studies, about medical, psychological and climate science.',
      method: 'Measured how humble people saw real scientists, then experimentally described scientists as more or less humble and compared trust, belief in their research and willingness to follow their advice. The quotes above are illustrative, not the study’s materials.',
      limitation: 'Scientific communication only, mostly in short written descriptions. Published online in November 2024; the effect sizes aren’t in the open abstract, so none are shown here.',
    },
  },
  {
    id: 'hm-news', kind: 'choice', short: 'Fake news',
    question: 'Who is better at spotting fake news?',
    prompt: 'Across 31 experiments, thousands of Americans judged whether real and false headlines were accurate. Which group was better at telling the two apart?',
    options: [
      { id: 'younger', label: 'Younger adults' },
      { id: 'older', label: 'Older adults' },
      { id: 'same', label: 'No difference by age' },
    ],
    answer: 'older',
    finding: 'Older adults. They were better at telling true headlines from false ones.',
    takeaway: 'Older people were also more cautious, a little more inclined to call headlines false. Overall people got about two in three headlines right, true or false. This is about judging headlines, not about who shares misinformation.',
    visual: 'news',
    evidence: {
      citation: 'Sultan et al. (2024), PNAS',
      url: 'https://doi.org/10.1073/pnas.2409329121',
      more: [{ citation: 'Pfänder & Altay (2025), Nature Human Behaviour', url: 'https://doi.org/10.1038/s41562-024-02086-1' }],
      sample: '11,561 US participants making 256,337 judgments in 31 experiments.',
      method: 'Pooled every participant’s answers and separated skill at telling true from false (discernment) from a general lean towards “true” or “false”. Older age: β = 0.38 for discernment (95% CI 0.29–0.47). A wider meta-analysis across 40 countries also found people better than chance.',
      limitation: 'US participants and headlines picked by researchers. A few guesses here can’t measure anyone’s own skill.',
    },
  },
  {
    id: 'hm-lure', kind: 'choice', short: 'False memory',
    question: 'Can you remember a word you never saw?',
    warmup: { kind: 'words', prompt: 'First, just for you. Read these 15 words once. They’ll disappear.' },
    prompt: 'In a recent memory study, people studied lists like this one. Later they saw a related word that had never been shown, like “sleep”. How often did they say they had seen it?',
    options: [
      { id: 'rare', label: 'About 1 time in 10' },
      { id: 'some', label: 'About 4 times in 10' },
      { id: 'most', label: 'More than 8 times in 10' },
    ],
    answer: 'most',
    finding: 'More than 8 times in 10, almost as often as words they really had seen.',
    takeaway: 'Each word quietly activates related ones, and the missing word ends up feeling familiar. That isn’t a fault: it’s how memory stores meaning rather than exact copies. If you said yes to “sleep”, you remembered the gist.',
    visual: 'lure',
    evidence: {
      citation: 'Bayoud, Pierce & Gallo (2026), Memory & Cognition',
      url: 'https://doi.org/10.3758/s13421-026-01892-4',
      more: [
        { citation: 'Tringali & Huff (2025), Frontiers in Psychology', url: 'https://doi.org/10.3389/fpsyg.2025.1529070' },
        { citation: 'Roediger & McDermott (1995), Journal of Experimental Psychology: Learning, Memory, and Cognition', url: 'https://doi.org/10.1037/0278-7393.21.4.803' },
      ],
      sample: 'About 36 university students in the first experiment; the word list is the classic one from 1995.',
      method: 'People said “seen” to 86% of studied words and 84% of the missing related words, against 10% for missing words from lists they never studied. A 2025 study found 75%.',
      limitation: 'Small student samples and word lists. It doesn’t mean memories of real events are this unreliable, and this exercise doesn’t test your memory.',
    },
  },
  {
    id: 'hm-lies', kind: 'choice', short: 'Lie detection',
    question: 'Can we tell when someone is lying?',
    prompt: 'People read short statements about others’ weekend plans. Half were true and half were lies. Without help, how often did people judge correctly?',
    options: [
      { id: 'below', label: 'Slightly worse than a coin flip' },
      { id: 'sixty', label: 'About 60% of the time' },
      { id: 'eighty', label: 'About 80% of the time' },
    ],
    answer: 'below',
    finding: 'Slightly worse than a coin flip: 46% correct, where guessing would give 50%.',
    takeaway: 'A trained algorithm scored 67% on the same statements. People rarely accused anyone of lying, and when they did, they were wrong more often than right. Older studies found that feeling confident doesn’t mean being accurate.',
    visual: 'lies',
    evidence: {
      citation: 'von Schenk et al. (2024), iScience',
      url: 'https://doi.org/10.1016/j.isci.2024.110201',
      more: [{ citation: 'Volz, Reinhard & Müller (2022), Applied Cognitive Psychology', url: 'https://doi.org/10.1002/acp.3953' }],
      sample: 'Written true and false statements about weekend plans, judged by online participants; 12 earlier studies (2,817 people) for confidence.',
      method: 'Without the algorithm, people were 46.47% accurate and accused 19.22% of statements, of which 40.82% were lies. The algorithm’s 66.86% comes from five-fold cross-validation. The 2022 reanalysis found no link between confidence and accuracy under any measure.',
      limitation: 'One kind of written statement and one algorithm. It doesn’t show that AI can detect lies in general or in real-world settings.',
    },
  },
  {
    id: 'hm-brainstorm', kind: 'choice', short: 'Brainstorming',
    question: 'Do groups come up with better ideas by talking?',
    prompt: 'Groups solve the same problem either by talking it through or by silently writing ideas down. What happened?',
    options: [
      { id: 'talk', label: 'Talking won on both' },
      { id: 'write', label: 'Writing won on both' },
      { id: 'split', label: 'Writing produced better ideas, but talking made groups like working together more' },
      { id: 'same', label: 'No difference' },
    ],
    answer: 'split',
    finding: 'Writing won on the ideas. Talking won on how the group felt.',
    takeaway: 'Writing groups came up with more ideas, more original ones and a higher share of good ones. Talking groups built more on each other’s ideas and felt more cohesive. Coming up with ideas and choosing one are different jobs: on video calls, pairs came up with fewer creative ideas than in person, but were no worse at picking the best one.',
    visual: 'ideas',
    evidence: {
      citation: 'Baruah, Jimenez & Paulus (2025), Journal of Creative Behavior',
      url: 'https://doi.org/10.1002/jocb.70058',
      more: [
        { citation: 'Henningsen et al. (2026), Southern Communication Journal', url: 'https://doi.org/10.1080/1041794X.2026.2638815' },
        { citation: 'Brucks & Levav (2022), Nature', url: 'https://doi.org/10.1038/s41586-022-04643-y' },
      ],
      sample: '157 working students randomly assigned to 57 small online groups (2025); 54 three-person groups, 18 per condition (2026); a lab study and a field experiment in five countries (2022).',
      method: '2025: groups either wrote ideas silently in a shared online space or brainstormed out loud on video, then chose their best idea. Writing groups picked more original ideas; video groups picked more feasible ones. 2026: talking groups were compared with silent-writing groups and with people working alone whose ideas were pooled. 2022: pairs on video vs in person; staring at a screen narrowed their focus.',
      limitation: 'Separate, small studies in different settings, and only their abstracts were open, so the quiz shows who came out ahead, not by how much. The 2026 abstract reports no idea counts. None of these studies tests whether working alone first and then pooling ideas beats both.',
    },
  },
]

export const MIND_CHAPTER = {
  id: 'brain-fool',
  title: 'How easily can your brain fool you?',
  description: 'Memory, creativity, confidence and judgment. Discover how much you can really trust your own mind.',
  summary: 'Memory, creativity, confidence and judgment. Discover how much you can really trust your own mind.',
  minutes: 7,
  scoring: 'One point per research prediction. The personal exercises are never scored.',
} as const
