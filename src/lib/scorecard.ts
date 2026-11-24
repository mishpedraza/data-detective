import { formatPoints } from './chapterScore'

export const SIGNATURE = 'Can you beat my score?'
export const SHARE_MESSAGE = 'Can you beat my score on Data Detective?'
export const SITE_LABEL = 'data-detective.pages.dev'

export type Scorecard =
  | { kind: 'quiz'; theme: string; title: string; points: number; total: number; sequence: number[]; accent: string }
  | { kind: 'theme'; prompt: string; points: number; total: number; parts: { title: string; points: number; total: number }[]; accent: string }

/** 4:5 portrait: full-bleed in WhatsApp and Instagram posts, letterboxed cleanly in Stories. */
export const CARD_WIDTH = 1080
export const CARD_HEIGHT = 1350

const PAPER = '#202820'
const INK = '#ffffff'
const INK_2 = '#eef1e8'
const MUTED = '#c5cfbc'
const HIGHLIGHT = '#e5ff77'
const SERIF = '"Fraunces Variable", "Iowan Old Style", Georgia, serif'
const SANS = '"Inter Variable", Inter, system-ui, sans-serif'
const PAD = 96

export const scoreLabel = (points: number, total: number) => `${formatPoints(points)}/${total}`

/** The score in words, for shares that can't carry the image. */
export const scoreSummary = (card: Scorecard) => card.kind === 'quiz'
  ? `I scored ${scoreLabel(card.points, card.total)} on “${card.title}”.`
  : `I scored ${scoreLabel(card.points, card.total)} across all ${card.parts.length} quizzes of “${card.prompt}”`

export function scorecardAlt(card: Scorecard) {
  return card.kind === 'quiz'
    ? `Data Detective scorecard: ${card.title}, ${scoreLabel(card.points, card.total)}. ${SIGNATURE}`
    : `Data Detective scorecard: ${card.prompt} ${scoreLabel(card.points, card.total)}. ${card.parts.map(({ title, points, total }) => `${title} ${scoreLabel(points, total)}`).join(', ')}. ${SIGNATURE}`
}

function tracked(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number) {
  let left = x
  for (const char of text) {
    ctx.fillText(char, left, y)
    left += ctx.measureText(char).width + spacing
  }
}

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width > width && line) { lines.push(line); line = word } else line = next
  }
  return [...lines, line]
}

function bar(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, share: number, accent: string) {
  ctx.globalAlpha = 0.22
  ctx.fillStyle = accent
  ctx.beginPath(); ctx.roundRect(x, y, width, height, Math.min(6, height / 2)); ctx.fill()
  ctx.globalAlpha = 1
  if (share > 0) { ctx.beginPath(); ctx.roundRect(x, y, Math.max(width * share, height), height, Math.min(6, height / 2)); ctx.fill() }
}

function score(ctx: CanvasRenderingContext2D, points: number, total: number, y: number, size: number, accent: string) {
  const big = formatPoints(points)
  ctx.font = `500 ${size}px ${SERIF}`
  ctx.fillStyle = accent
  ctx.fillText(big, PAD - size * 0.04, y)
  const left = PAD + ctx.measureText(big).width + size * 0.06
  ctx.font = `400 ${Math.round(size * 0.36)}px ${SERIF}`
  ctx.fillStyle = MUTED
  ctx.fillText(`/ ${total}`, left, y)
}

/** Draws the scorecard on a canvas; the layout only depends on the card, so it renders the same everywhere. */
export function drawScorecard(ctx: CanvasRenderingContext2D, card: Scorecard) {
  const width = CARD_WIDTH - PAD * 2
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)
  ctx.fillStyle = HIGHLIGHT
  ctx.fillRect(0, 0, CARD_WIDTH, 32)
  ctx.fillRect(PAD, CARD_HEIGHT - 332, width, 2)

  ctx.font = `650 26px ${SANS}`
  ctx.fillStyle = INK
  tracked(ctx, 'DATA DETECTIVE', PAD, 150, 5)
  ctx.font = `600 24px ${SANS}`
  ctx.fillStyle = HIGHLIGHT
  tracked(ctx, card.kind === 'quiz' ? card.theme.toUpperCase() : 'THE COMPLETE SERIES', PAD, 196, 4)

  ctx.font = `450 ${card.kind === 'quiz' ? 80 : 68}px ${SERIF}`
  const lineHeight = card.kind === 'quiz' ? 86 : 76
  const title = wrap(ctx, card.kind === 'quiz' ? card.title : card.prompt, width).slice(0, 3)
  const parts = card.kind === 'theme' ? card.parts.slice(0, 4) : []
  // Title, score and breakdown sit as one block, centred between the masthead and the signature.
  const block = (title.length - 1) * lineHeight + (card.kind === 'quiz' ? 300 + 70 + 150 : 250 + 80 + parts.length * 92 - 40)
  const top = 250
  let y = top + 60 + Math.max(0, (CARD_HEIGHT - 300 - top - block) / 2)
  ctx.fillStyle = INK
  title.forEach((line, i) => ctx.fillText(line, PAD, y + i * lineHeight))
  y += (title.length - 1) * lineHeight

  if (card.kind === 'quiz') {
    score(ctx, card.points, card.total, y + 300, 280, HIGHLIGHT)
    const gap = 12
    const column = Math.min(72, (width - gap * (card.sequence.length - 1)) / card.sequence.length)
    card.sequence.forEach((points, i) => {
      const x = PAD + i * (column + gap)
      ctx.globalAlpha = 0.14; ctx.fillStyle = HIGHLIGHT
      ctx.beginPath(); ctx.roundRect(x, y + 370, column, 150, 8); ctx.fill()
      ctx.globalAlpha = 1
      if (points > 0) { ctx.beginPath(); ctx.roundRect(x, y + 370 + 150 * (1 - points), column, 150 * points, 8); ctx.fill() }
    })
  } else {
    score(ctx, card.points, card.total, y + 250, 230, HIGHLIGHT)
    y += 330
    for (const part of parts) {
      ctx.font = `450 34px ${SERIF}`
      ctx.fillStyle = INK
      ctx.fillText(wrap(ctx, part.title, width - 140)[0], PAD, y)
      ctx.font = `650 30px ${SANS}`
      ctx.textAlign = 'right'
      ctx.fillText(scoreLabel(part.points, part.total), CARD_WIDTH - PAD, y)
      ctx.textAlign = 'left'
      bar(ctx, PAD, y + 20, width, 10, part.total ? part.points / part.total : 0, HIGHLIGHT)
      y += 92
    }
  }

  ctx.font = `500 52px ${SERIF}`
  ctx.fillStyle = INK
  ctx.fillText(SIGNATURE, PAD, CARD_HEIGHT - 232)
  ctx.font = `400 29px ${SANS}`
  ctx.fillStyle = INK_2
  const questions = card.kind === 'theme' ? card.total : 0
  const sub = card.kind === 'quiz'
    ? 'Make your guesses and see what the data says.'
    : `${questions} questions. ${card.parts.length} quizzes. A few surprises.`
  wrap(ctx, sub, width).forEach((line, i) => ctx.fillText(line, PAD, CARD_HEIGHT - 176 + i * 40))
  ctx.fillStyle = HIGHLIGHT
  ctx.fillRect(PAD, CARD_HEIGHT - 92, 48, 3)
  ctx.font = `650 26px ${SANS}`
  ctx.fillText(SITE_LABEL, PAD + 66, CARD_HEIGHT - 82)
}

/** Renders the scorecard to a PNG once the page fonts are ready. */
export async function renderScorecard(card: Scorecard): Promise<Blob> {
  await Promise.all([`500 80px ${SERIF}`, `650 26px ${SANS}`, `400 29px ${SANS}`].map((font) => document.fonts?.load(font).catch(() => [])))
  const canvas = document.createElement('canvas')
  canvas.width = CARD_WIDTH
  canvas.height = CARD_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')
  drawScorecard(ctx, card)
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Image export failed')), 'image/png'))
}
