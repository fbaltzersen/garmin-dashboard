import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
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
      <Panel title="VO2max">
        <p className="hero-note">Ingen VO2max-data registrert ennå.</p>
      </Panel>
    )
  }
  return (
    <Panel title="VO2max">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
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
          <Line
            type="monotone"
            dataKey="vo2max"
            stroke="var(--series-aqua)"
            strokeWidth={2}
            dot={{ r: 3, fill: 'var(--series-aqua)', stroke: 'var(--surface-1)', strokeWidth: 2 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Panel>
  )
}
