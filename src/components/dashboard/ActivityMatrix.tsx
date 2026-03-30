'use client'

import { useState } from 'react'

interface ContributionDay {
  date: string
  contributionCount: number
}

interface ContributionWeek {
  contributionDays: ContributionDay[]
}

interface ActivityMatrixProps {
  githubData: {
    totalContributions: number
    weeks: ContributionWeek[]
  } | null
  logs: { created_at: string; is_verified: boolean }[]
}

type FilterMode = 'mixed' | 'github' | 'manual'

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

export default function ActivityMatrix({ githubData, logs }: ActivityMatrixProps) {
  const [filter, setFilter] = useState<FilterMode>('mixed')

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

  // Build manual log activity map
  const logActivityMap = new Map<string, number>()
  logs.forEach(log => {
    const date = new Date(log.created_at).toISOString().split('T')[0]
    const current = logActivityMap.get(date) || 0
    logActivityMap.set(date, current + (log.is_verified ? 2 : 1))
  })

  // Build GitHub activity map
  const githubActivityMap = new Map<string, number>()
  if (githubData) {
    githubData.weeks.forEach(week => {
      week.contributionDays.forEach(day => {
        if (day.contributionCount > 0) {
          githubActivityMap.set(day.date, day.contributionCount)
        }
      })
    })
  }

  // Determine which data to display based on filter
  const hasGithubData = githubData && githubData.weeks.length > 0

  // For GitHub and Mixed modes, use the GitHub calendar structure
  if (hasGithubData && (filter === 'github' || filter === 'mixed')) {
    const weeks = githubData.weeks

    // Build the merged activity map based on filter
    let maxCount = 0
    const activityForWeeks = weeks.map(week => {
      return week.contributionDays.map(day => {
        let count = 0
        if (filter === 'github') {
          count = day.contributionCount
        } else {
          // mixed: combine both
          count = day.contributionCount + (logActivityMap.get(day.date) || 0)
        }
        if (count > maxCount) maxCount = count
        return { date: day.date, count }
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

    // Total
    let totalActivity = 0
    activityForWeeks.forEach(days => {
      days.forEach(day => { totalActivity += day.count })
    })

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
      <div className="card-static p-5">
        {/* Header with filter */}
        <div className="flex items-center justify-between mb-1">
          <p className="section-label">Activity Matrix</p>
          <span className="text-xs font-mono text-[var(--accent-green)]">
            {totalActivity} {filter === 'github' ? 'contributions' : 'total activity'}
          </span>
        </div>

        {/* Filter toggle */}
        <div className="flex items-center gap-1 mb-3 bg-[var(--bg-elevated)] rounded-lg p-0.5 w-fit">
          {([
            { key: 'mixed', label: 'Mixed' },
            { key: 'github', label: 'GitHub' },
            { key: 'manual', label: 'Manual' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1 rounded-md text-[11px] font-mono transition-all ${
                filter === key
                  ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Month labels + Heatmap */}
        <div className="overflow-x-auto pb-1">
          <div style={{ minWidth: `${weeks.length * 14}px` }}>
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

            <div
              className="grid gap-[3px]"
              style={{
                gridTemplateColumns: `repeat(${weeks.length}, 1fr)`,
                gridTemplateRows: 'repeat(7, 1fr)',
                gridAutoFlow: 'column',
              }}
            >
              {activityForWeeks.map((days, weekIdx) =>
                days.map((day, dayIdx) => {
                  const level = getLevel(day.count)
                  const tooltipText = `${formatDate(day.date)} — ${day.count} ${filter === 'github' ? 'contribution' : 'activit'}${day.count !== 1 ? (filter === 'github' ? 's' : 'ies') : (filter === 'github' ? '' : 'y')}`
                  return (
                    <Tooltip key={`${weekIdx}-${dayIdx}`} text={tooltipText}>
                      <div
                        className="rounded-sm aspect-square cursor-pointer transition-transform hover:scale-150 hover:z-10"
                        style={{
                          backgroundColor: heatmapColors[level],
                          minWidth: '10px',
                          minHeight: '10px',
                        }}
                      />
                    </Tooltip>
                  )
                })
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-[9px] font-mono text-[var(--text-tertiary)]">LESS</span>
          <div className="flex items-center gap-1">
            {heatmapColors.map((color, i) => (
              <div key={i} className="w-[10px] h-[10px] rounded-sm" style={{ backgroundColor: color }} />
            ))}
          </div>
          <span className="text-[9px] font-mono text-[var(--text-tertiary)]">MORE</span>
        </div>
      </div>
    )
  }

  // Manual-only view (or fallback when no GitHub data)
  const fallbackWeeks = hasGithubData ? 52 : 20
  const today = new Date()
  const cells: { date: string; count: number }[] = []

  for (let w = fallbackWeeks - 1; w >= 0; w--) {
    for (let d = 0; d < 7; d++) {
      const date = new Date(today)
      date.setDate(date.getDate() - (w * 7 + (6 - d)))
      const dateStr = date.toISOString().split('T')[0]
      const activity = logActivityMap.get(dateStr) || 0
      cells.push({ date: dateStr, count: activity })
    }
  }

  let maxManual = 0
  cells.forEach(c => { if (c.count > maxManual) maxManual = c.count })

  const getManualLevel = (count: number): number => {
    if (count === 0) return 0
    if (maxManual <= 4) return Math.min(count, 4)
    const ratio = count / maxManual
    if (ratio <= 0.25) return 1
    if (ratio <= 0.5) return 2
    if (ratio <= 0.75) return 3
    return 4
  }

  const totalManual = cells.reduce((sum, c) => sum + c.count, 0)

  return (
    <div className="card-static p-5">
      <div className="flex items-center justify-between mb-1">
        <p className="section-label">Activity Matrix</p>
        <span className="text-xs font-mono text-[var(--text-tertiary)]">
          {totalManual} manual logs
        </span>
      </div>

      {/* Filter toggle — only show if GitHub data exists */}
      {hasGithubData && (
        <div className="flex items-center gap-1 mb-3 bg-[var(--bg-elevated)] rounded-lg p-0.5 w-fit">
          {([
            { key: 'mixed', label: 'Mixed' },
            { key: 'github', label: 'GitHub' },
            { key: 'manual', label: 'Manual' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1 rounded-md text-[11px] font-mono transition-all ${
                filter === key
                  ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="overflow-x-auto pb-1">
        <div
          className="grid gap-[3px]"
          style={{
            gridTemplateColumns: `repeat(${fallbackWeeks}, 1fr)`,
            gridTemplateRows: 'repeat(7, 1fr)',
            gridAutoFlow: 'column',
            minWidth: `${fallbackWeeks * 14}px`,
          }}
        >
          {cells.map((cell, i) => {
            const level = getManualLevel(cell.count)
            return (
              <Tooltip key={i} text={`${formatDate(cell.date)} — ${cell.count} log${cell.count !== 1 ? 's' : ''}`}>
                <div
                  className="rounded-sm aspect-square cursor-pointer transition-transform hover:scale-150"
                  style={{ backgroundColor: heatmapColors[level], minWidth: '10px', minHeight: '10px' }}
                />
              </Tooltip>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-[9px] font-mono text-[var(--text-tertiary)]">LESS</span>
        <div className="flex items-center gap-1">
          {heatmapColors.map((color, i) => (
            <div key={i} className="w-[10px] h-[10px] rounded-sm" style={{ backgroundColor: color }} />
          ))}
        </div>
        <span className="text-[9px] font-mono text-[var(--text-tertiary)]">MORE</span>
      </div>
    </div>
  )
}
