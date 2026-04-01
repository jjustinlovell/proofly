import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { fetchGitHubEvents, fetchGitHubTopLanguages } from '@/lib/github'
import CVGeneratorClient from './CVGeneratorClient'

export default async function CVGeneratorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, full_name, avatar_url, current_streak, verified_streak, best_streak, github_access_token')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/dashboard')

  // Fetch all database logs
  const { data: logs } = await supabase
    .from('logs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch real GitHub data
  let githubEvents: Awaited<ReturnType<typeof fetchGitHubEvents>> = []
  let topLanguages: { language: string; size: number }[] = []
  if (profile?.github_access_token && profile?.username) {
    try {
      githubEvents = await fetchGitHubEvents(profile.github_access_token, profile.username)
      topLanguages = await fetchGitHubTopLanguages(profile.github_access_token, profile.username)
    } catch (e) {
      console.error('Failed to fetch github data', e)
    }
  }

  // Convert GitHub events to internal Log format
  const githubLogs = githubEvents.flatMap(event => 
    event.commits.map((commit, i) => {
      // Offset timestamp slightly for multiple commits so sorting is deterministic
      const commitDate = new Date(event.created_at)
      commitDate.setSeconds(commitDate.getSeconds() + i)
      
      return {
        id: commit.sha,
        content: `[GitHub] ${commit.message}`,
        is_verified: true,
        github_data: {
          repo: event.repo,
          commit_sha: commit.sha,
          commit_message: commit.message
        },
        created_at: commitDate.toISOString()
      }
    })
  )

  const allLogs = [...(logs || []), ...githubLogs].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <CVGeneratorClient
      profile={profile}
      initialLogs={allLogs}
      topLanguages={topLanguages}
    />
  )
}
