'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { quickLookup, type QuickLookupResult } from '@/lib/api/quicklookup'

const ACTIONS = [
  { label: 'Set up a new entity',           href: '/compliance/entities/new', mono: 'entity · governance suite' },
  { label: 'Research a regulatory question', href: '/query',                   mono: 'deep research · 10 agents' },
  { label: 'Browse the regulatory corpus',   href: '/corpus',                  mono: '67,056 provisions' },
  { label: 'Explore jurisdictions',          href: '/corpus',                  mono: 'ADGM · VARA · El Salvador · BVI · Panama' },
]

const JURISDICTION_TABS = [
  { code: 'ADGM',        label: 'ADGM / FSRA' },
  { code: 'VARA',        label: 'VARA \u2014 Dubai' },
  { code: 'EL_SALVADOR', label: 'El Salvador' },
  { code: 'BVI',         label: 'BVI \u2014 FSC' },
  { code: 'PANAMA',      label: 'Panama \u2014 SMV' },
]

export default function DashboardPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken || ''

  const [query, setQuery] = useState('')
  const [jurisdiction, setJurisdiction] = useState('ADGM')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<QuickLookupResult | null>(null)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!query.trim() || !token) return
    setLoading(true)
    setResult(null)
    setError('')
    try {
      const res = await quickLookup(query.trim(), jurisdiction, token)
      setResult(res)
    } catch (e: any) {
      setError(e.message || 'Lookup failed')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setQuery('')
    setResult(null)
    setError('')
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

        {/* Jurisdiction tabs */}
        <div className="flex gap-0 mb-3 overflow-x-auto">
          {JURISDICTION_TABS.map((j) => (
            <button
              key={j.code}
              onClick={() => {
                setJurisdiction(j.code)
                setResult(null)
                setError('')
              }}
              className={`font-mono text-[10px] uppercase tracking-[0.15em] px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
                jurisdiction === j.code
                  ? 'bg-black text-white border-black'
                  : 'bg-transparent text-black/40 border-transparent hover:text-black/70'
              }`}
            >
              {j.label}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex mb-3 border border-black/20
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
            disabled={!query.trim() || loading}
            className="w-14 bg-black text-white flex items-center justify-center
                       hover:bg-[#0047FF] disabled:bg-black/15 transition-colors shrink-0"
          >
            {loading
              ? <Loader2 size={14} className="animate-spin" />
              : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7h10M7.5 3l4.5 4-4.5 4" stroke="currentColor"
                        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )
            }
          </button>
        </div>

        {/* Hint row */}
        <div className="flex items-center justify-between mb-6">
          <p className="font-mono text-[10px] text-black/20 uppercase tracking-[0.2em]">
            Enter for quick lookup · or choose below
          </p>
          {result && (
            <button
              onClick={handleReset}
              className="font-mono text-[10px] text-black/30 uppercase tracking-[0.2em]
                         hover:text-black/60 transition-colors"
            >
              ← Clear
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="border border-red-200 bg-red-50 px-4 py-3 mb-6
                          font-mono text-[12px] text-red-700">
            {error}
          </div>
        )}

        {/* Quick Lookup Result */}
        {result && (
          <div className="mb-8 border border-black/10">
            {/* Answer */}
            <div className="px-5 py-5 border-b border-black/10">
              <div className="flex items-center gap-2 mb-3">
                <p className="font-mono text-[10px] text-black/30 uppercase tracking-[0.2em]">
                  Quick answer
                </p>
                <span className="font-mono text-[9px] text-black/30 uppercase">
                  {JURISDICTION_TABS.find(j => j.code === jurisdiction)?.label ?? jurisdiction}
                </span>
              </div>
              <p className="font-mono text-[13px] text-black/80 leading-relaxed whitespace-pre-wrap">
                {result.answer}
              </p>
            </div>

            {/* Source passages */}
            {result.passages.length > 0 && (
              <div className="px-5 py-4">
                <p className="font-mono text-[10px] text-black/30 uppercase tracking-[0.2em] mb-3">
                  Sources ({result.passages.length})
                </p>
                <div className="space-y-2">
                  {result.passages.slice(0, 5).map((p, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 py-2 border-b border-black/5 last:border-0 cursor-pointer hover:bg-black/[0.015] -mx-2 px-2 transition-colors"
                      onClick={() => router.push(`/corpus?section_ref=${encodeURIComponent(p.section_ref)}`)}
                    >
                      <span className="flex items-center gap-1.5 shrink-0 pt-0.5">
                        <span className="font-mono text-[10px] text-[#0047FF] font-semibold uppercase tracking-[0.05em]">
                          {p.section_ref}
                        </span>
                        {p.source_entity && (
                          <span className="font-mono text-[9px] text-black/25 uppercase">
                            {p.source_entity}
                          </span>
                        )}
                      </span>
                      <p className="font-mono text-[11px] text-black/50 leading-relaxed line-clamp-2">
                        {p.text}
                      </p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => router.push(`/query?q=${encodeURIComponent(query)}`)}
                  className="mt-4 font-mono text-[10px] text-black/30 uppercase tracking-[0.2em]
                             hover:text-black/60 transition-colors"
                >
                  Deep research this question →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Action list — hidden when result is showing */}
        {!result && (
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
        )}

      </div>
    </div>
  )
}
