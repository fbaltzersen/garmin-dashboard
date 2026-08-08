const OWNER = 'fbaltzersen'
const DATA_REPO = 'GarminData'
const PAT_STORAGE_KEY = 'gd_pat'

export class GitHubApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export function getToken(): string | null {
  return localStorage.getItem(PAT_STORAGE_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(PAT_STORAGE_KEY, token.trim())
}

export function clearToken(): void {
  localStorage.removeItem(PAT_STORAGE_KEY)
}

async function githubFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = getToken()
  if (!token) {
    throw new GitHubApiError('No PAT configured', 401)
  }
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      ...init?.headers,
    },
  })
  if (res.status === 401 || res.status === 403) {
    if (res.headers.get('x-ratelimit-remaining') === '0') {
      const reset = res.headers.get('x-ratelimit-reset')
      throw new GitHubApiError(
        `Rate limited. Try again after ${reset ? new Date(Number(reset) * 1000).toLocaleTimeString() : 'a bit'}.`,
        res.status,
      )
    }
    clearToken()
    throw new GitHubApiError('PAT is invalid or expired', res.status)
  }
  if (res.status === 404) {
    throw new GitHubApiError(
      `Not found (${path}) — check the PAT has access to ${OWNER}/${DATA_REPO} and that the workflow file is on main.`,
      404,
    )
  }
  if (!res.ok) {
    throw new GitHubApiError(`GitHub API error ${res.status} on ${path}`, res.status)
  }
  return res
}

export async function fetchRepoJson<T>(path: string): Promise<T> {
  const res = await githubFetch(`/repos/${OWNER}/${DATA_REPO}/contents/${path}`, {
    headers: { Accept: 'application/vnd.github.raw+json' },
  })
  return res.json() as Promise<T>
}

export async function fetchActivityDetail<T>(date: string, activityId: number): Promise<T> {
  const [year, month] = date.split('-')
  return fetchRepoJson<T>(`data/activities/${year}/${month}/${activityId}.json`)
}

export async function dispatchSyncWorkflow(): Promise<void> {
  await githubFetch(`/repos/${OWNER}/${DATA_REPO}/actions/workflows/sync.yml/dispatches`, {
    method: 'POST',
    body: JSON.stringify({ ref: 'main' }),
  })
}

export interface WorkflowRun {
  id: number
  status: string
  conclusion: string | null
  html_url: string
  created_at: string
}

export async function listRecentSyncRuns(): Promise<WorkflowRun[]> {
  const res = await githubFetch(
    `/repos/${OWNER}/${DATA_REPO}/actions/workflows/sync.yml/runs?event=workflow_dispatch&per_page=5`,
  )
  const data = (await res.json()) as { workflow_runs: WorkflowRun[] }
  return data.workflow_runs
}
