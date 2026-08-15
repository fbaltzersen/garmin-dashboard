# 5K under 20:00 — treningsdashboard

Mobile-first React + Vite-dashboard som viser progresjon mot målet **5K under 20:00**,
basert på data synket fra Garmin Connect. Faner: **Home** (mål + nøkkeltall),
**Talk** (AI-chat mot egne treningsdata), **Plan** (AI-treningsplan + etterlevelse),
**Sessions** (økthistorikk + utviklingsgrafer).

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
- **Talk-fanen**: `api/chat.ts` er en Vercel serverless-funksjon som kaller
  Anthropic sitt Messages API. Klienten sender med et utdrag av dashboardet den
  allerede har lastet (`src/api/chat.ts`) som kontekst — funksjonen trenger
  dermed ingen egen GitHub-tilgang, kun `ANTHROPIC_API_KEY`. Hvert
  assistent-svar har en "lytt"-knapp som sender teksten til `api/tts.ts`
  (ElevenLabs, `ELEVENLABS_API_KEY`) og spiller av lyden — lyd genereres kun
  når du trykker, og caches i nettleseren så samme svar ikke genereres på nytt.
- **Hosting**: Vercel, koblet mot dette repoet via git — deployer automatisk
  ved push til `main`.

## Førstegangsoppsett

1. Opprett en finkornet GitHub Personal Access Token med tilgang kun til
   `fbaltzersen/GarminData`:
   - **Contents**: Read and write (skrivetilgang trengs for dagbok-loggingen)
   - **Actions**: Read and write
2. Åpne dashboardet og lim inn tokenet når du blir bedt om det.
3. For Talk-fanen: sett `ANTHROPIC_API_KEY` (og valgfritt `CHAT_ACCESS_KEY` +
   matchende `VITE_CHAT_ACCESS_KEY`, se `.env.example`) som miljøvariabler i
   Vercel-prosjektets innstillinger.

## Utvikling

```
npm install
npm run dev
```

`Talk`-fanen krever `vercel dev` (eller en tilsvarende lokal kjøring av
`api/chat.ts`) for å teste chat lokalt — `npm run dev` alene serverer kun
frontend.

## Struktur

```
src/
  api/github.ts         PAT-lagring + Contents/Actions API-klient (les + skriv)
  api/chat.ts            klient for Talk-fanens chat-endepunkt
  api/syncTrigger.ts     dispatch + polling av GitHub Actions-workflower
  hooks/useRollupData.ts henter alle rollup-filene + AI-planen
  hooks/useTalkChat.ts   chat-tilstand for Talk-fanen
  components/             HomeTab, TalkPanel, PlanTab, SessionsTab + underliggende paneler
api/chat.ts               Vercel serverless-funksjon: kaller Anthropic for Talk-fanen
```
