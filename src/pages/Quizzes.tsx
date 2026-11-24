import { QUIZZES, hasChapterList, quizQuestions, type Quiz } from '../data/quizzes'
import { challengeAnswers } from '../lib/discoveryChallenge'
import { readDiscoveryProgress } from '../lib/discoveryProgress'
import { hrefFor } from '../lib/route'
import { track } from '../lib/analytics'
import { chapterAnswers, chapterQuestions } from '../lib/chapterScore'
import { chapterEntry, follow, playStatus, type Scored } from '../lib/quizEntry'

/** A row in a quiz or chapter list. Without an href it shows as coming soon. */
export function PlayCard({ kicker, title, description, status, questions = [], answers = [], href, onOpen, navigate }: {
  kicker?: string; title: string; description?: string; status: string
  questions?: readonly { id: string }[]; answers?: readonly Scored[]
  href?: string; onOpen?: () => void; navigate: (href: string) => void
}) {
  const body = <>
    <span className="quiz-body">
      {kicker && <span className="discovery-kicker">{kicker}</span>}
      <span className="quiz-title">{title}</span>
      {description && <span className="quiz-desc">{description}</span>}
      <span className="quiz-meta">{status}</span>
      {questions.length > 0 && <span className="quiz-dots" aria-hidden="true">
        {questions.map(({ id }) => {
          const answer = answers.find((entry) => entry.id === id)
          return <span key={id} className={answer ? (answer.points === 1 ? 'right' : answer.points > 0 ? 'partial' : 'wrong') : ''} />
        })}
      </span>}
    </span>
    {href && <span className="quiz-go" aria-hidden="true">→</span>}
  </>
  return href
    ? <a className="quiz-card" href={href} onClick={follow(navigate, href, onOpen)}>{body}</a>
    : <div className="quiz-card quiz-soon">{body}</div>
}

function QuizCard({ quiz, navigate }: { quiz: Quiz; navigate: (href: string) => void }) {
  const questions = quizQuestions(quiz)
  const progress = readDiscoveryProgress(quiz.attemptKey)
  const answers: Scored[] = quiz.format === 'chapter'
    ? chapterAnswers(progress, chapterQuestions(quiz), quiz.edition).map(({ id, points }) => ({ id, points }))
    : challengeAnswers(progress, quiz).map(({ id, correct }) => ({ id, points: Number(correct) }))
  const soon = questions.length === 0
  const chapter = quiz.chapters[0]
  const entry = !soon && quiz.format === 'chapter' && !hasChapterList(quiz) ? chapterEntry(quiz, chapter.id) : undefined
  const href = soon ? undefined : entry?.href ?? hrefFor('discover', { quiz: quiz.id })
  const minutes = quiz.chapters.reduce((sum, { minutes = 0 }) => sum + minutes, 0)
  const browse = hrefFor('discover', { quiz: quiz.id, mode: 'browse' })
  return (
    <li>
      <PlayCard title={quiz.title} description={quiz.description} navigate={navigate} href={href}
        status={soon ? 'Coming soon' : playStatus(questions, answers, minutes)} questions={questions} answers={answers}
        onOpen={() => {
          track('quiz_selected', { quiz_id: quiz.id, answered_count: answers.length })
          if (entry) track(entry.event, { quiz_id: quiz.id, theme_id: quiz.id, chapter_id: chapter.id, answered_count: entry.answers.length })
        }} />
      {quiz.browse && !soon && <a className="discovery-link quiz-browse" href={browse} onClick={follow(navigate, browse)}>Browse all discoveries <span aria-hidden="true">→</span></a>}
    </li>
  )
}

export function QuizCollection({ navigate }: { navigate: (href: string) => void }) {
  return (
    <div className="discover discover-edition discovery-reader">
      <section className="discovery-reading quiz-collection">
        <h1 tabIndex={-1}>Think you know how things really are?</h1>
        <p className="discovery-context">Test your gut. Discover what the data says.</p>
        <ol className="quiz-list">
          {QUIZZES.map((quiz) => <QuizCard key={quiz.id} quiz={quiz} navigate={navigate} />)}
        </ol>
      </section>
    </div>
  )
}

export function QuizComingSoon({ quiz, navigate }: { quiz: Quiz; navigate: (href: string) => void }) {
  const home = hrefFor('discover')
  return (
    <div className="discover discover-edition discovery-reader">
      <nav className="discovery-reader-nav" aria-label="Quiz navigation">
        <a className="discovery-contents-trigger" href={home} onClick={follow(navigate, home)}>← All quizzes</a>
      </nav>
      <section className="discovery-reading discovery-welcome">
        <p className="discovery-kicker">Coming soon</p>
        <h1 tabIndex={-1}>{quiz.title}</h1>
        <p className="discovery-context">{quiz.description} The questions are still being checked against the evidence.</p>
        <div className="discovery-welcome-actions">
          <a className="discovery-link" href={home} onClick={follow(navigate, home)}>Try another quiz <span aria-hidden="true">→</span></a>
        </div>
      </section>
    </div>
  )
}
