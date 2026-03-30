import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HeroProofMap from '@/components/landing/HeroProofMap'
import LoginButton from '@/components/landing/LoginButton'

export default async function LandingPage() {
  // If already authenticated, redirect to dashboard
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 glass-card border-0 border-b border-[var(--border-primary)]" style={{ borderRadius: 0 }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2 text-[var(--text-primary)] font-bold text-lg tracking-tight hover:text-[var(--text-primary)]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              Proofly
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Features</a>
              <a href="#cta" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Get Started</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex items-center py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — Copy */}
            <div className="animate-fade-in">
              {/* System status badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] mb-8">
                <span className="status-dot status-online"></span>
                <span className="text-xs font-mono font-medium text-[var(--text-secondary)] tracking-wider uppercase">System Online: v2.4.0</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-6">
                Bridge the{' '}
                <span className="text-gradient">Trust Gap</span>.
                <br />
                Prove Your Code.
              </h1>

              <p className="text-lg text-[var(--text-secondary)] max-w-lg mb-10 leading-relaxed">
                Proofly automates the verification of your daily technical output, transforming raw commits into an immutable ledger of professional achievement.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <LoginButton />
                <Link href="#features" className="btn btn-secondary btn-lg">
                  View Public Ledger
                </Link>
              </div>
            </div>

            {/* Right — Proof Map + Commit Card */}
            <div className="space-y-6 animate-slide-in-right" style={{ animationDelay: '0.2s', opacity: 0 }}>
              {/* Proof Map Card */}
              <div className="card-static p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="section-label mb-1">Consistency Metric</p>
                    <h3 className="text-xl font-bold">Proof Map</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-[var(--accent-green)]">365</p>
                    <p className="section-label">Day Streak</p>
                  </div>
                </div>
                <HeroProofMap />
              </div>

              {/* Commit Card */}
              <div className="card-static p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="16 18 22 12 16 6" />
                        <polyline points="8 6 2 12 8 18" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Refactor Auth Middleware</p>
                      <p className="text-xs font-mono text-[var(--text-tertiary)]">commit: 7f8a2c1</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill="var(--accent-green)" fillOpacity="0.15" />
                      <path d="M9 12l2 2 4-4" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <span className="badge badge-verified">Passed_Tests</span>
                  <span className="badge badge-blue">Verified_Work</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6 stagger-children">
            {/* Feature 1 */}
            <div className="card-static p-8">
              <div className="w-12 h-12 rounded-lg bg-[var(--accent-green-bg)] flex items-center justify-center mb-5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-3">Daily Proof of Work</h3>
              <p className="text-sm leading-relaxed">
                Every meaningful contribution is cryptographically hashed and logged. Build a transparent history of your coding evolution that goes beyond simple green squares.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card-static p-8 border-t-2 border-t-[var(--accent-green)]">
              <div className="w-12 h-12 rounded-lg bg-[var(--accent-blue-bg)] flex items-center justify-center mb-5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-3">GitHub Verification</h3>
              <p className="text-sm leading-relaxed">
                Direct integration with GitHub Actions ensures that your &apos;Proof&apos; is tied to real, passing code. We verify the complexity and impact of your PRs automatically.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card-static p-8">
              <div className="w-12 h-12 rounded-lg bg-[var(--accent-purple-bg)] flex items-center justify-center mb-5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-3">Auto-Generated Technical CVs</h3>
              <p className="text-sm leading-relaxed">
                Stop writing resumes. Proofly generates a live, data-driven technical portfolio that highlights your strongest languages, tools, and consistency patterns.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="py-20 lg:py-28 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to curate your technical legacy?
          </h2>
          <p className="text-lg text-[var(--text-secondary)] mb-10">
            Join 12,000+ developers documenting their journey from junior to lead.
          </p>
          <LoginButton variant="large" />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-primary)] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">Proofly Ledger</span>
          </div>
          <p className="text-xs text-[var(--text-tertiary)]">© {new Date().getFullYear()} Proofly Ledger</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Docs</a>
            <a href="#" className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Support</a>
            <a href="#" className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Privacy</a>
            <a href="https://github.com" className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">GitHub Status</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
