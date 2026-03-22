'use client'

import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/client'
import { useState } from 'react'
import { Search, BookOpen, FileText, Scale } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const DOC_TYPE_ICONS: Record<string, React.ElementType> = {
  legislation: Scale,
  rulebook: BookOpen,
  guidance: FileText,
}

export default function CorpusPage() {
  const { data: session } = useSession()
  const token = session?.user?.accessToken as string
  const [search, setSearch] = useState('')
  const [docType, setDocType] = useState<string>('all')

  const { data, isLoading } = useQuery({
    queryKey: ['corpus', docType],
    queryFn: () =>
      apiFetch<{
        documents: Array<{
          doc_id: string
          title: string
          doc_type: string
          source_entity: string
          effective_date: string | null
          sections_count: number
        }>
        total: number
      }>(`/api/corpus${docType !== 'all' ? `?doc_type=${docType}` : ''}`, { token }),
    enabled: !!token,
  })

  const docs = (data?.documents ?? []).filter(
    (d) =>
      !search ||
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.source_entity?.toLowerCase().includes(search.toLowerCase())
  )

  const docTypes = ['all', 'legislation', 'rulebook', 'guidance', 'consultation', 'amendment']

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Corpus Browser</h1>
        <p className="text-[14px] text-gray-500">
          {data?.total ?? 0} documents across ADGM, DIFC, and El Salvador
        </p>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents…"
            className="pl-10 text-[14px]"
          />
        </div>
        <div className="flex gap-1.5">
          {docTypes.map((dt) => (
            <button
              key={dt}
              onClick={() => setDocType(dt)}
              className={`text-[12px] px-3 py-1.5 rounded-full capitalize transition-colors ${
                docType === dt
                  ? 'bg-navy text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {dt}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {docs.slice(0, 50).map((doc) => {
          const Icon = DOC_TYPE_ICONS[doc.doc_type] ?? FileText
          return (
            <Card key={doc.doc_id} className="p-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-gray-900 truncate">{doc.title}</p>
                  <div className="flex items-center gap-2 text-[11px] text-gray-400">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{doc.source_entity}</Badge>
                    <span>{doc.doc_type}</span>
                    {doc.sections_count > 0 && <span>{doc.sections_count} sections</span>}
                    {doc.effective_date && <span>{new Date(doc.effective_date).toLocaleDateString()}</span>}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {docs.length === 0 && (
        <div className="text-center py-16">
          <BookOpen className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-[14px] text-gray-500">No documents found.</p>
        </div>
      )}
    </div>
  )
}
