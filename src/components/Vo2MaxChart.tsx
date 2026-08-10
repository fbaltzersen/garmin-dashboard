import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Gauge } from 'lucide-react'
import type { Vo2MaxPoint } from '../types'
import { Panel } from './Panel'
import { formatDate } from '../utils/format'

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="tooltip-box">
      <div className="tt-label">{formatDate(label)}</div>
      <div>{payload[0].value} ml/kg/min</div>
    </div>
  )
}

export function Vo2MaxChart({ data }: { data: Vo2MaxPoint[] }) {
  if (data.length === 0) {
    return (
      <Panel title="VO2max" icon={Gauge}>
        <p className="hero-note">Ingen VO2max-data registrert ennå.</p>
      </Panel>
    )
  }
  return (
    <Panel title="VO2max" icon={Gauge}>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="vo2maxFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--series-aqua)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--series-aqua)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--gridline)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="var(--baseline)"
            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
            minTickGap={40}
          />
          <YAxis
            stroke="var(--baseline)"
            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
            width={44}
            domain={['dataMin - 2', 'dataMax + 2']}
          />
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey="vo2max"
            stroke="none"
            fill="url(#vo2maxFill)"
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="vo2max"
            stroke="var(--series-aqua)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: 'var(--series-aqua)', stroke: 'var(--surface-1)', strokeWidth: 2 }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Panel>
  )
}
