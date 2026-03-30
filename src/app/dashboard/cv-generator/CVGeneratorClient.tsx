'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import CVPreview from '@/components/cv/CVPreview'

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

export default function CVGeneratorClient({ profile, initialLogs }: { profile: Profile; initialLogs: Log[] }) {
  const [dateRange, setDateRange] = useState<'30' | '90' | 'all'>('90')
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [sections, setSections] = useState({
    dailyLogs: true,
    githubContributions: true,
    techStack: true,
    publicProfileQR: true,
  })
  const printRef = useRef<HTMLDivElement>(null)

  // Filter logs by date range
  const filteredLogs = initialLogs.filter(log => {
    if (dateRange === 'all') return true
    const daysAgo = parseInt(dateRange)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - daysAgo)
    return new Date(log.created_at) >= cutoff
  })

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <span className="badge badge-verified">Live Preview</span>
        <span className="text-sm text-[var(--text-secondary)]">Last updated 2 mins ago</span>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        {/* CV Preview */}
        <div ref={printRef}>
          <CVPreview
            profile={profile}
            logs={filteredLogs}
            theme={theme}
            sections={sections}
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
                  publicProfileQR: 'Public Profile QR',
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
