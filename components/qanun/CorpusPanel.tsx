'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { apiFetch } from '@/lib/api/client'
import { X, BookOpen, Loader2, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface PassageResult {
  section_ref?: string
  chunk_text?: string
  text?: string
  current_text?: string
  doc_title?: string
  title?: string
  rulebook_code?: string
  source_entity?: string
  source_tier?: number
  is_current?: boolean
  found?: boolean
  relevance_score?: number
  citation?: string
  version?: string | null
  effective_date?: string | null
  source_url?: string
}

interface CorpusPanelProps {
  citation: string | null
  onClose: () => void
}

function formatRuleText(raw: string, cit: string): string[] {
  if (!raw) return []
  let text = raw
  // 1. Strip leading rule number if it matches citation
  const numOnly = cit.replace(/^[A-Z]+\s+/i, '').trim()
  if (numOnly) {
    const escaped = numOnly.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    text = text.replace(new RegExp(`^\\s*(?:[A-Z]+\\s+)?${escaped}\\s+`), '')
  }
  // 2. Join soft line wraps (single \n) — PDF artifacts
  text = text.replace(/([^.\n])\n([^\n])/g, '$1 $2')
  text = text.replace(/([,:;])\n([^\n])/g, '$1 $2')
  // 3. Split on real paragraph breaks (double newlines)
  return text
    .split(/\n\n+/)
    .map((p) => p.replace(/\n/g, ' ').trim())
    .filter((p) => {
      if (!p) return false
      if (/^\d+$/.test(p)) return false // bare footnote numbers
      if (p.length < 3) return false
      return true
    })
}

export function CorpusPanel({ citation, onClose }: CorpusPanelProps) {
  const { data: session } = useSession()
  const token = session?.user?.accessToken as string
  const [passages, setPassages] = useState<PassageResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<string>('')
  const [subPassages, setSubPassages] = useState<string[]>([])
  const [subLoading, setSubLoading] = useState(false)

  // Fetch sub-rules when main text ends with ":"
  useEffect(() => {
    if (!passages.length || !token || !citation) {
      setSubPassages([])
      return
    }
    const mainText = (passages[0]?.current_text ?? '').trim()
    if (!mainText.endsWith(':')) {
      setSubPassages([])
      return
    }
    setSubLoading(true)
    const subLetters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    const baseCitation = passages[0]?.citation || citation
    Promise.all(
      subLetters.map((letter) =>
        apiFetch<{ passages: PassageResult[] }>(
          `/api/corpus/passage?section_ref=${encodeURIComponent(`${baseCitation}(${letter})`)}`,
          { token }
        )
          .then((d) => {
            const p = d?.passages?.[0]
            if (p?.found && p?.current_text) {
              let subText = p.current_text.trim()
              subText = subText.replace(/^\([a-z]\)\s*/i, '').trim()
              return `(${letter})  ${subText}`
            }
            return null
          })
          .catch(() => null)
      )
    ).then((results) => {
      setSubPassages(results.filter(Boolean) as string[])
      setSubLoading(false)
    })
  }, [passages, token, citation])

  useEffect(() => {
    if (!citation || !token) {
      setPassages([])
      return
    }

    const fetchPassage = async () => {
      setLoading(true)
      setError(null)
      setSource('')

      try {
        // Use the passage endpoint which tries get_rule first, then search_corpus
        const data = await apiFetch<{
          passages: PassageResult[]
          section_ref: string
          source: string
        }>(`/api/corpus/passage?section_ref=${encodeURIComponent(citation)}`, { token })

        setPassages(data.passages ?? [])
        setSource(data.source ?? '')
      } catch {
        // Fallback: direct search
        try {
          const BARE_NUMBER = /^\d+\.\d+/
          const q = BARE_NUMBER.test(citation) && !/[A-Z]/.test(citation)
            ? `rule ${citation}`
            : citation

          const data = await apiFetch<{
            results: PassageResult[]
          }>(`/api/corpus/search?q=${encodeURIComponent(q)}&max_results=3`, { token })

          setPassages(data.results ?? [])
          setSource('search_fallback')
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Lookup failed')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchPassage()
  }, [citation, token])

  if (!citation) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-50"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-[440px] max-w-[90vw] bg-white border-l border-[#E8EBF0] shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8EBF0]">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[#1A5FA8]" />
            <span className="text-[14px] font-medium text-[#0B1829]">
              Corpus lookup
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-[#111827] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Citation badge */}
        <div className="px-5 py-3 bg-[#F5F7FA] border-b border-[#E8EBF0] flex items-center gap-2">
          <code className="font-mono text-[13px] text-[#1A5FA8] bg-[#EFF6FF] border border-[#85B7EB] rounded px-2 py-1">
            {citation}
          </code>
          {source === 'get_rule' && (
            <span className="flex items-center gap-1 text-[10px] text-[#16A34A]">
              <CheckCircle2 className="h-3 w-3" />
              Exact match
            </span>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 text-[#1A5FA8] animate-spin" />
              <span className="ml-2 text-[13px] text-[#9CA3AF]">
                Looking up {citation}…
              </span>
            </div>
          )}

          {error && (
            <div className="text-[13px] text-[#991B1B] py-4">{error}</div>
          )}

          {!loading && !error && passages.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-6 w-6 text-[#E8EBF0] mx-auto mb-2" />
              <p className="text-[13px] text-[#9CA3AF]">
                No corpus passage found for this citation.
              </p>
            </div>
          )}

          {!loading && passages.length > 0 && (
            <div className="space-y-4">
              {passages.map((passage, i) => {
                const text = passage.current_text || passage.chunk_text || passage.text || ''
                const title = passage.doc_title || passage.title || ''
                const ref = passage.section_ref || passage.citation || ''

                return (
                  <div
                    key={`${ref}-${i}`}
                    className={`border rounded-lg p-4 ${
                      i === 0 ? 'border-[#85B7EB] bg-[#F8FBFF]' : 'border-[#E8EBF0]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      {ref && (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono px-1.5 py-0"
                        >
                          {ref}
                        </Badge>
                      )}
                      {passage.rulebook_code && (
                        <span className="text-[10px] font-mono bg-[#0B1829] text-[#C4922A] px-2 py-0.5 rounded-sm">
                          {passage.rulebook_code}
                        </span>
                      )}
                      {passage.source_entity && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {passage.source_entity}
                        </Badge>
                      )}
                      {passage.is_current && (
                        <span className="flex items-center gap-1 text-[10px] text-[#16A34A]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                          Current
                        </span>
                      )}
                      {!passage.version && title && (
                        <span className="text-[11px] text-[#9CA3AF]">
                          Current version
                        </span>
                      )}
                    </div>
                    {/* Formatted rule text — paragraphs, no truncation */}
                    <div className="space-y-3">
                      {formatRuleText(text, citation || '').map((para, pi) => (
                        <p
                          key={pi}
                          className="text-[13px] text-[#111827] leading-[1.75] font-normal"
                        >
                          {para}
                        </p>
                      ))}
                      {formatRuleText(text, citation || '').length === 0 && (
                        <p className="text-[13px] text-[#6B7280] italic">
                          No provision text available.
                        </p>
                      )}
                    </div>
                    {/* Sub-rules for sections ending with ":" */}
                    {i === 0 && subLoading && (
                      <p className="text-[11px] text-[#9CA3AF] mt-2 italic">
                        Loading sub-provisions…
                      </p>
                    )}
                    {i === 0 && subPassages.length > 0 && (
                      <div className="mt-4 space-y-2.5 border-l-2 border-[#E8EBF0] pl-4">
                        {subPassages.map((sub, si) => (
                          <p key={si} className="text-[13px] text-[#111827] leading-[1.75]">
                            {sub}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Source attribution */}
        {!loading && passages.length > 0 && (
          <div className="px-5 py-3 border-t border-[#E8EBF0] bg-[#F5F7FA]">
            <p className="text-[11px] text-[#9CA3AF]">
              Source: {passages[0]?.source_entity ?? 'FSRA'}{' '}
              {passages[0]?.rulebook_code ? `${passages[0].rulebook_code} Rulebook` : 'Corpus'}
              {passages[0]?.version
                ? ` · ${passages[0].version}`
                : ' · Current version'}
              {passages[0]?.effective_date
                ? ` · Effective ${passages[0].effective_date}`
                : ''}
            </p>
          </div>
        )}
      </div>
    </>
  )
}
