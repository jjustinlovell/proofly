interface StatsCardProps {
  currentStreak: number
  verifiedStreak: number
  totalLogs: number
  verifiedLogs: number
}

export default function StatsCard({ currentStreak, verifiedStreak, totalLogs, verifiedLogs }: StatsCardProps) {
  // Calculate trust score (percentage of verified logs)
  const trustScore = totalLogs > 0
    ? Math.round((verifiedLogs / totalLogs) * 100 * 10) / 10
    : 0

  return (
    <div className="space-y-4">
      {/* Streak & Trust Score */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card-static p-4 text-center">
          <p className="section-label mb-1">Current Streak</p>
          <p className="text-3xl font-bold">{currentStreak}</p>
          <p className="text-xs text-[var(--text-tertiary)] uppercase font-mono">Days</p>
        </div>
        <div className="card-static p-4 text-center">
          <p className="section-label mb-1">Trust Score</p>
          <p className="text-3xl font-bold text-[var(--accent-green)]">{trustScore}</p>
          <p className="text-xs text-[var(--text-tertiary)] uppercase font-mono">Rating</p>
        </div>
      </div>

      {/* Verified Ledger */}
      <div className="card-static p-5 relative overflow-hidden">
        <div className="absolute top-3 right-3 opacity-10">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="1.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>

        <h3 className="text-lg font-bold mb-2">Verified Ledger</h3>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          This profile is cryptographically linked to verified work history on Proofly Ledger.
        </p>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="section-label">Validated Hours</span>
            <span className="font-bold">{Math.round(totalLogs * 2.5)}h</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="section-label">Avg Daily Output</span>
            <span className="font-bold">{currentStreak > 0 ? (totalLogs / currentStreak).toFixed(1) : '0'} Units</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="section-label">Network Rank</span>
            <span className="font-bold text-[var(--accent-green)]">
              {trustScore >= 90 ? 'TOP 1%' : trustScore >= 70 ? 'TOP 5%' : trustScore >= 50 ? 'TOP 10%' : 'TOP 25%'}
            </span>
          </div>
        </div>

        <button className="btn btn-secondary w-full mt-4 font-mono tracking-wider text-xs">
          Download Verified CV
        </button>
      </div>

      {/* Ecosystem Links */}
      <div className="card-static p-5">
        <div className="flex items-center gap-2 mb-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          <h3 className="text-sm font-bold">Ecosystem</h3>
        </div>

        <div className="space-y-3">
          <a href="#" className="flex items-center justify-between p-2 rounded-md hover:bg-[var(--bg-elevated)] transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-[var(--bg-elevated)] flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--text-secondary)">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">GitHub</p>
                <p className="text-xs text-[var(--text-tertiary)]">Connected</p>
              </div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  )
}
