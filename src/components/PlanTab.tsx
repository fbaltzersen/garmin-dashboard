import type { AdherenceEntry, ActivitySummary, TrainingPlan } from '../types'
import { PlanPanel } from './PlanPanel'
import { AdherencePanel } from './AdherencePanel'

export function PlanTab({
  plan,
  adherence,
  activities,
  onSuccess,
}: {
  plan: TrainingPlan | null
  adherence: AdherenceEntry[]
  activities: ActivitySummary[]
  onSuccess: () => void
}) {
  return (
    <>
      <PlanPanel plan={plan} onSuccess={onSuccess} />
      <AdherencePanel entries={adherence} plan={plan} activities={activities} />
    </>
  )
}
