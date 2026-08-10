import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BarChart3 } from 'lucide-react'
import type { WeeklyVolumePoint } from '../types'
import { Panel } from './Panel'
import { formatDate } from '../utils/format'

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const point: WeeklyVolumePoint = payload[0].payload
  return (
    <div className="tooltip-box">
      <div className="tt-label">Uke fra {formatDate(label)}</div>
      <div>{point.distance_km} km</div>
      <div className="tt-label">
        {point.num_runs} økt{point.num_runs === 1 ? '' : 'er'}
      </div>
    </div>
  )
}

export function WeeklyVolumeChart({ data }: { data: WeeklyVolumePoint[] }) {
  const recent = data.slice(-26)
  return (
    <Panel title="Ukentlig løpsdistanse — kun utendørs (siste 26 uker)" icon={BarChart3}>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={recent} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="weeklyVolumeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--series-blue)" stopOpacity={1} />
              <stop offset="100%" stopColor="var(--series-blue)" stopOpacity={0.55} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--gridline)" vertical={false} />
          <XAxis
            dataKey="week_start"
            tickFormatter={formatDate}
            stroke="var(--baseline)"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            minTickGap={30}
          />
          <YAxis
            stroke="var(--baseline)"
            tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
            width={44}
            tickFormatter={(v) => `${v}`}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--gridline)' }} />
          <Bar dataKey="distance_km" fill="url(#weeklyVolumeFill)" radius={[6, 6, 0, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </Panel>
  )
}
