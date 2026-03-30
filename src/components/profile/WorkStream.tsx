import type { GitHubCommitEvent } from '@/lib/github'

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
  githubEvents: GitHubCommitEvent[]
}

type StreamItem =
  | { type: 'log'; data: Log }
  | { type: 'github'; data: GitHubCommitEvent }

export default function WorkStream({ logs, githubEvents }: WorkStreamProps) {
  // Merge and sort by date
  const items: StreamItem[] = [
    ...logs.map(log => ({ type: 'log' as const, data: log })),
    ...githubEvents.map(event => ({ type: 'github' as const, data: event })),
  ].sort((a, b) => new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime())

  if (items.length === 0) {
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
        {items.slice(0, 20).map((item) => {
          if (item.type === 'github') {
            const event = item.data
            const repoName = event.repo.split('/').pop() || event.repo
            return (
              <div key={`gh-${event.id}`} className="timeline-item">
                <div className="timeline-dot verified" />
                <div className="card-static p-5 border-l-2 border-l-[var(--accent-green)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="badge badge-manual text-[10px]">
                      {formatTimeAgo(event.created_at).toUpperCase()}
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--accent-green)] bg-[var(--accent-green-bg)] px-2 py-0.5 rounded-full">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                      GitHub
                    </span>
                  </div>

                  <h4 className="font-bold mb-2 flex items-center gap-2">
                    <span>{repoName}</span>
                    <span className="text-xs text-[var(--text-tertiary)] font-normal">
                      {event.commits.length} commit{event.commits.length !== 1 ? 's' : ''}
                    </span>
                  </h4>

                  <div className="space-y-1.5">
                    {event.commits.slice(0, 4).map((commit, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <code className="text-[var(--accent-green)] font-mono text-xs flex-shrink-0 mt-0.5">
                          {commit.sha.slice(0, 7)}
                        </code>
                        <span className="text-[var(--text-secondary)]">{commit.message.split('\n')[0]}</span>
                      </div>
                    ))}
                    {event.commits.length > 4 && (
                      <p className="text-xs text-[var(--text-tertiary)] font-mono">
                        +{event.commits.length - 4} more commits
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          }

          // Manual log
          const log = item.data
          const lines = log.content.split('\n').filter(l => l.trim())
          const title = lines[0]?.replace(/^#+\s*/, '').replace(/^-\s*/, '').trim() || 'Untitled'
          const body = lines.slice(1).filter(l => l.trim())

          return (
            <div key={`log-${log.id}`} className="timeline-item">
              <div className={`timeline-dot ${log.is_verified ? 'verified' : ''}`} />
              <div className="card-static p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="badge badge-manual text-[10px]">
                    {formatTimeAgo(log.created_at).toUpperCase()}
                  </span>
                  {log.is_verified ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill="var(--accent-green)" fillOpacity="0.15" />
                      <path d="M9 12l2 2 4-4" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <span className="text-[10px] font-mono text-[var(--text-tertiary)]">MANUAL</span>
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
                    {log.github_data.commit_sha && (
                      <span className="flex items-center gap-1">
                        sha:{log.github_data.commit_sha.slice(0, 7)}
                      </span>
                    )}
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
