# 5K under 20:00 — treningsdashboard

Statisk React + Vite-dashboard som viser progresjon mot målet **5K under 20:00**,
basert på data synket fra Garmin Connect.

Dette repoet er **offentlig** og inneholder **ingen persondata** — det er kun
app-koden. All treningsdata hentes live i nettleseren fra det private
[fbaltzersen/GarminData](https://github.com/fbaltzersen/GarminData)-repoet via
en GitHub Personal Access Token (PAT) du selv limer inn og som kun lagres i
`localStorage` i din egen nettleser.

## Hvordan det henger sammen

- **Data + sync-kode**: [GarminData](https://github.com/fbaltzersen/GarminData) (privat) —
  daglig GitHub Actions-jobb henter data fra Garmin Connect og committer den dit.
- **Denne appen**: leser `data/rollups/*.json` og `data/ai/plan.json` fra
  GarminData via GitHub sitt Contents API
  (`Accept: application/vnd.github.raw+json`), skriver dagbok-notater dit via
  samme API, og kan trigge `sync.yml` eller `generate_plan.yml` på forespørsel
  via `workflow_dispatch`.
- **Hosting**: GitHub Pages, deployet automatisk via `.github/workflows/deploy.yml`
  ved push til `main`.

## Førstegangsoppsett

1. Opprett en finkornet GitHub Personal Access Token med tilgang kun til
   `fbaltzersen/GarminData`:
   - **Contents**: Read and write (skrivetilgang trengs for dagbok-loggingen)
   - **Actions**: Read and write
2. Åpne dashboardet og lim inn tokenet når du blir bedt om det.

## Utvikling

```
npm install
npm run dev
```

## Struktur

```
src/
  api/github.ts        PAT-lagring + Contents/Actions API-klient (les + skriv)
  api/syncTrigger.ts    dispatch + polling av GitHub Actions-workflower
  hooks/useRollupData.ts henter alle rollup-filene + AI-planen
  components/            paneler: mål, AI-treningsplan, dagbok, VO2max, treningsstatus, volum, aktiviteter, restitusjon
```
