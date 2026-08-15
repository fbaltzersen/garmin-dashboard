import type {
  ActivitySummary,
  RecoveryPoint,
  SessionTypeTrends,
  TrainingStatusPoint,
  Vo2MaxPoint,
  WeeklyVolumePoint,
} from '../types'
import { LatestActivityCard } from './LatestActivityCard'
import { ActivityTable } from './ActivityTable'
import { WeeklyVolumeChart } from './WeeklyVolumeChart'
import { Zone2PacePanel } from './Zone2PacePanel'
import { Vo2MaxChart } from './Vo2MaxChart'
import { TrainingStatusStrip } from './TrainingStatusStrip'
import { RecoveryPanel } from './RecoveryPanel'

export function SessionsTab({
  latestActivity,
  activities,
  weeklyVolume,
  sessionTypeTrends,
  vo2max,
  trainingStatus,
  recovery,
}: {
  latestActivity: ActivitySummary | null
  activities: ActivitySummary[]
  weeklyVolume: WeeklyVolumePoint[]
  sessionTypeTrends: SessionTypeTrends | null
  vo2max: Vo2MaxPoint[]
  trainingStatus: TrainingStatusPoint[]
  recovery: RecoveryPoint[]
}) {
  return (
    <>
      <LatestActivityCard activity={latestActivity} />
      <ActivityTable activities={activities} />
      <WeeklyVolumeChart data={weeklyVolume} />
      <Zone2PacePanel data={sessionTypeTrends} />
      <div className="panel-grid">
        <Vo2MaxChart data={vo2max} />
        <TrainingStatusStrip data={trainingStatus} />
      </div>
      <RecoveryPanel data={recovery} />
    </>
  )
}
