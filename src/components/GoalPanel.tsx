import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { LatestRollup, RacePredictionPoint } from '../types'
import { Panel } from './Panel'
import { formatDate, formatDelta, formatSecondsAsClock } from '../utils/format'

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const point: RacePredictionPoint = payload[0].payload
  return (
    <div className="tooltip-box">
      <div className="tt-label">{formatDate(label)}</div>
      <div>{formatSecondsAsClock(point.time_5k_sec)}</div>
      <div className="tt-label">{point.source === 'garmin' ? 'Garmin-prediksjon' : 'VO2max-estimat'}</div>
    </div>
  )
}

export function GoalPanel({
  latest,
  trend,
}: {
  latest: LatestRollup
  trend: RacePredictionPoint[]
}) {
  const target = latest.goal.target_seconds
  const current = latest.current_race_prediction_5k_seconds
  const delta = latest.seconds_off_target
  const good = delta != null && delta <= 0

  return (
    <Panel title="Mål: 5K under 20:00">
      <div className="hero-row">
        <div className="hero-figure tabular">{formatSecondsAsClock(current)}</div>
        <div className="hero-sub">
          <div className={`hero-delta ${good ? 'good' : 'bad'}`}>
            {formatDelta(delta)} vs. {formatSecondsAsClock(target)}
          </div>
          <div className="hero-label">
            {latest.prediction_source === 'garmin' ? 'Garmin-prediksjon' : 'VO2max-estimat'}
            {latest.vo2max_date && ` · ${formatDate(latest.vo2max_date)}`}
          </div>
        </div>
      </div>
      {trend.length > 1 && (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="var(--gridline)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="var(--baseline)"
              tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
              minTickGap={40}
            />
            <YAxis
              tickFormatter={formatSecondsAsClock}
              stroke="var(--baseline)"
              tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
              width={56}
              domain={['dataMin - 30', 'dataMax + 30']}
            />
            <ReferenceLine y={target} stroke="var(--status-good)" strokeDasharray="4 4" />
            <Tooltip content={<ChartTooltip />} />
            <Line
              type="monotone"
              dataKey="time_5k_sec"
              stroke="var(--series-blue)"
              strokeWidth={2}
              dot={{ r: 3, fill: 'var(--series-blue)', stroke: 'var(--surface-1)', strokeWidth: 2 }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      )}
      <div className="hero-note">
        Grønn stiplet linje = 20:00-målet. Estimat forutsetter et jevnt tempoløp — faktisk
        løpsresultat påvirkes av gjennomføring, vær og underlag.
      </div>
    </Panel>
  )
}
