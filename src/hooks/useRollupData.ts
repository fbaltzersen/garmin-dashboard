import { useCallback, useEffect, useState } from 'react'
import { fetchRepoJson, getToken, GitHubApiError, readCachedJson } from '../api/github'
import type {
  AdherenceEntry,
  AiRacePredictionPoint,
  DashboardBundle,
  TrainingPlan,
} from '../types'

export interface RollupData {
  latest: DashboardBundle['latest']
  vo2max: DashboardBundle['vo2max_trend']
  racePredictions: DashboardBundle['race_predictions_trend']
  weeklyVolume: DashboardBundle['weekly_volume']
  recovery: DashboardBundle['recovery_trend']
  trainingStatus: DashboardBundle['training_status_history']
  activities: DashboardBundle['activities']
  sessionTypeTrends: DashboardBundle['session_type_trends'] | null
  plan: TrainingPlan | null
  aiRacePredictionTrend: AiRacePredictionPoint[]
  adherence: AdherenceEntry[]
}

interface State {
  data: RollupData | null
  loading: boolean
  error: string | null
}

const DASHBOARD_PATH = 'data/rollups/dashboard.json'

function toRollupData(
  bundle: DashboardBundle,
  plan: TrainingPlan | null,
  aiRacePredictionTrend: AiRacePredictionPoint[],
  adherence: AdherenceEntry[],
): RollupData {
  return {
    latest: bundle.latest,
    vo2max: bundle.vo2max_trend,
    racePredictions: bundle.race_predictions_trend,
    weeklyVolume: bundle.weekly_volume,
    recovery: bundle.recovery_trend,
    trainingStatus: bundle.training_status_history,
    activities: bundle.activities,
    sessionTypeTrends: bundle.session_type_trends,
    plan,
    aiRacePredictionTrend,
    adherence,
  }
}

function or404<T>(fallback: T) {
  return (err: unknown) => {
    if (err instanceof GitHubApiError && err.status === 404) return fallback
    throw err
  }
}

export function useRollupData() {
  const [state, setState] = useState<State>({ data: null, loading: false, error: null })

  const load = useCallback(async () => {
    if (!getToken()) {
      setState({ data: null, loading: false, error: null })
      return
    }

    // Stale-while-revalidate: paint instantly from the last successful load
    // in this browser session, then refresh from the network underneath it.
    const cachedBundle = readCachedJson<DashboardBundle>(DASHBOARD_PATH)
    const cachedPlan = readCachedJson<TrainingPlan>('data/ai/plan.json')
    const cachedTrend = readCachedJson<AiRacePredictionPoint[]>('data/ai/race_prediction_trend.json')
    const cachedAdherence = readCachedJson<AdherenceEntry[]>('data/ai/adherence.json')
    if (cachedBundle) {
      setState({
        data: toRollupData(cachedBundle, cachedPlan, cachedTrend ?? [], cachedAdherence ?? []),
        loading: false,
        error: null,
      })
    } else {
      setState((s) => ({ ...s, loading: true, error: null }))
    }

    try {
      const [bundle, plan, aiRacePredictionTrend, adherence] = await Promise.all([
        fetchRepoJson<DashboardBundle>(DASHBOARD_PATH),
        // Plan/trend/adherence files may not exist yet on a fresh setup — treat 404 as "none yet".
        fetchRepoJson<TrainingPlan>('data/ai/plan.json').catch(or404(null)),
        fetchRepoJson<AiRacePredictionPoint[]>('data/ai/race_prediction_trend.json').catch(or404([])),
        fetchRepoJson<AdherenceEntry[]>('data/ai/adherence.json').catch(or404([])),
      ])
      setState({
        data: toRollupData(bundle, plan, aiRacePredictionTrend, adherence),
        loading: false,
        error: null,
      })
    } catch (err) {
      const message = err instanceof GitHubApiError ? err.message : 'Failed to load data'
      // A cached paint is already showing — a failed background refresh
      // shouldn't blank the page out from under the user.
      if (!cachedBundle) setState({ data: null, loading: false, error: message })
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { ...state, reload: load }
}
