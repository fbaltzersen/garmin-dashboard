import { useState } from 'react'
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
import { PlanPanel } from './components/PlanPanel'
import { JournalForm } from './components/JournalForm'

function App() {
  const [hasToken, setHasToken] = useState(() => Boolean(getToken()))
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
          <GoalPanel latest={data.latest} trend={data.racePredictions} />
          <div className="panel">
            <QuickStats latest={data.latest} />
          </div>
          <PlanPanel plan={data.plan} onSuccess={reload} />
          <JournalForm />
          <div className="panel-grid">
            <Vo2MaxChart data={data.vo2max} />
            <TrainingStatusStrip data={data.trainingStatus} />
          </div>
          <WeeklyVolumeChart data={data.weeklyVolume} />
          <ActivityTable activities={data.activities} />
          <RecoveryPanel data={data.recovery} />
        </>
      )}
    </div>
  )
}

export default App
