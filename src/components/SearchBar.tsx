'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface ProfileResult {
  username: string
  full_name: string | null
  avatar_url: string | null
}

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ProfileResult[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Debounced search effect
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setIsOpen(false)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      
      // Use full text search or simple wildcard on username/full_name
      // Note: `ilike` is case-insensitive pattern matching
      const searchTerm = `%${query}%`
      
      const { data, error } = await supabase
        .from('profiles')
        .select('username, full_name, avatar_url')
        .or(`username.ilike.${searchTerm},full_name.ilike.${searchTerm}`)
        .not('username', 'is', null) // only show users who have set a username
        .limit(5)

      if (!error && data) {
        setResults(data)
        setIsOpen(true)
      }
      
      setLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, supabase])

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [wrapperRef])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    // If they press enter, just go to that string as a route.
    // In many cases this would be better to select the first result, but an exact match search is fine as a fallback.
    if (results.length > 0) {
      handleSelect(results[0].username)
    } else {
      router.push(`/${query.trim()}`)
      setIsOpen(false)
    }
  }

  const handleSelect = (username: string) => {
    router.push(`/${username}`)
    setIsOpen(false)
    setQuery('') // optional: clear after navigation
  }

  return (
    <div ref={wrapperRef} className="relative w-full max-w-xs ml-4 hidden sm:block">
      <form onSubmit={handleSubmit} className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-tertiary)]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <input
          type="text"
          className="input h-9 bg-[var(--bg-elevated)] border-transparent w-full text-sm placeholder-[var(--text-tertiary)] focus:border-[var(--accent-green)] transition-all"
          style={{ paddingLeft: '2.25rem' }}
          placeholder="Search Proofly..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true) }}
        />
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="animate-spin h-4 w-4 text-[var(--text-tertiary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </form>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute mt-2 w-full card-static shadow-xl z-50 overflow-hidden border border-[var(--border-primary)]" style={{ animation: 'fade-in 0.15s ease-out' }}>
          {results.length > 0 ? (
            <ul>
              {results.map((profile) => (
                <li key={profile.username}>
                  <button
                    onClick={() => handleSelect(profile.username)}
                    className="w-full text-left flex items-center gap-3 px-3 py-2 hover:bg-[var(--bg-elevated)] transition-colors focus:bg-[var(--bg-elevated)] focus:outline-none"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-[var(--border-primary)] flex-shrink-0">
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={profile.username || 'Avatar'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[var(--accent-green-bg)] flex items-center justify-center text-xs font-bold text-[var(--accent-green)]">
                          {(profile.full_name || profile.username)[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="overflow-hidden flex-1">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {profile.full_name || profile.username}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)] truncate">
                        @{profile.username}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-sm text-[var(--text-tertiary)] text-center">
              No users found matching "{query}"
            </div>
          )}
          
          <div className="px-3 py-2 border-t border-[var(--border-primary)] bg-[var(--bg-elevated)]/50">
            <Link 
              href={`/${query.trim()}`} 
              onClick={() => setIsOpen(false)}
              className="text-xs text-[var(--accent-green)] hover:underline flex items-center justify-between"
            >
              <span>Search exactly "@{query}"</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
