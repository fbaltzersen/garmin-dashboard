import { lazy, Suspense, useState } from 'react'
import { CalendarDays, LineChart, LogOut, TrendingUp } from 'lucide-react'
import './App.css'
import { clearToken, getToken } from './api/github'
import { useRollupData } from './hooks/useRollupData'
import { PatModal } from './components/PatModal'
import { SyncButton } from './components/SyncButton'
import { GoalPanel } from './components/GoalPanel'
import { QuickStats } from './components/QuickStats'
import { LatestActivityCard } from './components/LatestActivityCard'
import { WeekSummaryPanel } from './components/WeekSummaryPanel'
import { LoadingSkeleton } from './components/LoadingSkeleton'

// Only needed once the user opens a non-default tab - kept out of the initial bundle.
const DetailsTab = lazy(() => import('./components/DetailsTab').then((m) => ({ default: m.DetailsTab })))
const PlanPanel = lazy(() => import('./components/PlanPanel').then((m) => ({ default: m.PlanPanel })))
const AdherencePanel = lazy(() =>
  import('./components/AdherencePanel').then((m) => ({ default: m.AdherencePanel })),
)

type Tab = 'progresjon' | 'detaljer' | 'planlegging'

function BrandMark() {
  return (
    <svg className="app-brand-mark" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="12" y="1.5" width="8" height="4" rx="1.6" fill="var(--series-blue)" />
      <path d="M9 3.5 L11.5 6" stroke="var(--series-blue)" strokeWidth="2" strokeLinecap="round" />
      <path d="M23 3.5 L20.5 6" stroke="var(--series-blue)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="19" r="13" fill="var(--page)" stroke="var(--series-blue)" strokeWidth="2.4" />
      <circle cx="16" cy="19" r="10.4" fill="none" stroke="var(--gridline)" strokeWidth="1.2" />
      <path d="M16 19 L16 11.5" stroke="var(--text-primary)" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M16 19 L20.8 21.2" stroke="var(--series-blue)" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="16" cy="19" r="1.7" fill="var(--series-blue)" />
    </svg>
  )
}

const TABS: { id: Tab; label: string; icon: typeof TrendingUp }[] = [
  { id: 'progresjon', label: 'Progresjon', icon: TrendingUp },
  { id: 'detaljer', label: 'Detaljer', icon: LineChart },
  { id: 'planlegging', label: 'Planlegging', icon: CalendarDays },
]

function App() {
  const [hasToken, setHasToken] = useState(() => Boolean(getToken()))
  const [tab, setTab] = useState<Tab>('progresjon')
  const { data, loading, error, reload } = useRollupData()

  function handleForget() {
    clearToken()
    setHasToken(false)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-brand">
          <BrandMark />
          <h1>5K under 20:00</h1>
        </div>
        <div className="app-header-actions">
          {hasToken && <SyncButton onSuccess={reload} />}
          {hasToken && (
            <button className="icon-button" onClick={handleForget} title="Fjern PAT">
              <LogOut />
              <span className="icon-button-label">Koble fra</span>
            </button>
          )}
        </div>
      </header>

      {!hasToken && (
        <PatModal
          onSaved={() => {
            setHasToken(true)
            reload()
          }}
        />
      )}

      {hasToken && loading && <LoadingSkeleton />}
      {hasToken && error && (
        <div className="empty-state">
          <h1>Kunne ikke laste data</h1>
          <p>{error}</p>
        </div>
      )}

      {hasToken && data && (
        <>
          <LatestActivityCard activity={data.activities[0] ?? null} />

          <nav className="tab-nav">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={`tab-button ${tab === id ? 'active' : ''}`}
                onClick={() => setTab(id)}
              >
                <Icon />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          {tab === 'progresjon' && (
            <>
              <WeekSummaryPanel plan={data.plan} activities={data.activities} />
              <GoalPanel latest={data.latest} plan={data.plan} trend={data.aiRacePredictionTrend} />
              <div className="panel">
                <QuickStats latest={data.latest} />
              </div>
            </>
          )}

          {tab === 'detaljer' && (
            <Suspense fallback={<LoadingSkeleton />}>
              <DetailsTab
                vo2max={data.vo2max}
                trainingStatus={data.trainingStatus}
                weeklyVolume={data.weeklyVolume}
                activities={data.activities}
                sessionTypeTrends={data.sessionTypeTrends}
                lthrBpm={data.latest.lactate_threshold?.heart_rate ?? null}
                recovery={data.recovery}
              />
            </Suspense>
          )}

          {tab === 'planlegging' && (
            <Suspense fallback={<LoadingSkeleton />}>
              <PlanPanel plan={data.plan} onSuccess={reload} />
              <AdherencePanel entries={data.adherence} plan={data.plan} activities={data.activities} />
            </Suspense>
          )}
        </>
      )}
    </div>
  )
}

export default App
