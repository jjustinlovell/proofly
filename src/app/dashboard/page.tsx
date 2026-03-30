import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
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

  // Fetch all logs for heatmap (last 90 days)
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const { data: heatmapLogs } = await supabase
    .from('logs')
    .select('created_at, is_verified')
    .eq('user_id', user.id)
    .gte('created_at', ninetyDaysAgo.toISOString())

  return (
    <div className="p-6 lg:p-8 w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Daily Standup</h1>
        <p className="text-[var(--text-secondary)]">
          Log your progress and maintain your cryptographic proof of work.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Main Column */}
        <div className="space-y-8">
          {/* Log Editor */}
          <LogEditor />

          {/* Activity Feed */}
          <div>
            <p className="section-label mb-4">Archive / Recent Activity</p>
            <ActivityFeed logs={logs || []} />
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Activity Matrix */}
          <ActivityMatrix logs={heatmapLogs || []} />

          {/* Streak Cards */}
          <StreakCard
            currentStreak={profile?.current_streak ?? 0}
            verifiedStreak={profile?.verified_streak ?? 0}
            bestStreak={profile?.best_streak ?? 0}
          />
        </div>
      </div>
    </div>
  )
}
