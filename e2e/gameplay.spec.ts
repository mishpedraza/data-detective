import { test } from './support/fixtures'
import { CHAPTERS, chapterUrl, mixedStrategy, type Strategy } from './support/data'
import { expectScore, playChapter } from './support/play'
import { expect, expectNoHorizontalOverflow } from './support/fixtures'

// One run per chapter and strategy, on desktop and mobile. New chapters and questions are picked up from the quiz registry.
const STRATEGIES: [string, (i: number) => Strategy][] = [
  ['all correct', () => 'correct'],
  ['all wrong', () => 'wrong'],
  ['mixed correct, wrong and partial', mixedStrategy],
]

for (const chapter of CHAPTERS) {
  test.describe(`${chapter.name} (${chapter.questions.length} questions)`, () => {
    for (const [label, strategy] of STRATEGIES) {
      test(`plays through ${label}`, async ({ page }) => {
        await page.goto(chapterUrl(chapter))
        const points = await playChapter(page, chapter, strategy)
        if (label === 'all correct') expect(points, 'a perfect run should score every point').toBe(chapter.questions.length)
        await expectScore(page, points, chapter.questions.length)
        await expect(page.locator('.ch-tally li')).toHaveCount(chapter.questions.length)
        await expectNoHorizontalOverflow(page, `on ${chapter.name} results`)
      })
    }
  })
}
