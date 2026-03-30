import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fetchGitHubContributions, fetchGitHubEvents, calculateGitHubStreak } from '@/lib/github'
import LogEditor from '@/components/dashboard/LogEditor'
import ActivityFeed from '@/components/dashboard/ActivityFeed'
import ActivityMatrix from '@/components/dashboard/ActivityMatrix'
import StreakCard from '@/components/dashboard/StreakCard'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch recent logs
  const { data: logs } = await supabase
    .from('logs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  // Fetch all logs for heatmap fallback
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const { data: heatmapLogs } = await supabase
    .from('logs')
    .select('created_at, is_verified')
    .eq('user_id', user.id)
    .gte('created_at', ninetyDaysAgo.toISOString())

  // Fetch real GitHub data
  let githubData = null
  let githubEvents: Awaited<ReturnType<typeof fetchGitHubEvents>> = []
  let streakData = { current: 0, best: 0 }

  if (profile?.github_access_token && profile?.username) {
    const [contributions, events] = await Promise.all([
      fetchGitHubContributions(profile.github_access_token, profile.username),
      fetchGitHubEvents(profile.github_access_token, profile.username),
    ])
    githubData = contributions
    githubEvents = events
    streakData = calculateGitHubStreak(contributions)
  }

  // Use GitHub streak if available, otherwise fall back to profile streak
  const currentStreak = streakData.current || profile?.current_streak || 0
  const bestStreak = streakData.best || profile?.best_streak || 0

  return (
    <div className="p-6 lg:p-8 w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Daily Standup</h1>
        <p className="text-[var(--text-secondary)]">
          Log your progress and maintain your verified proof of work.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        {/* Main Column */}
        <div className="space-y-8">
          {/* Log Editor */}
          <LogEditor />

          {/* Activity Feed — merged Proofly logs + GitHub commits */}
          <div>
            <p className="section-label mb-4">Archive / Recent Activity</p>
            <ActivityFeed logs={logs || []} githubEvents={githubEvents} />
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Activity Matrix — real GitHub data */}
          <ActivityMatrix githubData={githubData} logs={heatmapLogs || []} />

          {/* Streak Cards — powered by GitHub contributions */}
          <StreakCard
            currentStreak={currentStreak}
            verifiedStreak={profile?.verified_streak ?? 0}
            bestStreak={bestStreak}
          />
        </div>
      </div>
    </div>
  )
}
