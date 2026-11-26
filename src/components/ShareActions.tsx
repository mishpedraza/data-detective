import { useEffect, useState } from 'react'
import { track } from '../lib/analytics'

type Props = Record<string, string | number | boolean>

const whatsappLink = (text: string, url: string) => `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`

/** WhatsApp, copy link and the device share sheet for one quiz link. `event` prefixes the share-sheet analytics events. */
export function ShareActions({ title, text, url, analytics, event }: { title?: string; text: string; url: string; analytics: Props; event: 'scorecard' | 'quiz_invite' }) {
  const [status, setStatus] = useState('')
  const native = typeof navigator.share === 'function'
  useEffect(() => {
    if (!status) return
    const timer = window.setTimeout(() => setStatus(''), 4000)
    return () => window.clearTimeout(timer)
  }, [status])

  async function copy(source: string, value = url) {
    try {
      await navigator.clipboard.writeText(value)
      track('quiz_link_copied', { ...analytics, source })
      return true
    } catch {
      window.prompt('Copy this link:', value)
      return false
    }
  }

  async function more() {
    track('share_clicked', { ...analytics, method: 'native_link' })
    track(`${event}_share_opened`, { ...analytics, method: 'native_link' })
    try {
      await navigator.share({ ...(title && { title }), text, url })
      track(`${event}_shared`, { ...analytics, method: 'native_link' })
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') track(`${event}_share_cancelled`, { ...analytics, method: 'native_link' })
      else if (await copy('share_fallback')) setStatus('Sharing isn’t available here, so the link was copied.')
    }
  }

  return (
    <div className="share-actions">
      <a className="share-whatsapp" href={whatsappLink(text, url)} target="_blank" rel="noopener noreferrer"
        onClick={() => {
          track('share_clicked', { ...analytics, method: 'whatsapp' })
          track(`${event}_share_opened`, { ...analytics, method: 'whatsapp' })
        }}>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" /></svg>
        Share on WhatsApp
      </a>
      <button className="share-secondary" type="button" onClick={async () => {
        track('share_clicked', { ...analytics, method: 'copy' })
        if (await copy('button')) setStatus('Link copied')
      }}>Copy link</button>
      {native && <button className="share-secondary" type="button" onClick={() => void more()}>More options</button>}
      <p className="share-status" role="status">{status}</p>
    </div>
  )
}
