'use client'

import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api/client'
import { GitCommit, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function ChangesPage() {
  const { data: session } = useSession()
  const token = session?.user?.accessToken as string

  const { data, isLoading } = useQuery({
    queryKey: ['recent-changes'],
    queryFn: () =>
      apiFetch<{
        changes: Array<{
          change_id: string
          document_title: string
          change_type: 'added' | 'amended' | 'repealed'
          effective_date: string
          source_entity: string
          summary: string
        }>
        total: number
      }>('/api/corpus/changes', { token }),
    enabled: !!token,
  })

  const CHANGE_COLORS: Record<string, string> = {
    added: 'bg-[#0F7A5F]/10 text-[#0F7A5F]',
    amended: 'bg-[#0047FF]/10 text-[#0047FF]',
    repealed: 'bg-red-100 text-[#991B1B]',
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Recent Changes</h1>
        <p className="text-[14px] text-gray-500">
          {data?.total ?? 0} corpus changes in the last 90 days
        </p>
      </div>

      {(data?.changes ?? []).length === 0 && (
        <div className="text-center py-16">
          <GitCommit className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-[14px] text-gray-500">No recent changes found.</p>
        </div>
      )}

      <div className="space-y-3">
        {(data?.changes ?? []).map((change) => (
          <Card key={change.change_id} className="p-4">
            <div className="flex items-start gap-3">
              <FileText className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[14px] font-medium text-gray-900">{change.document_title}</span>
                  <Badge className={`text-[10px] ${CHANGE_COLORS[change.change_type] ?? ''}`}>{change.change_type}</Badge>
                </div>
                {change.summary && <p className="text-[13px] text-gray-600 mb-1">{change.summary}</p>}
                <div className="flex items-center gap-3 text-[11px] text-gray-400">
                  <span>{change.source_entity}</span>
                  <span>{new Date(change.effective_date).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
