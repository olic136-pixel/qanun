'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { useDashboardKPIs, useSystemStatus } from '@/lib/hooks/useDashboard'
import { getSessions } from '@/lib/api/query'
import { getTwins } from '@/lib/api/twins'
import { Skeleton } from '@/components/ui/skeleton'

const jurisdictions = ['ADGM / FSRA', 'DIFC / DFSA', 'El Salvador', 'Cross-jurisdiction']

export default function DashboardPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const token = session?.user?.accessToken as string
  const [queryText, setQueryText] = useState('')
  const [activeJurisdiction, setActiveJurisdiction] = useState('ADGM / FSRA')

  const { data: kpiData, isLoading: kpiLoading } = useDashboardKPIs()
  const { data: statusData, isLoading: statusLoading } = useSystemStatus()

  const { data: sessionsData } = useQuery({
    queryKey: ['recent-sessions'],
    queryFn: () => getSessions(token, { limit: 3 }),
    enabled: !!token,
  })

  const { data: twinsData } = useQuery({
    queryKey: ['dashboard-twins'],
    queryFn: () => getTwins(token),
    enabled: !!token,
  })

  const kpis = [
    { label: 'Sessions this week', value: kpiData?.sessions_this_week?.toString() ?? '—', sub: 'Query sessions' },
    { label: 'Active product twins', value: kpiData?.active_twins?.toString() ?? '—', sub: `${kpiData?.pending_alerts ?? 0} alert${(kpiData?.pending_alerts ?? 0) !== 1 ? 's' : ''} pending` },
    { label: 'Claims generated', value: kpiData?.claims_total?.toLocaleString() ?? '—', sub: 'Across all sessions' },
    { label: 'Corpus documents', value: kpiData?.corpus_documents?.toLocaleString() ?? '—', sub: 'Updated today' },
  ]

  const agents = statusData?.agents
    ? Object.entries(statusData.agents)
    : [
        ['Orchestrator', 'available'], ['Retriever', 'available'], ['Analyst', 'available'],
        ["Devil's advocate", 'available'], ['Blue sky', 'available'], ['RSA', 'available'],
        ['Stress tester', 'available'], ['UX advocate', 'available'],
        ['Memory scribe', 'available'], ['Task director', 'available'],
      ]

  const submitQuery = useCallback(() => {
    if (!queryText.trim()) return
    router.push(
      `/query?q=${encodeURIComponent(queryText)}&jurisdiction=${encodeURIComponent(activeJurisdiction)}`
    )
  }, [queryText, activeJurisdiction, router])

  return (
    <div className="w-full">
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-[#F5F7FA] rounded-md p-3">
            <p className="text-xs text-[#6B7280]">{kpi.label}</p>
            {kpiLoading ? (
              <Skeleton className="h-7 w-16 rounded mt-1" />
            ) : (
              <p className="text-xl font-medium text-[#0B1829] mt-1">{kpi.value}</p>
            )}
            <p className="text-[12px] text-[#9CA3AF] mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Agent Availability Strip */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-medium text-[#111827]">Agent availability</h3>
          <button className="text-xs text-[#1A5FA8] hover:underline">
            run health check
          </button>
        </div>
        {statusLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-[52px] rounded-md" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {agents.map(([name, agentStatus]) => {
              const isLive = agentStatus === 'available'
              return (
                <div key={name} className="bg-[#F5F7FA] rounded-md p-2">
                  <p className="text-[12px] font-medium text-[#111827] capitalize">{name}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isLive ? 'bg-[#0F7A5F] animate-pulse' : 'bg-[#991B1B]'
                      }`}
                    />
                    <span className="text-[11px] text-[#6B7280]">
                      {isLive ? 'Live' : 'Unavailable'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick Query Box */}
      <div className="border border-[#E8EBF0] rounded-lg p-4 bg-white mb-5">
        <p className="text-[11px] text-[#6B7280] mb-2">
          Ask QANUN anything across the regulatory corpus
        </p>
        <div className="flex gap-2">
          <textarea
            className="flex-1 bg-[#F5F7FA] rounded-md p-3 text-sm resize-none min-h-[52px] border-none outline-none"
            placeholder="e.g. What are the capital requirements for a Category 3A entity?"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault()
                submitQuery()
              }
            }}
          />
          <button
            onClick={submitQuery}
            disabled={!queryText.trim()}
            className="bg-[#0B1829] text-[#C4922A] px-4 rounded-md text-sm font-medium hover:bg-[#1A5FA8] hover:text-white transition-colors disabled:opacity-50"
          >
            Run
          </button>
        </div>
        <div className="flex gap-1.5 mt-3">
          {jurisdictions.map((j) => (
            <button
              key={j}
              onClick={() => setActiveJurisdiction(j)}
              className={`text-[11px] px-3 py-1 rounded-md border transition-colors ${
                activeJurisdiction === j
                  ? 'bg-[#EFF6FF] text-[#0C447C] border-[#85B7EB]'
                  : 'bg-white text-[#6B7280] border-[#E8EBF0]'
              }`}
            >
              {j}
            </button>
          ))}
        </div>
      </div>

      {/* Two-column lower section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Product twins summary */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-[#111827]">Product twins</h3>
            <button
              onClick={() => router.push('/twins')}
              className="text-xs text-[#1A5FA8] hover:underline"
            >
              view all
            </button>
          </div>
          <div className="space-y-2">
            {(twinsData?.twins ?? []).map((twin) => {
              const hasAlert = twin.status === 'alert'
              return (
                <div
                  key={twin.twin_id}
                  onClick={() => router.push(`/twins/${twin.twin_id}`)}
                  className="bg-[#F5F7FA] rounded-md p-2.5 flex justify-between items-center cursor-pointer hover:bg-[#EBEDF2] transition-colors"
                >
                  <div>
                    <p className="text-[12px] font-medium text-[#0B1829]">{twin.product_name}</p>
                    <p className="text-[11px] text-[#9CA3AF]">
                      {twin.jurisdictions?.join(' · ')}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      hasAlert
                        ? 'text-amber-700 bg-amber-50'
                        : 'text-[#0F7A5F] bg-green-50'
                    }`}
                  >
                    {hasAlert ? 'Alert' : 'Clear'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent sessions summary */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-[#111827]">Recent sessions</h3>
            <button
              onClick={() => router.push('/sessions')}
              className="text-xs text-[#1A5FA8] hover:underline"
            >
              view all
            </button>
          </div>
          <div className="space-y-2">
            {(sessionsData?.sessions ?? []).map((s) => (
              <div
                key={s.session_id}
                onClick={() => router.push(`/query/${s.session_id}`)}
                className="bg-[#F5F7FA] rounded-md p-2.5 cursor-pointer hover:bg-[#EBEDF2] transition-colors"
              >
                <p className="text-[12px] font-medium text-[#0B1829] truncate">
                  {s.query_text}
                </p>
                <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                  {new Date(s.created_at).toLocaleDateString()} · {s.claims_count} claims · {s.jurisdictions?.[0] ?? 'ADGM'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
