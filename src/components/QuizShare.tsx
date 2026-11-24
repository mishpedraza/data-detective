import { useEffect, useState } from 'react'
import { track } from '../lib/analytics'
import { inviteMessage } from '../lib/scorecard'

/** Shares a link to the quiz at any point, before finishing it; the link and message carry no score or answers. */
export function QuizShare({ title, url, analytics }: { title: string; url: string; analytics: Record<string, string | number | boolean> }) {
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (!status) return
    const timer = window.setTimeout(() => setStatus(''), 4000)
    return () => window.clearTimeout(timer)
  }, [status])

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      track('quiz_link_copied', { ...analytics, source: 'invite' })
      setStatus('Link copied')
    } catch {
      window.prompt('Copy this link:', url)
    }
  }

  async function share() {
    const method = 'share' in navigator ? 'native_link' : 'copy_fallback'
    track('quiz_invite_opened', { ...analytics, method })
    if (method === 'copy_fallback') return copy()
    try {
      await navigator.share({ title, text: inviteMessage(title), url })
      track('quiz_invite_shared', { ...analytics, method })
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') track('quiz_invite_cancelled', { ...analytics, method })
      else await copy()
    }
  }

  return (
    <span className="quiz-invite">
      <span className="quiz-invite-status" role="status">{status}</span>
      <button className="discovery-contents-trigger" type="button" onClick={() => void share()}>Share quiz</button>
    </span>
  )
}
