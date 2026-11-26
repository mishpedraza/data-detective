import { test } from './support/fixtures'
import { CHAPTERS, maxPoints, chapterUrl } from './support/data'
import { expectScore, playChapter } from './support/play'

// Runs with full animations (the other projects use reduced motion) to catch errors in animated reveals.
for (const chapter of CHAPTERS) {
  test(`${chapter.name}: animated reveals and results`, async ({ page }) => {
    await page.goto(chapterUrl(chapter))
    const points = await playChapter(page, chapter, () => 'correct')
    await expectScore(page, points, maxPoints(chapter.questions))
  })
}
