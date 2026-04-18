'use client'

import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { listSources, searchCorpus, type CorpusSource, type CorpusSearchResult } from '@/lib/api/corpus'
import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { Search, BookOpen, FileText, Scale, Copy, Check, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const DOC_TYPE_ICONS: Record<string, React.ElementType> = {
  legislation: Scale,
  rulebook: BookOpen,
  guidance: FileText,
  circular: FileText,
}

const DOC_TYPES = ['all', 'rulebook', 'guidance', 'circular', 'legislation', 'judgment']

const JURISDICTIONS = [
  { label: 'All jurisdictions', value: '' },
  { label: 'FSRA', value: 'FSRA' },
  { label: 'DFSA', value: 'DFSA' },
  { label: 'DIFC', value: 'DIFC' },
  { label: 'ADGM RA', value: 'ADGM_RA' },
  { label: 'VARA', value: 'VARA' },
  { label: 'El Salvador', value: 'EL_SALVADOR' },
  { label: 'BVI — FSC',    value: 'BVI_FSC'     },
  { label: 'Panama — SMV', value: 'PANAMA_SMV'  },
]

const safeDecodeTitle = (title: string) => {
  try {
    return decodeURIComponent(title)
  } catch {
    return title
  }
}

function CorpusPageInner() {
  const { data: session } = useSession()
  const token = session?.user?.accessToken as string
  const searchParams = useSearchParams()

  const initialRef = searchParams.get('section_ref') ?? ''
  const initialQ   = searchParams.get('q') ?? ''
  const initialSearch = initialRef || initialQ

  const [searchQuery, setSearchQuery] =
    useState(initialSearch)
  const [debouncedQuery, setDebouncedQuery] =
    useState(initialSearch)
  const [docType, setDocType] = useState<string>('all')
  const [jurisdiction, setJurisdiction] = useState<string>('')
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [copiedRef, setCopiedRef] = useState<string | null>(null)
  const resultRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const deepLinkRef = useRef<string | null>(null)

  useEffect(() => {
    // Handle subsequent navigations to the
    // corpus page with new URL params
    const ref = searchParams.get('section_ref')
    const q   = searchParams.get('q')
    if (ref) {
      setSearchQuery(ref)
      setDebouncedQuery(ref)
      setJurisdiction('')
      setDocType('all')
      deepLinkRef.current = ref
    } else if (q) {
      setSearchQuery(q)
      setDebouncedQuery(q)
    }
  }, [searchParams])

  // Set deepLinkRef on initial load if section_ref
  // was in the URL (useState already set the query)
  useEffect(() => {
    if (initialRef) {
      deepLinkRef.current = initialRef
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 400)
    return () => clearTimeout(t)
  }, [searchQuery])

  const isSearchMode = debouncedQuery.trim().length > 0

  const { data: sourcesData, isLoading: sourcesLoading } = useQuery({
    queryKey: ['corpus-sources', jurisdiction, docType],
    queryFn: () => listSources(token, {
      source_entity: jurisdiction || undefined,
      doc_type: docType !== 'all' ? docType : undefined,
    }),
    enabled: !!token && !isSearchMode,
  })

  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ['corpus-search', debouncedQuery, jurisdiction, docType],
    queryFn: () => searchCorpus(debouncedQuery, token, {
      source_entity: jurisdiction || undefined,
      doc_type: docType !== 'all' ? docType : undefined,
      max_results: 20,
    }),
    enabled: !!token && isSearchMode,
  })

  const isLoading = isSearchMode ? searchLoading : sourcesLoading
  const sources: CorpusSource[] = !isSearchMode ? (sourcesData ?? []) : []
  const searchResults: CorpusSearchResult[] = isSearchMode ? (searchData?.results ?? []) : []
  const totalCount = isSearchMode ? (searchData?.total ?? 0) : sources.length

  // Filter sources client-side by title when not in search mode
  const filteredSources = sources.filter((s) =>
    !searchQuery || s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.rulebook_code?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const copyLink = useCallback((sectionRef: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const url = `${window.location.origin}/corpus?section_ref=${encodeURIComponent(sectionRef)}`
    navigator.clipboard.writeText(url).catch(() => undefined)
    setCopiedRef(sectionRef)
    setTimeout(() => setCopiedRef(null), 1500)
  }, [])

  // Auto-scroll to deep-linked section_ref once results load
  useEffect(() => {
    if (!deepLinkRef.current || searchResults.length === 0) return
    const ref = deepLinkRef.current
    const idx = searchResults.findIndex((r) => r.section_ref === ref)
    if (idx !== -1) {
      setExpandedIndex(idx)
      requestAnimationFrame(() => {
        const el = resultRefs.current.get(ref)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    }
    deepLinkRef.current = null
  }, [searchResults])

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Corpus Browser</h1>
        <p className="text-[14px] text-gray-500">
          {totalCount.toLocaleString()} {isSearchMode ? 'results' : 'documents'} across ADGM, DIFC, VARA, El Salvador, BVI and Panama
        </p>
      </div>

      {/* Search + filters */}
      <div className="space-y-3 mb-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search corpus…"
              className="pl-10 text-[14px]"
            />
          </div>
          <select
            value={jurisdiction}
            onChange={(e) => setJurisdiction(e.target.value)}
            className="text-[12px] px-3 py-1.5 rounded-lg border border-[#E8EBF0] bg-white text-[#6B7280]"
          >
            {JURISDICTIONS.map((j) => (
              <option key={j.value} value={j.value}>{j.label}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-1.5">
          {DOC_TYPES.map((dt) => (
            <button
              key={dt}
              onClick={() => setDocType(dt)}
              className={`text-[12px] px-3 py-1.5 rounded-full capitalize transition-colors ${
                docType === dt
                  ? 'bg-[#0B1829] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {dt}
            </button>
          ))}
        </div>
      </div>

      {/* Search results mode */}
      {isSearchMode && (
        <div className="space-y-2">
          {searchResults.map((result, i) => {
            const isExpanded = expandedIndex === i
            return (
              <Card
                key={`${result.section_ref}-${i}`}
                ref={(el) => {
                  if (el && result.section_ref) resultRefs.current.set(result.section_ref, el)
                }}
                className={`p-4 cursor-pointer transition-colors ${isExpanded ? 'bg-[#F5F7FA] border-[#0B1829]' : 'hover:bg-gray-50'}`}
                onClick={() => setExpandedIndex(isExpanded ? null : i)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {result.section_ref && (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono px-1.5 py-0 cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={(e) => copyLink(result.section_ref, e)}
                          title="Copy link to this provision"
                        >
                          {result.section_ref}
                        </Badge>
                      )}
                      {result.rulebook_code && (
                        <Badge className="bg-[#0B1829] text-white text-[10px] px-1.5 py-0">
                          {result.rulebook_code}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                        {result.source_entity}
                      </Badge>
                      {result.is_current && (
                        <span className="flex items-center gap-1 text-[10px] text-[#16A34A]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] font-medium text-gray-900 mb-1">
                      {safeDecodeTitle(result.doc_title)}
                    </p>
                    <p className={`text-[12px] text-gray-600 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                      {result.chunk_text}
                    </p>

                    {/* Expanded detail panel */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500">
                          {result.section_ref && (
                            <span><span className="font-semibold text-gray-700">Section:</span> {result.section_ref}</span>
                          )}
                          {result.rulebook_code && (
                            <span><span className="font-semibold text-gray-700">Rulebook:</span> {result.rulebook_code}</span>
                          )}
                          {result.effective_date && (
                            <span><span className="font-semibold text-gray-700">Effective:</span> {result.effective_date}</span>
                          )}
                          {result.version && (
                            <span><span className="font-semibold text-gray-700">Version:</span> {result.version}</span>
                          )}
                        </div>
                        {result.source_url && (
                          <a
                            href={result.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-block text-[11px] text-[#1A5FA8] hover:underline"
                          >
                            View source document &rarr;
                          </a>
                        )}
                        <button
                          onClick={(e) => copyLink(result.section_ref, e)}
                          className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-800 transition-colors"
                        >
                          {copiedRef === result.section_ref ? (
                            <><Check size={12} className="text-[#16A34A]" /> Copied!</>
                          ) : (
                            <><Copy size={12} /> Copy link</>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                  {/* Relevance bar + expand indicator */}
                  <div className="w-[60px] flex-shrink-0 pt-1">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0B1829] rounded-full"
                        style={{ width: `${Math.max(20, 95 - i * 8)}%` }}
                      />
                    </div>
                    <p className="text-[9px] text-gray-400 text-right mt-0.5">
                      {Math.round(result.relevance_score * 100)}%
                    </p>
                    <ChevronDown
                      size={14}
                      className={`text-gray-400 mx-auto mt-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Browse mode */}
      {!isSearchMode && (
        <div className="space-y-2">
          {filteredSources.slice(0, 50).map((doc) => {
            const Icon = DOC_TYPE_ICONS[doc.doc_type] ?? FileText
            return (
              <Card
                key={doc.doc_id}
                className="p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setSearchQuery(doc.rulebook_code || doc.title || doc.source_key)}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-gray-900 truncate">
                      {doc.title ? safeDecodeTitle(doc.title) : (doc.source_key || `Document #${doc.doc_id}`)}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-gray-400">
                      {doc.rulebook_code && (
                        <Badge className="bg-[#0B1829] text-white text-[10px] px-1.5 py-0">
                          {doc.rulebook_code}
                        </Badge>
                      )}
                      <span className="capitalize">{doc.doc_type}</span>
                      {doc.word_count > 0 && (
                        <span>{doc.word_count.toLocaleString()} words</span>
                      )}
                      {doc.is_current && (
                        <span className="flex items-center gap-1 text-[#16A34A]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                          Current
                        </span>
                      )}
                      {doc.version && <span>v{doc.version}</span>}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (isSearchMode ? searchResults.length === 0 : filteredSources.length === 0) && (
        <div className="text-center py-16">
          <BookOpen className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-[14px] text-gray-500">No documents found.</p>
        </div>
      )}
    </div>
  )
}

export default function CorpusPage() {
  return (
    <Suspense>
      <CorpusPageInner />
    </Suspense>
  )
}
