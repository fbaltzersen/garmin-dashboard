import { lazy, Suspense, useState } from 'react'
import { CalendarDays, Home, ListOrdered, LogOut, MessageCircle } from 'lucide-react'
import './App.css'
import { clearToken, getToken } from './api/github'
import { useRollupData } from './hooks/useRollupData'
import { useTalkChat } from './hooks/useTalkChat'
import { PatModal } from './components/PatModal'
import { SyncButton } from './components/SyncButton'
import { HomeTab } from './components/HomeTab'
import { LoadingSkeleton } from './components/LoadingSkeleton'

// Only needed once the user opens a non-default tab - kept out of the initial bundle.
const TalkPanel = lazy(() => import('./components/TalkPanel').then((m) => ({ default: m.TalkPanel })))
const PlanTab = lazy(() => import('./components/PlanTab').then((m) => ({ default: m.PlanTab })))
const SessionsTab = lazy(() => import('./components/SessionsTab').then((m) => ({ default: m.SessionsTab })))

type Tab = 'home' | 'talk' | 'plan' | 'sessions'

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

const TABS: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'talk', label: 'Talk', icon: MessageCircle },
  { id: 'plan', label: 'Plan', icon: CalendarDays },
  { id: 'sessions', label: 'Sessions', icon: ListOrdered },
]

function App() {
  const [hasToken, setHasToken] = useState(() => Boolean(getToken()))
  const [tab, setTab] = useState<Tab>('home')
  const { data, loading, error, reload } = useRollupData()
  const chat = useTalkChat(data)

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

          {tab === 'home' && (
            <HomeTab data={data} chat={chat} onOpenTalk={() => setTab('talk')} />
          )}

          {tab === 'talk' && (
            <Suspense fallback={<LoadingSkeleton />}>
              <TalkPanel chat={chat} />
            </Suspense>
          )}

          {tab === 'plan' && (
            <Suspense fallback={<LoadingSkeleton />}>
              <PlanTab plan={data.plan} adherence={data.adherence} activities={data.activities} onSuccess={reload} />
            </Suspense>
          )}

          {tab === 'sessions' && (
            <Suspense fallback={<LoadingSkeleton />}>
              <SessionsTab
                latestActivity={data.activities[0] ?? null}
                activities={data.activities}
                weeklyVolume={data.weeklyVolume}
                sessionTypeTrends={data.sessionTypeTrends}
                vo2max={data.vo2max}
                trainingStatus={data.trainingStatus}
                recovery={data.recovery}
              />
            </Suspense>
          )}
        </>
      )}
    </div>
  )
}

export default App
