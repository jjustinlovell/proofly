'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createLog(content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('logs')
    .insert({
      user_id: user.id,
      content,
      is_verified: false,
      github_data: null,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  // Trigger GitHub sync after creating a log
  try {
    await syncGitHubActivity(user.id)
  } catch {
    // Non-blocking: sync failure shouldn't prevent log creation
  }

  // Recalculate streaks
  try {
    await recalculateStreaks(user.id)
  } catch {
    // Non-blocking
  }

  revalidatePath('/dashboard')
  return { success: true, data }
}

export async function deleteLog(logId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('logs')
    .delete()
    .eq('id', logId)
    .eq('user_id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

async function syncGitHubActivity(userId: string) {
  const supabase = await createClient()

  // Get the user's GitHub access token
  const { data: profile } = await supabase
    .from('profiles')
    .select('github_access_token, username')
    .eq('id', userId)
    .single()

  if (!profile?.github_access_token) return

  // Fetch today's GitHub events
  const today = new Date().toISOString().split('T')[0]

  try {
    const response = await fetch(
      `https://api.github.com/users/${profile.username}/events?per_page=100`,
      {
        headers: {
          Authorization: `Bearer ${profile.github_access_token}`,
          Accept: 'application/vnd.github.v3+json',
        },
        next: { revalidate: 0 },
      }
    )

    if (!response.ok) return

    const events = await response.json()

    // Filter to today's push events
    const todayEvents = events.filter((event: { type: string; created_at: string }) => {
      const eventDate = new Date(event.created_at).toISOString().split('T')[0]
      return eventDate === today && event.type === 'PushEvent'
    })

    if (todayEvents.length > 0) {
      const firstEvent = todayEvents[0]
      const payload = firstEvent.payload as { commits?: { sha: string; message: string }[] }
      const commits = payload?.commits || []
      const latestCommit = commits[commits.length - 1]

      // Update today's unverified logs to verified
      const startOfDay = new Date(today + 'T00:00:00Z').toISOString()
      const endOfDay = new Date(today + 'T23:59:59Z').toISOString()

      await supabase
        .from('logs')
        .update({
          is_verified: true,
          github_data: {
            repo: firstEvent.repo?.name,
            commit_sha: latestCommit?.sha,
            commit_message: latestCommit?.message,
          },
        })
        .eq('user_id', userId)
        .eq('is_verified', false)
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay)
    }
  } catch {
    // Silently fail — GitHub API issues shouldn't break the app
  }
}

async function recalculateStreaks(userId: string) {
  const supabase = await createClient()

  // Fetch all logs for streak calculation, ordered by date
  const { data: logs } = await supabase
    .from('logs')
    .select('created_at, is_verified')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (!logs || logs.length === 0) return

  // Group logs by date
  const logDates = new Set<string>()
  const verifiedDates = new Set<string>()

  logs.forEach(log => {
    const date = new Date(log.created_at).toISOString().split('T')[0]
    logDates.add(date)
    if (log.is_verified) verifiedDates.add(date)
  })

  // Calculate current streak (consecutive days with any log)
  let currentStreak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today)
    checkDate.setDate(checkDate.getDate() - i)
    const dateStr = checkDate.toISOString().split('T')[0]
    if (logDates.has(dateStr)) {
      currentStreak++
    } else if (i === 0) {
      // Today doesn't have a log yet — that's okay, check yesterday
      continue
    } else {
      break
    }
  }

  // Calculate verified streak
  let verifiedStreak = 0
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today)
    checkDate.setDate(checkDate.getDate() - i)
    const dateStr = checkDate.toISOString().split('T')[0]
    if (verifiedDates.has(dateStr)) {
      verifiedStreak++
    } else if (i === 0) {
      continue
    } else {
      break
    }
  }

  // Get current best streak
  const { data: profile } = await supabase
    .from('profiles')
    .select('best_streak')
    .eq('id', userId)
    .single()

  const bestStreak = Math.max(profile?.best_streak || 0, currentStreak)

  // Update profile
  await supabase
    .from('profiles')
    .update({
      current_streak: currentStreak,
      verified_streak: verifiedStreak,
      best_streak: bestStreak,
    })
    .eq('id', userId)
}
