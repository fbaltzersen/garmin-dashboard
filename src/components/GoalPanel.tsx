import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
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

const SMOOTHING_WINDOW = 3

interface ChartPoint extends AiRacePredictionPoint {
  range?: [number, number]
  smoothed: number | null
}

function withSmoothing(trend: AiRacePredictionPoint[]): ChartPoint[] {
  return trend.map((point, i) => {
    const windowPoints = trend
      .slice(Math.max(0, i - SMOOTHING_WINDOW + 1), i + 1)
      .map((p) => p.seconds)
      .filter((v): v is number => v != null)
    const smoothed = windowPoints.length
      ? Math.round(windowPoints.reduce((a, b) => a + b, 0) / windowPoints.length)
      : null
    const range: [number, number] | undefined =
      point.range_low_seconds != null && point.range_high_seconds != null
        ? [point.range_low_seconds, point.range_high_seconds]
        : undefined
    return { ...point, range, smoothed }
  })
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const point: ChartPoint = payload[0].payload
  return (
    <div className="tooltip-box">
      <div className="tt-label">{formatDate(label)}</div>
      <div>{formatSecondsAsClock(point.seconds)} (denne vurderingen)</div>
      {point.smoothed != null && <div>{formatSecondsAsClock(point.smoothed)} (glidende snitt)</div>}
      {point.range_low_seconds != null && point.range_high_seconds != null && (
        <div className="tt-label">
          {formatSecondsAsClock(point.range_low_seconds)}–{formatSecondsAsClock(point.range_high_seconds)}
        </div>
      )}
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
  const chartData = withSmoothing(trend)
  const hasRange = plan?.race_prediction.range_low_seconds != null && plan?.race_prediction.range_high_seconds != null

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
                {hasRange &&
                  ` · realistisk spenn ${formatSecondsAsClock(plan.race_prediction.range_low_seconds)}–${formatSecondsAsClock(plan.race_prediction.range_high_seconds)}`}
              </div>
            </div>
          </div>
          {chartData.length > 1 && (
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
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
                <Area
                  type="monotone"
                  dataKey="range"
                  stroke="none"
                  fill="var(--series-blue)"
                  fillOpacity={0.12}
                  connectNulls
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="seconds"
                  stroke="var(--series-blue)"
                  strokeWidth={1}
                  strokeOpacity={0.5}
                  dot={{ r: 2, fill: 'var(--series-blue)', stroke: 'none' }}
                  activeDot={{ r: 4 }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="smoothed"
                  stroke="var(--series-blue)"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
          <p className="hero-note">{plan.race_prediction.reasoning}</p>
          <div className="hero-note">
            Grønn stiplet linje = 20:00-målet. Tykk linje = glidende snitt av siste{' '}
            {SMOOTHING_WINDOW} vurderinger (dempet dag-til-dag-støy), tynn linje = enkeltvurdering,
            skravert felt = AI-ens usikkerhetsspenn. Vurdert av AI ({plan.model}) ut fra
            Garmin-data, treningshistorikk og dine egne notater — ikke bare Garmins egen
            prediksjon.
          </div>
        </>
      )}
    </Panel>
  )
}
