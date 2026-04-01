import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HeroProofMap from '@/components/landing/HeroProofMap'
import LoginButton from '@/components/landing/LoginButton'
import InteractiveBackground from '@/components/landing/InteractiveBackground'
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
              <img src="/logo.png" alt="Proofly Logo" className="w-6 h-6 rounded-md object-contain" />
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
      <section className="relative flex-1 flex items-center py-20 lg:py-32 overflow-hidden">
        {/* Background Effects */}
        <InteractiveBackground />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — Copy */}
            <div className="animate-fade-in relative z-10">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6 relative">
                Bridge the{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-green)] to-emerald-400">Trust Gap</span>.
                <br />
                Prove Your Code.
              </h1>

              <p className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-lg mb-10 leading-relaxed">
                Proofly automates the verification of your daily technical output, transforming raw commits into an immutable record of professional achievement.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <LoginButton />
              </div>
            </div>

            {/* Right — Proof Map + Commit Card */}
            <div className="space-y-6 animate-slide-in-right relative" style={{ animationDelay: '0.2s', opacity: 0 }}>
              {/* Decorative back-glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[120%] bg-[var(--accent-green)]/5 blur-[100px] rounded-full -z-10 pointer-events-none" />
              
              {/* Proof Map Card */}
              <div className="card-static p-6 border border-[var(--border-primary)] bg-[var(--bg-secondary)]/50 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-green)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div>
                    <p className="section-label mb-1">Consistency Metric</p>
                    <h3 className="text-xl font-bold">Proof Map</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-[var(--accent-green)] drop-shadow-[0_0_15px_rgba(var(--accent-green-rgb),0.3)]">365</p>
                    <p className="section-label">Day Streak</p>
                  </div>
                </div>
                <div className="relative z-10 flex">
                  <HeroProofMap />
                </div>
              </div>

              {/* Commit Card */}
              <div className="card-static p-5 border border-[var(--border-primary)] shadow-xl bg-[var(--bg-primary)] transform hover:-translate-y-1 transition-transform duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-primary)] shadow-inner flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="16 18 22 12 16 6" />
                        <polyline points="8 6 2 12 8 18" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-[var(--text-primary)]">Refactor Auth Middleware</p>
                      <p className="text-sm font-mono text-[var(--text-tertiary)] mt-0.5">commit: 7f8a2c1</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--accent-green)]/10">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17l-5-5" stroke="var(--accent-green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <span className="badge badge-verified border-[var(--accent-green)]/30 shadow-sm bg-[var(--bg-secondary)]">Passed_Tests</span>
                  <span className="badge badge-blue border-[var(--accent-blue)]/30 shadow-sm bg-[var(--bg-secondary)]">Verified_Work</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 lg:py-32 overflow-hidden bg-[var(--bg-secondary)]/30 border-y border-[var(--border-primary)]/50">
        {/* Subtle decorative grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none -z-10" />
        
        {/* Ambient glows matching feature card colors */}
        <div className="absolute top-1/2 left-[10%] -translate-y-1/2 w-[400px] h-[400px] bg-[var(--accent-green)]/10 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[var(--accent-blue)]/10 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-1/2 right-[10%] -translate-y-1/2 w-[400px] h-[400px] bg-[var(--accent-purple)]/10 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                Every meaningful contribution is hashed and logged. Build a transparent history of your coding evolution that goes beyond simple green squares.
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
      <section id="cta" className="relative py-24 lg:py-32 text-center overflow-hidden border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
        {/* Green Aurora from Bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-[600px] bg-gradient-to-t from-[var(--accent-green)]/20 via-[var(--accent-green)]/5 to-transparent blur-3xl pointer-events-none -z-10" />
        {/* Decorative CTA Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_100%,#000_70%,transparent_100%)] pointer-events-none -z-10" />
        
        <div className="relative z-10 max-w-3xl mx-auto px-4">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight">
            Ready to curate your <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-green)] to-emerald-400">technical legacy?</span>
          </h2>
          <div className="flex justify-center">
            <LoginButton variant="large" />
          </div>
        </div>
      </section>

    </div>
  )
}
