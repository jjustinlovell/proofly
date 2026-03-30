import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import ProofMap from '@/components/profile/ProofMap'
import WorkStream from '@/components/profile/WorkStream'
import StatsCard from '@/components/profile/StatsCard'

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

  // Fetch all logs for this user (public: only verified ones via RLS, plus own if logged in)
  const { data: logs } = await supabase
    .from('logs')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  const allLogs = logs || []
  const verifiedLogs = allLogs.filter(l => l.is_verified)
  const totalLogs = allLogs.length

  // Calculate top languages from github_data (simplified)
  const langMap = new Map<string, number>()
  allLogs.forEach(log => {
    if (log.github_data?.repo) {
      const repo = log.github_data.repo as string
      // Use repo name as a proxy for language (simplified for MVP)
      langMap.set(repo, (langMap.get(repo) || 0) + 1)
    }
  })

  const topRepos = Array.from(langMap.entries())
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
                  {totalLogs >= 100 && (
                    <span className="badge badge-gold">🏆 {totalLogs}+ Logs</span>
                  )}
                  {verifiedLogs.length >= 50 && (
                    <span className="badge badge-blue">✓ Core Maintainer</span>
                  )}
                </div>
              </div>
            </div>

            {/* Streak / Score */}
            <div className="flex gap-3">
              <div className="card-static p-4 text-center min-w-[120px]">
                <p className="section-label mb-1">Current Streak</p>
                <p className="text-3xl font-bold">{profile.current_streak}</p>
                <p className="text-xs text-[var(--text-tertiary)] uppercase font-mono">Days</p>
              </div>
              <div className="card-static p-4 text-center min-w-[120px]">
                <p className="section-label mb-1">Trust Score</p>
                <p className="text-3xl font-bold text-[var(--accent-green)]">
                  {totalLogs > 0 ? (Math.round((verifiedLogs.length / totalLogs) * 100 * 10) / 10) : 0}
                </p>
                <p className="text-xs text-[var(--text-tertiary)] uppercase font-mono">Rating</p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_340px] gap-6">
            {/* Main Column */}
            <div className="space-y-8">
              {/* Proof Map */}
              <ProofMap logs={allLogs} />

              {/* Top Languages / Repos */}
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
                              <span className="text-sm font-medium">{repo.split('/').pop()}</span>
                              <span className="text-sm text-[var(--text-secondary)]">{pctg}%</span>
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
                      {profile.best_streak >= 30 ? 'Consistency King' : profile.best_streak >= 14 ? 'Dedicated Dev' : 'Rising Star'}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {profile.best_streak >= 30
                        ? `Earned for maintains a ${profile.best_streak}-day proof streak in major repositories.`
                        : `Keep building to earn achievement badges!`}
                    </p>
                    <a href="#" className="text-sm font-semibold text-[var(--text-primary)] mt-3 flex items-center gap-1 section-label">
                      View All Badges
                    </a>
                  </div>
                </div>
              )}

              {/* Work Stream */}
              <WorkStream logs={allLogs.slice(0, 10)} />
            </div>

            {/* Right Sidebar */}
            <div>
              <StatsCard
                currentStreak={profile.current_streak}
                verifiedStreak={profile.verified_streak}
                totalLogs={totalLogs}
                verifiedLogs={verifiedLogs.length}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-primary)] py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm font-bold">Proofly Ledger</span>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Docs</a>
            <a href="#" className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Support</a>
            <a href="#" className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Privacy</a>
          </div>
          <p className="text-xs text-[var(--text-tertiary)]">© {new Date().getFullYear()} Proofly Ledger</p>
        </div>
      </footer>
    </div>
  )
}
