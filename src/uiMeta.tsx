import { AlertTriangle, BedDouble, CheckCircle2, Circle, Flame, Map, Target, Waves, XCircle } from 'lucide-react'
import type { SessionType } from './types'

export const SESSION_LABEL: Record<SessionType, string> = {
  hvile: 'Hvile',
  rolig: 'Rolig',
  intervall: 'Intervall',
  terskel: 'Terskel',
  langtur: 'Langtur',
}

export const SESSION_COLOR: Record<SessionType, string> = {
  hvile: 'var(--status-neutral)',
  rolig: 'var(--seq-blue-350)',
  langtur: 'var(--series-blue)',
  terskel: 'var(--series-orange)',
  intervall: 'var(--status-critical)',
}

export const SESSION_ICON: Record<SessionType, typeof BedDouble> = {
  hvile: BedDouble,
  rolig: Waves,
  langtur: Map,
  terskel: Target,
  intervall: Flame,
}

export type DayStatus = 'completed' | 'partial' | 'missed' | 'rest_broken' | 'upcoming'

export const STATUS_LABEL: Record<DayStatus, string> = {
  completed: 'Gjennomført',
  partial: 'Delvis',
  missed: 'Droppet',
  rest_broken: 'Trente på hviledag',
  upcoming: 'Kommer',
}

export const STATUS_COLOR: Record<DayStatus, string> = {
  completed: 'var(--status-good)',
  partial: 'var(--status-warning)',
  missed: 'var(--status-critical)',
  rest_broken: 'var(--status-warning)',
  upcoming: 'var(--text-muted)',
}

export const STATUS_ICON: Record<DayStatus, typeof CheckCircle2> = {
  completed: CheckCircle2,
  partial: AlertTriangle,
  missed: XCircle,
  rest_broken: AlertTriangle,
  upcoming: Circle,
}
