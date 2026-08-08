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
  Object.keys(sessionStorage)
    .filter((k) => k.startsWith(CACHE_PREFIX))
    .forEach((k) => sessionStorage.removeItem(k))
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

const CACHE_PREFIX = 'gd_cache:'

/** Best-effort read of the last successful response for `path` - used for an
 * instant first paint on repeat visits (stale-while-revalidate). A miss or a
 * disabled/full sessionStorage is not an error, just means no cached paint. */
export function readCachedJson<T>(path: string): T | null {
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + path)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function writeCachedJson(path: string, data: unknown): void {
  try {
    sessionStorage.setItem(CACHE_PREFIX + path, JSON.stringify(data))
  } catch {
    // quota exceeded or storage disabled - caching is a pure optimization
  }
}

export async function fetchRepoJson<T>(path: string): Promise<T> {
  const res = await githubFetch(`/repos/${OWNER}/${DATA_REPO}/contents/${path}`, {
    headers: { Accept: 'application/vnd.github.raw+json' },
  })
  const data = (await res.json()) as T
  writeCachedJson(path, data)
  return data
}

export async function fetchActivityDetail<T>(date: string, activityId: number): Promise<T> {
  const [year, month] = date.split('-')
  return fetchRepoJson<T>(`data/activities/${year}/${month}/${activityId}.json`)
}

function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

async function getFileSha(path: string): Promise<string | null> {
  try {
    const res = await githubFetch(`/repos/${OWNER}/${DATA_REPO}/contents/${path}`)
    const data = (await res.json()) as { sha: string }
    return data.sha
  } catch (err) {
    if (err instanceof GitHubApiError && err.status === 404) return null
    throw err
  }
}

/** Creates or updates a JSON file in GarminData via the Contents API. Requires
 * the PAT to have Contents: Read and write. */
export async function writeRepoJson(path: string, data: unknown, commitMessage: string): Promise<void> {
  const sha = await getFileSha(path)
  await githubFetch(`/repos/${OWNER}/${DATA_REPO}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: commitMessage,
      content: utf8ToBase64(JSON.stringify(data, null, 2)),
      ...(sha ? { sha } : {}),
    }),
  })
}

export async function dispatchWorkflow(workflowFile: string, inputs?: Record<string, string>): Promise<void> {
  await githubFetch(`/repos/${OWNER}/${DATA_REPO}/actions/workflows/${workflowFile}/dispatches`, {
    method: 'POST',
    body: JSON.stringify({ ref: 'main', ...(inputs ? { inputs } : {}) }),
  })
}

export interface WorkflowRun {
  id: number
  status: string
  conclusion: string | null
  html_url: string
  created_at: string
}

export async function listRecentRuns(workflowFile: string): Promise<WorkflowRun[]> {
  const res = await githubFetch(
    `/repos/${OWNER}/${DATA_REPO}/actions/workflows/${workflowFile}/runs?event=workflow_dispatch&per_page=5`,
  )
  const data = (await res.json()) as { workflow_runs: WorkflowRun[] }
  return data.workflow_runs
}
