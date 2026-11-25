# Testing Data Detective

There are two layers of tests:

| Layer | Command | What it checks |
|---|---|---|
| Unit and data tests | `npm test` | Scoring, saved progress, quiz registration, research figures and DOIs (Node test runner, `tests/`). Also runs in the Cloudflare build. |
| Gameplay tests | `npm run test:e2e` | The real site in a browser: every quiz played on desktop and mobile (Playwright, `e2e/`). |
| Research links | `npm run test:links` | Every source link shown in a reveal (needs internet). |

## Running the gameplay tests locally

```sh
npm ci
npx playwright install chromium   # once per machine
npm run test:e2e                  # builds the site, serves it on 127.0.0.1:4330 and runs every project
npx playwright show-report        # opens the HTML report
```

Useful variations:

```sh
npm run test:e2e -- --project=mobile           # only the phone layout (Pixel 7)
npm run test:e2e -- -g "health-longevity"      # only one quiz
npm run test:e2e -- gameplay                   # only one file in e2e/
npm run test:e2e -- --headed --project=desktop # watch the browser
npm run test:e2e -- --ui                       # step through tests interactively
```

If a server is already running on port 4330 it is reused, so `npx vite preview --port 4330` plus repeated runs is faster.

## How the tests find quizzes

`e2e/support/data.ts` reads the app's own registry (`QUIZZES` and `chapterQuestions`). Every chapter with questions becomes a set of tests, and the answers the tests enter are generated from each question's data:

| Question kind | Correct | Wrong | Partial |
|---|---|---|---|
| `choice` | the `answer` option | another option | (wrong) |
| `rows` | every row's answer | every row flipped | first row right, the rest wrong |
| `estimate` | `actual` | the far end of the scale | just outside `near`, inside `far` |
| `sliders` | both `actual` values | both at the far end | first right, second far |

Warm-up exercises (`choice`, `week`, `holiday`, `words`) are completed through their controls before each question. The expected points come from the app's `scoreQuestion`, so a test fails if the screen disagrees with the scoring rules.

**Adding a quiz or question needs no new test.** It is picked up as soon as it is registered in `src/data/quizzes.ts`. A new question *kind* or warm-up kind needs one new branch in `e2e/support/play.ts` (how to operate it) and `e2e/support/data.ts` (which answer to give); `e2e/catalogue.spec.ts` fails until then.

## What each file covers

| File | Coverage |
|---|---|
| `gameplay.spec.ts` | Every chapter played three ways (all correct, all wrong, mixed with partial credit). Each question: controls, reveal finding and takeaway, a rendered visualization with no `NaN`/`undefined`, verdict colour, points, ✓ on the right answer, every "How we know" source link, no horizontal overflow. Final score and per-question tally. |
| `progress.spec.ts` | Answers saved with the quiz edition; resume after reload and from the homepage card; first prediction stays locked when going back; results; Play again clears only that chapter; answers from an older edition are ignored; quizzes don't share progress; combined theme results (complete, incomplete, and the link shown after finishing the last chapter). |
| `share.spec.ts` | "Challenge a friend" shares score text plus a link and no image; copy fallback with no share sheet or when it fails; cancelling does nothing; Copy link; "Share quiz" invite mid-quiz carries no score; theme score sharing; shared links open the quiz. Links are checked to carry only `quiz`, `chapter`, `from` and `card`. |
| `analytics.spec.ts` | Consent banner; nothing sent before a choice or after "No thanks" (even through a full game and share); "Allow analytics" sends `page_viewed`, `quiz_selected`, `quiz_started`, one `quiz_question_answered` per question, `discovery_revealed`, `quiz_completed`, sharing and shared-link events, each with `app_name: data_detective`, `$current_url`, the anonymous visitor id and nothing that looks like an email. PostHog requests are intercepted and never reach PostHog. |
| `catalogue.spec.ts` | Every question kind is reachable; question ids unique; every source link is well-formed https (DOIs look like DOIs); homepage shows every chapter, each card opens its first question; sitemap and robots.txt are served. |
| `motion.spec.ts` | Every chapter with full animations (the other projects use reduced motion, which keeps them fast). |
| `links.spec.ts` | Each research link fetched (HEAD, then GET). 4xx/5xx or unreachable fails. Publishers that refuse automated requests (401/403/429) are reported as warnings; for DOIs, the DOI registry is checked instead. |

Every browser test fails on console errors, uncaught exceptions and failed requests (`e2e/support/fixtures.ts`).

## When a test fails

The HTML report (`playwright-report/`) and `test-results/` hold, for each failed test:

- a screenshot and a video,
- a Playwright trace (`npx playwright show-trace <trace.zip>`): every click, DOM snapshot, console message and network request,
- `page-state.json`: URL, viewport, the question on screen and all of localStorage (saved answers, consent),
- `page.html`, and `browser-errors.txt` if the console logged errors.

On GitHub, these are uploaded as the `playwright-report` artifact of the **Tests** workflow.

## GitHub Actions

`.github/workflows/tests.yml` runs on every pull request, on demand, and weekly (Monday 06:00 UTC):

- **Unit tests, lint and build** – `npm test`, `npm run lint`, `npm run build`.
- **Gameplay** – the Playwright suite on desktop, mobile and full-motion projects. Failures retry once to separate flaky from broken.
- **Research links** – non-blocking (`continue-on-error`), because external sites can be slow or block bots. Its report shows which links to check by hand.

No secrets are needed.
