import Navbar from '@/components/Navbar'
import Sidebar from '@/components/dashboard/Sidebar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fetchGitHubContributions, calculateGitHubStreak } from '@/lib/github'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  // Fetch profile for sidebar data
  const { data: profile } = await supabase
    .from('profiles')
    .select('current_streak, verified_streak, github_access_token, username')
    .eq('id', user.id)
    .single()

  // Get GitHub-based streak for sidebar
  let githubStreak = 0
  if (profile?.github_access_token && profile?.username) {
    const contributions = await fetchGitHubContributions(
      profile.github_access_token,
      profile.username
    )
    const streakData = calculateGitHubStreak(contributions)
    githubStreak = streakData.current
  }

  const currentStreak = githubStreak || profile?.current_streak || 0

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentStreak={currentStreak}
          verifiedStreak={profile?.verified_streak ?? 0}
          githubConnected={!!profile?.github_access_token}
        />
        <main className="flex-1 overflow-y-auto bg-[var(--bg-primary)]">
          {children}
        </main>
      </div>

    </div>
  )
}
