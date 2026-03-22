'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { searchCorpus, type CorpusSearchResult } from '@/lib/api/corpus'
import { X, BookOpen, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface CorpusPanelProps {
  citation: string | null
  onClose: () => void
}

export function CorpusPanel({ citation, onClose }: CorpusPanelProps) {
  const { data: session } = useSession()
  const token = session?.user?.accessToken as string
  const [results, setResults] = useState<CorpusSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!citation || !token) {
      setResults([])
      return
    }

    const fetchResults = async () => {
      setLoading(true)
      setError(null)
      try {
        // If bare number, prefix with "rule" for better search
        const BARE_NUMBER = /^\d+\.\d+/
        const searchQuery =
          BARE_NUMBER.test(citation) && !/[A-Z]/.test(citation)
            ? `rule ${citation}`
            : citation

        const data = await searchCorpus(searchQuery, token, { max_results: 5 })
        setResults(data.results)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed')
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
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
      <div className="fixed right-0 top-0 bottom-0 w-[440px] max-w-[90vw] bg-white border-l border-[#E8EBF0] shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
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
        <div className="px-5 py-3 bg-[#F5F7FA] border-b border-[#E8EBF0]">
          <code className="font-mono text-[13px] text-[#1A5FA8] bg-[#EFF6FF] border border-[#85B7EB] rounded px-2 py-1">
            {citation}
          </code>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 text-[#1A5FA8] animate-spin" />
              <span className="ml-2 text-[13px] text-[#9CA3AF]">Searching corpus…</span>
            </div>
          )}

          {error && (
            <div className="text-[13px] text-[#991B1B] py-4">{error}</div>
          )}

          {!loading && !error && results.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-6 w-6 text-[#E8EBF0] mx-auto mb-2" />
              <p className="text-[13px] text-[#9CA3AF]">
                No corpus matches found for this citation.
              </p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-4">
              {results.map((result, i) => (
                <div
                  key={`${result.section_ref}-${i}`}
                  className="border border-[#E8EBF0] rounded-lg p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {result.section_ref && (
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono px-1.5 py-0"
                      >
                        {result.section_ref}
                      </Badge>
                    )}
                    {result.rulebook_code && (
                      <Badge className="bg-navy text-white text-[10px] px-1.5 py-0">
                        {result.rulebook_code}
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {result.source_entity}
                    </Badge>
                  </div>
                  <p className="text-[12px] font-medium text-[#0B1829] mb-1">
                    {result.doc_title}
                  </p>
                  <p className="text-[12px] text-[#6B7280] leading-relaxed whitespace-pre-wrap">
                    {result.chunk_text}
                  </p>
                  {result.relevance_score > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1 flex-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#1A5FA8] rounded-full"
                          style={{ width: `${Math.round(result.relevance_score * 100)}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-[#9CA3AF]">
                        {Math.round(result.relevance_score * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
