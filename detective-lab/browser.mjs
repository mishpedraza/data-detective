import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium, devices } from 'playwright'
import { catalog } from './catalog.mjs'

export function verifyFeedback(snapshot, { score, correct, answer, pick }) {
  assert.equal(snapshot.score, `${score} correct so far`, 'The displayed score differs from the expected score')
  assert.equal(snapshot.verdict, correct ? '✓Correct!' : 'Not quite!', 'Missing or incorrect answer feedback')
  assert.ok(snapshot.reaction && snapshot.visible, 'Missing or invisible reaction')
  assert.equal(snapshot.pick, pick, 'Selected answer is absent or wrong')
  assert.equal(snapshot.answer, answer, 'Correct answer is absent or wrong')
  assert.ok(snapshot.toneMatches && snapshot.correctIsGreen, 'Answer feedback lacks the expected green or terracotta tone')
  assert.ok(snapshot.beforeEvidence, 'Reaction is below the research reveal')
  assert.ok(snapshot.finding && snapshot.citations.length, 'Reveal lacks a finding or citation')
}

export async function reviewBrowser({ base, output, executablePath, fault, allowUntrustedTls = false }) {
  const screenshots = path.join(output, 'screenshots')
  await mkdir(screenshots, { recursive: true })
  const browser = await chromium.launch({ executablePath })
  const runs = []
  try {
    for (const device of ['mobile', 'desktop']) {
      const context = await browser.newContext({
        ...(device === 'mobile' ? devices['iPhone 13'] : { viewport: { width: 1440, height: 900 } }),
        reducedMotion: 'reduce', serviceWorkers: 'block', ignoreHTTPSErrors: allowUntrustedTls,
      })
      await context.route('**/*', (route) => {
        const req = route.request()
        return ['GET', 'HEAD'].includes(req.method()) && new URL(req.url()).origin === base.origin
          ? route.continue() : route.abort()
      })
      try {
        const page = await context.newPage()
        page.setDefaultTimeout(4500)
        const run = { device, checks: [], answers: [], investigations: [], browserErrors: [], screenshots: [] }
        runs.push(run)
        page.on('pageerror', (error) => run.browserErrors.push(error.message))
        const shot = async (name) => {
          const file = `screenshots/${device}-${name}.png`
          await page.screenshot({ path: path.join(output, file), fullPage: true, animations: 'disabled', timeout: 8000 })
          run.screenshots.push(file)
          return file
        }
        async function check(id, action) {
          try {
            await action()
            run.checks.push({ id, status: 'PASS' })
            return true
          } catch (error) {
            const screenshot = await shot(`failure-${id}`).catch(() => undefined)
            run.checks.push({ id, status: 'FAIL', detail: String(error.message).split('\n')[0], screenshot })
            return false
          }
        }
        function url(hash = '#/discover') {
          const target = new URL(base)
          target.hash = hash
          return target.href
        }
        const reachable = await check('site-access', async () => {
          const response = await page.goto(url(), { timeout: 12000 })
          assert.ok(response?.ok(), `Site returned HTTP ${response?.status()}`)
        })
        if (!reachable) continue
        await check('welcome', async () => {
          await page.getByRole('heading', { name: 'How Well Do You Know the World?' }).waitFor()
          assert.equal(await page.locator('.discovery-options button').count(), 0)
          await shot('welcome')
        })
        await check('complete-challenge', async () => {
          await page.getByRole('button', { name: 'Take the challenge →', exact: true }).click()
          let score = 0
          const reactions = new Set()
          for (const [index, story] of catalog.entries()) {
            const { id, interaction } = story
            const correct = index % 2 === (device === 'mobile' ? 0 : 1)
            const choice = correct ? interaction.answer : story.wrongChoice
            const pick = interaction.choiceLabels?.[choice] ?? choice
            await page.getByText(`Question ${index + 1} of ${catalog.length}`, { exact: true }).waitFor()
            await page.getByRole('heading', { name: interaction.label, exact: true }).waitFor()
            await page.locator('.discovery-options').getByRole('button', { name: pick, exact: true }).click()
            if (correct) score++
            const reveal = page.locator('.discovery-reveal')
            await reveal.locator('.discovery-result').waitFor()
            if (fault === 'score' && index === 0) await page.locator('.challenge-progress [role=status]').evaluate((el) => { el.textContent = '99 correct so far' })
            if (fault === 'feedback' && index === 0) await reveal.locator('.challenge-feedback').evaluate((el) => el.remove())
            const snapshot = await page.evaluate(() => {
              const text = (selector) => document.querySelector(selector)?.textContent.trim()
              const green = (el) => {
                const rgb = getComputedStyle(el).color.match(/\d+/g)?.map(Number) ?? []
                return rgb[1] > rgb[0] && rgb[1] > rgb[2]
              }
              const feedback = document.querySelector('.challenge-feedback')
              const selected = feedback?.querySelector('.challenge-answer')
              const right = feedback?.querySelector('.challenge-answer.challenge-correct')
              const reaction = feedback?.querySelector('.challenge-reaction')
              return {
                score: text('.challenge-progress [role=status]'), verdict: text('.challenge-verdict'),
                pick: selected?.querySelector('strong')?.textContent, answer: right?.querySelector('strong')?.textContent,
                toneMatches: !!selected && (text('.challenge-verdict') === '✓Correct!' ? green(selected)
                  : selected.classList.contains('challenge-incorrect') && getComputedStyle(selected).backgroundColor !== 'rgba(0, 0, 0, 0)' && !green(selected)),
                correctIsGreen: !!right && green(right), reaction: reaction?.textContent,
                visible: !!reaction?.getBoundingClientRect().height && getComputedStyle(reaction).visibility === 'visible',
                beforeEvidence: feedback?.nextElementSibling?.classList.contains('discovery-result'),
                finding: text('.discovery-result'), evidenceRows: document.querySelectorAll('.discovery-bars li, .discovery-facts > div').length,
                citations: [...document.querySelectorAll('.discovery-reveal .story-sources a')].map((a) => a.href),
                overflow: document.documentElement.scrollWidth - innerWidth,
                nextBelowFold: document.querySelector('.challenge-continue')?.getBoundingClientRect().bottom > innerHeight,
              }
            })
            const screenshot = await shot(`quiz-${id}`)
            run.answers.push({ id, correct, ...snapshot, screenshot })
            await check(`feedback-${id}`, async () => {
              verifyFeedback(snapshot, { score, correct, answer: story.correctChoice, pick })
              assert.ok(snapshot.overflow <= 1, 'Quiz reveal has horizontal overflow')
              assert.ok(!reactions.has(snapshot.reaction), 'Reaction repeated in this attempt')
              reactions.add(snapshot.reaction)
            })
            if (fault && fault !== 'navigation') return
            if (index === 1) await check('resume-after-reload', async () => {
              await page.reload()
              await page.getByText(`${score} correct so far`, { exact: true }).waitFor()
              assert.equal(await reveal.locator('.challenge-reaction').textContent(), snapshot.reaction)
            })
            const next = page.getByRole('button', { name: index === catalog.length - 1 ? 'See my results →' : 'Next question →', exact: true })
            if (fault === 'navigation' && index === 0) await next.evaluate((el) => { el.disabled = true })
            await next.click().catch(() => { throw new Error(`Next action did not work after ${id}`) })
          }
          await page.getByText(`${score} out of ${catalog.length}`, { exact: true }).waitFor()
          await shot('results')
          await page.getByRole('button', { name: 'Review my answers →' }).click()
          await page.locator('.challenge-review li').first().waitFor()
          assert.equal(await page.locator('.challenge-review li').count(), catalog.length)
          await page.getByRole('button', { name: 'Back to results' }).click()
          await page.getByRole('button', { name: 'Try again', exact: true }).click()
          await page.getByText('Question 1 of 9', { exact: true }).waitFor()
          await page.getByText('0 correct so far', { exact: true }).waitFor()
          assert.equal(await page.locator('.discovery-reveal').count(), 0)
        })
        if (fault) continue
        await check('independent-browse', async () => {
          await page.goto(url())
          await page.getByRole('link', { name: 'Or browse all discoveries →' }).click()
          await page.getByRole('button', { name: 'Next discovery', exact: true }).click()
          await page.getByRole('heading', { name: catalog[1].interaction.label, exact: true }).waitFor()
          await page.getByRole('button', { name: 'Previous discovery', exact: true }).click()
          await page.locator('.discovery-options').getByRole('button', { name: catalog[0].correctChoice, exact: true }).click()
          await page.locator('.discovery-result').waitFor()
          assert.equal(await page.locator('.challenge-progress, .challenge-feedback').count(), 0)
          await shot('browse')
          await page.getByRole('link', { name: 'Explore why' }).click()
          await page.waitForURL((target) => target.hash.startsWith('#/investigate?') && target.hash.includes(catalog[0].id))
        })
        for (const story of catalog) await check(`investigate-${story.id}`, async () => {
          await page.goto(url(story.route))
          const evidence = page.getByRole('region', { name: 'Evidence', exact: true })
          const explanation = page.getByRole('region', { name: 'Explanation', exact: true })
          await evidence.locator('figure').first().waitFor()
          const exp = await explanation.innerText()
          const citationCount = await evidence.locator('a[href^="https://"]').count()
          const disclosure = page.getByText('Research, methods and limitations', { exact: true })
          await disclosure.click()
          const limitations = await disclosure.locator('..').innerText()
          const screenshot = await shot(`investigate-${story.id}`)
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
          run.investigations.push({ id: story.id, headline: await page.locator('.investigate h1').innerText(),
            evidence: await evidence.innerText(), explanation: exp, limitations, citationCount, overflow, screenshot })
          assert.ok(exp.trim() && citationCount, 'Missing explanation or primary figure citation')
          assert.ok(overflow <= 1, 'Investigation has horizontal overflow')
        })
        if (run.browserErrors.length) run.checks.push({ id: 'browser-errors', status: 'FAIL', detail: run.browserErrors.join(' / ') })
      } finally {
        await context.close()
      }
    }
  } finally {
    await browser.close()
  }
  return runs
}
