'use client'

import { useState } from 'react'
import { createLog } from '@/app/dashboard/actions'

export default function LogEditor() {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSubmit = async () => {
    if (!content.trim()) return
    setIsSubmitting(true)

    try {
      const result = await createLog(content)
      if (result.success) {
        setContent('')
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 3000)
      }
    } catch {
      // Handle error
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="terminal-editor">
      <div className="terminal-header">
        <span className="terminal-title">STANDUP_LOG.MD</span>
        <div className="terminal-dots">
          <span className="terminal-dot terminal-dot-red" />
          <span className="terminal-dot terminal-dot-yellow" />
          <span className="terminal-dot terminal-dot-green" />
        </div>
      </div>
      <div className="terminal-body">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`### What did I do today?\n\n- Implemented the new Obsidian Ledger auth flow\n- Fixed race condition in sync worker\n- Refactored typography tokens...`}
          disabled={isSubmitting}
        />
      </div>
      <div className="flex items-center justify-between p-4 border-t border-[var(--border-primary)]">
        <div>
          {showSuccess && (
            <span className="text-sm text-[var(--accent-green)] animate-fade-in flex items-center gap-1.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Log committed successfully!
            </span>
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          className="btn btn-secondary btn-sm font-mono tracking-wider"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
              Committing...
            </span>
          ) : (
            'COMMIT LOG'
          )}
        </button>
      </div>
    </div>
  )
}
