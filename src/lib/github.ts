/**
 * Fetch GitHub contribution data for the activity heatmap.
 * Uses the GitHub GraphQL API to get the real contribution calendar.
 */

interface ContributionDay {
  date: string
  contributionCount: number
}

interface ContributionWeek {
  contributionDays: ContributionDay[]
}

interface GitHubContributionData {
  totalContributions: number
  weeks: ContributionWeek[]
}

/**
 * Resolve the best available GitHub token.
 * Priority: user's OAuth token → server-side GITHUB_PAT env variable.
 * The PAT fallback ensures we always have 5,000 req/hr instead of 60.
 */
function resolveGitHubToken(accessToken?: string): string {
  if (accessToken) return accessToken
  return process.env.GITHUB_PAT || ''
}

export async function fetchGitHubContributions(
  accessToken: string,
  username: string
): Promise<GitHubContributionData | null> {
  const token = resolveGitHubToken(accessToken)
  if (!token) return null

  try {
    const query = `
      query($username: String!) {
        user(login: $username) {
          contributionsCollection {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  date
                  contributionCount
                }
              }
            }
          }
        }
      }
    `

    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables: { username } }),
    })

    if (!response.ok) return null

    const json = await response.json()
    const calendar = json?.data?.user?.contributionsCollection?.contributionCalendar

    if (!calendar) return null

    return {
      totalContributions: calendar.totalContributions,
      weeks: calendar.weeks,
    }
  } catch {
    return null
  }
}

/**
 * Fetch recent GitHub commits for the activity feed.
 * Uses the Repos + Commits API (more reliable than Events API).
 */
export interface GitHubCommitEvent {
  id: string
  repo: string
  commits: { sha: string; message: string }[]
  created_at: string
}

export async function fetchGitHubEvents(
  accessToken: string,
  username: string
): Promise<GitHubCommitEvent[]> {
  const token = resolveGitHubToken(accessToken)
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  try {
    // 1. Fetch user's repos (sorted by most recently pushed)
    const reposRes = await fetch(
      `https://api.github.com/users/${username}/repos?sort=pushed&per_page=10`,
      { headers, cache: 'no-store' }
    )

    if (!reposRes.ok) return []
    const repos = await reposRes.json()
    if (!Array.isArray(repos) || repos.length === 0) return []

    // 2. For each repo, fetch recent commits by this user
    const since = new Date()
    since.setDate(since.getDate() - 90)

    const commitPromises = repos.slice(0, 8).map(async (repo: { full_name: string }) => {
      try {
        const commitsRes = await fetch(
          `https://api.github.com/repos/${repo.full_name}/commits?author=${username}&since=${since.toISOString()}&per_page=10`,
          { headers, cache: 'no-store' }
        )
        if (!commitsRes.ok) return []
        const commits = await commitsRes.json()
        if (!Array.isArray(commits)) return []
        return commits.map((c: {
          sha: string
          commit: { message: string; author: { date: string } }
        }) => ({
          sha: c.sha,
          message: c.commit.message,
          date: c.commit.author.date,
          repo: repo.full_name,
        }))
      } catch {
        return []
      }
    })

    const allCommits = (await Promise.all(commitPromises)).flat()

    // 3. Group commits by repo + day
    const groupMap = new Map<string, {
      repo: string
      commits: { sha: string; message: string }[]
      created_at: string
    }>()

    allCommits.forEach((c: { sha: string; message: string; date: string; repo: string }) => {
      const day = c.date.split('T')[0]
      const key = `${c.repo}::${day}`

      if (!groupMap.has(key)) {
        groupMap.set(key, {
          repo: c.repo,
          commits: [],
          created_at: c.date,
        })
      }
      groupMap.get(key)!.commits.push({ sha: c.sha, message: c.message })
    })

    // Convert to sorted array (newest first)
    return Array.from(groupMap.entries())
      .map(([key, val]) => ({
        id: key,
        repo: val.repo,
        commits: val.commits,
        created_at: val.created_at,
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  } catch {
    return []
  }
}

/**
 * Calculate streak from GitHub contribution calendar.
 */
export function calculateGitHubStreak(
  data: GitHubContributionData | null
): { current: number; best: number } {
  if (!data || data.weeks.length === 0) return { current: 0, best: 0 }

  const allDays: ContributionDay[] = []
  data.weeks.forEach(week => {
    week.contributionDays.forEach(day => allDays.push(day))
  })

  let current = 0
  const today = new Date().toISOString().split('T')[0]

  for (let i = allDays.length - 1; i >= 0; i--) {
    const day = allDays[i]
    if (day.date > today) continue
    if (day.contributionCount > 0) {
      current++
    } else if (day.date === today) {
      continue
    } else {
      break
    }
  }

  let best = 0
  let streak = 0
  for (const day of allDays) {
    if (day.contributionCount > 0) {
      streak++
      if (streak > best) best = streak
    } else {
      streak = 0
    }
  }

  return { current, best }
}

/**
 * Fetch top programming languages based on repository size. 
 */
export async function fetchGitHubTopLanguages(
  accessToken: string,
  username: string
): Promise<{ language: string; size: number }[]> {
  const token = resolveGitHubToken(accessToken)
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  try {
    const reposRes = await fetch(
      `https://api.github.com/users/${username}/repos?per_page=100`,
      { headers, cache: 'no-store' }
    )
    if (!reposRes.ok) return []
    const repos = await reposRes.json()

    const langMap = new Map<string, number>()
    repos.forEach((repo: any) => {
      // Ignore forks and empty languages
      if (repo.language && !repo.fork) {
        langMap.set(repo.language, (langMap.get(repo.language) || 0) + (repo.size || 1))
      }
    })

    const sorted = Array.from(langMap.entries())
      .map(([language, size]) => ({ language, size }))
      .sort((a, b) => b.size - a.size)

    return sorted.slice(0, 5) // top 5
  } catch {
    return []
  }
}

