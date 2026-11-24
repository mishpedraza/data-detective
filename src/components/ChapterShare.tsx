import { useId, useRef, useState } from 'react'
import { shareLink } from '../lib/site'
import './chapterShare.css'

export function ChapterShare({ quizId, chapterId, title }: { quizId: string; chapterId: string; title: string }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'manual'>('idle')
  const linkInput = useRef<HTMLInputElement>(null)
  const linkId = useId()
  const url = shareLink({ quiz: quizId, chapter: chapterId }, 'invite')

  async function share() {
    const invitation = { title, text: 'Want to try this Data Detective quiz?', url }
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share(invitation)
        setStatus('idle')
        return
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      setStatus('copied')
    } catch {
      setStatus('manual')
    }
  }

  return (
    <div className="chapter-share">
      <button type="button" aria-label={`Share quiz: ${title}`} onClick={share}>Share quiz</button>
      <span role="status">{status === 'copied' ? 'Quiz link copied' : status === 'manual' ? 'Copy the quiz link below.' : ''}</span>
      {status === 'manual' && <div className="chapter-share-link">
        <label htmlFor={linkId}>Quiz link</label>
        <input id={linkId} ref={linkInput} value={url} readOnly onFocus={() => linkInput.current?.select()} />
      </div>}
    </div>
  )
}
