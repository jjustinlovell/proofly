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

interface ActivityFeedProps {
  logs: Log[]
}

export default function ActivityFeed({ logs }: ActivityFeedProps) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
        <p className="text-[var(--text-secondary)] text-sm">No logs yet. Start your first daily standup!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => {
        const date = new Date(log.created_at)
        const formattedDate = date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
        const formattedTime = date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })

        // Extract a title from the first line of content
        const lines = log.content.split('\n').filter(l => l.trim())
        const title = lines[0]?.replace(/^#+\s*/, '').replace(/^-\s*/, '').trim() || 'Untitled Log'
        const body = lines.slice(1).filter(l => l.trim())

        return (
          <article key={log.id} className="card-static p-5 animate-fade-in">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-mono text-[var(--accent-blue)] mb-1">
                  {formattedDate} • {formattedTime}
                </p>
                <h4 className="text-base font-bold">{title}</h4>
              </div>
              {log.is_verified ? (
                <span className="badge badge-verified">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  Verified
                </span>
              ) : (
                <span className="badge badge-manual">Manual Log</span>
              )}
            </div>

            {body.length > 0 && (
              <div className="text-sm text-[var(--text-secondary)] font-mono leading-7 mb-3">
                {body.slice(0, 4).map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            )}

            {log.github_data?.repo && (
              <div className="commit-block">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" />
                  <line x1="1.05" y1="12" x2="7" y2="12" />
                  <line x1="17.01" y1="12" x2="22.96" y2="12" />
                </svg>
                <span className="text-[var(--text-secondary)]">{log.github_data.repo}</span>
                <span className="text-[var(--text-tertiary)]">/</span>
                <span className="text-xs">commit: </span>
                <span className="commit-sha">{log.github_data.commit_sha?.slice(0, 7) || 'N/A'}</span>
                {log.github_data.commit_message && (
                  <>
                    <span className="text-[var(--text-tertiary)] mx-1">&quot;</span>
                    <span className="commit-message truncate max-w-[200px]">{log.github_data.commit_message}</span>
                    <span className="text-[var(--text-tertiary)]">&quot;</span>
                  </>
                )}
              </div>
            )}
          </article>
        )
      })}
    </div>
  )
}
