import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fetchGitHubEvents } from '@/lib/github'
import ActivityFeed from '@/components/dashboard/ActivityFeed'

export default async function LogsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch all logs
  const { data: logs } = await supabase
    .from('logs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  // Fetch real GitHub events
  let githubEvents: Awaited<ReturnType<typeof fetchGitHubEvents>> = []

  if (profile?.github_access_token && profile?.username) {
    const events = await fetchGitHubEvents(profile.github_access_token, profile.username)
    githubEvents = events
  }

  return (
    <div className="p-6 lg:p-8 w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Work Logs</h1>
        <p className="text-[var(--text-secondary)]">
          Your combined history of Proofly standups and GitHub commits.
        </p>
      </div>

      <div className="card-static p-6">
        <ActivityFeed logs={logs || []} githubEvents={githubEvents} />
      </div>
    </div>
  )
}
