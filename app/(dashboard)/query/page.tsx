'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSession } from '@/lib/api/query'
import { useState, useEffect, useRef, Suspense } from 'react'
import { Loader2 } from 'lucide-react'

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

function QueryPageInner() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [queryText, setQueryText] = useState('')
  const [activeJurisdictions, setActiveJurisdictions] = useState<string[]>(['ADGM'])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      return next.length === 0 ? prev : next // keep at least one
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

  return (
    <div className="max-w-[680px] mx-auto w-full py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-medium text-[#0B1829]">New query</h1>
        <p className="text-[13px] text-[#6B7280] mt-1">
          Ask anything across the regulatory corpus. QANUN will search, analyse,
          and synthesise a grounded response with full citations.
        </p>
      </div>

      {/* Single query card */}
      <div className="bg-white border border-[#E8EBF0] rounded-xl p-5">
        <textarea
          ref={textareaRef}
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. What are the four conditions for dealing as Matched Principal under PRU 1.3.3(2), and does a dual-entity structure satisfy each condition?"
          disabled={isSubmitting}
          className="min-h-[140px] max-h-[360px] resize-none bg-transparent border-none outline-none text-[14px] text-[#111827] leading-relaxed w-full placeholder:text-[#9CA3AF]"
        />

        {/* Divider */}
        <div className="border-t border-[#E8EBF0] mt-4 pt-3">
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
                    className={`text-[11px] font-medium px-3 py-1 rounded-full cursor-pointer transition-colors duration-100 ${
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

            {/* Run button */}
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
        <div className="mt-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-[13px] text-[#991B1B]">{error}</p>
        </div>
      )}

      {/* Keyboard hint */}
      <p className="mt-2 text-center text-[11px] text-[#9CA3AF]">
        ⌘ Enter to submit
      </p>

      {/* Example queries */}
      <div className="mt-5">
        <p className="text-[11px] text-[#9CA3AF] uppercase tracking-[0.06em] mb-2">
          Try an example
        </p>
        <div className="flex flex-col gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => selectExample(ex)}
              className="border border-[#E8EBF0] rounded-lg px-3 py-2 text-[12px] text-[#6B7280] hover:border-[#1A5FA8] hover:text-[#1A5FA8] bg-white cursor-pointer transition-colors duration-100 text-left w-full"
            >
              {ex}
            </button>
          ))}
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
