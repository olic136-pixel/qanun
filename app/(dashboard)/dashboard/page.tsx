'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { useDashboardKPIs, useSystemStatus } from '@/lib/hooks/useDashboard'
import { createSession, getSessions } from '@/lib/api/query'
import { getTwins } from '@/lib/api/twins'
import { Skeleton } from '@/components/ui/skeleton'
import { Activity, CheckCircle2, Loader2, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

const JURISDICTIONS = [
  { id: 'ADGM', label: 'ADGM / FSRA' },
  { id: 'DIFC', label: 'DIFC / DFSA' },
  { id: 'EL_SALVADOR', label: 'El Salvador' },
]

const REG_UPDATES = [
  { day: '22', month: 'Mar', title: 'FSRA publishes updated COBS guidance on virtual asset marketing restrictions', source: 'FSRA', type: 'Guidance' },
  { day: '18', month: 'Mar', title: 'PRU VER13 — amendments to Category 3C capital adequacy calculations', source: 'FSRA', type: 'Amendment' },
  { day: '15', month: 'Mar', title: 'ADGM Registration Authority issues updated UBO disclosure requirements', source: 'ADGM RA', type: 'Amendment' },
  { day: '10', month: 'Mar', title: 'DFSA releases consultation paper on tokenised securities framework', source: 'DFSA', type: 'Guidance' },
  { day: '5', month: 'Mar', title: 'FSRA updates COBS 23 — mirror trading clarification for professional clients', source: 'FSRA', type: 'Amendment' },
  { day: '28', month: 'Feb', title: 'El Salvador CNR — DASP renewal requirements for 2026 operating cycle', source: 'CNR', type: 'New rule' },
]

const TYPE_COLORS: Record<string, string> = {
  Amendment: 'bg-[#FFFBEB] text-[#92400E]',
  Guidance: 'bg-[#EFF6FF] text-[#0C447C]',
  'New rule': 'bg-[#ECFDF5] text-[#166534]',
}

const RULEBOOKS = ['PRU', 'COBS', 'GEN', 'MKT', 'FUNDS', 'PIB']

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'yesterday'
  return `${days}d ago`
}

export default function DashboardPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const token = session?.user?.accessToken as string
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [queryText, setQueryText] = useState('')
  const [activeJurisdictions, setActiveJurisdictions] = useState<string[]>(['ADGM'])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [corpusSearch, setCorpusSearch] = useState('')

  const { data: kpiData, isLoading: kpiLoading } = useDashboardKPIs()
  const { data: statusData } = useSystemStatus()

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['recent-sessions'],
    queryFn: () => getSessions(token, { limit: 5 }),
    enabled: !!token,
  })

  const { data: twinsData } = useQuery({
    queryKey: ['dashboard-twins'],
    queryFn: () => getTwins(token),
    enabled: !!token,
  })

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 120) + 'px'
    }
  }, [queryText])

  const liveAgentCount = statusData?.agents
    ? Object.values(statusData.agents).filter((s) => s === 'available').length
    : 10

  const toggleJurisdiction = (id: string) => {
    setActiveJurisdictions((prev) => {
      const next = prev.includes(id) ? prev.filter((j) => j !== id) : [...prev, id]
      return next.length === 0 ? prev : next
    })
  }

  const handleSubmit = useCallback(async () => {
    if (!queryText.trim() || !token) return
    setIsSubmitting(true)
    try {
      const result = await createSession(
        { query: queryText.trim(), jurisdictions: activeJurisdictions },
        token
      )
      router.push(`/query/${result.session_id}`)
    } catch {
      setIsSubmitting(false)
    }
  }, [queryText, activeJurisdictions, token, router])

  const canSubmit = queryText.trim().length > 0 && !isSubmitting
  const twins = twinsData?.twins ?? []
  const recentSessions = sessionsData?.sessions ?? []
  const alertCount = twins.filter((t) => t.status === 'alert').length

  return (
    <div className="w-full space-y-5">
      {/* ROW 1 — Query entry */}
      <div className="bg-[#0B1829] rounded-xl p-5">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[13px] font-medium text-white/70 uppercase tracking-[0.08em]">
            Ask QANUN
          </span>
          <div className="flex gap-1.5">
            {JURISDICTIONS.map((j) => {
              const active = activeJurisdictions.includes(j.id)
              return (
                <button
                  key={j.id}
                  onClick={() => toggleJurisdiction(j.id)}
                  className={`text-[11px] px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                    active
                      ? 'bg-[#C4922A]/20 text-[#C4922A] border border-[#C4922A]/40'
                      : 'bg-white/5 text-white/40 border border-white/15 hover:text-white/60'
                  }`}
                >
                  {j.label}
                </button>
              )
            })}
          </div>
        </div>

        <textarea
          ref={textareaRef}
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault()
              handleSubmit()
            }
          }}
          placeholder="What do you need to know about ADGM regulations today?"
          disabled={isSubmitting}
          className="bg-transparent border-none outline-none text-[15px] text-white placeholder:text-white/30 w-full resize-none min-h-[48px] max-h-[120px]"
        />

        <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/[0.08]">
          <span className="text-[11px] text-white/30">⌘ Enter to submit</span>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`h-[36px] px-5 rounded-md text-[13px] font-medium transition-all duration-150 ${
              canSubmit
                ? 'bg-[#1A5FA8] text-white hover:bg-[#C4922A] hover:text-[#0B1829]'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="h-[14px] w-[14px] animate-spin" />
            ) : (
              'Run query →'
            )}
          </button>
        </div>
      </div>

      {/* ROW 2 — Three columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Product Twins */}
        <div className="bg-white border border-[#E8EBF0] rounded-xl p-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[13px] font-medium text-[#0B1829]">Product twins</span>
            <Link href="/twins" className="text-[12px] text-[#1A5FA8] hover:underline">
              view all →
            </Link>
          </div>
          <div className="space-y-3">
            {twins.map((twin) => {
              const hasAlert = twin.status === 'alert'
              return (
                <div
                  key={twin.twin_id}
                  onClick={() => router.push(`/twins/${twin.twin_id}`)}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <div
                    className={`w-[10px] h-[10px] rounded-full flex-shrink-0 ring-2 ${
                      hasAlert
                        ? 'bg-[#C4922A] ring-[#C4922A]/20'
                        : 'bg-[#16A34A] ring-[#16A34A]/20'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[#0B1829] truncate group-hover:text-[#1A5FA8] transition-colors">
                      {twin.product_name}
                    </p>
                    <p className="text-[11px] text-[#9CA3AF] truncate">
                      {twin.jurisdictions?.join(' · ')}
                    </p>
                  </div>
                  {hasAlert ? (
                    <span className="bg-[#FEF3C7] text-[#92400E] text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                      2
                    </span>
                  ) : (
                    <CheckCircle2 className="h-[14px] w-[14px] text-[#16A34A] flex-shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-[#E8EBF0] flex justify-between text-[11px] text-[#9CA3AF]">
            <span>{twins.length} entities monitored</span>
            {alertCount > 0 && (
              <span className="text-[#C4922A] font-medium">{alertCount} alert{alertCount !== 1 ? 's' : ''} active</span>
            )}
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="bg-white border border-[#E8EBF0] rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[13px] font-medium text-[#0B1829]">Recent sessions</span>
            <Link href="/sessions" className="text-[12px] text-[#1A5FA8] hover:underline">
              view all →
            </Link>
          </div>
          {sessionsLoading && (
            <div className="space-y-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-[44px] bg-[#F5F7FA] rounded-lg" />
              ))}
            </div>
          )}
          {!sessionsLoading && recentSessions.length === 0 && (
            <p className="text-[12px] text-[#9CA3AF] text-center py-4">
              No sessions yet — run your first query
            </p>
          )}
          {!sessionsLoading && recentSessions.length > 0 && (
            <div className="space-y-1">
              {recentSessions.map((s) => (
                <button
                  key={s.session_id}
                  onClick={() => router.push(`/query/${s.session_id}`)}
                  className="w-full bg-[#F5F7FA] hover:bg-[#EFF6FF] rounded-lg px-3 py-2 cursor-pointer transition-colors text-left"
                >
                  <p className="text-[12px] text-[#111827] font-medium line-clamp-1">
                    {s.query_text}
                  </p>
                  <p className="text-[10px] text-[#9CA3AF] mt-0.5">
                    {relativeTime(s.created_at)} · {s.claims_count} claims
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* KPIs */}
        <div className="bg-white border border-[#E8EBF0] rounded-xl p-4">
          <span className="text-[13px] font-medium text-[#0B1829] block mb-4">Activity</span>
          <div className="space-y-3">
            {[
              { label: 'Sessions this week', value: kpiData?.sessions_this_week },
              { label: 'Claims extracted', value: kpiData?.claims_total },
              { label: 'Corpus documents', value: kpiData?.corpus_documents },
              { label: 'Active alerts', value: kpiData?.pending_alerts, highlight: (kpiData?.pending_alerts ?? 0) > 0 },
            ].map((kpi) => (
              <div key={kpi.label} className="flex justify-between items-baseline">
                <span className="text-[12px] text-[#6B7280]">{kpi.label}</span>
                {kpiLoading ? (
                  <Skeleton className="h-6 w-12" />
                ) : (
                  <span className={`text-[20px] font-medium ${kpi.highlight ? 'text-[#C4922A]' : 'text-[#0B1829]'}`}>
                    {kpi.value?.toLocaleString() ?? '—'}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-[#E8EBF0] flex items-center gap-1.5 text-[11px] text-[#0F7A5F]">
            <Activity className="h-3 w-3" />
            <span>System healthy · {liveAgentCount} agents live</span>
          </div>
        </div>
      </div>

      {/* ROW 3 — Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        {/* Regulatory Updates */}
        <div className="bg-white border border-[#E8EBF0] rounded-xl p-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[13px] font-medium text-[#0B1829]">Regulatory updates</span>
            <span className="bg-[#EFF6FF] text-[#0C447C] text-[10px] px-2 py-0.5 rounded-full">
              ADGM / FSRA
            </span>
          </div>
          <div className="divide-y divide-[#F5F7FA]">
            {REG_UPDATES.map((item, i) => (
              <div key={i} className="py-3 flex gap-3">
                <div className="w-[48px] flex-shrink-0 text-center">
                  <div className="text-[18px] font-medium text-[#0B1829] leading-none">
                    {item.day}
                  </div>
                  <div className="text-[10px] text-[#9CA3AF] uppercase mt-0.5">
                    {item.month}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-[#0B1829] leading-snug">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-[#9CA3AF] mt-0.5">{item.source}</p>
                </div>
                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full uppercase self-start ${TYPE_COLORS[item.type] ?? ''}`}>
                  {item.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Corpus search */}
        <div className="bg-white border border-[#E8EBF0] rounded-xl p-4">
          <span className="text-[13px] font-medium text-[#0B1829] block mb-3">
            Corpus search
          </span>
          <div className="relative">
            <Search className="h-[14px] w-[14px] text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={corpusSearch}
              onChange={(e) => setCorpusSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && corpusSearch.trim()) {
                  router.push(`/corpus?q=${encodeURIComponent(corpusSearch)}`)
                }
              }}
              placeholder="Search corpus..."
              className="bg-[#F5F7FA] border-[#E8EBF0] rounded-lg pl-9 h-[36px] text-[13px]"
            />
          </div>

          {/* Corpus stats */}
          <div className="flex gap-3 mt-3 mb-3">
            {[
              { value: '2,484', label: 'Documents' },
              { value: '63,397', label: 'Sections' },
              { value: '3', label: 'Jurisdictions' },
            ].map((stat) => (
              <div key={stat.label} className="flex-1 bg-[#F5F7FA] rounded-lg py-2 text-center">
                <div className="text-[15px] font-medium text-[#0B1829]">{stat.value}</div>
                <div className="text-[10px] text-[#9CA3AF]">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Top rulebooks */}
          <div className="mt-2">
            <p className="text-[11px] text-[#9CA3AF] uppercase tracking-[0.06em] mb-2">
              Top rulebooks
            </p>
            <div className="flex flex-wrap gap-1.5">
              {RULEBOOKS.map((code) => (
                <button
                  key={code}
                  onClick={() => setCorpusSearch(code)}
                  className="border border-[#E8EBF0] rounded-md px-2.5 py-1 text-[11px] font-mono text-[#6B7280] hover:border-[#1A5FA8] hover:text-[#1A5FA8] cursor-pointer bg-white transition-colors"
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
