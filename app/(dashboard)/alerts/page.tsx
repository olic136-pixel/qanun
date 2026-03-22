'use client'

import { useState } from 'react'
import { AlertTriangle, Info, CheckCircle } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

const alerts = [
  {
    id: 'alert-1',
    severity: 'high' as const,
    title: 'COBS 23.12.2 — Auto-Build retail eligibility risk',
    rule: 'COBS 23.12.2',
    entity: 'TradeDar Ltd',
    description:
      'The Auto-Build block-delegation model may constitute copy trading under COBS 23.12.2 when offered to retail clients. The current 3A licence does not include a Managing Assets FSP.',
    timestamp: '1 day ago',
    resolved: false,
  },
  {
    id: 'alert-2',
    severity: 'medium' as const,
    title: 'PRU 1.3.3(2)(c) — Risk Co independence requirement',
    rule: 'PRU 1.3.3(2)(c)',
    entity: 'TradeDar Ltd',
    description:
      'The matched principal conditions require that Risk Co positions arise solely from hedging Internaliser transactions. Any proprietary trading not directly referrable to client hedging may breach PRU 1.3.3(2)(c).',
    timestamp: '1 day ago',
    resolved: false,
  },
]

export default function AlertsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [dismissedIds, setDismissedIds] = useState<string[]>([])

  const unresolvedAlerts = alerts.filter(
    (a) => !a.resolved && !dismissedIds.includes(a.id)
  )
  const resolvedAlerts = alerts.filter(
    (a) => a.resolved || dismissedIds.includes(a.id)
  )

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDismissedIds((prev) => [...prev, id])
  }

  const renderAlert = (alert: (typeof alerts)[0]) => {
    const isExpanded = expandedId === alert.id
    const Icon = alert.severity === 'high' ? AlertTriangle : Info

    return (
      <div
        key={alert.id}
        onClick={() => setExpandedId(isExpanded ? null : alert.id)}
        className="bg-white border border-[#E8EBF0] rounded-lg px-4 py-3 cursor-pointer hover:bg-[#F5F7FA] transition-all"
      >
        <div className="flex items-start gap-3">
          {/* Left: Icon */}
          <div
            className={`w-[32px] h-[32px] rounded-full flex-shrink-0 flex items-center justify-center ${
              alert.severity === 'high' ? 'bg-[#FEF2F2]' : 'bg-[#FFFBEB]'
            }`}
          >
            <Icon
              size={14}
              strokeWidth={1.5}
              className={
                alert.severity === 'high' ? 'text-[#991B1B]' : 'text-[#92400E]'
              }
            />
          </div>

          {/* Middle: Content */}
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium text-[#0B1829]">
              {alert.title}
            </div>
            <div className="font-mono text-[11px] text-[#6B7280] mt-0.5">
              {alert.rule}
            </div>
            <span className="inline-block bg-[#F5F7FA] text-[#6B7280] text-[10px] px-2 py-0.5 rounded-full mt-1">
              {alert.entity}
            </span>
            {isExpanded && (
              <p className="text-[12px] text-[#6B7280] mt-2">
                {alert.description}
              </p>
            )}
          </div>

          {/* Right: Timestamp + Dismiss */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <span className="text-[10px] text-[#9CA3AF]">{alert.timestamp}</span>
            <button
              onClick={(e) => handleDismiss(alert.id, e)}
              className="border border-[#E8EBF0] text-[#6B7280] hover:border-[#991B1B] hover:text-[#991B1B] rounded px-2 h-[24px] text-[11px] transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <CheckCircle size={40} strokeWidth={1.5} className="text-[#ECFDF5]" />
      <p className="text-[14px] text-[#9CA3AF] mt-3">No resolved alerts</p>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-[28px] font-medium text-[#0B1829]">Alerts</h1>
        <span className="bg-[#FEF2F2] text-[#991B1B] text-[12px] px-3 py-1 rounded-full">
          {unresolvedAlerts.length} unresolved
        </span>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="mb-4">
        <TabsList variant="line">
          <TabsTrigger value="all">All ({alerts.length})</TabsTrigger>
          <TabsTrigger value="unresolved">
            Unresolved ({unresolvedAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved ({resolvedAlerts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <div className="space-y-2">
            {alerts
              .filter((a) => !dismissedIds.includes(a.id))
              .map(renderAlert)}
            {dismissedIds.length > 0 &&
              alerts
                .filter((a) => dismissedIds.includes(a.id))
                .map(renderAlert)}
          </div>
        </TabsContent>

        <TabsContent value="unresolved" className="mt-4">
          <div className="space-y-2">
            {unresolvedAlerts.length > 0
              ? unresolvedAlerts.map(renderAlert)
              : renderEmptyState()}
          </div>
        </TabsContent>

        <TabsContent value="resolved" className="mt-4">
          {resolvedAlerts.length > 0 ? (
            <div className="space-y-2">{resolvedAlerts.map(renderAlert)}</div>
          ) : (
            renderEmptyState()
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
