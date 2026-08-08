import { useCallback, useEffect, useState } from 'react'
import { fetchRepoJson, getToken, GitHubApiError } from '../api/github'
import type {
  ActivitySummary,
  AiRacePredictionPoint,
  LatestRollup,
  RacePredictionPoint,
  RecoveryPoint,
  SessionTypeTrends,
  TrainingPlan,
  TrainingStatusPoint,
  Vo2MaxPoint,
  WeeklyVolumePoint,
} from '../types'

export interface RollupData {
  latest: LatestRollup
  vo2max: Vo2MaxPoint[]
  racePredictions: RacePredictionPoint[]
  weeklyVolume: WeeklyVolumePoint[]
  recovery: RecoveryPoint[]
  trainingStatus: TrainingStatusPoint[]
  activities: ActivitySummary[]
  plan: TrainingPlan | null
  sessionTypeTrends: SessionTypeTrends | null
  aiRacePredictionTrend: AiRacePredictionPoint[]
}

interface State {
  data: RollupData | null
  loading: boolean
  error: string | null
}

export function useRollupData() {
  const [state, setState] = useState<State>({ data: null, loading: false, error: null })

  const load = useCallback(async () => {
    if (!getToken()) {
      setState({ data: null, loading: false, error: null })
      return
    }
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const [latest, vo2max, racePredictions, weeklyVolume, recovery, trainingStatus, activities] =
        await Promise.all([
          fetchRepoJson<LatestRollup>('data/rollups/latest.json'),
          fetchRepoJson<Vo2MaxPoint[]>('data/rollups/vo2max_trend.json'),
          fetchRepoJson<RacePredictionPoint[]>('data/rollups/race_predictions_trend.json'),
          fetchRepoJson<WeeklyVolumePoint[]>('data/rollups/weekly_volume.json'),
          fetchRepoJson<RecoveryPoint[]>('data/rollups/recovery_trend.json'),
          fetchRepoJson<TrainingStatusPoint[]>('data/rollups/training_status_history.json'),
          fetchRepoJson<ActivitySummary[]>('data/rollups/activities.json'),
        ])
      // Plan/session-type trends may not exist yet on a fresh setup — treat 404 as "none yet".
      const [plan, sessionTypeTrends, aiRacePredictionTrend] = await Promise.all([
        fetchRepoJson<TrainingPlan>('data/ai/plan.json').catch((err) => {
          if (err instanceof GitHubApiError && err.status === 404) return null
          throw err
        }),
        fetchRepoJson<SessionTypeTrends>('data/rollups/session_type_trends.json').catch((err) => {
          if (err instanceof GitHubApiError && err.status === 404) return null
          throw err
        }),
        fetchRepoJson<AiRacePredictionPoint[]>('data/ai/race_prediction_trend.json').catch((err) => {
          if (err instanceof GitHubApiError && err.status === 404) return []
          throw err
        }),
      ])
      setState({
        data: {
          latest,
          vo2max,
          racePredictions,
          weeklyVolume,
          recovery,
          trainingStatus,
          activities,
          plan,
          sessionTypeTrends,
          aiRacePredictionTrend,
        },
        loading: false,
        error: null,
      })
    } catch (err) {
      const message = err instanceof GitHubApiError ? err.message : 'Failed to load data'
      setState({ data: null, loading: false, error: message })
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { ...state, reload: load }
}
