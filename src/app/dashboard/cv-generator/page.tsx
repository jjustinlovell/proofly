import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CVGeneratorClient from './CVGeneratorClient'

export default async function CVGeneratorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, full_name, avatar_url, current_streak, verified_streak, best_streak')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/dashboard')

  // Fetch all logs
  const { data: logs } = await supabase
    .from('logs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <CVGeneratorClient
      profile={profile}
      initialLogs={logs || []}
    />
  )
}
