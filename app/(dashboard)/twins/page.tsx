'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { getProductTwins as getTwins, assessTwin, type TwinSummary } from '@/lib/api/twins'
import { useState } from 'react'
import {
  Hexagon,
  CheckCircle2,
  AlertCircle,
  Archive,
  Play,
  Loader2,
  ChevronRight,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

const STATUS_STYLES: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  clear: { icon: CheckCircle2, color: 'text-teal', label: 'Clear' },
  alert: { icon: AlertCircle, color: 'text-amber-600', label: 'Alert' },
  archived: { icon: Archive, color: 'text-gray-400', label: 'Archived' },
}

export default function TwinsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const token = session?.user?.accessToken as string
  const [assessing, setAssessing] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['twins'],
    queryFn: () => getTwins(token),
    enabled: !!token,
  })

  const handleAssess = async (twinId: string) => {
    setAssessing(twinId)
    try {
      await assessTwin(twinId, token)
      alert('Assessment running — check back shortly')
    } catch {
      alert('Failed to start assessment')
    } finally {
      setAssessing(null)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Product Twins</h1>
        <p className="text-[14px] text-gray-500">
          {data?.total ?? 0} monitored product{(data?.total ?? 0) !== 1 ? 's' : ''}
        </p>
      </div>

      {(data?.twins ?? []).length === 0 && (
        <div className="text-center py-16">
          <Hexagon className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-[14px] text-gray-500">No product twins created yet.</p>
        </div>
      )}

      <div className="space-y-4">
        {(data?.twins ?? []).map((twin) => {
          const status = STATUS_STYLES[twin.status] ?? STATUS_STYLES.clear
          const StatusIcon = status.icon

          return (
            <Card key={twin.twin_id} className="p-5">
              <div className="flex items-start justify-between">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => router.push(`/twins/${twin.twin_id}`)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Hexagon className="h-4 w-4 text-navy" />
                    <span className="text-[15px] font-medium text-gray-900">
                      {twin.product_name}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${status.color}`}
                    >
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>
                  <p className="text-[13px] text-gray-600 mb-2 line-clamp-2">
                    {twin.product_description}
                  </p>
                  <div className="flex items-center gap-3 text-[12px] text-gray-400">
                    {twin.jurisdictions?.map((j) => (
                      <Badge key={j} variant="outline" className="text-[10px] px-1.5 py-0">
                        {j}
                      </Badge>
                    ))}
                    {twin.last_assessed_at && (
                      <span>
                        Last assessed:{' '}
                        {new Date(twin.last_assessed_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAssess(twin.twin_id)}
                    disabled={assessing === twin.twin_id}
                    className="text-[12px]"
                  >
                    {assessing === twin.twin_id ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    ) : (
                      <Play className="h-3.5 w-3.5 mr-1" />
                    )}
                    Run assessment
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/twins/${twin.twin_id}`)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
