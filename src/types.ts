export type AcwrRiskBand = 'low' | 'optimal' | 'elevated' | 'high' | 'insufficient_data'

export interface AcwrRollup {
  value: number | null
  acute_km_7d: number
  chronic_avg_km_28d: number
  risk_band: AcwrRiskBand
}

export interface LatestRollup {
  generated_at: string | null
  goal: { event: string; target_seconds: number }
  current_race_prediction_5k_seconds: number | null
  prediction_source: 'garmin' | 'vo2max_estimate' | null
  seconds_off_target: number | null
  vo2max: number | null
  vo2max_date: string | null
  training_status: string | null
  training_status_date: string | null
  weekly_volume_km_last_7d: number | null
  last_activity_date: string | null
  lactate_threshold: { heart_rate: number | null; speed_mps: number | null } | null
  acwr: AcwrRollup | null
  last_sync_utc: string | null
}

export interface Vo2MaxPoint {
  date: string
  vo2max: number
}

export interface RacePredictionPoint {
  date: string
  source: 'garmin' | 'vo2max_estimate'
  time_5k_sec: number | null
  time_10k_sec: number | null
  time_half_sec: number | null
  time_marathon_sec: number | null
}

export interface WeeklyVolumePoint {
  week_start: string
  distance_km: number
  num_runs: number
}

export interface RecoveryPoint {
  date: string
  rhr: number | null
  hrv_last_night_avg: number | null
  sleep_score: number | null
  sleep_duration_min: number | null
  body_battery_high: number | null
  body_battery_low: number | null
  training_readiness: number | null
}

export interface TrainingStatusPoint {
  date: string
  status: string
}

export interface ActivitySummary {
  date: string
  activity_id: number
  name: string | null
  type: string | null
  distance_km: number
  duration_min: number
  avg_hr: number | null
  garmin_note?: string | null
  elevation_gain_m?: number | null
  cadence_spm?: number | null
  temperature_c?: number | null
  counts_as_running?: boolean
  classified_session_type?: CompletedSessionType | null
}

export interface ActivityLap {
  lapIndex: number
  distance: number
  duration: number
  averageSpeed: number | null
  averageHR: number | null
  maxHR: number | null
  intensityType?: 'WARMUP' | 'ACTIVE' | 'REST' | 'COOLDOWN' | string | null
  elevationGain?: number | null
  elevationLoss?: number | null
}

export interface ActivityDetail {
  splits: { activityId: number; lapDTOs: ActivityLap[] }
  typed_splits: { activityId: number; splits: unknown[] }
}

export type SessionType = 'hvile' | 'rolig' | 'intervall' | 'terskel' | 'langtur'

export interface PlanInterval {
  label: string
  target_pace: string
  target_hr: string
  duration_or_distance: string
}

export interface WeeklyPlanDay {
  day: string
  date: string
  session_type: SessionType
  title: string
  target_distance_km: number
  target_duration_min: number
  target_effort: string
  expected_feeling?: string
  intervals?: PlanInterval[]
  rationale: string
}

export interface TrainingPlan {
  plan_start_date: string
  plan_end_date: string
  generated_at: string
  model: string
  vo2max_projection: {
    current: number
    current_date: string
    in_4_weeks: number
    in_12_weeks: number
    reasoning: string
  }
  race_prediction: {
    current_5k_seconds: number
    range_low_seconds: number
    range_high_seconds: number
    estimated_weeks_to_goal: number
    confidence: 'high' | 'medium' | 'low'
    reasoning: string
  }
  daily_plan: WeeklyPlanDay[]
  coaching_notes: string
}

export interface JournalEntry {
  created_at: string
  rpe: number
  feeling: string
  note: string
  activity_id?: number
}

export type CompletedSessionType = 'rolig' | 'terskel' | 'intervall'

export interface SessionTypePoint {
  date: string
  activity_id: number
  pace_min_per_km: number
  grade_adjusted_pace_min_per_km?: number | null
  elevation_gain_m?: number | null
  avg_hr: number | null
  distance_km: number
  active_only?: boolean
}

export type SessionTypeTrends = Record<CompletedSessionType, SessionTypePoint[]>

export interface AiRacePredictionPoint {
  date: string
  seconds: number | null
  range_low_seconds?: number | null
  range_high_seconds?: number | null
  confidence: 'high' | 'medium' | 'low' | null
}

export type AdherenceStatus = 'completed' | 'partial' | 'missed' | 'rest_broken'

export interface AdherenceEntry {
  date: string
  planned_type: SessionType
  planned_title: string
  planned_distance_km: number
  actual_distance_km: number
  status: AdherenceStatus
}

export interface DashboardBundle {
  latest: LatestRollup
  vo2max_trend: Vo2MaxPoint[]
  race_predictions_trend: RacePredictionPoint[]
  weekly_volume: WeeklyVolumePoint[]
  recovery_trend: RecoveryPoint[]
  training_status_history: TrainingStatusPoint[]
  activities: ActivitySummary[]
  session_type_trends: SessionTypeTrends
}
