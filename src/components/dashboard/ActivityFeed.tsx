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

interface ActivityFeedProps {
  logs: Log[]
  githubEvents: GitHubCommitEvent[]
}

type FeedItem =
  | { type: 'log'; data: Log }
  | { type: 'github'; data: GitHubCommitEvent }

export default function ActivityFeed({ logs, githubEvents }: ActivityFeedProps) {
  // Merge logs and GitHub events into a single sorted feed
  const feedItems: FeedItem[] = [
    ...logs.map(log => ({ type: 'log' as const, data: log })),
    ...githubEvents.map(event => ({ type: 'github' as const, data: event })),
  ].sort((a, b) => new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime())

  if (feedItems.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
        <p className="text-[var(--text-secondary)] text-sm">No activity yet. Start your first daily standup or push some code!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {feedItems.slice(0, 30).map((item) => {
        if (item.type === 'log') {
          return <LogCard key={`log-${item.data.id}`} log={item.data} />
        }
        return <GitHubCard key={`gh-${item.data.id}`} event={item.data} />
      })}
    </div>
  )
}

function LogCard({ log }: { log: Log }) {
  const date = new Date(log.created_at)
  const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const formattedTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })

  const lines = log.content.split('\n').filter(l => l.trim())
  const title = lines[0]?.replace(/^#+\s*/, '').replace(/^-\s*/, '').trim() || 'Untitled Log'
  const body = lines.slice(1).filter(l => l.trim())

  return (
    <article className="card-static p-5 animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-mono text-[var(--accent-blue)] mb-0.5">
              {formattedDate} • {formattedTime}
            </p>
            <h4 className="text-sm font-bold">{title}</h4>
          </div>
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
        <div className="text-sm text-[var(--text-secondary)] font-mono leading-7 ml-11">
          {body.slice(0, 4).map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      )}
    </article>
  )
}

function GitHubCard({ event }: { event: GitHubCommitEvent }) {
  const date = new Date(event.created_at)
  const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const formattedTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  const repoName = event.repo.split('/').pop() || event.repo

  return (
    <article className="card-static p-5 animate-fade-in border-l-2 border-l-[var(--accent-green)]">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-green-bg)] flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <line x1="1.05" y1="12" x2="7" y2="12" />
              <line x1="17.01" y1="12" x2="22.96" y2="12" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-mono text-[var(--accent-blue)] mb-0.5">
              {formattedDate} • {formattedTime}
            </p>
            <p className="text-sm font-bold flex items-center gap-2">
              <span>{repoName}</span>
              <span className="text-xs text-[var(--text-tertiary)] font-normal">
                {event.commits.length} commit{event.commits.length !== 1 ? 's' : ''}
              </span>
            </p>
          </div>
        </div>
        <span className="badge badge-verified">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          GitHub
        </span>
      </div>

      {/* Commit messages */}
      <div className="ml-11 space-y-1.5">
        {event.commits.slice(0, 5).map((commit, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <code className="text-[var(--accent-green)] font-mono text-xs flex-shrink-0 mt-0.5">
              {commit.sha.slice(0, 7)}
            </code>
            <span className="text-[var(--text-secondary)]">{commit.message.split('\n')[0]}</span>
          </div>
        ))}
        {event.commits.length > 5 && (
          <p className="text-xs text-[var(--text-tertiary)] font-mono">
            +{event.commits.length - 5} more commits
          </p>
        )}
      </div>
    </article>
  )
}
