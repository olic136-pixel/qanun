'use client'

import { useSession } from 'next-auth/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getAlerts, dismissAlert, type AlertObject } from '@/lib/api/alerts'
import { useState } from 'react'
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

const LEVEL_STYLES: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  high: { icon: AlertTriangle, color: 'text-[#991B1B]', bg: 'bg-red-50 border-red-200' },
  medium: { icon: AlertCircle, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  low: { icon: Info, color: 'text-blue', bg: 'bg-blue-50 border-blue-200' },
}

export default function AlertsPage() {
  const { data: session } = useSession()
  const token = session?.user?.accessToken as string
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all')
  const [dismissing, setDismissing] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => getAlerts(token),
    enabled: !!token,
  })

  const handleDismiss = async (alertId: string) => {
    setDismissing(alertId)
    try {
      await dismissAlert(alertId, token)
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    } catch {
      /* ignore */
    } finally {
      setDismissing(null)
    }
  }

  const alerts = (data?.alerts ?? []).filter((a) => {
    if (filter === 'active') return !a.resolved
    if (filter === 'resolved') return a.resolved
    return true
  })

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">Alerts</h1>
          {(data?.unresolved_count ?? 0) > 0 && (
            <Badge className="bg-[#991B1B] text-white text-[11px]">
              {data?.unresolved_count} unresolved
            </Badge>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'active', 'resolved'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`text-[13px] px-4 py-1.5 rounded-full transition-colors capitalize ${
              filter === tab
                ? 'bg-navy text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {alerts.length === 0 && (
        <div className="text-center py-16">
          <Bell className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-[14px] text-gray-500">
            {filter === 'all' ? 'No alerts.' : `No ${filter} alerts.`}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {alerts.map((alert) => {
          const level = LEVEL_STYLES[alert.alert_level] ?? LEVEL_STYLES.low
          const LevelIcon = level.icon

          return (
            <Card
              key={alert.alert_id}
              className={`p-4 ${alert.resolved ? 'opacity-60' : ''} ${level.bg}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <LevelIcon className={`h-5 w-5 mt-0.5 ${level.color}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[14px] font-medium text-gray-900">
                        {alert.title}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {alert.alert_level}
                      </Badge>
                      {alert.resolved && (
                        <Badge className="bg-teal/10 text-teal text-[10px]">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Resolved
                        </Badge>
                      )}
                    </div>
                    <p className="text-[13px] text-gray-600 mb-2">
                      {alert.description}
                    </p>
                    <div className="flex items-center gap-4 text-[11px] text-gray-400">
                      <span>{alert.twin_name}</span>
                      {alert.affected_rule && (
                        <span className="font-mono">{alert.affected_rule}</span>
                      )}
                      <span>{new Date(alert.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                {!alert.resolved && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismiss(alert.alert_id)}
                    disabled={dismissing === alert.alert_id}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
