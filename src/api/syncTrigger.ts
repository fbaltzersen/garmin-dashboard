import { dispatchWorkflow, listRecentRuns, type WorkflowRun } from './github'

export type SyncPhase =
  | 'idle'
  | 'dispatching'
  | 'waiting_for_run'
  | 'queued'
  | 'in_progress'
  | 'success'
  | 'failure'
  | 'timeout'

export interface SyncState {
  phase: SyncPhase
  run?: WorkflowRun
  error?: string
}

const POLL_INTERVAL_MS = 4000
const OVERALL_TIMEOUT_MS = 120_000
const WAIT_FOR_RUN_TIMEOUT_MS = 15_000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Runs the full dispatch -> poll -> resolve flow for the given workflow file,
 * calling `onUpdate` after every state transition. Dispatch is fire-and-forget
 * (GitHub returns no run ID), so the matching run is found by
 * created_at >= dispatch time. Used for both sync.yml and generate_plan.yml. */
export async function triggerWorkflowAndTrack(
  workflowFile: string,
  onUpdate: (state: SyncState) => void,
): Promise<void> {
  onUpdate({ phase: 'dispatching' })
  const dispatchedAt = Date.now() - 10_000 // small buffer for clock skew

  try {
    await dispatchWorkflow(workflowFile)
  } catch (err) {
    onUpdate({ phase: 'failure', error: (err as Error).message })
    return
  }

  onUpdate({ phase: 'waiting_for_run' })
  const overallDeadline = Date.now() + OVERALL_TIMEOUT_MS
  const waitForRunDeadline = Date.now() + WAIT_FOR_RUN_TIMEOUT_MS
  let matchedRun: WorkflowRun | undefined

  while (Date.now() < overallDeadline) {
    await sleep(POLL_INTERVAL_MS)
    let runs: WorkflowRun[]
    try {
      runs = await listRecentRuns(workflowFile)
    } catch (err) {
      onUpdate({ phase: 'failure', error: (err as Error).message })
      return
    }

    if (!matchedRun) {
      matchedRun = runs.find((r) => new Date(r.created_at).getTime() >= dispatchedAt)
      if (!matchedRun && Date.now() > waitForRunDeadline) {
        onUpdate({ phase: 'timeout', error: 'No matching run appeared yet.' })
        return
      }
      if (!matchedRun) continue
    } else {
      matchedRun = runs.find((r) => r.id === matchedRun!.id) ?? matchedRun
    }

    if (matchedRun.status === 'completed') {
      onUpdate({
        phase: matchedRun.conclusion === 'success' ? 'success' : 'failure',
        run: matchedRun,
        error: matchedRun.conclusion !== 'success' ? `Run concluded: ${matchedRun.conclusion}` : undefined,
      })
      return
    }

    onUpdate({
      phase: matchedRun.status === 'queued' ? 'queued' : 'in_progress',
      run: matchedRun,
    })
  }

  onUpdate({ phase: 'timeout', run: matchedRun, error: 'Taking longer than expected.' })
}
