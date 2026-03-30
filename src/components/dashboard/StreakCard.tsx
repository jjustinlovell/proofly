interface StreakCardProps {
  currentStreak: number
  verifiedStreak: number
  bestStreak: number
}

export default function StreakCard({ currentStreak, verifiedStreak, bestStreak }: StreakCardProps) {
  const nextMilestone = currentStreak < 7 ? 7 : currentStreak < 14 ? 14 : currentStreak < 30 ? 30 : currentStreak < 60 ? 60 : 90
  const progress = Math.min((currentStreak / nextMilestone) * 100, 100)
  const remaining = Math.max(nextMilestone - currentStreak, 0)

  const milestoneBadge = nextMilestone <= 7 ? 'Bronze' : nextMilestone <= 14 ? 'Silver' : nextMilestone <= 30 ? 'Iron Coder' : nextMilestone <= 60 ? 'Gold' : 'Diamond'

  return (
    <div className="space-y-4">
      {/* Verified Proof Card */}
      <div className="card-static p-5 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-3 right-3 opacity-10">
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="1.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="var(--accent-green)" fillOpacity="0.15" />
            <path d="M9 12l2 2 4-4" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="section-label text-[var(--accent-green)]">Elite Tier Status</span>
        </div>

        <h3 className="text-xl font-bold mb-2">Verified Proof</h3>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Your work logs are currently being anchored to the Proofly Ledger every 6 hours via GitHub Actions.
        </p>

        <a href="#" className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent-green)] transition-colors flex items-center gap-1">
          View Ledger Explorer
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </a>
      </div>

      {/* Next Milestone Card */}
      <div className="card-static p-5">
        <p className="section-label mb-3">Next Milestone</p>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--accent-yellow-bg)] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-yellow)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="7" />
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-bold">{nextMilestone} Day Streak</p>
            <p className="text-xs text-[var(--text-secondary)]">
              {remaining} remaining until you unlock the &apos;{milestoneBadge}&apos; badge.
            </p>
          </div>
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, var(--accent-green), var(--accent-blue))',
            }}
          />
        </div>
      </div>
    </div>
  )
}
