'use client'

import { useState } from 'react'

interface ContributionDay {
  date: string
  contributionCount: number
}

interface ContributionWeek {
  contributionDays: ContributionDay[]
}

interface ProofMapProps {
  githubData: {
    totalContributions: number
    weeks: ContributionWeek[]
  } | null
  logs: { created_at: string; is_verified: boolean }[]
}

function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  return (
    <div
      className="relative"
      onMouseEnter={(e) => {
        const rect = (e.target as HTMLElement).getBoundingClientRect()
        setPos({ x: rect.left + rect.width / 2, y: rect.top })
        setShow(true)
      }}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: pos.x, top: pos.y - 8, transform: 'translate(-50%, -100%)' }}
        >
          <div className="bg-[#1a1a2e] border border-[var(--border-primary)] text-[var(--text-primary)] text-[11px] font-mono px-2.5 py-1.5 rounded-md shadow-lg whitespace-nowrap">
            {text}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProofMap({ githubData, logs }: ProofMapProps) {
  const heatmapColors = [
    'var(--heatmap-0)',
    'var(--heatmap-1)',
    'var(--heatmap-2)',
    'var(--heatmap-3)',
    'var(--heatmap-4)',
  ]

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Use real GitHub data if available
  if (githubData && githubData.weeks.length > 0) {
    const weeks = githubData.weeks
    const totalContributions = githubData.totalContributions

    let maxCount = 0
    weeks.forEach(week => {
      week.contributionDays.forEach(day => {
        if (day.contributionCount > maxCount) maxCount = day.contributionCount
      })
    })

    const getLevel = (count: number): number => {
      if (count === 0) return 0
      if (maxCount <= 4) return Math.min(count, 4)
      const ratio = count / maxCount
      if (ratio <= 0.25) return 1
      if (ratio <= 0.5) return 2
      if (ratio <= 0.75) return 3
      return 4
    }

    // Month labels
    const monthLabels: { label: string; col: number }[] = []
    let lastMonth = -1
    weeks.forEach((week, weekIdx) => {
      const firstDay = week.contributionDays[0]
      if (firstDay) {
        const month = new Date(firstDay.date + 'T00:00:00').getMonth()
        if (month !== lastMonth) {
          lastMonth = month
          monthLabels.push({
            label: new Date(firstDay.date + 'T00:00:00').toLocaleString('en-US', { month: 'short' }),
            col: weekIdx,
          })
        }
      }
    })

    return (
      <div className="card-static p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <h3 className="text-lg font-bold">Proof Map</h3>
          </div>
          <span className="text-sm font-mono text-[var(--accent-green)]">
            {totalContributions} contributions this year
          </span>
        </div>

        <div className="overflow-x-auto pb-2">
          <div style={{ minWidth: `${weeks.length * 15}px` }}>
            {/* Month labels */}
            <div
              className="grid mb-1"
              style={{ gridTemplateColumns: `repeat(${weeks.length}, 1fr)` }}
            >
              {Array.from({ length: weeks.length }, (_, i) => {
                const monthLabel = monthLabels.find(m => m.col === i)
                return (
                  <span key={i} className="text-[9px] font-mono text-[var(--text-tertiary)]">
                    {monthLabel?.label || ''}
                  </span>
                )
              })}
            </div>

            {/* Heatmap grid */}
            <div
              className="grid gap-[3px]"
              style={{
                gridTemplateColumns: `repeat(${weeks.length}, 1fr)`,
                gridTemplateRows: 'repeat(7, 1fr)',
                gridAutoFlow: 'column',
              }}
            >
              {weeks.map((week, weekIdx) =>
                week.contributionDays.map((day, dayIdx) => {
                  const level = getLevel(day.contributionCount)
                  const tooltipText = `${formatDate(day.date)} — ${day.contributionCount} contribution${day.contributionCount !== 1 ? 's' : ''}`
                  return (
                    <Tooltip key={`${weekIdx}-${dayIdx}`} text={tooltipText}>
                      <div
                        className="rounded-sm aspect-square cursor-pointer transition-transform hover:scale-150 hover:z-10"
                        style={{
                          backgroundColor: heatmapColors[level],
                          minWidth: '11px',
                          minHeight: '11px',
                        }}
                      />
                    </Tooltip>
                  )
                })
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <span className="text-[10px] font-mono text-[var(--text-tertiary)]">LESS</span>
          <div className="flex items-center gap-1">
            {heatmapColors.map((color, i) => (
              <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
            ))}
          </div>
          <span className="text-[10px] font-mono text-[var(--text-tertiary)]">MORE</span>
        </div>
      </div>
    )
  }

  // Fallback: Proofly logs
  const activityMap = new Map<string, number>()
  logs.forEach(log => {
    const date = new Date(log.created_at).toISOString().split('T')[0]
    const current = activityMap.get(date) || 0
    activityMap.set(date, current + (log.is_verified ? 2 : 1))
  })

  const numWeeks = 52
  const today = new Date()
  const cells: { date: string; level: number }[] = []
  for (let w = numWeeks - 1; w >= 0; w--) {
    for (let d = 0; d < 7; d++) {
      const date = new Date(today)
      date.setDate(date.getDate() - (w * 7 + (6 - d)))
      const dateStr = date.toISOString().split('T')[0]
      const activity = activityMap.get(dateStr) || 0
      const level = activity === 0 ? 0 : activity === 1 ? 1 : activity === 2 ? 2 : activity >= 3 ? 3 : 4
      cells.push({ date: dateStr, level })
    }
  }

  return (
    <div className="card-static p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          <h3 className="text-lg font-bold">Proof Map</h3>
        </div>
        <span className="text-sm text-[var(--text-secondary)]">Year {today.getFullYear()} Activity</span>
      </div>

      <div className="overflow-x-auto pb-2">
        <div
          className="grid gap-[3px]"
          style={{
            gridTemplateColumns: `repeat(${numWeeks}, 1fr)`,
            gridTemplateRows: 'repeat(7, 1fr)',
            gridAutoFlow: 'column',
            minWidth: `${numWeeks * 15}px`,
          }}
        >
          {cells.map((cell, i) => (
            <Tooltip key={i} text={`${formatDate(cell.date)} — ${cell.level > 0 ? 'Active' : 'No activity'}`}>
              <div
                className="rounded-sm aspect-square cursor-pointer transition-transform hover:scale-150"
                style={{ backgroundColor: heatmapColors[cell.level], minWidth: '11px', minHeight: '11px' }}
              />
            </Tooltip>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <span className="text-[10px] font-mono text-[var(--text-tertiary)]">LESS</span>
        <div className="flex items-center gap-1">
          {heatmapColors.map((color, i) => (
            <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
          ))}
        </div>
        <span className="text-[10px] font-mono text-[var(--text-tertiary)]">MORE</span>
      </div>
    </div>
  )
}
