interface Log {
  id: string
  content: string
  is_verified: boolean
  github_data: {
    repo?: string
    commit_sha?: string
    commit_message?: string
  } | null
  created_at: string
}

interface CVPreviewProps {
  profile: {
    username: string
    full_name: string
    avatar_url: string
    current_streak: number
    verified_streak: number
    best_streak: number
  }
  logs: Log[]
  theme: 'light' | 'dark'
  sections: {
    dailyLogs: boolean
    githubContributions: boolean
    techStack: boolean
    publicProfileQR: boolean
  }
}

export default function CVPreview({ profile, logs, theme, sections }: CVPreviewProps) {
  const isLight = theme === 'light'

  // Group logs by time period
  const groupedLogs = new Map<string, Log[]>()
  logs.forEach(log => {
    const date = new Date(log.created_at)
    const quarter = `Q${Math.ceil((date.getMonth() + 1) / 3)} ${date.getFullYear()}`
    const existing = groupedLogs.get(quarter) || []
    existing.push(log)
    groupedLogs.set(quarter, existing)
  })

  // Extract top repos
  const repoCounter = new Map<string, number>()
  logs.forEach(log => {
    if (log.github_data?.repo) {
      const repo = log.github_data.repo.split('/').pop() || log.github_data.repo
      repoCounter.set(repo, (repoCounter.get(repo) || 0) + 1)
    }
  })
  const topRepos = Array.from(repoCounter.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
  const totalRepoActivity = topRepos.reduce((sum, [, count]) => sum + count, 0) || 1

  const bgColor = isLight ? 'white' : 'var(--bg-secondary)'
  const textColor = isLight ? '#1a1a2e' : 'var(--text-primary)'
  const mutedColor = isLight ? '#6b7280' : 'var(--text-secondary)'
  const borderColor = isLight ? '#e5e7eb' : 'var(--border-primary)'
  const accentColor = isLight ? '#059669' : 'var(--accent-green)'

  return (
    <div
      className="rounded-lg overflow-hidden print:rounded-none print:shadow-none"
      style={{
        backgroundColor: bgColor,
        color: textColor,
        border: `1px solid ${borderColor}`,
        boxShadow: isLight ? '0 4px 24px rgba(0,0,0,0.1)' : 'var(--shadow-lg)',
      }}
    >
      {/* CV Header */}
      <div className="p-8 pb-6" style={{ borderBottom: `1px solid ${borderColor}` }}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: textColor }}>
              {profile.full_name || profile.username}
            </h1>
            <p className="text-lg mt-1" style={{ color: accentColor }}>
              Full-stack Engineer & Technical Architect
            </p>
          </div>
          {sections.publicProfileQR && (
            <div className="w-16 h-16 rounded-md flex items-center justify-center" style={{ backgroundColor: isLight ? '#f3f4f6' : 'var(--bg-elevated)' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={mutedColor} strokeWidth="1">
                <rect x="2" y="2" width="8" height="8" rx="1" />
                <rect x="14" y="2" width="8" height="8" rx="1" />
                <rect x="2" y="14" width="8" height="8" rx="1" />
                <rect x="14" y="14" width="4" height="4" rx="0.5" />
                <rect x="18" y="18" width="4" height="4" rx="0.5" />
                <rect x="14" y="18" width="4" height="4" rx="0.5" />
              </svg>
            </div>
          )}
        </div>
      </div>

      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-8">
          {sections.dailyLogs && (
            <div>
              <h2 className="font-bold text-sm uppercase tracking-widest mb-6" style={{ color: mutedColor }}>
                Verified Proof of Work
              </h2>

              {Array.from(groupedLogs.entries()).slice(0, 3).map(([quarter, qLogs]) => (
                <div key={quarter} className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accentColor }} />
                    <span className="text-sm font-bold" style={{ color: accentColor }}>{quarter} — Present</span>
                  </div>

                  {/* Group title from first log */}
                  <h3 className="text-lg font-bold mb-3" style={{ color: textColor }}>
                    {qLogs[0]?.content.split('\n')[0]?.replace(/^#+\s*/, '').replace(/^-\s*/, '').trim() || 'Development Work'}
                  </h3>

                  <ul className="space-y-2 ml-4">
                    {qLogs.slice(0, 4).map(log => {
                      const lines = log.content.split('\n').filter(l => l.trim())
                      const bullets = lines.slice(0, 2)
                      return bullets.map((line, i) => (
                        <li key={`${log.id}-${i}`} className="text-sm flex items-start gap-2">
                          <span style={{ color: mutedColor }}>•</span>
                          <span style={{ color: mutedColor }}>
                            {line.replace(/^[-*]\s*/, '')}
                          </span>
                        </li>
                      ))
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-56 p-6 space-y-6" style={{ borderLeft: `1px solid ${borderColor}` }}>
          {sections.techStack && topRepos.length > 0 && (
            <div>
              <h4 className="font-bold text-xs uppercase tracking-widest mb-4" style={{ color: mutedColor }}>
                Top Languages
              </h4>
              <div className="space-y-3">
                {topRepos.map(([repo, count], i) => {
                  const pctg = Math.round((count / totalRepoActivity) * 100)
                  const colors = [accentColor, 'var(--accent-blue)', 'var(--accent-orange)']
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{repo}</span>
                        <span style={{ color: accentColor }}>{pctg}%</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ backgroundColor: isLight ? '#e5e7eb' : 'var(--bg-elevated)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pctg}%`, backgroundColor: colors[i] || colors[2] }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {sections.githubContributions && (
            <div>
              <h4 className="font-bold text-xs uppercase tracking-widest mb-3" style={{ color: mutedColor }}>
                Credentials
              </h4>
              <div className="p-3 rounded-lg" style={{ backgroundColor: isLight ? '#f0fdf4' : 'var(--accent-green-bg)', border: `1px solid ${isLight ? '#bbf7d0' : 'rgba(74, 222, 128, 0.2)'}` }}>
                <div className="flex items-center gap-2 mb-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill={accentColor} fillOpacity="0.2" />
                    <path d="M9 12l2 2 4-4" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-xs font-bold" style={{ color: accentColor }}>Proofly Verified</span>
                </div>
                <p className="text-[10px] font-mono" style={{ color: mutedColor }}>
                  Ledger ID: {profile.username?.slice(0, 4)}-{Math.random().toString(36).slice(2, 6)}-{Math.random().toString(36).slice(2, 6)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-8 py-4 flex justify-between text-xs font-mono" style={{ color: mutedColor, borderTop: `1px solid ${borderColor}` }}>
        <span>Generated via Proofly.io</span>
        <span>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
      </div>
    </div>
  )
}
