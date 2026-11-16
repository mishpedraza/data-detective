# Data Detective

*Question what you think you know.*

Interactive prototype for investigating popular beliefs about immigration, crime, the economy, housing and living standards, using official statistics. First investigation: Spain, 1998–2025.

## Run locally

```bash
npm install
npm run dev
```

## Data

`scripts/fetch_data.py` downloads the series from public Eurostat, OECD and World Bank APIs (no keys needed) and writes `src/data/generated/indicators.json`, including sources, definitions, coverage and series breaks. Re-run it to refresh the data:

```bash
python3 scripts/fetch_data.py
```

## Deploy

Pushing to `main` builds the site and publishes it to GitHub Pages (`.github/workflows/pages.yml`).
