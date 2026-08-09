import type { ActivitySummary, CompletedSessionType, SessionType, WeeklyPlanDay } from '../types'

export type DayStatus = 'completed' | 'partial' | 'missed' | 'rest_broken' | 'upcoming'

// Mirrors generate_plan.py's COMPATIBLE_ACTUAL_TYPES - keep in sync. langtur
// (long run) isn't separately classified server-side, it reads as "rolig"
// (aerobic effort) same as an easy run.
const COMPATIBLE_ACTUAL_TYPES: Partial<Record<SessionType, CompletedSessionType[]>> = {
  rolig: ['rolig'],
  langtur: ['rolig'],
  terskel: ['terskel'],
  intervall: ['intervall'],
}

/** Same rules as generate_plan.py's _compute_adherence, computed live from
 * whatever activities/plan are currently loaded - used where we can't wait
 * for the next once-daily plan generation to reflect today's session. */
export function computeDayStatus(
  day: Pick<WeeklyPlanDay, 'session_type' | 'target_distance_km'>,
  dayActivities: ActivitySummary[],
  isFuture: boolean,
): DayStatus {
  if (isFuture) return 'upcoming'

  if (day.session_type === 'hvile') {
    const didTrain = dayActivities.some((a) => (a.duration_min ?? 0) >= 15 || (a.distance_km ?? 0) >= 2)
    return didTrain ? 'rest_broken' : 'completed'
  }

  const runningActivities = dayActivities.filter((a) => a.counts_as_running)
  if (runningActivities.length === 0) return 'missed'

  const actualDistance = runningActivities.reduce((sum, a) => sum + (a.distance_km || 0), 0)
  if (day.target_distance_km > 0 && actualDistance < day.target_distance_km * 0.6) return 'partial'

  const classified = runningActivities.find((a) => a.classified_session_type)?.classified_session_type
  const compatible = COMPATIBLE_ACTUAL_TYPES[day.session_type]
  if (classified && compatible && !compatible.includes(classified)) return 'partial'

  return 'completed'
}
