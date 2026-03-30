'use client'

export default function HeroProofMap() {
  // Generate a deterministic heatmap pattern for the hero
  const weeks = 12
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

  const heatmapColors = [
    'var(--heatmap-0)',
    'var(--heatmap-1)',
    'var(--heatmap-2)',
    'var(--heatmap-3)',
    'var(--heatmap-4)',
  ]

  return (
    <div className="heatmap-grid" style={{ gridTemplateColumns: `repeat(${weeks}, 1fr)` }}>
      {cells.map((level, i) => (
        <div
          key={i}
          className="heatmap-cell"
          style={{ backgroundColor: heatmapColors[level] }}
          title={`${level} contributions`}
        />
      ))}
    </div>
  )
}
