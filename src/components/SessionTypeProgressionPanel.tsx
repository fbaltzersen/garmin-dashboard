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

function PaceTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const p: SessionTypePoint = payload[0].payload
  return (
    <div className="tooltip-box">
      <div className="tt-label">{formatDate(label)}</div>
      <div>{p.pace_min_per_km.toFixed(2)} min/km</div>
      <div className="tt-label">
        {p.distance_km} km{p.avg_hr ? ` · ${p.avg_hr} bpm` : ''}
      </div>
    </div>
  )
}

function HrTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const p: SessionTypePoint = payload[0].payload
  if (p.avg_hr == null) return null
  return (
    <div className="tooltip-box">
      <div className="tt-label">{formatDate(label)}</div>
      <div>{p.avg_hr} bpm</div>
      <div className="tt-label">{p.pace_min_per_km.toFixed(2)} min/km</div>
    </div>
  )
}

function TypeRow({ type, points }: { type: CompletedSessionType; points: SessionTypePoint[] }) {
  const color = TYPE_COLOR[type]
  return (
    <div style={{ marginBottom: 24 }}>
      <div className="hero-label" style={{ marginBottom: 8 }}>
        {TYPE_LABEL[type]} ({points.length} økt{points.length === 1 ? '' : 'er'})
      </div>
      {points.length < 2 ? (
        <p className="hero-note">Trenger minst 2 økter av denne typen for å vise en trend.</p>
      ) : (
        <div className="panel-grid">
          <div>
            <div className="tt-label" style={{ marginBottom: 4 }}>
              Tempo (min/km) — lavere er raskere
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={points} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="var(--gridline)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  stroke="var(--baseline)"
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  minTickGap={30}
                />
                <YAxis stroke="var(--baseline)" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} width={44} />
                <Tooltip content={<PaceTooltip />} />
                <Line
                  type="monotone"
                  dataKey="pace_min_per_km"
                  stroke={color}
                  strokeWidth={2}
                  dot={{ r: 3, fill: color, stroke: 'var(--surface-1)', strokeWidth: 2 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div>
            <div className="tt-label" style={{ marginBottom: 4 }}>
              Snittpuls — lavere ved samme tempo er bedre
            </div>
            <ResponsiveContainer width="100%" height={160}>
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
                  stroke="var(--baseline)"
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  width={44}
                  domain={['dataMin - 5', 'dataMax + 5']}
                />
                <Tooltip content={<HrTooltip />} />
                <Line
                  type="monotone"
                  dataKey="avg_hr"
                  stroke="var(--series-orange)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: 'var(--series-orange)', stroke: 'var(--surface-1)', strokeWidth: 2 }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}

export function SessionTypeProgressionPanel({ data }: { data: SessionTypeTrends | null }) {
  const anyData = data && TYPE_ORDER.some((t) => (data[t]?.length ?? 0) > 0)

  return (
    <Panel title="Progresjon per øktype">
      <p className="hero-note" style={{ marginBottom: 16 }}>
        Klassifisert automatisk fra Garmins egen treningseffekt-vurdering av hver økt. Se etter
        fallende tempo ved samme puls, eller fallende puls ved samme tempo — det er tegn på
        fremgang. Tredemølle-økter er utelatt (upålitelig tempo).
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
