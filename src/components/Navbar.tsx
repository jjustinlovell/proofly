'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

interface UserProfile {
  username: string | null
  full_name: string | null
  avatar_url: string | null
}

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    async function getUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, full_name, avatar_url')
          .eq('id', authUser.id)
          .single()
        setUser(profile)
      }
      setLoading(false)
    }
    getUser()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: user?.username ? `/${user.username}` : '#', label: 'Public Profile' },
    { href: '/dashboard/cv-generator', label: 'CV Generator' },
  ]

  return (
    <nav className="sticky top-0 z-50 glass-card border-0 border-b border-[var(--border-primary)]" style={{ borderRadius: 0 }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2 text-[var(--text-primary)] font-bold text-lg tracking-tight hover:text-[var(--text-primary)]">
            <img src="/logo.png" alt="Proofly Logo" className="w-6 h-6 rounded-md object-contain" />
            Proofly
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {user && navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  pathname === link.href || pathname.startsWith(link.href + '/')
                    ? 'text-[var(--text-primary)] bg-[var(--bg-elevated)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {!loading && user && (
              <>

                {/* Notification bell */}
                <button className="btn-ghost p-2 rounded-md relative" aria-label="Notifications">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </button>

                {/* Avatar / Menu */}
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="w-8 h-8 rounded-full overflow-hidden border-2 border-[var(--border-primary)] hover:border-[var(--accent-green)] transition-colors"
                  >
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name || 'Avatar'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[var(--accent-green-bg)] flex items-center justify-center text-xs font-bold text-[var(--accent-green)]">
                        {(user.full_name || user.username || 'U')[0].toUpperCase()}
                      </div>
                    )}
                  </button>

                  {menuOpen && (
                    <>
                      <div className="fixed inset-0" onClick={() => setMenuOpen(false)} />
                      <div className="absolute right-0 mt-2 w-48 card-static p-1 shadow-lg z-50" style={{ animation: 'fade-in 0.15s ease-out' }}>
                        <div className="px-3 py-2 border-b border-[var(--border-primary)]">
                          <p className="text-sm font-medium text-[var(--text-primary)]">{user.full_name || user.username}</p>
                          <p className="text-xs text-[var(--text-tertiary)]">@{user.username}</p>
                        </div>
                        <Link
                          href={user.username ? `/${user.username}` : '#'}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] rounded-md"
                          onClick={() => setMenuOpen(false)}
                        >
                          Profile
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--accent-red)] hover:bg-[var(--bg-elevated)] rounded-md"
                        >
                          Sign out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
