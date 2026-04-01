'use client'

import { useEffect, useRef, useState } from 'react'

export default function InteractiveBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [hasMoved, setHasMoved] = useState(false)

  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setPosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        })
        if (!hasMoved) setHasMoved(true)
      }
    }

    const container = containerRef.current
    if (container) {
      window.addEventListener('mousemove', updatePosition)
    }

    return () => {
      window.removeEventListener('mousemove', updatePosition)
    }
  }, [hasMoved])

  return (
    <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      {/* The Dynamic Follower */}
      <div 
        className="absolute w-[800px] h-[800px] bg-[var(--accent-green)]/15 blur-[120px] rounded-full mix-blend-screen transition-all duration-700 ease-out"
        style={{
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, -50%)',
          opacity: hasMoved ? 1 : 0
        }}
      />
      {/* Central static glow to always have some base light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-xl h-[400px] bg-[var(--accent-green)]/10 blur-[100px] rounded-full mix-blend-screen" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808015_1px,transparent_1px),linear-gradient(to_bottom,#80808015_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
    </div>
  )
}
