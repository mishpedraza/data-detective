import { useState } from 'react'
import { track } from '../lib/analytics'
import { SHARE_MESSAGE, scoreSummary, type Scorecard } from '../lib/scorecard'

type Props = Record<string, string | number | boolean>

/** Challenges a friend with the score and a link to the quiz; nothing in the message or link reveals answers. */
export function ScoreShare({ card, url, analytics }: { card: Scorecard; url: string; analytics: Props }) {
  const [status, setStatus] = useState('')
  const props = { ...analytics, card: card.kind }

  const message = `${scoreSummary(card)} ${SHARE_MESSAGE}`

  async function copy(source: string, text = url) {
    try {
      await navigator.clipboard.writeText(text)
      track('quiz_link_copied', { ...props, source })
      setStatus('Link copied.')
      return true
    } catch {
      window.prompt('Copy this link:', text)
      return false
    }
  }

  async function share() {
    const method = 'share' in navigator ? 'native_link' : 'copy_fallback'
    track('share_clicked', props)
    track('scorecard_share_opened', { ...props, method })
    if (method === 'copy_fallback') {
      if (await copy('share_fallback', `${message}\n${url}`)) setStatus('Your score and the link are copied. Paste them to a friend.')
      return
    }
    try {
      await navigator.share({ text: message, url })
      track('scorecard_shared', { ...props, method })
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') track('scorecard_share_cancelled', { ...props, method })
      else if (await copy('share_fallback', `${message}\n${url}`)) setStatus('Sharing isn’t available here, so your score and the link were copied.')
    }
  }

  return (
    <div className="score-share">
      <div className="score-share-actions">
        <h2>Can they beat your score?</h2>
        <p className="score-share-invite">Send a friend your score and a link to the quiz.</p>
        <button className="challenge-primary score-share-primary" type="button" onClick={share}>Challenge a friend</button>
        <button className="score-share-secondary" type="button" onClick={() => void copy('button')}>Copy link</button>
        <p className="discovery-note" role="status">{status}</p>
      </div>
    </div>
  )
}
