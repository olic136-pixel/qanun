'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Loader2, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { quickLookup, type QuickLookupResult } from '@/lib/api/quicklookup'
import { useEntity } from '@/lib/entity-context'
import { useQuery } from '@tanstack/react-query'
import { getAlerts, type AlertObject } from '@/lib/api/alerts'

const ACTIONS = [
  { label: 'Set up a new entity',            href: '/compliance/entities/new', mono: 'entity · governance suite' },
  { label: 'Launch a governance suite',      href: '/compliance/governance-suite', mono: '5 tiers · 112 templates' },
  { label: 'Research a regulatory question', href: '/query',                   mono: 'deep research · 10 agents' },
  { label: 'Browse the regulatory corpus',   href: '/corpus',                  mono: '67,056 provisions' },
]

const JURISDICTION_TABS = [
  { code: 'ADGM',        label: 'ADGM / FSRA' },
  { code: 'VARA',        label: 'VARA \u2014 Dubai' },
  { code: 'EL_SALVADOR', label: 'El Salvador' },
  { code: 'BVI',         label: 'BVI \u2014 FSC' },
  { code: 'PANAMA',      label: 'Panama \u2014 SMV' },
]

// ── Alert severity icon ───────────────────────────────────────
function AlertIcon({ level }: { level: AlertObject['alert_level'] }) {
  if (level === 'high')   return <AlertCircle   size={13} className="text-[#991B1B] shrink-0 mt-0.5" strokeWidth={1.5} />
  if (level === 'medium') return <AlertTriangle size={13} className="text-[#D97706] shrink-0 mt-0.5" strokeWidth={1.5} />
  return                         <Info          size={13} className="text-[#0047FF] shrink-0 mt-0.5" strokeWidth={1.5} />
}

// ── Circular readiness gauge ──────────────────────────────────
function ReadinessGauge({ pct }: { pct: number }) {
  const r = 40
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  const color = pct >= 100 ? '#059669' : pct > 0 ? '#D97706' : '#9CA3AF'

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#00000010" strokeWidth="6" />
        <circle
          cx="48" cy="48" r={r} fill="none"
          stroke={color} strokeWidth="6"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="butt"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-black text-[18px] leading-none text-black">{Math.round(pct)}%</span>
        <span className="font-mono text-[8px] text-black/30 uppercase tracking-[0.15em] mt-0.5">ready</span>
      </div>
    </div>
  )
}

// ── Search + action tiles (shared between State A and State B) ─
function SearchBlock({
  query, setQuery, jurisdiction, setJurisdiction,
  loading, result, error, handleSubmit, handleReset,
}: {
  query: string
  setQuery: (v: string) => void
  jurisdiction: string
  setJurisdiction: (v: string) => void
  loading: boolean
  result: QuickLookupResult | null
  error: string
  handleSubmit: () => void
  handleReset: () => void
}) {
  const router = useRouter()
  return (
    <>
      {/* Jurisdiction tabs */}
      <div className="flex gap-0 mb-3 overflow-x-auto">
        {JURISDICTION_TABS.map((j) => (
          <button
            key={j.code}
            onClick={() => { setJurisdiction(j.code); handleReset() }}
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
      <div className="flex mb-3 border border-black/20 focus-within:border-[#0047FF] transition-colors">
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

      {/* Hint / clear row */}
      <div className="flex items-center justify-between mb-4">
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
        <div className="border border-red-200 bg-red-50 px-4 py-3 mb-4
                        font-mono text-[12px] text-red-700">
          {error}
        </div>
      )}

      {/* Quick Lookup Result */}
      {result && (
        <div className="mb-6 border border-black/10">
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
          {result.passages.length > 0 && (
            <div className="px-5 py-4">
              <p className="font-mono text-[10px] text-black/30 uppercase tracking-[0.2em] mb-3">
                Sources ({result.passages.length})
              </p>
              <div className="space-y-2">
                {result.passages.slice(0, 5).map((p, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 py-2 border-b border-black/5 last:border-0
                               cursor-pointer hover:bg-black/[0.015] -mx-2 px-2 transition-colors"
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
    </>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken || ''

  const [query, setQuery]           = useState('')
  const [jurisdiction, setJurisdiction] = useState('ADGM')
  const [loading, setLoading]       = useState(false)
  const [result, setResult]         = useState<QuickLookupResult | null>(null)
  const [error, setError]           = useState('')

  const { entities, loading: entitiesLoading, selectedEntity } = useEntity()

  // Fetch unresolved alerts for needs-attention panel
  const { data: alertsData } = useQuery({
    queryKey: ['dashboard-alerts'],
    queryFn:  () => getAlerts(token, false),
    enabled:  !!token && entities.length > 0,
    refetchInterval: 60_000,
  })
  const unresolvedAlerts = alertsData?.alerts?.slice(0, 3) ?? []

  async function handleSubmit() {
    if (!query.trim() || !token) return
    setLoading(true)
    setResult(null)
    setError('')
    try {
      const res = await quickLookup(query.trim(), jurisdiction, token)
      setResult(res)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lookup failed')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setQuery('')
    setResult(null)
    setError('')
  }

  // ── State A: no entities yet ──────────────────────────────
  const hasEntities = !entitiesLoading && entities.length > 0

  if (!hasEntities) {
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

          <SearchBlock
            query={query} setQuery={setQuery}
            jurisdiction={jurisdiction} setJurisdiction={setJurisdiction}
            loading={loading} result={result} error={error}
            handleSubmit={handleSubmit} handleReset={handleReset}
          />

          {/* Action tiles */}
          {!result && (
            <div className="border-t border-black/10">
              {ACTIONS.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center justify-between w-full py-4
                             border-b border-black/10
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

  // ── State B: returning user — two-column layout ───────────
  const active = selectedEntity ?? entities[0]
  // Find the full entity data (with completionPct) from the entities array
  const activeEntity = entities.find(e => e.id === active?.id) ?? entities[0]
  const otherEntities = entities.filter(e => e.id !== activeEntity?.id)

  // Missing docs count: if the entity has completionPct < 100, infer missing
  const missingCount = activeEntity
    ? Math.max(0, 100 - Math.round(activeEntity.completionPct))
    : 0

  return (
    <div className="flex gap-6 min-h-[calc(100vh-52px-48px)]">

      {/* ── Left column: active entity card ──────────────── */}
      <div className="w-[260px] shrink-0 flex flex-col gap-4">

        {/* Active entity card */}
        <div className="border border-black/10 bg-white p-5">
          {/* Category badge */}
          <p className="font-mono text-[9px] text-black/30 uppercase tracking-[0.2em] mb-2">
            {activeEntity?.category?.replace(/_/g, ' ') ?? 'Entity'}
          </p>
          {/* Name */}
          <h2 className="font-black text-[15px] uppercase tracking-tight text-black
                         leading-tight mb-4">
            {activeEntity?.name ?? '—'}
          </h2>

          {/* Gauge */}
          <div className="flex justify-center mb-4">
            <ReadinessGauge pct={activeEntity?.completionPct ?? 0} />
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="border border-black/10 px-3 py-2 text-center">
              <p className="font-black text-[20px] text-black leading-none">
                {Math.round(activeEntity?.completionPct ?? 0)}%
              </p>
              <p className="font-mono text-[8px] text-black/30 uppercase tracking-[0.15em] mt-1">
                Complete
              </p>
            </div>
            <div className="border border-black/10 px-3 py-2 text-center">
              <p className={`font-black text-[20px] leading-none ${
                unresolvedAlerts.length > 0 ? 'text-[#991B1B]' : 'text-black'
              }`}>
                {unresolvedAlerts.length}
              </p>
              <p className="font-mono text-[8px] text-black/30 uppercase tracking-[0.15em] mt-1">
                Alerts
              </p>
            </div>
          </div>

          {/* View entity link */}
          <Link
            href={`/entity/${activeEntity?.id}`}
            className="block w-full text-center font-mono text-[10px] uppercase
                       tracking-[0.15em] py-2.5 bg-black text-white
                       hover:bg-[#0047FF] transition-colors"
          >
            View entity →
          </Link>
        </div>

        {/* Other entities */}
        {otherEntities.length > 0 && (
          <div className="border border-black/10 bg-white">
            <p className="font-mono text-[9px] text-black/25 uppercase tracking-[0.2em]
                          px-4 pt-3 pb-2">
              Other entities
            </p>
            {otherEntities.map(e => (
              <Link
                key={e.id}
                href={`/entity/${e.id}`}
                className="flex items-center gap-2 px-4 py-2.5 border-t border-black/5
                           hover:bg-black/[0.03] transition-colors group"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: e.completionPct >= 100 ? '#059669'
                      : e.completionPct > 0 ? '#D97706' : '#9CA3AF'
                  }}
                />
                <span className="font-mono text-[10px] text-black/55 uppercase
                                 tracking-[0.08em] truncate flex-1
                                 group-hover:text-black transition-colors">
                  {e.name}
                </span>
                <span className="font-mono text-[9px] text-black/25 shrink-0">
                  {e.completionPct > 0 ? `${Math.round(e.completionPct)}%` : '—'}
                </span>
              </Link>
            ))}
            <Link
              href="/compliance/entities/new"
              className="flex items-center gap-2 px-4 py-2.5 border-t border-black/5
                         hover:bg-black/[0.03] transition-colors"
            >
              <span className="font-mono text-[10px] text-[#0047FF] uppercase
                               tracking-[0.08em]">
                + New entity
              </span>
            </Link>
          </div>
        )}
      </div>

      {/* ── Right column: search + needs attention ────────── */}
      <div className="flex-1 min-w-0 flex flex-col gap-6">

        {/* Search block */}
        <div>
          <SearchBlock
            query={query} setQuery={setQuery}
            jurisdiction={jurisdiction} setJurisdiction={setJurisdiction}
            loading={loading} result={result} error={error}
            handleSubmit={handleSubmit} handleReset={handleReset}
          />
        </div>

        {/* Needs attention — only shown when no search result */}
        {!result && (
          <div>
            <p className="font-mono text-[9px] text-black/30 uppercase tracking-[0.25em] mb-3">
              Needs attention
            </p>

            {unresolvedAlerts.length === 0 && missingCount === 0 ? (
              /* All clear state */
              <div className="border border-black/10 bg-white px-5 py-4
                              flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[#059669] shrink-0" />
                <span className="font-mono text-[11px] text-black/40 uppercase tracking-[0.1em]">
                  Everything looks good
                </span>
                <Link
                  href="/corpus"
                  className="ml-auto font-mono text-[10px] text-[#0047FF] uppercase
                             tracking-[0.15em] hover:text-black transition-colors"
                >
                  Browse corpus →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Unresolved alerts */}
                {unresolvedAlerts.map(alert => (
                  <div
                    key={alert.alert_id}
                    className="border border-black/10 bg-white px-5 py-4
                               flex items-start gap-3 cursor-pointer
                               hover:border-black/20 transition-colors"
                    onClick={() => router.push('/alerts')}
                  >
                    <AlertIcon level={alert.alert_level} />
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[11px] text-black font-medium
                                   uppercase tracking-[0.08em] truncate">
                        {alert.title}
                      </p>
                      <p className="font-mono text-[10px] text-black/35 mt-0.5 line-clamp-1">
                        {alert.affected_rule}
                      </p>
                    </div>
                    <span className={`font-mono text-[9px] uppercase tracking-[0.1em]
                                     px-2 py-1 shrink-0 ${
                      alert.alert_level === 'high'   ? 'bg-[#991B1B]/10 text-[#991B1B]'
                      : alert.alert_level === 'medium' ? 'bg-[#D97706]/10 text-[#D97706]'
                      : 'bg-[#0047FF]/10 text-[#0047FF]'
                    }`}>
                      {alert.alert_level}
                    </span>
                  </div>
                ))}

                {/* Resolve all link if alerts present */}
                {unresolvedAlerts.length > 0 && (
                  <Link
                    href="/alerts"
                    className="block font-mono text-[10px] text-black/30 uppercase
                               tracking-[0.2em] hover:text-black/60 transition-colors py-1"
                  >
                    View all alerts →
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* Quick action rows — shown when no result and no alerts needing attention */}
        {!result && unresolvedAlerts.length === 0 && (
          <div className="border-t border-black/10">
            {ACTIONS.slice(1).map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center justify-between w-full py-3.5
                           border-b border-black/10
                           hover:bg-black/[0.025] transition-colors group"
              >
                <span className="font-mono text-[11px] font-medium text-black/60
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
