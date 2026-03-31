'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

const ACTIONS = [
  { label: 'Set up a new entity',           href: '/compliance/entities/new', mono: 'entity · governance suite' },
  { label: 'Research a regulatory question', href: '/query',                   mono: 'deep research · 10 agents' },
  { label: 'Browse the regulatory corpus',   href: '/corpus',                  mono: '65,822 provisions' },
  { label: 'Explore jurisdictions',          href: '/corpus',                  mono: 'ADGM · VARA · El Salvador' },
]

export default function DashboardPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [query, setQuery] = useState('')

  function handleSubmit() {
    if (!query.trim()) return
    router.push(`/query?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center
                    min-h-[calc(100vh-52px)] px-6">
      <div className="w-full max-w-[680px]">

        {/* Q mark */}
        <div className="w-16 h-16 bg-black flex items-center justify-center mb-10">
          <span className="text-white font-black text-3xl leading-none">Q</span>
        </div>

        {/* Heading */}
        <h1 className="text-[clamp(36px,3.5vw,52px)] font-black uppercase tracking-tighter
                       text-black mb-8 leading-[0.95]">
          What would you like<br />to work on today?
        </h1>

        {/* Input — routes to full research */}
        <div className="flex mb-6 border border-black/20
                        focus-within:border-[#0047FF] transition-colors">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
            placeholder="Ask a regulatory question, or describe what you need…"
            className="flex-1 px-5 py-4 font-mono text-[13px] text-black
                       placeholder:text-black/25 bg-white border-none outline-none"
          />
          <button
            onClick={handleSubmit}
            disabled={!query.trim()}
            className="w-14 bg-black text-white flex items-center justify-center
                       hover:bg-[#0047FF] disabled:bg-black/15 transition-colors shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h10M7.5 3l4.5 4-4.5 4" stroke="currentColor"
                    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Hint */}
        <p className="font-mono text-[10px] text-black/20 uppercase tracking-[0.2em] mb-8">
          Enter to search · or choose below
        </p>

        {/* Action list */}
        <div className="border-t border-black/10">
          {ACTIONS.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center justify-between w-full py-4
                         border-b border-black/10 px-0
                         hover:bg-black/[0.025] transition-colors group"
            >
              <span className="font-mono text-[12px] font-medium text-black/70
                               uppercase tracking-[0.08em]
                               group-hover:text-black transition-colors">
                {action.label}
              </span>
              <span className="font-mono text-[10px] text-black/25 uppercase
                               tracking-[0.2em] group-hover:text-black/40 transition-colors">
                {action.mono} →
              </span>
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
}
