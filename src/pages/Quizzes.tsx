import type { MouseEvent } from 'react'
import { QUIZZES, quizQuestions, type Quiz } from '../data/quizzes'
import { challengeAnswers } from '../lib/discoveryChallenge'
import { readDiscoveryProgress } from '../lib/discoveryProgress'
import { hrefFor } from '../lib/route'
import { track } from '../lib/analytics'
import { chapterAnswers, chapterQuestions, formatPoints, totalPoints } from '../lib/chapterScore'

function follow(navigate: (href: string) => void, href: string, then?: () => void) {
  return (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    then?.()
    navigate(href)
  }
}

function QuizCard({ quiz, position, navigate }: { quiz: Quiz; position: number; navigate: (href: string) => void }) {
  const questions = quizQuestions(quiz)
  const progress = readDiscoveryProgress(quiz.attemptKey)
  const answers = quiz.format === 'chapter'
    ? chapterAnswers(progress, chapterQuestions(quiz), quiz.edition).map(({ id, points }) => ({ id, points }))
    : challengeAnswers(progress, quiz).map(({ id, correct }) => ({ id, points: Number(correct) }))
  const score = formatPoints(totalPoints(answers))
  const soon = questions.length === 0
  const href = hrefFor('discover', { quiz: quiz.id })
  const status = soon ? 'Coming soon'
    : answers.length === questions.length ? `You scored ${score}/${questions.length} · Play again`
      : answers.length ? `${answers.length} of ${questions.length} answered · Resume`
        : `${questions.length} questions`
  return (
    <li>
      <a className={`quiz-card${soon ? ' quiz-soon' : ''}`} href={href}
        onClick={follow(navigate, href, () => track('quiz_selected', { quiz_id: quiz.id, answered_count: answers.length }))}>
        <span className="quiz-num">{String(position + 1).padStart(2, '0')}</span>
        <span className="quiz-body">
          <span className="discovery-kicker">{quiz.title}</span>
          <span className="quiz-title">{quiz.prompt}</span>
          <span className="quiz-meta">{status}</span>
          {!soon && <span className="quiz-dots" aria-hidden="true">
            {questions.map(({ id }) => {
              const answer = answers.find((entry) => entry.id === id)
              return <span key={id} className={answer ? (answer.points === 1 ? 'right' : answer.points > 0 ? 'partial' : 'wrong') : ''} />
            })}
          </span>}
        </span>
        <span className="quiz-go" aria-hidden="true">→</span>
      </a>
    </li>
  )
}

export function QuizCollection({ navigate }: { navigate: (href: string) => void }) {
  return (
    <div className="discover discover-edition discovery-reader">
      <section className="discovery-reading quiz-collection">
        <h1 tabIndex={-1}>Think you know how things really are?</h1>
        <p className="discovery-context">Pick a quiz. Trust your gut. Then see what the data says.</p>
        <ol className="quiz-list">
          {QUIZZES.map((quiz, position) => <QuizCard key={quiz.id} quiz={quiz} position={position} navigate={navigate} />)}
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
        <p className="discovery-kicker">{quiz.title}</p>
        <h1 tabIndex={-1}>{quiz.prompt}</h1>
        <p className="discovery-context">Coming soon. The questions are still being checked against the evidence.</p>
        <div className="discovery-welcome-actions">
          <a className="discovery-link" href={home} onClick={follow(navigate, home)}>Try another quiz <span aria-hidden="true">→</span></a>
        </div>
      </section>
    </div>
  )
}
