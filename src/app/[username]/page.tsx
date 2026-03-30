import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import ProofMap from '@/components/profile/ProofMap'
import WorkStream from '@/components/profile/WorkStream'
import StatsCard from '@/components/profile/StatsCard'
import { fetchGitHubContributions, fetchGitHubEvents, calculateGitHubStreak } from '@/lib/github'

export async function generateMetadata(
  props: { params: Promise<{ username: string }> }
): Promise<Metadata> {
  const { username } = await props.params
  return {
    title: `${username} — Proofly Profile`,
    description: `View ${username}'s verified proof of work on Proofly.`,
  }
}

export default async function PublicProfilePage(
  props: { params: Promise<{ username: string }> }
) {
  const { username } = await props.params
  const supabase = await createClient()

  // Fetch profile by username
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  // Fetch all logs for this user
  const { data: logs } = await supabase
    .from('logs')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  const allLogs = logs || []
  const verifiedLogs = allLogs.filter(l => l.is_verified)
  const totalLogs = allLogs.length

  // Fetch real GitHub data
  let githubData = null
  let githubEvents: Awaited<ReturnType<typeof fetchGitHubEvents>> = []
  let streakData = { current: 0, best: 0 }

  if (profile.github_access_token && profile.username) {
    const [contributions, events] = await Promise.all([
      fetchGitHubContributions(profile.github_access_token, profile.username),
      fetchGitHubEvents(profile.github_access_token, profile.username),
    ])
    githubData = contributions
    githubEvents = events
    streakData = calculateGitHubStreak(contributions)
  }

  const currentStreak = streakData.current || profile.current_streak || 0
  const bestStreak = streakData.best || profile.best_streak || 0

  // Calculate top repos from GitHub events
  const repoMap = new Map<string, number>()
  githubEvents.forEach(event => {
    const repo = event.repo.split('/').pop() || event.repo
    repoMap.set(repo, (repoMap.get(repo) || 0) + event.commits.length)
  })
  // Also include repos from logs
  allLogs.forEach(log => {
    if (log.github_data?.repo) {
      const repo = (log.github_data.repo as string).split('/').pop() || log.github_data.repo as string
      repoMap.set(repo, (repoMap.get(repo) || 0) + 1)
    }
  })

  const topRepos = Array.from(repoMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
  const totalRepoActivity = topRepos.reduce((sum, [, count]) => sum + count, 0) || 1

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 animate-fade-in">
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[var(--border-primary)]">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.username || 'User'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[var(--accent-green-bg)] flex items-center justify-center text-2xl font-bold text-[var(--accent-green)]">
                      {(profile.username || 'U')[0].toUpperCase()}
                    </div>
                  )}
                </div>
                {/* Online indicator */}
                <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-[var(--accent-green)] border-2 border-[var(--bg-primary)] flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--bg-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </div>

              <div>
                <h1 className="text-2xl font-bold">{profile.username}</h1>
                {profile.full_name && (
                  <p className="text-sm text-[var(--text-secondary)] font-mono uppercase tracking-wider">
                    {profile.full_name}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  {githubData && (
                    <span className="badge badge-verified">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                      {githubData.totalContributions} contributions
                    </span>
                  )}
                  {totalLogs >= 100 && (
                    <span className="badge badge-gold">🏆 {totalLogs}+ Logs</span>
                  )}
                </div>
              </div>
            </div>

            {/* Streak / Score */}
            <div className="flex gap-3">
              <div className="card-static p-4 text-center min-w-[120px]">
                <p className="section-label mb-1">Current Streak</p>
                <p className="text-3xl font-bold">{currentStreak}</p>
                <p className="text-xs text-[var(--text-tertiary)] uppercase font-mono">Days</p>
              </div>
              <div className="card-static p-4 text-center min-w-[120px]">
                <p className="section-label mb-1">Best Streak</p>
                <p className="text-3xl font-bold text-[var(--accent-green)]">{bestStreak}</p>
                <p className="text-xs text-[var(--text-tertiary)] uppercase font-mono">Days</p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_340px] gap-6">
            {/* Main Column */}
            <div className="space-y-8">
              {/* Proof Map — real GitHub contributions */}
              <ProofMap githubData={githubData} logs={allLogs} />

              {/* Top Repos */}
              {topRepos.length > 0 && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="card-static p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                      <h3 className="font-bold">Top Repositories</h3>
                    </div>

                    <div className="space-y-4">
                      {topRepos.map(([repo, count], i) => {
                        const pctg = Math.round((count / totalRepoActivity) * 100)
                        const colors = ['var(--accent-blue)', 'var(--accent-green)', 'var(--accent-orange)', 'var(--text-tertiary)']
                        return (
                          <div key={i}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{repo}</span>
                              <span className="text-sm text-[var(--text-secondary)]">{count} commits</span>
                            </div>
                            <div className="progress-bar">
                              <div
                                className="progress-fill"
                                style={{ width: `${pctg}%`, backgroundColor: colors[i] || colors[3] }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Achievement Badge */}
                  <div className="card-static p-6 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-[var(--accent-yellow-bg)] flex items-center justify-center mb-4">
                      <span className="text-3xl">🏆</span>
                    </div>
                    <h3 className="font-bold mb-2">
                      {bestStreak >= 30 ? 'Consistency King' : bestStreak >= 14 ? 'Dedicated Dev' : 'Rising Star'}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {bestStreak >= 30
                        ? `Maintained a ${bestStreak}-day proof streak across repositories.`
                        : `Keep building to earn achievement badges!`}
                    </p>
                  </div>
                </div>
              )}

              {/* Work Stream — merged with GitHub commits */}
              <WorkStream logs={allLogs.slice(0, 10)} githubEvents={githubEvents} />
            </div>

            {/* Right Sidebar */}
            <div>
              <StatsCard
                currentStreak={currentStreak}
                verifiedStreak={profile.verified_streak || 0}
                totalLogs={totalLogs + githubEvents.reduce((sum, e) => sum + e.commits.length, 0)}
                verifiedLogs={verifiedLogs.length + githubEvents.length}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-primary)] py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm font-bold">Proofly</span>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
