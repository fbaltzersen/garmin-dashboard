import { fetchRepoJson, GitHubApiError, writeRepoJson } from './github'
import type { JournalEntry } from '../types'

interface DayJournal {
  date: string
  entries: JournalEntry[]
}

async function readDayJournal(date: string): Promise<DayJournal> {
  return fetchRepoJson<DayJournal>(`data/journal/${date}.json`).catch((err) => {
    if (err instanceof GitHubApiError && err.status === 404) return { date, entries: [] }
    throw err
  })
}

/** Creates or replaces a journal entry for the given date. When `entry.activity_id`
 * is set, any existing entry for that same activity is replaced (upsert); otherwise
 * the entry is appended alongside whatever is already logged for the day. */
export async function upsertJournalEntry(date: string, entry: JournalEntry): Promise<void> {
  const path = `data/journal/${date}.json`
  const existing = await readDayJournal(date)
  const kept = entry.activity_id
    ? existing.entries.filter((e) => e.activity_id !== entry.activity_id)
    : existing.entries
  const updated: DayJournal = { date, entries: [...kept, entry] }
  const message = entry.activity_id ? `journal: activity ${entry.activity_id}` : `journal: ${date}`
  await writeRepoJson(path, updated, message)
}

export async function fetchJournalEntryForActivity(
  date: string,
  activityId: number,
): Promise<JournalEntry | null> {
  const day = await readDayJournal(date)
  return day.entries.find((e) => e.activity_id === activityId) ?? null
}
