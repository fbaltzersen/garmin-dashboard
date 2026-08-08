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
import type { AiRacePredictionPoint, LatestRollup, TrainingPlan } from '../types'
import { Panel } from './Panel'
import { formatDate, formatDelta, formatSecondsAsClock } from '../utils/format'

const CONFIDENCE_LABEL: Record<string, string> = {
  high: 'Høy sikkerhet',
  medium: 'Middels sikkerhet',
  low: 'Lav sikkerhet',
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const point: AiRacePredictionPoint = payload[0].payload
  return (
    <div className="tooltip-box">
      <div className="tt-label">{formatDate(label)}</div>
      <div>{formatSecondsAsClock(point.seconds)}</div>
      {point.confidence && <div className="tt-label">{CONFIDENCE_LABEL[point.confidence]}</div>}
    </div>
  )
}

export function GoalPanel({
  latest,
  plan,
  trend,
}: {
  latest: LatestRollup
  plan: TrainingPlan | null
  trend: AiRacePredictionPoint[]
}) {
  const target = latest.goal.target_seconds
  const current = plan?.race_prediction.current_5k_seconds ?? null
  const delta = current != null ? current - target : null
  const good = delta != null && delta <= 0

  return (
    <Panel title="Mål: 5K under 20:00 — AI-vurdering">
      {!plan && (
        <p className="hero-note">
          Ingen AI-vurdering ennå. Gå til "Planlegging" og generer en plan for å se AI-ens
          vurdering av din 5K-progresjon.
        </p>
      )}
      {plan && (
        <>
          <div className="hero-row">
            <div className="hero-figure tabular">{formatSecondsAsClock(current)}</div>
            <div className="hero-sub">
              <div className={`hero-delta ${good ? 'good' : 'bad'}`}>
                {formatDelta(delta)} vs. {formatSecondsAsClock(target)}
              </div>
              <div className="hero-label">
                {CONFIDENCE_LABEL[plan.race_prediction.confidence]} · vurdert {formatDate(plan.generated_at)}
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
                  dataKey="seconds"
                  stroke="var(--series-blue)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: 'var(--series-blue)', stroke: 'var(--surface-1)', strokeWidth: 2 }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          )}
          <p className="hero-note">{plan.race_prediction.reasoning}</p>
          <div className="hero-note">
            Grønn stiplet linje = 20:00-målet. Vurdert av AI ({plan.model}) ut fra Garmin-data,
            treningshistorikk og dine egne notater — ikke bare Garmins egen prediksjon.
          </div>
        </>
      )}
    </Panel>
  )
}
