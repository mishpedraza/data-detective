import { ShareActions } from './ShareActions'
import { SHARE_MESSAGE, scoreSummary, type Scorecard } from '../lib/scorecard'

type Props = Record<string, string | number | boolean>

/** Shares the score and a link to the quiz; nothing in the message or link reveals answers. */
export function ScoreShare({ card, url, analytics }: { card: Scorecard; url: string; analytics: Props }) {
  return (
    <div className="score-share">
      <h2>Share this quiz</h2>
      <ShareActions text={`${scoreSummary(card)} ${SHARE_MESSAGE}`} url={url} analytics={{ ...analytics, card: card.kind }} event="scorecard" />
    </div>
  )
}
