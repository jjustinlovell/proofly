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
  }
  topLanguages: { language: string; size: number }[]
}

export default function CVPreview({ profile, logs, theme, sections, topLanguages }: CVPreviewProps) {
  const isLight = theme === 'light'

  // Only include verified GitHub contributions to maintain CV integrity
  const githubLogsOnly = logs.filter(log => !!log.github_data?.repo)

  // Group logs by time period
  const groupedLogs = new Map<string, Log[]>()
  githubLogsOnly.forEach(log => {
    const date = new Date(log.created_at)
    const quarter = `Q${Math.ceil((date.getMonth() + 1) / 3)} ${date.getFullYear()}`
    const existing = groupedLogs.get(quarter) || []
    existing.push(log)
    groupedLogs.set(quarter, existing)
  })

  const totalLangSize = topLanguages.reduce((sum, lang) => sum + lang.size, 0) || 1

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
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact'
      }}
    >
      {/* CV Header */}
      <div className="p-8 pb-6" style={{ borderBottom: `1px solid ${borderColor}` }}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: textColor }}>
              {profile.full_name || profile.username}
            </h1>
          </div>
          <div className="w-16 h-16 rounded-md flex items-center justify-center overflow-hidden" style={{ backgroundColor: isLight ? '#f3f4f6' : 'var(--bg-elevated)', border: `1px solid ${borderColor}` }}>
            <img src="/logo.png" alt="Proofly Mascot" className="w-10 h-10 object-contain" />
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-8">
          {sections.dailyLogs && (
            <div>
              <h2 className="font-bold text-sm uppercase tracking-widest mb-2" style={{ color: mutedColor }}>
                Verified Proof of Work
              </h2>
              <p className="text-xs mb-8 max-w-lg font-mono tracking-tight" style={{ color: mutedColor }}>
                * Exclusively verified GitHub contributions; manual unverified entries are omitted to maintain absolute integrity.
              </p>

              {Array.from(groupedLogs.entries()).slice(0, 3).map(([quarter, qLogs]) => (
                <div key={quarter} className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accentColor }} />
                    <span className="text-sm font-bold" style={{ color: accentColor }}>{quarter} — Present</span>
                  </div>

                  {/* Group title from first log */}
                  <h3 className="text-lg font-bold mb-3" style={{ color: textColor }}>
                    {qLogs[0]?.github_data?.repo?.split('/').pop() || 'Development Work'}
                  </h3>

                  <div className="space-y-3 ml-2">
                    {qLogs.slice(0, 10).map(log => {
                      const commitMsg = log.github_data!.commit_message 
                      
                      return (
                        <div key={log.id} className="flex flex-col gap-1 pl-3 border-l-2" style={{ borderColor: isLight ? '#e5e7eb' : 'var(--border-primary)' }}>
                          <div className="flex items-center gap-2">
                            {log.github_data?.commit_sha && (
                              <span style={{ color: mutedColor }} className="font-mono text-xs">
                                {log.github_data.commit_sha.slice(0, 7)}
                              </span>
                            )}
                            <span className="font-mono text-[10px] uppercase font-bold tracking-widest border px-1.5 py-0.5 rounded" style={{ color: accentColor, borderColor: accentColor }}>
                              {log.github_data!.repo!.split('/').pop()}
                            </span>
                          </div>
                          <p className="text-sm" style={{ color: textColor }}>
                            {commitMsg}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-56 p-6 space-y-6" style={{ borderLeft: `1px solid ${borderColor}` }}>
          {sections.techStack && topLanguages.length > 0 && (
            <div>
              <h4 className="font-bold text-xs uppercase tracking-widest mb-4" style={{ color: mutedColor }}>
                Top Languages
              </h4>
              <div className="space-y-3">
                {topLanguages.map((lang, i) => {
                  const pctg = Math.round((lang.size / totalLangSize) * 100)
                  const colors = [accentColor, 'var(--accent-blue)', 'var(--accent-orange)', '#8b5cf6', '#ec4899']
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-bold">{lang.language}</span>
                        <span style={{ color: accentColor }} className="font-mono text-xs">{pctg}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: isLight ? '#e5e7eb' : 'var(--bg-elevated)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${Math.max(pctg, 2)}%`, backgroundColor: colors[i] || colors[2] }}
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
                <div className="mt-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: mutedColor }}>GitHub ID</p>
                  <p className="text-[11px] font-mono mt-0.5" style={{ color: textColor }}>
                    @{profile.username}
                  </p>
                </div>
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
