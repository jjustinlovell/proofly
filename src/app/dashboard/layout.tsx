import Navbar from '@/components/Navbar'
import Sidebar from '@/components/dashboard/Sidebar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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
    .select('current_streak, verified_streak, github_access_token')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentStreak={profile?.current_streak ?? 0}
          verifiedStreak={profile?.verified_streak ?? 0}
          githubConnected={!!profile?.github_access_token}
        />
        <main className="flex-1 overflow-y-auto bg-[var(--bg-primary)]">
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-[var(--border-primary)] py-4 bg-[var(--bg-secondary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <span className="text-xs font-bold text-[var(--text-secondary)]">Proofly Ledger</span>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">Docs</a>
            <a href="#" className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">Support</a>
            <a href="#" className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">Privacy</a>
            <a href="#" className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">GitHub Status</a>
          </div>
          <span className="text-xs text-[var(--text-tertiary)]">© {new Date().getFullYear()} Proofly Ledger</span>
        </div>
      </footer>
    </div>
  )
}
