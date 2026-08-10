import type {
  ActivitySummary,
  RecoveryPoint,
  SessionTypeTrends,
  TrainingStatusPoint,
  Vo2MaxPoint,
  WeeklyVolumePoint,
} from '../types'
import { Vo2MaxChart } from './Vo2MaxChart'
import { TrainingStatusStrip } from './TrainingStatusStrip'
import { WeeklyVolumeChart } from './WeeklyVolumeChart'
import { ActivityTable } from './ActivityTable'
import { SessionTypeProgressionPanel } from './SessionTypeProgressionPanel'
import { RecoveryPanel } from './RecoveryPanel'

export function DetailsTab({
  vo2max,
  trainingStatus,
  weeklyVolume,
  activities,
  sessionTypeTrends,
  lthrBpm,
  recovery,
}: {
  vo2max: Vo2MaxPoint[]
  trainingStatus: TrainingStatusPoint[]
  weeklyVolume: WeeklyVolumePoint[]
  activities: ActivitySummary[]
  sessionTypeTrends: SessionTypeTrends | null
  lthrBpm: number | null
  recovery: RecoveryPoint[]
}) {
  return (
    <>
      <div className="panel-grid">
        <Vo2MaxChart data={vo2max} />
        <TrainingStatusStrip data={trainingStatus} />
      </div>
      <WeeklyVolumeChart data={weeklyVolume} />
      <ActivityTable activities={activities} />
      <SessionTypeProgressionPanel data={sessionTypeTrends} lthrBpm={lthrBpm} />
      <RecoveryPanel data={recovery} />
    </>
  )
}
