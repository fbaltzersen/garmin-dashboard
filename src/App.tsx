import { lazy, Suspense, useState } from 'react'
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
        <h1>5K under 20:00</h1>
        <div className="app-header-actions">
          {hasToken && <SyncButton onSuccess={reload} />}
          {hasToken && (
            <button className="icon-button" onClick={handleForget} title="Fjern PAT">
              Koble fra
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
            <button
              className={`tab-button ${tab === 'progresjon' ? 'active' : ''}`}
              onClick={() => setTab('progresjon')}
            >
              Progresjon
            </button>
            <button
              className={`tab-button ${tab === 'detaljer' ? 'active' : ''}`}
              onClick={() => setTab('detaljer')}
            >
              Detaljer
            </button>
            <button
              className={`tab-button ${tab === 'planlegging' ? 'active' : ''}`}
              onClick={() => setTab('planlegging')}
            >
              Planlegging
            </button>
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
