# Detective Lab

Phase 1 is a read-only reviewer for Data Detective. It runs on demand and writes only local review artifacts.

## Run a review

From the repository root with Node.js 22 or newer:

```sh
npm ci
npx playwright install chromium
npm run detective:review
```

Use `npx playwright install --with-deps chromium` if Linux browser libraries are missing. Set `DETECTIVE_CHROMIUM_PATH` to use a compatible installed Chromium instead of downloading Playwright's browser.

The default run starts a Vite server on a free loopback port, uses separate clean mobile and desktop browser contexts, then shuts them down. It runs the challenge twice overall, using opposite right and wrong choices so every question is seen in both feedback states. The checks cover scoring, visible reactions, answer colors, reload, progression, final score, answer review, replay, independent browsing and all nine investigations. Captures and measured failures are saved alongside Markdown and JSON reports in `detective-lab/runs/<timestamp>-<process-id>/`. Failed browser assertions and blocked research gates return a nonzero exit code after the report is written.

### Optional modes

```sh
npm run detective:review -- --url https://mishpedraza.github.io/data-detective/
npm run detective:review -- --research
npm run detective:review -- --self-test
npm run detective:review -- --research --ai
```

- **`--url`** skips the local server. The browser permits only same-origin GET and HEAD, disables service workers, uses temporary browser state and never follows source links. It compares the deployment to the questions and answers in your checkout, so use the matching revision. `--allow-untrusted-tls` is a browser-only escape hatch for a known development proxy. Use it only for a trusted target you expect to be intercepted. Reports identify this mode.
- **`--research`** fetches three known primary sources to check specific claims about OECD real house prices, Pinotti's Italian permit cutoff, and Gallup's paired perception figures. A reachable page alone is insufficient. Missing coverage, inaccessible sources and unexpected formats stay unverified. On Node versions supporting it, `NODE_USE_ENV_PROXY=1` enables corporate proxy environment settings for Node requests.
- **`--self-test`** runs three additional local-only scenarios. It corrupts the rendered score, removes feedback, or disables the Next control inside isolated Playwright pages. The reviewer must diagnose all three defects. The app and repository files are untouched.
- **`--ai`** uses `OPENAI_API_KEY` from the shell with the OpenAI Responses API. It sends public story content, local research verdicts, and mobile and desktop screenshots. `DETECTIVE_MODEL` defaults to `gpt-4.1-mini`. Use a vision model that supports structured JSON responses. The run makes up to nine model requests and can incur API charges. Missing credentials, rejected calls and malformed opinions are reported explicitly. They yield no synthetic scores. The model gets no tools and cannot change a research verdict.

## How it fits the app

Data Detective is a Vite and React publication deployed as static assets to GitHub Pages by the existing main-branch workflow. The reviewer reads the same editorial identifiers used by the app, importing the quiz prompts and verified answers from `src/data/discoverEdition.ts`. It joins the lead investigation and limitations from `editorialStories.ts` and `reviewedAnswers.ts`, as well as the underlying indicator and reference registries. Browser checks exercise the actual rendered experience, including the locally stored score derived by `src/lib/discoveryChallenge.ts` and the shared reveal and investigation figures. The implementation adds one development dependency, Playwright. Existing Node tests also exercise the reviewer's validation and classification rules.

`catalog.mjs` adapts the app data. `browser.mjs` records observable behaviour and screenshots. `research.mjs` owns evidence statuses and the research gate. `editorial.mjs` sends the reusable [editorial principles](editorial-principles.md) to the optional model and validates all seven editorial judgments. `report.mjs` assembles both evidence and recommendations. Research risk and severity have greater weight than implementation effort in priority ranking. An OPEN or BLOCKED research gate stays visible regardless of editorial scores.

## Limits and Phase 2

Independent research coverage is intentionally claim-specific. The lab can flag unattributed claims and measure layout, but an editor still needs to check unsupported causal claims, read inaccessible studies and validate the broader conclusions. AI opinions are hypotheses. Chromium mobile capture is emulation, and a below-fold control does not by itself demonstrate a usability problem.

For Phase 2, add a baseline-to-candidate comparison from the JSON artifacts: pin a site revision, compare screenshots and measured checks, and require a human to approve any change to research wording. Once the baseline comparisons reliably distinguish regressions from editorial judgments, add a separate, explicitly invoked patch mode that proposes one reviewable change on a branch.
