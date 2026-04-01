'use client'

export default function HeroProofMap() {
  // Expand weeks to go fully to the right
  const weeks = 24
  const days = 7
  const levels = [0, 1, 2, 3, 4]

  // Seeded random for consistent display
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
  }

  const cells = Array.from({ length: weeks * days }, (_, i) => {
    const rand = seededRandom(i * 7 + 13)
    // Bias toward higher values for an impressive-looking map
    const level = rand < 0.15 ? 0 : rand < 0.3 ? 1 : rand < 0.5 ? 2 : rand < 0.75 ? 3 : 4
    return levels[level]
  })

  // The very last cell in the matrix (bottom right)
  const lastCellIndex = cells.length - 1;

  const heatmapColors = [
    'var(--heatmap-0)',
    'var(--heatmap-1)',
    'var(--heatmap-2)',
    'var(--heatmap-3)',
    'var(--heatmap-4)',
  ]

  return (
    <div className="heatmap-grid w-full justify-between flex-1" style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))` }}>
      {cells.map((level, i) => {
        const isToday = i === lastCellIndex;
        return (
          <div
            key={i}
            className={`heatmap-cell rounded-sm ${isToday ? 'animate-pulse' : ''}`}
            style={{ 
              backgroundColor: isToday ? 'var(--accent-green)' : heatmapColors[level],
              ...(isToday ? { boxShadow: '0 0 12px var(--accent-green)', zIndex: 10, position: 'relative' } : {})
            }}
            title={isToday ? 'Today: Verified' : `${level} contributions`}
          />
        )
      })}
    </div>
  )
}
