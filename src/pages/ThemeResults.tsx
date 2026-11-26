import { useEffect, useRef, type CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { QUIZZES, quizQuestions, type Quiz } from '../data/quizzes'
import { ScoreShare } from '../components/ScoreShare'
import { useCount } from '../components/chapter/motion'
import { track } from '../lib/analytics'
import { formatPoints } from '../lib/chapterScore'
import { follow } from '../lib/quizEntry'
import { hrefFor } from '../lib/route'
import { scoreLabel, type Scorecard } from '../lib/scorecard'
import { shareLink } from '../lib/site'
import { shareProps } from '../lib/shareTracking'
import { themeProgress, themeVersion, type QuizState, type ThemeProgress } from '../lib/themeProgress'

const stateLabel: Record<QuizState, string> = { 'not-started': 'Not started', 'in-progress': 'In progress', completed: 'Completed' }

/** A theme's progress, then the way on: the next unfinished quiz, or the combined results once all are done. */
export function ThemeNext({ quiz, theme, navigate, combined, next }: {
  quiz: Quiz; theme: ThemeProgress; navigate: (href: string) => void; combined?: string
  next?: { title: string; href: string; state: QuizState }
}) {
  return (
    <aside className="theme-next" aria-label={`${quiz.title} progress`}>
      <ThemeMeter theme={theme} />
      {combined ? <a className="theme-results-cta" href={combined} onClick={follow(navigate, combined, () => track('combined_results_opened', { theme_id: quiz.id, from: 'quiz_results' }))}>
        <span>See your combined {quiz.title} results</span> <span aria-hidden="true">→</span>
      </a> : next && <a className="discovery-link" href={next.href} onClick={follow(navigate, next.href, () => track('next_theme_quiz_opened', { theme_id: quiz.id, target_chapter: next.title }))}>
        {next.state === 'in-progress' ? 'Resume' : 'Next'}: {next.title} <span aria-hidden="true">→</span>
      </a>}
    </aside>
  )
}

/** "1 of 2 quizzes completed" with one segment per quiz, filled by how much of it is answered. */
export function ThemeMeter({ theme }: { theme: ThemeProgress }) {
  const count = theme.chapters.length
  return (
    <div className="theme-meter">
      <p className="theme-meter-label">{theme.completed} of {count} {count === 1 ? 'quiz' : 'quizzes'} completed</p>
      <span className="theme-meter-bar" aria-hidden="true">
        {theme.chapters.map(({ chapter, answers, questionIds, state }) =>
          <span key={chapter.id} className={state}><i style={{ width: `${questionIds.length ? answers.length / questionIds.length * 100 : 0}%` }} /></span>)}
      </span>
    </div>
  )
}

export function ThemeResults({ quiz, navigate }: { quiz: Quiz; navigate: (href: string) => void }) {
  const theme = themeProgress(quiz)
  const shown = useCount(theme.points, 0, 1300, 200)
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus() }, [])
  useEffect(() => {
    if (theme.complete) track('combined_results_viewed', { theme_id: quiz.id, ...shareProps(), score: theme.points, max_points: theme.total, theme_version: themeVersion(quiz) })
  }, [quiz, theme.complete, theme.points, theme.total])
  const home = hrefFor('discover')
  const other = QUIZZES.find((entry) => entry.id !== quiz.id && entry.format === 'chapter' && quizQuestions(entry).length)
  const otherHref = other && hrefFor('discover', { quiz: other.id })
  const card: Scorecard = { kind: 'theme', prompt: quiz.selfPrompt ?? quiz.prompt, points: theme.points, total: theme.total, accent: quiz.accent,
    parts: theme.chapters.map(({ chapter, points, total }) => ({ title: chapter.title, points, total })) }

  return (
    <div className="discover discover-edition discovery-reader chapter-quiz theme-results" style={{ '--accent': quiz.accent } as CSSProperties}>
      <nav className="discovery-reader-nav" aria-label="Quiz navigation">
        <a className="discovery-contents-trigger" href={home} onClick={follow(navigate, home)}>← All quizzes</a>
      </nav>
      <section className="discovery-reading ch-results">
        <p className="discovery-kicker">{quiz.title} · {theme.complete ? 'The complete series' : 'Combined results'}</p>
        <h1 ref={heading} tabIndex={-1}>{quiz.selfPrompt ?? quiz.prompt}</h1>
        {theme.complete
          ? <p className="ch-score" aria-label={`${formatPoints(theme.points)} out of ${theme.total} points`}>
            <span className="ch-score-big">{formatPoints(shown === theme.points ? theme.points : Math.round(shown * 4) / 4)}</span><span className="ch-score-of">/ {theme.total}</span>
          </p>
          : <p className="discovery-context">Finish every quiz in {quiz.title} to see your combined score.</p>}
        <ol className="theme-breakdown">
          {theme.chapters.map(({ chapter, points, total, answers, questionIds, state }, i) => {
            const href = hrefFor('discover', { quiz: quiz.id, chapter: chapter.id, ...(state === 'completed' && { mode: 'results' }) })
            return (
              <li key={chapter.id}>
                <a href={href} onClick={follow(navigate, href, () => track('theme_quiz_opened', { theme_id: quiz.id, chapter_id: chapter.id, state }))}>
                  <span className="theme-breakdown-title">{chapter.title}</span>
                  <span className="theme-breakdown-score">{state === 'completed' ? scoreLabel(points, total) : `${stateLabel[state]} · ${answers.length} of ${questionIds.length}`}</span>
                  <span className="theme-breakdown-bar" aria-hidden="true">
                    <motion.i initial={{ width: 0 }} animate={{ width: `${state === 'completed' ? (total ? points / total * 100 : 0) : answers.length / questionIds.length * 100}%` }}
                      className={state === 'completed' ? '' : 'is-pending'} transition={{ delay: 0.3 + i * 0.12, duration: 0.7 }} />
                  </span>
                  <span className="theme-breakdown-go">{state === 'completed' ? 'Review or replay' : state === 'in-progress' ? 'Resume quiz' : 'Play quiz'} <span aria-hidden="true">→</span></span>
                </a>
              </li>
            )
          })}
        </ol>
        {theme.complete && <p className="discovery-note">Every scored question is worth up to one point, so the maximum is {theme.total}. Partial credit counts.</p>}
        {theme.complete && <ScoreShare card={card} url={shareLink({ quiz: quiz.id }, 'theme')}
          analytics={{ theme_id: quiz.id, quiz_id: quiz.id, score: theme.points, max_points: theme.total, theme_version: themeVersion(quiz) }} />}
        <div className="ch-actions">
          {other && otherHref && <a className="discovery-link" href={otherHref} onClick={follow(navigate, otherHref, () => track('another_theme_opened', { theme_id: quiz.id, target_theme_id: other.id }))}>
            Explore {other.title} <span aria-hidden="true">→</span>
          </a>}
          <a className="discovery-link" href={home} onClick={follow(navigate, home)}>All quizzes <span aria-hidden="true">→</span></a>
        </div>
      </section>
    </div>
  )
}
