'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import CVPreview, { type RepoSummary } from '@/components/cv/CVPreview'
import { summarizeRepo } from './actions'

interface Profile {
  username: string
  full_name: string
  avatar_url: string
  current_streak: number
  verified_streak: number
  best_streak: number
}

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

export default function CVGeneratorClient({ 
  profile, 
  initialLogs,
  topLanguages
}: { 
  profile: Profile; 
  initialLogs: Log[];
  topLanguages: { language: string; size: number }[];
}) {
  const [dateRange, setDateRange] = useState<'30' | '90' | 'all'>('90')
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [sections, setSections] = useState({
    dailyLogs: true,
    githubContributions: true,
    techStack: true,
  })
  const [selectedRepos, setSelectedRepos] = useState<string[]>([])
  const [repoSummaries, setRepoSummaries] = useState<Record<string, RepoSummary>>({})
  const [summarizingRepo, setSummarizingRepo] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const printRef = useRef<HTMLDivElement>(null)

  // Filter logs by date range
  const filteredLogs = initialLogs.filter(log => {
    if (dateRange === 'all') return true
    const daysAgo = parseInt(dateRange)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - daysAgo)
    return new Date(log.created_at) >= cutoff
  })

  // Extract unique repos from filtered logs
  const allRepos = Array.from(
    new Set(
      filteredLogs
        .filter(log => !!log.github_data?.repo)
        .map(log => log.github_data!.repo!)
    )
  )

  // Auto-select all repos on first load
  useEffect(() => {
    if (selectedRepos.length === 0 && allRepos.length > 0) {
      setSelectedRepos(allRepos)
    }
  }, [allRepos.join(',')])

  // Get commits for a specific repo
  const getRepoCommits = (repo: string) => {
    return filteredLogs
      .filter(log => log.github_data?.repo === repo)
      .map(log => ({
        sha: log.github_data!.commit_sha || '',
        message: log.github_data!.commit_message || log.content,
      }))
  }

  const handleSummarize = async (repo: string) => {
    setSummarizingRepo(repo)
    const commits = getRepoCommits(repo)
    const languages = topLanguages.map(l => l.language)

    startTransition(async () => {
      const result = await summarizeRepo({
        repoName: repo,
        commits,
        languages,
      })

      if (result.success && result.summary) {
        // Extract tech stack from languages + repo context
        const techStack = topLanguages.slice(0, 3).map(l => l.language)
        
        setRepoSummaries(prev => ({
          ...prev,
          [repo]: {
            repoName: repo,
            summary: result.summary!,
            techStack,
            commitCount: commits.length,
          }
        }))
      } else {
        // Show error briefly
        console.error('Summarization failed:', result.error)
      }
      setSummarizingRepo(null)
    })
  }

  const handleSummarizeAll = async () => {
    for (const repo of selectedRepos) {
      if (!repoSummaries[repo]) {
        await handleSummarize(repo)
      }
    }
  }

  const toggleRepo = (repo: string) => {
    setSelectedRepos(prev =>
      prev.includes(repo) ? prev.filter(r => r !== repo) : [...prev, repo]
    )
  }

  useEffect(() => {
    // Add print styles dynamically
    const style = document.createElement('style')
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #cv-preview, #cv-preview * {
          visibility: visible;
        }
        #cv-preview {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          margin: 0;
          padding: 0;
        }
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  const handlePrint = () => {
    window.print()
  }

  const summarizedCount = selectedRepos.filter(r => repoSummaries[r]).length
  const allSummarized = selectedRepos.length > 0 && summarizedCount === selectedRepos.length

  return (
    <div className="p-6 lg:p-8 w-full max-w-none">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <span className="badge badge-verified">Live Preview</span>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        {/* CV Preview */}
        <div ref={printRef} id="cv-preview">
          <CVPreview
            profile={profile}
            logs={filteredLogs}
            theme={theme}
            sections={sections}
            topLanguages={topLanguages}
            repoSummaries={repoSummaries}
            selectedRepos={selectedRepos}
          />
        </div>

        {/* Export Settings */}
        <div className="space-y-6">
          {/* Date Range */}
          <div className="card-static p-5">
            <h3 className="text-lg font-bold mb-4">Export Settings</h3>

            <div className="space-y-4">
              <div>
                <p className="section-label mb-2">Date Range</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['30', '90', 'all'] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setDateRange(range)}
                      className={`py-2 px-3 rounded-md text-sm font-medium transition-all ${
                        dateRange === range
                          ? 'bg-[var(--accent-green)] text-[var(--bg-primary)]'
                          : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {range === 'all' ? 'ALL' : `${range}D`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme */}
              <div>
                <p className="section-label mb-2">Theme Profile</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTheme('light')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      theme === 'light'
                        ? 'border-[var(--accent-green)]'
                        : 'border-[var(--border-primary)] hover:border-[var(--text-tertiary)]'
                    }`}
                  >
                    <div className="w-full h-16 rounded-md bg-white mb-2" />
                    <p className="text-xs font-mono text-center">Minimal Light</p>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      theme === 'dark'
                        ? 'border-[var(--accent-green)]'
                        : 'border-[var(--border-primary)] hover:border-[var(--text-tertiary)]'
                    }`}
                  >
                    <div className="w-full h-16 rounded-md bg-[#0D1117] mb-2" />
                    <p className="text-xs font-mono text-center">Obsidian Dark</p>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Repo Selector */}
          <div className="card-static p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Repositories</h3>
              <span className="text-xs font-mono text-[var(--text-tertiary)]">{selectedRepos.length}/{allRepos.length}</span>
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
              {allRepos.map(repo => {
                const isSelected = selectedRepos.includes(repo)
                const isSummarized = !!repoSummaries[repo]
                const isSummarizing = summarizingRepo === repo
                const repoDisplay = repo.split('/').pop() || repo
                const commitCount = getRepoCommits(repo).length

                return (
                  <div
                    key={repo}
                    className="flex items-center gap-3 p-2.5 rounded-lg transition-all"
                    style={{
                      backgroundColor: isSelected ? 'var(--bg-elevated)' : 'transparent',
                      border: `1px solid ${isSelected ? 'var(--border-primary)' : 'transparent'}`,
                    }}
                  >
                    <button
                      onClick={() => toggleRepo(repo)}
                      className="flex-shrink-0"
                    >
                      <div
                        className="w-4 h-4 rounded border-2 flex items-center justify-center transition-all"
                        style={{
                          borderColor: isSelected ? 'var(--accent-green)' : 'var(--text-tertiary)',
                          backgroundColor: isSelected ? 'var(--accent-green)' : 'transparent',
                        }}
                      >
                        {isSelected && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--bg-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{repoDisplay}</p>
                      <p className="text-xs font-mono text-[var(--text-tertiary)]">{commitCount} commits</p>
                    </div>

                    {isSummarized ? (
                      <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider text-[var(--accent-green)] bg-[var(--accent-green-bg)] px-2 py-1 rounded">
                        ✓ AI
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSummarize(repo)}
                        disabled={isSummarizing || !isSelected}
                        className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded transition-all disabled:opacity-40"
                        style={{
                          color: 'var(--accent-blue)',
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          border: '1px solid rgba(59, 130, 246, 0.2)',
                        }}
                      >
                        {isSummarizing ? (
                          <span className="flex items-center gap-1">
                            <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Generating...
                          </span>
                        ) : '✨ AI'}
                      </button>
                    )}
                  </div>
                )
              })}

              {allRepos.length === 0 && (
                <p className="text-sm text-[var(--text-tertiary)] text-center py-4">
                  No repositories found in the selected date range.
                </p>
              )}
            </div>

            {/* Summarize All Button */}
            {selectedRepos.length > 0 && !allSummarized && (
              <button
                onClick={handleSummarizeAll}
                disabled={isPending || summarizingRepo !== null}
                className="w-full mt-4 py-2.5 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15))',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  color: 'var(--text-primary)',
                }}
              >
                {summarizingRepo ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
                    Summarizing...
                  </>
                ) : (
                  <>
                    ✨ Summarize All ({selectedRepos.length - summarizedCount} remaining)
                  </>
                )}
              </button>
            )}

            {allSummarized && selectedRepos.length > 0 && (
              <div className="mt-4 py-2.5 px-4 rounded-lg text-center text-sm font-medium" style={{ backgroundColor: 'var(--accent-green-bg)', color: 'var(--accent-green)' }}>
                ✓ All repos summarized
              </div>
            )}
          </div>

          {/* Generate Button */}
          <button
            onClick={handlePrint}
            className="btn btn-primary w-full btn-lg font-mono tracking-wider"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Generate PDF
          </button>
          <p className="text-xs text-center text-[var(--text-tertiary)] font-mono">
            Verified Watermark Included
          </p>

          {/* Include Sections */}
          <div className="card-static p-5">
            <p className="section-label mb-3">Include Sections</p>
            <div className="space-y-3">
              {Object.entries(sections).map(([key, value]) => {
                const labels: Record<string, string> = {
                  dailyLogs: 'Daily Log Summaries',
                  githubContributions: 'GitHub Contributions',
                  techStack: 'Technical Tech Stack',
                }
                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm">{labels[key]}</span>
                    <button
                      onClick={() => setSections(prev => ({ ...prev, [key]: !value }))}
                      className={`toggle ${value ? 'active' : ''}`}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Info Card */}
          <div className="card-static p-4 border-l-2 border-l-[var(--accent-blue)]">
            <div className="flex items-center gap-2 mb-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span className="text-sm font-bold text-[var(--accent-blue)]">Elite Status</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Generated CVs with 90+ days of proof of work have a 3.4x higher response rate from recruiters.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
