import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Waves } from 'lucide-react'
import type { SessionTypeTrends } from '../types'
import { Panel } from './Panel'
import { formatDate } from '../utils/format'

const PACE_COLOR = 'var(--seq-blue-350)'

function ZoneTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  const gap = p.grade_adjusted_pace_min_per_km
  return (
    <div className="tooltip-box">
      <div className="tt-label">{formatDate(label)}</div>
      <div>{(gap ?? p.pace_min_per_km).toFixed(2)} min/km{gap != null && ' (høydejustert)'}</div>
      {gap != null && Math.abs(gap - p.pace_min_per_km) > 0.01 && (
        <div className="tt-label">{p.pace_min_per_km.toFixed(2)} min/km rå tempo</div>
      )}
      <div className="tt-label">
        {p.distance_km} km{p.elevation_gain_m ? ` · ${Math.round(p.elevation_gain_m)} hm` : ''}
      </div>
    </div>
  )
}

/** Zone 2 easy runs only - HR is deliberately held flat (~145-150 bpm) on
 * these every time, so a HR line/axis adds nothing; grade-adjusted pace
 * alone (+100 hm ≈ +1 km flatt) is the useful progress signal here. */
export function Zone2PacePanel({ data }: { data: SessionTypeTrends | null }) {
  const points = data?.rolig ?? []
  // Computed as plain rounded numbers rather than Recharts' 'dataMin - N'
  // domain strings - floating-point subtraction produces long decimals that
  // get clipped by the narrow axis width into unreadable tick labels.
  const paceValues = points.map((p) => p.grade_adjusted_pace_min_per_km ?? p.pace_min_per_km)
  const paceDomain: [number, number] =
    paceValues.length > 0
      ? [
          Math.round((Math.min(...paceValues) - 0.2) * 100) / 100,
          Math.round((Math.max(...paceValues) + 0.2) * 100) / 100,
        ]
      : [0, 10]

  return (
    <Panel title="Sone 2 — snittpace (høydejustert)" icon={Waves}>
      <p className="hero-note" style={{ marginBottom: 16 }}>
        Rolige økter holdt i sone 2 (samme puls hver gang, 145–150 bpm), stigningsjustert
        (+100 hm ≈ +1 km flatt) slik at en kupert tur ikke ser ut som en flat rask økt. Fallende
        linje over tid er tegn på fremgang.
      </p>
      {points.length < 2 ? (
        <p className="hero-note">Trenger minst 2 sone 2-økter for å vise en trend.</p>
      ) : (
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
              stroke={PACE_COLOR}
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              width={44}
              domain={paceDomain}
            />
            <Tooltip content={<ZoneTooltip />} />
            <Line
              type="monotone"
              dataKey={(p: (typeof points)[number]) => p.grade_adjusted_pace_min_per_km ?? p.pace_min_per_km}
              stroke={PACE_COLOR}
              strokeWidth={2.5}
              dot={{ r: 3, fill: PACE_COLOR, stroke: 'var(--surface-1)', strokeWidth: 2 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Panel>
  )
}
