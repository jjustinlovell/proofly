'use client'

interface ActivityMatrixProps {
  logs: { created_at: string; is_verified: boolean }[]
}

export default function ActivityMatrix({ logs }: ActivityMatrixProps) {
  // Build a map of date -> activity level
  const activityMap = new Map<string, number>()
  logs.forEach(log => {
    const date = new Date(log.created_at).toISOString().split('T')[0]
    const current = activityMap.get(date) || 0
    activityMap.set(date, current + (log.is_verified ? 2 : 1))
  })

  // Generate last 10 weeks of data
  const weeks = 10
  const today = new Date()
  const cells: { date: string; level: number }[] = []

  for (let w = weeks - 1; w >= 0; w--) {
    for (let d = 0; d < 7; d++) {
      const date = new Date(today)
      date.setDate(date.getDate() - (w * 7 + (6 - d)))
      const dateStr = date.toISOString().split('T')[0]
      const activity = activityMap.get(dateStr) || 0
      const level = activity === 0 ? 0 : activity === 1 ? 1 : activity === 2 ? 2 : activity >= 3 ? 3 : 4
      cells.push({ date: dateStr, level })
    }
  }

  const heatmapColors = [
    'var(--heatmap-0)',
    'var(--heatmap-1)',
    'var(--heatmap-2)',
    'var(--heatmap-3)',
    'var(--heatmap-4)',
  ]

  // Calculate percentage change vs last month (mock for now)
  const thisMonth = cells.filter(c => c.level > 0).length
  const comparison = thisMonth > 0 ? `+${Math.min(thisMonth * 3, 99)}%` : '0%'

  return (
    <div className="card-static p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="section-label">Activity Matrix</p>
        <span className="text-xs font-mono text-[var(--accent-green)]">{comparison} vs last month</span>
      </div>

      <div className="heatmap-grid" style={{ gridTemplateColumns: `repeat(${weeks}, 1fr)` }}>
        {cells.map((cell, i) => (
          <div
            key={i}
            className="heatmap-cell"
            style={{ backgroundColor: heatmapColors[cell.level] }}
            title={`${cell.date}: ${cell.level} activity`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between mt-3">
        <span className="text-[10px] font-mono text-[var(--text-tertiary)]">LESS</span>
        <div className="flex items-center gap-1">
          {heatmapColors.slice(1).map((color, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <span className="text-[10px] font-mono text-[var(--text-tertiary)]">MORE</span>
      </div>
    </div>
  )
}
