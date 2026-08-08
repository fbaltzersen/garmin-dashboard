import { lazy, Suspense, useState } from 'react'
import './App.css'
import { clearToken, getToken } from './api/github'
import { useRollupData } from './hooks/useRollupData'
import { PatModal } from './components/PatModal'
import { SyncButton } from './components/SyncButton'
import { GoalPanel } from './components/GoalPanel'
import { QuickStats } from './components/QuickStats'
import { Vo2MaxChart } from './components/Vo2MaxChart'
import { TrainingStatusStrip } from './components/TrainingStatusStrip'
import { WeeklyVolumeChart } from './components/WeeklyVolumeChart'
import { ActivityTable } from './components/ActivityTable'
import { RecoveryPanel } from './components/RecoveryPanel'
import { SessionTypeProgressionPanel } from './components/SessionTypeProgressionPanel'
import { LatestActivityCard } from './components/LatestActivityCard'

// Only needed when the user opens "Planlegging" - kept out of the initial bundle.
const PlanPanel = lazy(() => import('./components/PlanPanel').then((m) => ({ default: m.PlanPanel })))
const AdherencePanel = lazy(() =>
  import('./components/AdherencePanel').then((m) => ({ default: m.AdherencePanel })),
)

type Tab = 'progresjon' | 'planlegging'

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

      {hasToken && loading && <p className="hero-note">Laster data…</p>}
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
              className={`tab-button ${tab === 'planlegging' ? 'active' : ''}`}
              onClick={() => setTab('planlegging')}
            >
              Planlegging
            </button>
          </nav>

          {tab === 'progresjon' && (
            <>
              <GoalPanel latest={data.latest} plan={data.plan} trend={data.aiRacePredictionTrend} />
              <div className="panel">
                <QuickStats latest={data.latest} />
              </div>
              <div className="panel-grid">
                <Vo2MaxChart data={data.vo2max} />
                <TrainingStatusStrip data={data.trainingStatus} />
              </div>
              <WeeklyVolumeChart data={data.weeklyVolume} />
              <ActivityTable activities={data.activities} />
              <SessionTypeProgressionPanel
                data={data.sessionTypeTrends}
                lthrBpm={data.latest.lactate_threshold?.heart_rate ?? null}
              />
              <RecoveryPanel data={data.recovery} />
            </>
          )}

          {tab === 'planlegging' && (
            <Suspense fallback={<p className="hero-note">Laster…</p>}>
              <PlanPanel plan={data.plan} onSuccess={reload} />
              <AdherencePanel entries={data.adherence} />
            </Suspense>
          )}
        </>
      )}
    </div>
  )
}

export default App
