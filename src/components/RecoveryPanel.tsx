import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BatteryMedium, Heart, Moon, Sparkles } from 'lucide-react'
import type { RecoveryPoint } from '../types'
import { Panel } from './Panel'
import { formatDate } from '../utils/format'

function hasAny(data: RecoveryPoint[], key: keyof RecoveryPoint): boolean {
  return data.some((d) => d[key] != null)
}

function MiniLineTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="tooltip-box">
      <div className="tt-label">{formatDate(label)}</div>
      <div>
        {payload[0].value} {unit}
      </div>
    </div>
  )
}

export function RecoveryPanel({ data }: { data: RecoveryPoint[] }) {
  const recent = data.slice(-90)
  const showRhr = hasAny(recent, 'rhr')
  const showSleep = hasAny(recent, 'sleep_duration_min')
  const showBodyBattery = hasAny(recent, 'body_battery_high')

  if (!showRhr && !showSleep && !showBodyBattery) {
    return (
      <Panel title="Restitusjon" icon={Sparkles}>
        <p className="hero-note">Ingen restitusjonsdata (hvilepuls/søvn/body battery) registrert ennå.</p>
      </Panel>
    )
  }

  return (
    <Panel title="Restitusjon (siste 90 dager)" icon={Sparkles}>
      <div className="panel-grid">
        {showRhr && (
          <div>
            <div className="hero-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Heart style={{ width: 14, height: 14, color: 'var(--series-orange)' }} />
              Hvilepuls
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={recent} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="var(--gridline)" vertical={false} />
                <XAxis dataKey="date" tickFormatter={formatDate} hide />
                <YAxis stroke="var(--baseline)" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} width={44} />
                <Tooltip content={<MiniLineTooltip unit="bpm" />} />
                <Line
                  type="monotone"
                  dataKey="rhr"
                  stroke="var(--series-orange)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {showSleep && (
          <div>
            <div className="hero-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Moon style={{ width: 14, height: 14, color: 'var(--series-violet)' }} />
              Søvn (minutter)
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={recent} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="var(--gridline)" vertical={false} />
                <XAxis dataKey="date" tickFormatter={formatDate} hide />
                <YAxis stroke="var(--baseline)" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} width={44} />
                <Tooltip content={<MiniLineTooltip unit="min" />} />
                <Line
                  type="monotone"
                  dataKey="sleep_duration_min"
                  stroke="var(--series-violet)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {showBodyBattery && (
          <div>
            <div className="hero-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <BatteryMedium style={{ width: 14, height: 14, color: 'var(--series-aqua)' }} />
              Body Battery (høy)
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <ComposedChart data={recent} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="bodyBatteryFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--series-aqua)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--series-aqua)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--gridline)" vertical={false} />
                <XAxis dataKey="date" tickFormatter={formatDate} hide />
                <YAxis stroke="var(--baseline)" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} width={44} />
                <Tooltip content={<MiniLineTooltip unit="" />} />
                <Area
                  type="monotone"
                  dataKey="body_battery_high"
                  stroke="var(--series-aqua)"
                  fill="url(#bodyBatteryFill)"
                  strokeWidth={2}
                  connectNulls
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Panel>
  )
}
