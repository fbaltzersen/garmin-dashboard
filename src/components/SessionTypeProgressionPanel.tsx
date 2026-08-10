import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { LineChart as LineChartIcon } from 'lucide-react'
import type { CompletedSessionType, SessionTypePoint, SessionTypeTrends } from '../types'
import { Panel } from './Panel'
import { formatDate } from '../utils/format'
import { computeHrZones, type HrZone } from '../utils/hrZones'
import { SESSION_ICON } from '../uiMeta'

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
  const gap = p.grade_adjusted_pace_min_per_km
  return (
    <div className="tooltip-box">
      <div className="tt-label">{formatDate(label)}</div>
      <div>{(gap ?? p.pace_min_per_km).toFixed(2)} min/km {gap != null && '(stigningsjustert)'}</div>
      {gap != null && Math.abs(gap - p.pace_min_per_km) > 0.01 && (
        <div className="tt-label">{p.pace_min_per_km.toFixed(2)} min/km rå tempo</div>
      )}
      {p.avg_hr != null && <div>{p.avg_hr} bpm</div>}
      <div className="tt-label">
        {p.distance_km} km{p.elevation_gain_m ? ` · ${Math.round(p.elevation_gain_m)} hm` : ''}
      </div>
      <div className="tt-label">
        {p.active_only ? 'Kun aktive drag (pauser filtrert bort)' : 'Snitt for hele økten'}
      </div>
    </div>
  )
}

/** Which HR zone (from the personal LTHR-derived zones) counts as "on target"
 * for each session type - shaded on the HR axis so it's visible at a glance
 * whether e.g. an "easy" run actually stayed easy. */
function targetBandForType(type: CompletedSessionType, zones: HrZone[], hrDomain: [number, number]) {
  const zone2 = zones.find((z) => z.zone === 2)
  const zone4 = zones.find((z) => z.zone === 4)
  const zone5 = zones.find((z) => z.zone === 5)
  if (type === 'rolig' && zone2) return { y1: hrDomain[0], y2: zone2.upperBpm ?? hrDomain[1], label: 'Mål: sone 1–2' }
  if (type === 'terskel' && zone4) return { y1: zone4.lowerBpm, y2: zone4.upperBpm ?? hrDomain[1], label: 'Mål: sone 4' }
  if (type === 'intervall' && zone5) return { y1: zone5.lowerBpm, y2: hrDomain[1], label: 'Mål: sone 5' }
  return null
}

function TypeRow({
  type,
  points,
  zones,
}: {
  type: CompletedSessionType
  points: SessionTypePoint[]
  zones: HrZone[] | null
}) {
  const paceColor = TYPE_COLOR[type]

  // Computed as plain (rounded) numbers rather than Recharts' 'dataMin - N'
  // domain strings — floating-point subtraction (e.g. 2.05 - 0.2) produces
  // long decimals like 1.8499999999999999 that get clipped by the narrow
  // axis width into unreadable tick labels.
  const paceValues = points.map((p) => p.grade_adjusted_pace_min_per_km ?? p.pace_min_per_km)
  const paceDomain: [number, number] = [
    Math.round((Math.min(...paceValues) - 0.2) * 100) / 100,
    Math.round((Math.max(...paceValues) + 0.2) * 100) / 100,
  ]
  const hrValues = points.map((p) => p.avg_hr).filter((v): v is number => v != null)
  const hrDomain: [number, number] = hrValues.length
    ? [Math.min(...hrValues) - 5, Math.max(...hrValues) + 5]
    : [0, 200]
  const targetBand = zones ? targetBandForType(type, zones, hrDomain) : null
  const anyActiveOnly = points.some((p) => p.active_only)
  const TypeIcon = SESSION_ICON[type]

  return (
    <div style={{ marginBottom: 24 }}>
      <div className="badge" style={{ marginBottom: 8, color: paceColor, fontSize: 14 }}>
        <TypeIcon />
        {TYPE_LABEL[type]} ({points.length} økt{points.length === 1 ? '' : 'er'})
      </div>
      {points.length < 2 ? (
        <p className="hero-note">Trenger minst 2 økter av denne typen for å vise en trend.</p>
      ) : (
        <>
          <div className="tt-label" style={{ marginBottom: 4 }}>
            <span style={{ color: paceColor }}>■</span> Tempo (min/km, stigningsjustert, venstre akse
            — lavere er raskere) · <span style={{ color: 'var(--series-orange)' }}>■</span> Snittpuls
            (bpm, høyre akse){targetBand && ` · skravert felt = ${targetBand.label}`}
          </div>
          {anyActiveOnly && (
            <p className="hero-note" style={{ marginBottom: 4 }}>
              Beregnet fra kun de aktive dragene der Garmin har registrert dem (pauser/jogg mellom
              drag er filtrert bort) — økter uten registrerte drag viser snitt for hele økten i
              stedet.
            </p>
          )}
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
              {targetBand && (
                <ReferenceArea
                  yAxisId="hr"
                  y1={targetBand.y1}
                  y2={targetBand.y2}
                  fill="var(--status-good)"
                  fillOpacity={0.08}
                  stroke="none"
                />
              )}
              <Tooltip content={<CombinedTooltip />} />
              <Line
                yAxisId="pace"
                type="monotone"
                dataKey={(p: SessionTypePoint) => p.grade_adjusted_pace_min_per_km ?? p.pace_min_per_km}
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

export function SessionTypeProgressionPanel({
  data,
  lthrBpm,
}: {
  data: SessionTypeTrends | null
  lthrBpm: number | null
}) {
  const anyData = data && TYPE_ORDER.some((t) => (data[t]?.length ?? 0) > 0)
  const zones = lthrBpm ? computeHrZones(lthrBpm) : null

  return (
    <Panel title="Progresjon per øktype" icon={LineChartIcon}>
      <p className="hero-note" style={{ marginBottom: 16 }}>
        Klassifisert automatisk fra Garmins egen treningseffekt-vurdering av hver økt. Tempo er
        stigningsjustert (+100 hm ≈ +1 km flatt) slik at en kupert langtur ikke ser ut som en flat
        rask økt. Tempo (heltrukket) og puls (stiplet) vises i samme graf — se etter fallende
        tempo ved samme puls, eller fallende puls ved samme tempo, det er tegn på fremgang.
        Tredemølle-økter er utelatt (upålitelig tempo).
      </p>
      {zones && (
        <div className="hero-note" style={{ marginBottom: 16 }}>
          Pulssoner fra laktatterskel ({lthrBpm} bpm):{' '}
          {zones.map((z) => (
            <span key={z.zone} style={{ marginRight: 12 }}>
              Sone {z.zone}: {z.lowerBpm}
              {z.upperBpm ? `–${z.upperBpm}` : '+'} bpm
            </span>
          ))}
        </div>
      )}
      {!anyData && (
        <p className="hero-note">
          Ingen fullførte økter er klassifisert ennå. Denne fylles opp etter hvert som du
          gjennomfører rolige økter, terskeløkter og intervaller.
        </p>
      )}
      {anyData &&
        TYPE_ORDER.map((type) => (
          <TypeRow key={type} type={type} points={data?.[type] ?? []} zones={zones} />
        ))}
    </Panel>
  )
}
