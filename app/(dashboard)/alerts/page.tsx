'use client'

import { useSession } from 'next-auth/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getAlerts, dismissAlert, type AlertObject } from '@/lib/api/alerts'
import { useEntity } from '@/lib/entity-context'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  X,
  ChevronDown,
  FileEdit,
} from 'lucide-react'

// ── Severity config ───────────────────────────────────────────
const LEVEL_CONFIG: Record<AlertObject['alert_level'], {
  icon: React.ElementType
  iconColor: string
  badgeClass: string
}> = {
  high:   { icon: AlertCircle,   iconColor: 'text-[#991B1B]', badgeClass: 'bg-[#991B1B]/10 text-[#991B1B]' },
  medium: { icon: AlertTriangle, iconColor: 'text-[#D97706]', badgeClass: 'bg-[#D97706]/10 text-[#D97706]' },
  low:    { icon: Info,          iconColor: 'text-[#0047FF]', badgeClass: 'bg-[#0047FF]/10 text-[#0047FF]' },
}

export default function AlertsPage() {
  const { data: session } = useSession()
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken || ''
  const { entities } = useEntity()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [filter, setFilter]             = useState<'all' | 'active' | 'resolved'>('all')
  const [entityFilter, setEntityFilter] = useState<string | null>(null)  // null = all entities
  const [entityDropdownOpen, setEntityDropdownOpen] = useState(false)
  const [dismissing, setDismissing]     = useState<string | null>(null)

  // Fetch all alerts — no entity_id filter at API level; filter client-side
  // This fixes the bug where entity label showed one entity but alerts showed another
  const { data, isLoading } = useQuery({
    queryKey: ['alerts-all'],
    queryFn:  () => getAlerts(token, undefined, undefined),
    enabled:  !!token,
    refetchInterval: 60_000,
  })

  const handleDismiss = async (alertId: string) => {
    setDismissing(alertId)
    try {
      await dismissAlert(alertId, token)
      queryClient.invalidateQueries({ queryKey: ['alerts-all'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-alerts'] })
    } catch {
      /* ignore */
    } finally {
      setDismissing(null)
    }
  }

  // Client-side filtering
  const allAlerts = data?.alerts ?? []
  const unresolvedCount = allAlerts.filter(a => !a.resolved).length

  const filteredAlerts = allAlerts.filter((a) => {
    // Status filter
    if (filter === 'active'   && a.resolved)  return false
    if (filter === 'resolved' && !a.resolved) return false
    // Entity filter: match on twin_name (alerts carry twin_name which maps to entity)
    if (entityFilter && !a.twin_name?.toLowerCase().includes(entityFilter.toLowerCase())) return false
    return true
  })

  // Selected entity label for display
  const selectedEntityName = entityFilter
    ? entities.find(e => e.id === entityFilter)?.name ?? entityFilter
    : null

  if (isLoading) {
    return (
      <div className="max-w-[720px] space-y-3">
        <div className="h-8 w-40 bg-black/5 animate-pulse" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-black/5 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-[720px]">

      {/* Page heading */}
      <div className="flex items-center gap-3 mb-5">
        <h1 className="font-black text-[22px] uppercase tracking-tight text-black">
          Alerts
        </h1>
        {unresolvedCount > 0 && (
          <span className="font-mono text-[10px] uppercase tracking-[0.1em]
                           bg-[#991B1B]/10 text-[#991B1B] px-2.5 py-1">
            {unresolvedCount} unresolved
          </span>
        )}
      </div>

      {/* Controls row: entity selector + filter tabs */}
      <div className="flex items-center justify-between mb-5 gap-4">

        {/* Entity selector dropdown */}
        <div className="relative" data-entity-dropdown>
          <button
            onClick={() => setEntityDropdownOpen(o => !o)}
            className="flex items-center gap-2 font-mono text-[10px] uppercase
                       tracking-[0.1em] text-black/50 border border-black/15 px-3 py-2
                       hover:border-black/30 hover:text-black/70 transition-colors"
          >
            <span>
              {selectedEntityName
                ? <>Showing: <span className="text-black/80">{selectedEntityName}</span></>
                : 'All entities'
              }
            </span>
            <ChevronDown size={10} strokeWidth={1.5} />
          </button>

          {entityDropdownOpen && (
            <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-black/15
                            shadow-lg min-w-[220px]">
              <button
                onClick={() => { setEntityFilter(null); setEntityDropdownOpen(false) }}
                className={`w-full text-left px-4 py-2.5 font-mono text-[10px] uppercase
                             tracking-[0.08em] transition-colors hover:bg-black/[0.03]
                             border-b border-black/5 ${!entityFilter ? 'text-black font-bold' : 'text-black/50'}`}
              >
                All entities
              </button>
              {entities.map(e => (
                <button
                  key={e.id}
                  onClick={() => { setEntityFilter(e.id); setEntityDropdownOpen(false) }}
                  className={`w-full text-left px-4 py-2.5 font-mono text-[10px] uppercase
                               tracking-[0.08em] transition-colors hover:bg-black/[0.03]
                               border-b border-black/5 last:border-0
                               ${entityFilter === e.id ? 'text-black font-bold' : 'text-black/50'}`}
                >
                  {e.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-0">
          {(['all', 'active', 'resolved'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`font-mono text-[10px] uppercase tracking-[0.1em] px-4 py-2
                           border-b-2 transition-colors capitalize ${
                filter === tab
                  ? 'border-black text-black'
                  : 'border-transparent text-black/30 hover:text-black/60'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filteredAlerts.length === 0 && (
        <div className="border border-black/10 bg-white px-6 py-10 text-center">
          <p className="font-mono text-[11px] text-black/30 uppercase tracking-[0.15em]">
            {filter === 'all' ? 'No alerts.' : `No ${filter} alerts.`}
          </p>
        </div>
      )}

      {/* Alert cards */}
      <div className="space-y-2">
        {filteredAlerts.map((alert) => {
          const cfg = LEVEL_CONFIG[alert.alert_level] ?? LEVEL_CONFIG.low
          const LevelIcon = cfg.icon

          return (
            <div
              key={alert.alert_id}
              className={`border bg-white px-5 py-4 transition-colors ${
                alert.resolved ? 'border-black/8 opacity-55' : 'border-black/12 hover:border-black/20'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <LevelIcon
                  size={14}
                  strokeWidth={1.5}
                  className={`shrink-0 mt-0.5 ${cfg.iconColor}`}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <p className="font-mono text-[12px] text-black font-medium
                                   uppercase tracking-[0.06em] leading-snug">
                      {alert.title}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Severity badge */}
                      <span className={`font-mono text-[9px] uppercase tracking-[0.1em]
                                       px-2 py-0.5 ${cfg.badgeClass}`}>
                        {alert.alert_level}
                      </span>
                      {/* Resolved badge */}
                      {alert.resolved && (
                        <span className="font-mono text-[9px] uppercase tracking-[0.1em]
                                         px-2 py-0.5 bg-[#059669]/10 text-[#059669]
                                         flex items-center gap-1">
                          <CheckCircle2 size={9} strokeWidth={1.5} />
                          Resolved
                        </span>
                      )}
                      {/* Dismiss */}
                      {!alert.resolved && (
                        <button
                          onClick={() => handleDismiss(alert.alert_id)}
                          disabled={dismissing === alert.alert_id}
                          className="text-black/20 hover:text-black/50 transition-colors
                                     disabled:opacity-30"
                          title="Dismiss alert"
                        >
                          <X size={13} strokeWidth={1.5} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="font-mono text-[11px] text-black/50 leading-relaxed mb-3">
                    {alert.description}
                  </p>

                  {/* Meta + action row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {alert.twin_name && (
                        <span className="font-mono text-[9px] text-black/30 uppercase
                                         tracking-[0.1em]">
                          {alert.twin_name}
                        </span>
                      )}
                      {alert.affected_rule && (
                        <span className="font-mono text-[9px] text-[#0047FF] uppercase
                                         tracking-[0.05em]">
                          {alert.affected_rule}
                        </span>
                      )}
                      <span className="font-mono text-[9px] text-black/20">
                        {new Date(alert.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Draft compliance update action */}
                    {!alert.resolved && (
                      <button
                        onClick={() =>
                          router.push(`/compliance/documents?alert=${alert.alert_id}`)
                        }
                        className="flex items-center gap-1.5 font-mono text-[9px] uppercase
                                   tracking-[0.1em] text-black/35 border border-black/12 px-2.5 py-1
                                   hover:border-black/30 hover:text-black/60 transition-colors"
                      >
                        <FileEdit size={9} strokeWidth={1.5} />
                        Draft compliance update
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}
