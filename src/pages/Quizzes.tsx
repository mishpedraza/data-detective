import { QUIZZES, quizQuestions, type Quiz, type QuizChapter } from '../data/quizzes'
import { hrefFor } from '../lib/route'
import { track } from '../lib/analytics'
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

function ChapterCard({ quiz, chapter, navigate }: { quiz: Quiz; chapter: QuizChapter; navigate: (href: string) => void }) {
  const entry = chapterEntry(quiz, chapter.id)
  return (
    <li>
      <PlayCard title={chapter.title} description={chapter.summary} navigate={navigate} href={entry.href}
        status={playStatus(entry.questions, entry.answers, chapter.minutes)} questions={entry.questions} answers={entry.answers}
        onOpen={() => {
          track('quiz_selected', { quiz_id: quiz.id, chapter_id: chapter.id, answered_count: entry.answers.length })
          track(entry.event, { quiz_id: quiz.id, theme_id: quiz.id, chapter_id: chapter.id, answered_count: entry.answers.length })
        }} />
    </li>
  )
}

function Theme({ quiz, navigate }: { quiz: Quiz; navigate: (href: string) => void }) {
  const browse = hrefFor('discover', { quiz: quiz.id, mode: 'browse' })
  return (
    <section className="quiz-theme" aria-labelledby={`theme-${quiz.id}`}>
      <h2 id={`theme-${quiz.id}`} className="discovery-kicker">{quiz.title}</h2>
      <ol className="quiz-list">
        {quiz.chapters.map((chapter) => <ChapterCard key={chapter.id} quiz={quiz} chapter={chapter} navigate={navigate} />)}
      </ol>
      {quiz.browse && <a className="discovery-link quiz-browse" href={browse} onClick={follow(navigate, browse)}>Browse all discoveries <span aria-hidden="true">→</span></a>}
    </section>
  )
}

export function QuizCollection({ navigate }: { navigate: (href: string) => void }) {
  return (
    <div className="discover discover-edition discovery-reader">
      <section className="discovery-reading quiz-collection">
        <h1 tabIndex={-1}>Think you know how things really are?</h1>
        <p className="discovery-context">Test your gut. Discover what the data says.</p>
        {QUIZZES.filter((quiz) => quiz.format === 'chapter' && quizQuestions(quiz).length > 0)
          .map((quiz) => <Theme key={quiz.id} quiz={quiz} navigate={navigate} />)}
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
        <p className="discovery-context">{quiz.description && `${quiz.description} `}The questions are still being checked against the evidence.</p>
        <div className="discovery-welcome-actions">
          <a className="discovery-link" href={home} onClick={follow(navigate, home)}>Try another quiz <span aria-hidden="true">→</span></a>
        </div>
      </section>
    </div>
  )
}
