import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { CompletedSessionType, SessionTypePoint, SessionTypeTrends } from '../types'
import { Panel } from './Panel'
import { formatDate } from '../utils/format'

const TYPE_LABEL: Record<CompletedSessionType, string> = {
  rolig: 'Rolige økter (sone 2)',
  terskel: 'Terskeløkter',
  intervall: 'Intervaløkter',
}

const TYPE_COLOR: Record<CompletedSessionType, string> = {
  rolig: 'var(--seq-blue-350)',
  terskel: 'var(--series-orange)',
  intervall: 'var(--status-critical)',
}

const TYPE_ORDER: CompletedSessionType[] = ['rolig', 'terskel', 'intervall']

function CombinedTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const p: SessionTypePoint = payload[0].payload
  return (
    <div className="tooltip-box">
      <div className="tt-label">{formatDate(label)}</div>
      <div>{p.pace_min_per_km.toFixed(2)} min/km</div>
      {p.avg_hr != null && <div>{p.avg_hr} bpm</div>}
      <div className="tt-label">{p.distance_km} km</div>
    </div>
  )
}

function TypeRow({ type, points }: { type: CompletedSessionType; points: SessionTypePoint[] }) {
  const paceColor = TYPE_COLOR[type]

  // Computed as plain (rounded) numbers rather than Recharts' 'dataMin - N'
  // domain strings — floating-point subtraction (e.g. 2.05 - 0.2) produces
  // long decimals like 1.8499999999999999 that get clipped by the narrow
  // axis width into unreadable tick labels.
  const paceValues = points.map((p) => p.pace_min_per_km)
  const paceDomain: [number, number] = [
    Math.round((Math.min(...paceValues) - 0.2) * 100) / 100,
    Math.round((Math.max(...paceValues) + 0.2) * 100) / 100,
  ]
  const hrValues = points.map((p) => p.avg_hr).filter((v): v is number => v != null)
  const hrDomain: [number, number] = hrValues.length
    ? [Math.min(...hrValues) - 5, Math.max(...hrValues) + 5]
    : [0, 200]

  return (
    <div style={{ marginBottom: 24 }}>
      <div className="hero-label" style={{ marginBottom: 8 }}>
        {TYPE_LABEL[type]} ({points.length} økt{points.length === 1 ? '' : 'er'})
      </div>
      {points.length < 2 ? (
        <p className="hero-note">Trenger minst 2 økter av denne typen for å vise en trend.</p>
      ) : (
        <>
          <div className="tt-label" style={{ marginBottom: 4 }}>
            <span style={{ color: paceColor }}>■</span> Tempo (min/km, venstre akse — lavere er raskere) ·{' '}
            <span style={{ color: 'var(--series-orange)' }}>■</span> Snittpuls (bpm, høyre akse)
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={points} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="var(--gridline)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="var(--baseline)"
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                minTickGap={30}
              />
              <YAxis
                yAxisId="pace"
                stroke={paceColor}
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                width={44}
                domain={paceDomain}
              />
              <YAxis
                yAxisId="hr"
                orientation="right"
                stroke="var(--series-orange)"
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                width={44}
                domain={hrDomain}
              />
              <Tooltip content={<CombinedTooltip />} />
              <Line
                yAxisId="pace"
                type="monotone"
                dataKey="pace_min_per_km"
                stroke={paceColor}
                strokeWidth={2}
                dot={{ r: 3, fill: paceColor, stroke: 'var(--surface-1)', strokeWidth: 2 }}
                activeDot={{ r: 5 }}
              />
              <Line
                yAxisId="hr"
                type="monotone"
                dataKey="avg_hr"
                stroke="var(--series-orange)"
                strokeWidth={2}
                strokeDasharray="4 3"
                dot={{ r: 3, fill: 'var(--series-orange)', stroke: 'var(--surface-1)', strokeWidth: 2 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  )
}

export function SessionTypeProgressionPanel({ data }: { data: SessionTypeTrends | null }) {
  const anyData = data && TYPE_ORDER.some((t) => (data[t]?.length ?? 0) > 0)

  return (
    <Panel title="Progresjon per øktype">
      <p className="hero-note" style={{ marginBottom: 16 }}>
        Klassifisert automatisk fra Garmins egen treningseffekt-vurdering av hver økt. Tempo
        (heltrukket) og puls (stiplet) vises i samme graf per øktype — se etter fallende tempo
        ved samme puls, eller fallende puls ved samme tempo, det er tegn på fremgang.
        Tredemølle-økter er utelatt (upålitelig tempo).
      </p>
      {!anyData && (
        <p className="hero-note">
          Ingen fullførte økter er klassifisert ennå. Denne fylles opp etter hvert som du
          gjennomfører rolige økter, terskeløkter og intervaller.
        </p>
      )}
      {anyData &&
        TYPE_ORDER.map((type) => <TypeRow key={type} type={type} points={data?.[type] ?? []} />)}
    </Panel>
  )
}
