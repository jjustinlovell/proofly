'use client'

interface ProofMapProps {
  logs: { created_at: string; is_verified: boolean }[]
}

export default function ProofMap({ logs }: ProofMapProps) {
  // Build activity map for the past year
  const activityMap = new Map<string, number>()
  logs.forEach(log => {
    const date = new Date(log.created_at).toISOString().split('T')[0]
    const current = activityMap.get(date) || 0
    activityMap.set(date, current + (log.is_verified ? 2 : 1))
  })

  const weeks = 52
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
        <div className="heatmap-grid" style={{
          gridTemplateColumns: `repeat(${weeks}, 1fr)`,
          minWidth: `${weeks * 17}px`,
        }}>
          {cells.map((cell, i) => (
            <div
              key={i}
              className="heatmap-cell"
              style={{ backgroundColor: heatmapColors[cell.level] }}
              title={`${cell.date}: ${cell.level > 0 ? 'Active' : 'No activity'}`}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <span className="text-[10px] font-mono text-[var(--text-tertiary)]">LESS</span>
        <div className="flex items-center gap-1">
          {heatmapColors.map((color, i) => (
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
