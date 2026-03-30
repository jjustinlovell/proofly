'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  currentStreak: number
  verifiedStreak: number
  githubConnected: boolean
}

export default function Sidebar({ currentStreak, verifiedStreak, githubConnected }: SidebarProps) {
  const pathname = usePathname()

  const navItems = [
    {
      href: '/dashboard',
      label: 'Overview',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      ),
    },
    {
      href: '/dashboard/logs',
      label: 'Logs',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="12 8 12 12 14 14" />
          <circle cx="12" cy="12" r="10" />
        </svg>
      ),
    },
  ]

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col border-r border-[var(--border-primary)] bg-[var(--bg-secondary)]">
      <div className="flex-1 p-4 space-y-6">
        {/* Streak Display */}
        <div className="flex items-center gap-3 px-1">
          <span className="text-2xl">🔥</span>
          <div>
            <p className="section-label">Current Streak</p>
            <p className="text-xl font-bold">{currentStreak} Days</p>
          </div>
        </div>

        {/* GitHub Status */}
        <div className="card-static p-3">
          <div className="flex items-center justify-between">
            <p className="section-label">GitHub Status</p>
            <span className={`status-dot ${githubConnected ? 'status-online' : ''}`}
              style={{ background: githubConnected ? undefined : 'var(--accent-red)' }}
            />
          </div>
          <p className="text-sm font-medium mt-1">
            {githubConnected ? 'Connected' : 'Disconnected'}
          </p>
        </div>

        {/* Grace Period */}
        <div className="card-static p-3">
          <p className="section-label">Grace Period</p>
          <p className="text-sm font-medium mt-1">Freeze 1/1 Available</p>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Bottom section */}
      <div className="p-4 border-t border-[var(--border-primary)]">
        <Link href="/dashboard" className="btn btn-primary w-full btn-sm">
          Post Logs
        </Link>
      </div>
    </aside>
  )
}
