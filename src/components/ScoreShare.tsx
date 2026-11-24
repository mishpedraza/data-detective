import { useEffect, useState } from 'react'
import { track } from '../lib/analytics'
import { SHARE_MESSAGE, renderScorecard, scoreSummary, scorecardAlt, type Scorecard } from '../lib/scorecard'

type Props = Record<string, string | number | boolean>

/** The scorecard preview with share, download and copy-link actions; nothing in the image or link reveals answers. */
export function ScoreShare({ card, url, analytics }: { card: Scorecard; url: string; analytics: Props }) {
  const [image, setImage] = useState<{ blob: Blob; src: string }>()
  const [status, setStatus] = useState('')
  const key = JSON.stringify(card)
  const props = { ...analytics, card: card.kind }
  const file = `data-detective-${card.kind === 'quiz' ? card.title : 'complete-series'}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '')

  useEffect(() => {
    let src = ''
    let live = true
    renderScorecard(JSON.parse(key) as Scorecard).then((blob) => {
      if (!live) return
      src = URL.createObjectURL(blob)
      setImage({ blob, src })
    }).catch(() => { /* The links still work without the image. */ })
    return () => { live = false; if (src) URL.revokeObjectURL(src) }
  }, [key])

  function download() {
    if (!image) return
    const link = document.createElement('a')
    link.href = image.src
    link.download = `${file}.png`
    link.click()
    track('scorecard_downloaded', props)
    setStatus('Scorecard image saved.')
  }

  async function copy(source: string) {
    try {
      await navigator.clipboard.writeText(url)
      track('quiz_link_copied', { ...props, source })
      setStatus('Link copied.')
      return true
    } catch {
      window.prompt('Copy this link:', url)
      return false
    }
  }

  async function share() {
    const png = image && new File([image.blob], `${file}.png`, { type: 'image/png' })
    const withImage = !!png && !!navigator.canShare?.({ files: [png] })
    const canShare = 'share' in navigator
    const method = withImage ? 'native_image' : canShare ? 'native_link' : 'copy_fallback'
    track('share_clicked', props)
    track('scorecard_share_opened', { ...props, method })
    if (!canShare) {
      // No share sheet: copy the link and offer the image to post alongside it.
      if (await copy('share_fallback')) setStatus('Link copied. Download the image to post it with your link.')
      return
    }
    try {
      // The link goes in the text too: some apps drop the url field when an image is attached.
      await navigator.share(withImage ? { files: [png!], text: `${scoreSummary(card)} ${SHARE_MESSAGE}\n${url}` } : { text: `${scoreSummary(card)} ${SHARE_MESSAGE}`, url })
      track('scorecard_shared', { ...props, method })
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') track('scorecard_share_cancelled', { ...props, method })
      else if (await copy('share_fallback')) setStatus('Sharing isn’t available here, so the link was copied.')
    }
  }

  return (
    <div className="score-share">
      <figure className="scorecard-preview">
        {image ? <img src={image.src} alt={scorecardAlt(card)} width={1080} height={1350} /> : <span className="scorecard-placeholder" aria-hidden="true" />}
      </figure>
      <div className="score-share-actions">
        <h2>Can they beat your score?</h2>
        <button className="challenge-primary score-share-primary" type="button" onClick={share}>Challenge a friend</button>
        <button className="score-share-secondary" type="button" onClick={download} disabled={!image}>Download image</button>
        <button className="score-share-secondary" type="button" onClick={() => void copy('button')}>Copy link</button>
        <p className="discovery-note" role="status">{status}</p>
      </div>
    </div>
  )
}
