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

interface WorkStreamProps {
  logs: Log[]
}

export default function WorkStream({ logs }: WorkStreamProps) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[var(--text-tertiary)] text-sm">No verified work logs yet.</p>
      </div>
    )
  }

  const formatTimeAgo = (dateStr: string) => {
    const now = new Date()
    const date = new Date(dateStr)
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours} hours ago`
    if (days === 1) return 'Yesterday'
    return `${days} days ago`
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="12 8 12 12 14 14" />
          <circle cx="12" cy="12" r="10" />
        </svg>
        <h3 className="text-lg font-bold">Verified Work Stream</h3>
      </div>

      <div className="timeline">
        {logs.map((log) => {
          const lines = log.content.split('\n').filter(l => l.trim())
          const title = lines[0]?.replace(/^#+\s*/, '').replace(/^-\s*/, '').trim() || 'Untitled'
          const body = lines.slice(1).filter(l => l.trim())

          return (
            <div key={log.id} className="timeline-item">
              <div className={`timeline-dot ${log.is_verified ? 'verified' : ''}`} />

              <div className="card-static p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="badge badge-manual text-[10px]">
                    {formatTimeAgo(log.created_at).toUpperCase()}
                  </span>
                  {log.is_verified && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill="var(--accent-green)" fillOpacity="0.15" />
                      <path d="M9 12l2 2 4-4" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>

                <h4 className="font-bold mb-2">{title}</h4>

                {body.length > 0 && (
                  <div className="text-sm text-[var(--text-secondary)] font-mono leading-7 mb-3">
                    {body.slice(0, 3).map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                )}

                {log.github_data?.repo && (
                  <div className="flex items-center gap-3 mt-3 text-xs font-mono text-[var(--text-tertiary)]">
                    <span className="flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      </svg>
                      {log.github_data.repo}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="4" />
                        <line x1="1.05" y1="12" x2="7" y2="12" />
                        <line x1="17.01" y1="12" x2="22.96" y2="12" />
                      </svg>
                      sha:{log.github_data.commit_sha?.slice(0, 7)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
