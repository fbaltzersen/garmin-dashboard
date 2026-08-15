import type { RollupData } from '../hooks/useRollupData'
import type { TalkChat } from '../hooks/useTalkChat'
import { GoalPanel } from './GoalPanel'
import { QuickStats } from './QuickStats'
import { WeekSummaryPanel } from './WeekSummaryPanel'

const QUICK_PROMPTS = [
  'Er jeg på rette spor for 20:00?',
  'Bør jeg trene i dag?',
  'Hvordan var uken min?',
  'Hvordan er restitusjonen min?',
]

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 10) return 'God morgen.'
  if (hour < 17) return 'God dag.'
  return 'God kveld.'
}

export function HomeTab({
  data,
  chat,
  onOpenTalk,
}: {
  data: RollupData
  chat: TalkChat
  onOpenTalk: (prompt: string) => void
}) {
  return (
    <>
      <div className="home-greeting">
        <h2 className="home-greeting-title">{greeting()}</h2>
        <p className="hero-note" style={{ marginTop: 4 }}>
          {data.latest.training_status
            ? `Treningsstatus: ${data.latest.training_status.toLowerCase()}. Spør TEMPO om noe før du legger ut.`
            : 'Spør TEMPO om noe før du legger ut.'}
        </p>
      </div>

      <div className="chip-row">
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="pill-choice"
            onClick={() => {
              onOpenTalk(prompt)
              void chat.sendMessage(prompt)
            }}
          >
            {prompt}
          </button>
        ))}
      </div>

      <GoalPanel latest={data.latest} plan={data.plan} trend={data.aiRacePredictionTrend} />
      <div className="panel">
        <QuickStats latest={data.latest} />
      </div>
      <WeekSummaryPanel plan={data.plan} activities={data.activities} />
    </>
  )
}
