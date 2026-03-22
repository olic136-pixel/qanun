'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createSession, getSessions } from '@/lib/api/query'
import { useState, useEffect, useRef, Suspense } from 'react'
import { Loader2, Clock } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

const JURISDICTIONS = [
  { id: 'ADGM', label: 'ADGM / FSRA' },
  { id: 'DIFC', label: 'DIFC / DFSA' },
  { id: 'EL_SALVADOR', label: 'El Salvador' },
]

const EXAMPLES = [
  'PRU 1.3.3(2) — matched principal conditions',
  'COBS 23.12.2 — copy trading and block-delegation',
  'Category 3A vs 3C — what triggers reclassification?',
]

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'yesterday'
  return `${days}d ago`
}

function QueryPageInner() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const token = session?.user?.accessToken as string

  const [queryText, setQueryText] = useState('')
  const [activeJurisdictions, setActiveJurisdictions] = useState<string[]>(['ADGM'])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions-recent'],
    queryFn: () => getSessions(token, { limit: 6 }),
    enabled: !!token,
  })

  useEffect(() => {
    const q = searchParams.get('q')
    const j = searchParams.get('jurisdiction')
    if (q) setQueryText(q)
    if (j) {
      const match = JURISDICTIONS.find(
        (jur) => jur.id === j || jur.label === j
      )
      if (match) setActiveJurisdictions([match.id])
    }
  }, [searchParams])

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 360) + 'px'
    }
  }, [queryText])

  const toggleJurisdiction = (id: string) => {
    setActiveJurisdictions((prev) => {
      const next = prev.includes(id) ? prev.filter((j) => j !== id) : [...prev, id]
      return next.length === 0 ? prev : next
    })
  }

  const handleSubmit = async () => {
    if (!queryText.trim() || !session?.user?.accessToken) return
    if (activeJurisdictions.length === 0) {
      setError('Select at least one jurisdiction')
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      const result = await createSession(
        {
          query: queryText.trim(),
          jurisdictions: activeJurisdictions,
        },
        session.user.accessToken as string
      )
      router.push(`/query/${result.session_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create query session')
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  const selectExample = (text: string) => {
    setQueryText(text)
    textareaRef.current?.focus()
  }

  const canSubmit = queryText.trim().length > 0 && !isSubmitting
  const recentSessions = sessionsData?.sessions ?? []

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-[22px] font-medium text-[#0B1829]">New query</h1>
        <p className="text-[13px] text-[#6B7280] mt-0.5">
          Ask anything across the regulatory corpus.
        </p>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 flex-1 min-h-0">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-4">
          {/* Query card */}
          <div className="bg-white border border-[#E8EBF0] rounded-xl p-5 flex flex-col flex-1">
            <textarea
              ref={textareaRef}
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. What are the four conditions for dealing as Matched Principal under PRU 1.3.3(2), and does a dual-entity structure satisfy each condition?"
              disabled={isSubmitting}
              className="flex-1 min-h-[180px] resize-none bg-transparent border-none outline-none text-[14px] text-[#111827] leading-relaxed w-full placeholder:text-[#9CA3AF]"
            />

            <div className="border-t border-[#E8EBF0] my-3" />

            <div className="flex items-center justify-between">
              {/* Jurisdiction chips */}
              <div className="flex items-center gap-1.5">
                {JURISDICTIONS.map((j) => {
                  const active = activeJurisdictions.includes(j.id)
                  return (
                    <button
                      key={j.id}
                      onClick={() => toggleJurisdiction(j.id)}
                      disabled={isSubmitting}
                      className={`text-[11px] font-medium px-3 py-1.5 rounded-full cursor-pointer transition-colors duration-100 ${
                        active
                          ? 'bg-[#0B1829] text-[#C4922A]'
                          : 'bg-white text-[#6B7280] border border-[#E8EBF0] hover:border-[#9CA3AF]'
                      }`}
                    >
                      {j.label}
                    </button>
                  )
                })}
              </div>

              {/* Right: hint + button */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-[#9CA3AF] hidden sm:inline">⌘↵</span>
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className={`h-[38px] px-5 rounded-md text-[13px] font-medium transition-all duration-150 ${
                    canSubmit
                      ? 'bg-[#0B1829] text-[#C4922A] hover:bg-[#1A5FA8] hover:text-white'
                      : 'bg-[#F5F7FA] text-[#9CA3AF] cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-[14px] w-[14px] animate-spin" />
                  ) : (
                    'Run query →'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-[13px] text-[#991B1B]">{error}</p>
            </div>
          )}

          {/* Example queries */}
          <div>
            <p className="text-[11px] text-[#9CA3AF] uppercase tracking-[0.06em] mb-2">
              Try an example
            </p>
            <div className="flex flex-col gap-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => selectExample(ex)}
                  className="border border-[#E8EBF0] rounded-lg px-3 py-2.5 text-[12px] text-[#6B7280] hover:border-[#1A5FA8] hover:text-[#1A5FA8] bg-white cursor-pointer transition-colors duration-100 text-left"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-4">
          {/* Recent sessions */}
          <div className="bg-white border border-[#E8EBF0] rounded-xl p-4 flex-1">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[13px] font-medium text-[#0B1829]">
                Recent sessions
              </span>
              <Link
                href="/sessions"
                className="text-[12px] text-[#1A5FA8] hover:underline"
              >
                View all →
              </Link>
            </div>

            {sessionsLoading && (
              <div className="space-y-1.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-[48px] bg-[#F5F7FA] rounded-lg"
                  />
                ))}
              </div>
            )}

            {!sessionsLoading && recentSessions.length === 0 && (
              <p className="text-[12px] text-[#9CA3AF] text-center py-4">
                No sessions yet — run your first query
              </p>
            )}

            {!sessionsLoading && recentSessions.length > 0 && (
              <div className="space-y-1.5">
                {recentSessions.map((s) => (
                  <button
                    key={s.session_id}
                    onClick={() => router.push(`/query/${s.session_id}`)}
                    className="w-full bg-[#F5F7FA] hover:bg-[#EFF6FF] rounded-lg px-3 py-2.5 cursor-pointer transition-colors text-left"
                  >
                    <p className="text-[11px] text-[#111827] font-medium line-clamp-1">
                      {s.query_text}
                    </p>
                    <div className="text-[10px] text-[#9CA3AF] mt-0.5 flex items-center gap-2">
                      <Clock className="h-[10px] w-[10px]" />
                      <span>{relativeTime(s.created_at)}</span>
                      <span>·</span>
                      <span>{s.claims_count} claims</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Corpus status */}
          <div className="bg-white border border-[#E8EBF0] rounded-xl p-4">
            <p className="text-[11px] text-[#9CA3AF] uppercase tracking-[0.06em] mb-2">
              Corpus
            </p>
            <div className="space-y-1.5">
              {[
                { label: 'Documents', value: '2,484' },
                { label: 'Sections', value: '63,397' },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between text-[12px]"
                >
                  <span className="text-[#6B7280]">{row.label}</span>
                  <span className="text-[#0B1829] font-medium">
                    {row.value}
                  </span>
                </div>
              ))}
              <div className="flex justify-between text-[12px]">
                <span className="text-[#6B7280]">Status</span>
                <span className="text-[#0F7A5F] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0F7A5F] animate-pulse" />
                  Live
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function QueryPage() {
  return (
    <Suspense>
      <QueryPageInner />
    </Suspense>
  )
}
