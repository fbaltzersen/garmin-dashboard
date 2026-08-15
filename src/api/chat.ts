import type { RollupData } from '../hooks/useRollupData'

export interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
}

/** Trims the already client-loaded dashboard bundle down to what a chat
 * answer actually needs - the serverless function gets this in the request
 * body instead of fetching GarminData itself, so it never needs its own
 * GitHub PAT. */
function buildChatContext(data: RollupData) {
  return {
    goal: data.latest.goal,
    current_race_prediction_5k_seconds: data.latest.current_race_prediction_5k_seconds,
    seconds_off_target: data.latest.seconds_off_target,
    vo2max: data.latest.vo2max,
    training_status: data.latest.training_status,
    weekly_volume_km_last_7d: data.latest.weekly_volume_km_last_7d,
    lactate_threshold: data.latest.lactate_threshold,
    acwr: data.latest.acwr,
    last_activity_date: data.latest.last_activity_date,
    plan: data.plan
      ? {
          plan_start_date: data.plan.plan_start_date,
          plan_end_date: data.plan.plan_end_date,
          vo2max_projection: data.plan.vo2max_projection,
          race_prediction: data.plan.race_prediction,
          daily_plan: data.plan.daily_plan,
          coaching_notes: data.plan.coaching_notes,
        }
      : null,
    recent_activities: data.activities.slice(0, 10),
    recovery_last_7_days: data.recovery.slice(-7),
    adherence_last_14_days: data.adherence.slice(-14),
  }
}

const ACCESS_KEY = import.meta.env.VITE_CHAT_ACCESS_KEY as string | undefined

export async function sendChatMessage(
  message: string,
  history: ChatMessage[],
  data: RollupData | null,
): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(ACCESS_KEY ? { 'X-Chat-Access-Key': ACCESS_KEY } : {}),
    },
    body: JSON.stringify({
      message,
      history,
      context: data ? buildChatContext(data) : null,
    }),
  })

  const body = (await res.json().catch(() => null)) as { reply?: string; error?: string } | null
  if (!res.ok) {
    throw new Error(body?.error ?? `Chat-forespørsel feilet (${res.status})`)
  }
  return body?.reply ?? 'Fikk ikke noe svar.'
}
