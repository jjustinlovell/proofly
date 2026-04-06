import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()

    // Exchange the auth code for a session
    const { data: { user, session }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && user && session) {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!existingProfile) {
        // Create profile on first login using GitHub metadata
        const meta = user.user_metadata
        const githubUsername = meta?.user_name || meta?.preferred_username || ''
        const fullName = meta?.full_name || meta?.name || ''
        const avatarUrl = meta?.avatar_url || ''

        // Get the GitHub access token from the session directly
        const githubAccessToken = session.provider_token || ''

        await supabase.from('profiles').insert({
          id: user.id,
          username: githubUsername,
          full_name: fullName,
          avatar_url: avatarUrl,
          github_access_token: githubAccessToken,
          current_streak: 0,
          verified_streak: 0,
          best_streak: 0,
        })
      } else {
        // Update the GitHub access token on every login (it may have changed)
        if (session.provider_token) {
          await supabase
            .from('profiles')
            .update({ github_access_token: session.provider_token })
            .eq('id', user.id)
        }
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin
      
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (process.env.NEXT_PUBLIC_APP_URL) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}${next}`)
      } else if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  const errorAppUrl = process.env.NEXT_PUBLIC_APP_URL || origin
  // Auth error — redirect to landing with error
  return NextResponse.redirect(`${errorAppUrl}/?error=auth_failed`)
}
