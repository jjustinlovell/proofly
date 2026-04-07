'use client'

import { useState, useRef, useEffect, useTransition, useCallback } from 'react'
import CVPreview, { type RepoSummary } from '@/components/cv/CVPreview'
import { summarizeRepo, getAICredits, getGitHubRepos, getRemoteRepoCommits } from './actions'

interface BaseLog {
  id: string
  content: string
  created_at: string
  is_verified: boolean
  github_data: {
    repo?: string
    commit_sha?: string
    commit_message?: string
  } | null
}

interface Profile {
  username: string
  full_name: string
  avatar_url: string
  current_streak: number
  verified_streak: number
  best_streak: number
  github_access_token?: string
  ai_credits: number
}

type SectionKeys = 'dailyLogs' | 'githubContributions' | 'techStack'

interface Props {
  profile: Profile
  initialLogs: BaseLog[]
  topLanguages: { language: string; size: number }[]
}

export default function CVGeneratorClient({ profile, initialLogs, topLanguages }: Props) {
  const [dateRange, setDateRange] = useState<'30' | '90' | 'all'>('90')
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [sections, setSections] = useState<Record<SectionKeys, boolean>>({
    dailyLogs: true,
    githubContributions: true,
    techStack: true,
  })
  
  const printRef = useRef<HTMLDivElement>(null)
  
  // Credits and summarize state
  const [credits, setCredits] = useState(profile.ai_credits || 0)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [summarizingRepo, setSummarizingRepo] = useState<string | null>(null)
  const [repoSummaries, setRepoSummaries] = useState<Record<string, RepoSummary>>({})
  const [selectedRepos, setSelectedRepos] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'failed'>('idle')
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('payment_status') === 'success') {
      setPaymentStatus('success')
      setTimeout(() => setPaymentStatus('idle'), 5000)
    }
  }, [])

  const [remoteLogs, setRemoteLogs] = useState<BaseLog[]>([])
  const fetchingRepos = useRef<Set<string>>(new Set())
  const [loadingRepos, setLoadingRepos] = useState<Set<string>>(new Set())

  useEffect(() => {
    selectedRepos.forEach(repo => {
      const hasLocalLogs = initialLogs.some(l => l.github_data?.repo === repo)
      if (!hasLocalLogs && !fetchingRepos.current.has(repo)) {
        fetchingRepos.current.add(repo)
        setLoadingRepos(prev => new Set(prev).add(repo))
        getRemoteRepoCommits(repo)
          .then(({ commits }) => {
            if (commits && commits.length > 0) {
              const newLogs: BaseLog[] = commits.map((c: any) => ({
                id: c.sha,
                content: `[GitHub] ${c.message}`,
                created_at: c.date,
                is_verified: true,
                github_data: {
                  repo,
                  commit_sha: c.sha,
                  commit_message: c.message
                }
              }))
              setRemoteLogs(prev => [...prev, ...newLogs])
            }
          })
          .catch(err => {
            console.error('Failed to fetch remote commits:', err)
          })
          .finally(() => {
            setLoadingRepos(prev => {
              const next = new Set(prev)
              next.delete(repo)
              return next
            })
          })
      }
    })
  }, [selectedRepos, initialLogs])

  const filteredInitialLogs = initialLogs.filter(log => {
    if (dateRange === 'all') return true
    const daysAgo = parseInt(dateRange)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - daysAgo)
    return new Date(log.created_at) >= cutoff
  })

  // remoteLogs bypass the date filter because if a user explicitly selects a remote repo to include, 
  // its recent commits should be displayed regardless of how long ago the project was last active.
  const filteredLogs = [...filteredInitialLogs, ...remoteLogs]

  const [publicRepos, setPublicRepos] = useState<string[]>([])

  useEffect(() => {
    if (profile.username) {
      getGitHubRepos(profile.username).then(repos => {
        setPublicRepos(repos)
      })
    }
  }, [profile.username])

  // Extract unique repos from filtered logs and merge with public repos
  const logRepos = Array.from(
    new Set(
      filteredLogs
        .filter(log => !!log.github_data?.repo)
        .map(log => log.github_data!.repo!)
    )
  )
  
  const allRepos = Array.from(new Set([...logRepos, ...publicRepos]))

  // Auto-select repos that have manual logs on first load, or all if none
  const [hasAutoSelected, setHasAutoSelected] = useState(false)
  useEffect(() => {
    if (!hasAutoSelected && allRepos.length > 0) {
      // By default, just select tracked ones to save credits, if any. Else select a few.
      setSelectedRepos(logRepos.length > 0 ? logRepos : allRepos.slice(0, 3))
      setHasAutoSelected(true)
    }
  }, [allRepos, logRepos, hasAutoSelected])

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
    if (credits <= 0) {
      setShowUpgradeModal(true)
      return
    }

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

        // Update credits from server response
        if (result.remainingCredits !== undefined) {
          setCredits(result.remainingCredits)
        }
      } else if (result.error === 'NO_CREDITS') {
        setShowUpgradeModal(true)
      } else {
        console.error('Summarization failed:', result.error)
      }
      setSummarizingRepo(null)
    })
  }

  const handleSummarizeAll = async () => {
    for (const repo of selectedRepos) {
      if (!repoSummaries[repo]) {
        if (credits <= 0) {
          setShowUpgradeModal(true)
          break
        }
        await handleSummarize(repo)
      }
    }
  }

  const toggleRepo = (repo: string) => {
    setSelectedRepos(prev =>
      prev.includes(repo) ? prev.filter(r => r !== repo) : [...prev, repo]
    )
  }

  const handleUpgrade = async () => {
    setIsProcessingPayment(true)
    try {
      const res = await fetch('/api/payment/create', { method: 'POST' })
      const data = await res.json()
      
      if (data.invoiceUrl) {
        // Redirect to Xendit payment page
        window.location.href = data.invoiceUrl
      } else {
        console.error('No invoice URL returned:', data)
        setIsProcessingPayment(false)
      }
    } catch (err) {
      console.error('Payment error:', err)
      setIsProcessingPayment(false)
    }
  }

  useEffect(() => {
    const style = document.createElement('style')
    style.innerHTML = `
      @media print {
        body * { visibility: hidden; }
        #cv-preview, #cv-preview * { visibility: visible; }
        #cv-preview { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
      }
    `
    document.head.appendChild(style)
    return () => { document.head.removeChild(style) }
  }, [])

  const handlePrint = () => { window.print() }

  const summarizedCount = selectedRepos.filter(r => repoSummaries[r]).length
  const allSummarized = selectedRepos.length > 0 && summarizedCount === selectedRepos.length

  return (
    <div className="p-6 lg:p-8 w-full max-w-none">
      {/* Payment status toast */}
      {paymentStatus !== 'idle' && (
        <div
          className="fixed top-6 right-6 z-50 px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in slide-in-from-top-2"
          style={{
            backgroundColor: paymentStatus === 'success' ? 'var(--accent-green)' : '#ef4444',
            color: 'white',
          }}
        >
          {paymentStatus === 'success' ? (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12l2 2 4-4" />
                <circle cx="12" cy="12" r="10" />
              </svg>
              <span className="font-bold text-sm">Payment successful! 25 credits added.</span>
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span className="font-bold text-sm">Payment failed. Please try again.</span>
            </>
          )}
        </div>
      )}

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
            loadingRepos={loadingRepos}
          />
        </div>

        {/* Export Settings Sidebar */}
        <div className="space-y-6">
          {/* Credits Card */}
          <div
            className="p-4 rounded-lg border"
            style={{
              background: credits > 0
                ? 'linear-gradient(135deg, rgba(74, 222, 128, 0.08), rgba(59, 130, 246, 0.08))'
                : 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(249, 115, 22, 0.08))',
              borderColor: credits > 0 ? 'rgba(74, 222, 128, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
                AI Credits
              </span>
              <span
                className="text-2xl font-bold font-mono"
                style={{ color: credits > 0 ? 'var(--accent-green)' : '#ef4444' }}
              >
                {credits}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-tertiary)]">
                {credits > 0 ? `${credits} summar${credits === 1 ? 'y' : 'ies'} remaining` : 'No credits left'}
              </span>
              {credits <= 2 && (
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="text-xs font-bold px-3 py-1 rounded-md transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                    color: 'white',
                  }}
                >
                  Get Pro
                </button>
              )}
            </div>
          </div>

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
                    <button onClick={() => toggleRepo(repo)} className="flex-shrink-0">
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
                      <p className="text-xs font-mono text-[var(--text-tertiary)]">
                        {loadingRepos.has(repo) ? (
                          <span className="flex items-center gap-1">
                            <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Fetching commits...
                          </span>
                        ) : commitCount > 0 ? (
                          `${commitCount} tracked commits`
                        ) : (
                          'Remote repository'
                        )}
                      </p>
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
                  <>✨ Summarize All</>
                )}
              </button>
            )}

            {allSummarized && selectedRepos.length > 0 && (
              <div className="mt-4 py-2.5 px-4 rounded-lg text-center text-sm font-medium" style={{ backgroundColor: 'var(--accent-green-bg)', color: 'var(--accent-green)' }}>
                ✓ All repos summarized
              </div>
            )}
          </div>

          {/* Generate PDF Button */}
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
          {/* <div className="card-static p-4 border-l-2 border-l-[var(--accent-blue)]">
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
          </div> */}
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div
            className="w-full max-w-md rounded-2xl overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
            }}
          >
            {/* Modal Header */}
            <div
              className="p-6 pb-4 text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(59, 130, 246, 0.15))',
                borderBottom: '1px solid var(--border-primary)',
              }}
            >
              <div className="text-4xl mb-3">✨</div>
              <h2 className="text-xl font-bold mb-1">Upgrade to Pro</h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Get more AI-powered CV summaries
              </p>
            </div>

            {/* Pricing */}
            <div className="p-6">
              {/* Free Tier */}
              <div className="p-4 rounded-xl mb-3" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-primary)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold">Free</span>
                  <span className="font-mono text-lg font-bold text-[var(--text-tertiary)]">$0</span>
                </div>
                <ul className="space-y-1.5">
                  <li className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    2 AI summaries
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    PDF export
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    Verified badge
                  </li>
                </ul>
              </div>

              {/* Pro Tier */}
              <div
                className="p-4 rounded-xl relative"
                style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1))',
                  border: '2px solid rgba(139, 92, 246, 0.4)',
                }}
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: 'white' }}>
                  Most Popular
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold">Pro</span>
                  <div className="text-right">
                    <span className="font-mono text-2xl font-bold" style={{ color: '#8b5cf6' }}>$1.99</span>
                    <span className="text-xs text-[var(--text-tertiary)] block">one-time</span>
                  </div>
                </div>
                <ul className="space-y-1.5">
                  <li className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    <strong style={{ color: '#8b5cf6' }}>25 AI summaries</strong>
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    Everything in Free
                  </li>
                  <li className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    ~$0.08 per summary
                  </li>
                </ul>
              </div>

              {/* Payment Methods */}
              <div className="mt-4 text-center">
                <p className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
                  Accepts
                </p>
                <div className="flex items-center justify-center gap-3 text-xs text-[var(--text-secondary)]">
                  <span className="px-2 py-1 rounded" style={{ backgroundColor: 'var(--bg-elevated)' }}>💳 Cards</span>
                  <span className="px-2 py-1 rounded" style={{ backgroundColor: 'var(--bg-elevated)' }}>🏦 Bank</span>
                  <span className="px-2 py-1 rounded" style={{ backgroundColor: 'var(--bg-elevated)' }}>📱 QRIS</span>
                  <span className="px-2 py-1 rounded" style={{ backgroundColor: 'var(--bg-elevated)' }}>💰 E-Wallet</span>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={handleUpgrade}
                disabled={isProcessingPayment}
                className="w-full mt-5 py-3 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2"
                style={{
                  background: isProcessingPayment
                    ? 'rgba(139, 92, 246, 0.5)'
                    : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                  boxShadow: isProcessingPayment ? 'none' : '0 4px 15px rgba(139, 92, 246, 0.4)',
                }}
              >
                {isProcessingPayment ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Redirecting to payment...
                  </>
                ) : (
                  'Upgrade to Pro — $1.99'
                )}
              </button>

              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-full mt-3 py-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-all"
              >
                Maybe later
              </button>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 text-center" style={{ borderTop: '1px solid var(--border-primary)' }}>
              <p className="text-[10px] text-[var(--text-tertiary)]">
                🔒 Secure payment via Xendit · No subscription · Buy once, use anytime
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
