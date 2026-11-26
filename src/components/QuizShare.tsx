import { inviteMessage } from '../lib/scorecard'
import { ShareActions } from './ShareActions'

/** Shares a link to the quiz at any point, before finishing it; the link and message carry no score or answers. */
export function QuizShare({ title, url, analytics }: { title: string; url: string; analytics: Record<string, string | number | boolean> }) {
  return (
    <details className="quiz-invite">
      <summary className="discovery-contents-trigger">Share quiz</summary>
      <div className="quiz-invite-pop">
        <h2>Share this quiz</h2>
        <ShareActions title={title} text={inviteMessage(title)} url={url} analytics={analytics} event="quiz_invite" />
      </div>
    </details>
  )
}
