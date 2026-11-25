# Data Detective

*Question what you think you know.*

Interactive prototype for investigating popular beliefs about immigration, crime, the economy, housing and living standards, using official statistics. First investigation: Spain, 1998–2025.

## Run locally

```bash
npm install
npm run dev
```

## Tests

```bash
npm test                         # unit and data tests
npx playwright install chromium  # once
npm run test:e2e                 # gameplay tests in a browser, desktop and mobile
npm run test:links               # research links (needs internet)
```

See [docs/testing.md](docs/testing.md) for what is covered, how new quizzes are included automatically and how to read failures.

## Data

`scripts/fetch_data.py` downloads the series from public Eurostat, OECD and World Bank APIs (no keys needed) and writes `src/data/generated/indicators.json`, including sources, definitions, coverage and series breaks. Re-run it to refresh the data:

```bash
python3 scripts/fetch_data.py
```

## Deploy

Pushing to `main` builds the site and publishes it to GitHub Pages (`.github/workflows/pages.yml`).
