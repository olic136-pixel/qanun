'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { useDashboardKPIs, useSystemStatus } from '@/lib/hooks/useDashboard'
import { createSession } from '@/lib/api/query'
import { getTwins, assessTwin } from '@/lib/api/twins'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle2, Loader2, Search, ExternalLink } from 'lucide-react'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

const JURISDICTIONS = [
  { id: 'ADGM', label: 'ADGM / FSRA' },
  { id: 'DIFC', label: 'DIFC / DFSA' },
  { id: 'EL_SALVADOR', label: 'El Salvador' },
]

const REG_UPDATES = [
  { day: '22', month: 'Mar', title: 'FSRA publishes updated COBS guidance on virtual asset marketing restrictions', source: 'FSRA', type: 'Guidance', href: '/corpus?q=COBS+virtual+asset+marketing', external: false },
  { day: '18', month: 'Mar', title: 'PRU VER13 — amendments to Category 3C capital adequacy calculations', source: 'FSRA', type: 'Amendment', href: '/corpus?q=PRU+VER13+Category+3C', external: false },
  { day: '15', month: 'Mar', title: 'ADGM Registration Authority issues updated UBO disclosure requirements', source: 'ADGM RA', type: 'Amendment', href: 'https://www.adgm.com/setting-up/registration-authority', external: true },
  { day: '10', month: 'Mar', title: 'DFSA releases consultation paper on tokenised securities framework', source: 'DFSA', type: 'Guidance', href: 'https://www.dfsa.ae/news-events', external: true },
  { day: '5', month: 'Mar', title: 'FSRA updates COBS 23 — mirror trading clarification for professional clients', source: 'FSRA', type: 'Amendment', href: '/corpus?q=COBS+23+mirror+trading', external: false },
  { day: '28', month: 'Feb', title: 'El Salvador CNR — DASP renewal requirements for 2026 operating cycle', source: 'CNR', type: 'New rule', href: 'https://www.bcr.gob.sv', external: true },
]

const TYPE_COLORS: Record<string, string> = {
  Amendment: 'bg-[#FFFBEB] text-[#92400E]',
  Guidance: 'bg-[#EFF6FF] text-[#0C447C]',
  'New rule': 'bg-[#ECFDF5] text-[#166534]',
}

const RULEBOOKS = ['PRU', 'COBS', 'GEN', 'MKT', 'FUNDS', 'PIB']

export default function DashboardPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const token = session?.user?.accessToken as string
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [queryText, setQueryText] = useState('')
  const [activeJurisdictions, setActiveJurisdictions] = useState<string[]>(['ADGM'])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [corpusSearch, setCorpusSearch] = useState('')
  const [assessing, setAssessing] = useState<string | null>(null)

  const { data: kpiData } = useDashboardKPIs()
  const { data: statusData } = useSystemStatus()

  const { data: twinsData } = useQuery({
    queryKey: ['dashboard-twins'],
    queryFn: () => getTwins(token),
    enabled: !!token,
  })

  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 120) + 'px'
    }
  }, [queryText])

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

  const handleAssess = async (twinId: string) => {
    if (!token) return
    setAssessing(twinId)
    try {
      await assessTwin(twinId, token)
    } catch { /* ignore */ }
    finally { setAssessing(null) }
  }

  const canSubmit = queryText.trim().length > 0 && !isSubmitting
  const twins = twinsData?.twins ?? []
  const pendingAlerts = kpiData?.pending_alerts ?? 0

  return (
    <div className="w-full space-y-5">
      {/* ROW 1 — Query entry */}
      <div className="bg-[#0B1829] rounded-xl p-5">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[13px] font-medium text-white/90 uppercase tracking-[0.08em]">
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
                      : 'bg-white/5 text-white/60 border border-white/25 hover:text-white/80'
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
          className="bg-transparent border-none outline-none text-[15px] text-white placeholder:text-white/40 w-full resize-none min-h-[48px] max-h-[120px]"
        />

        <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/[0.08]">
          <span className="text-[11px] text-white/50">⌘ Enter to submit</span>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`h-[36px] px-5 rounded-md text-[13px] font-medium transition-all duration-150 ${
              canSubmit
                ? 'bg-[#C4922A] text-[#0B1829] hover:bg-white hover:text-[#0B1829]'
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

      {/* ROW 2 — Full-width Product Twins */}
      <div className="bg-white border border-[#E8EBF0] rounded-xl p-5">
        <div className="flex justify-between items-center mb-5">
          <span className="text-[14px] font-medium text-[#0B1829]">Product twins</span>
          <Link href="/twins" className="text-[12px] text-[#1A5FA8] hover:underline">
            view all →
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {twins.map((twin) => {
            const hasAlert = twin.status === 'alert'
            return (
              <div
                key={twin.twin_id}
                className={`border rounded-xl p-4 ${
                  hasAlert ? 'border-[#C4922A]' : 'border-[#E8EBF0]'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-[10px] h-[10px] rounded-full flex-shrink-0 ${
                      hasAlert
                        ? 'bg-[#C4922A] shadow-[0_0_0_3px_rgba(196,146,42,0.20)] animate-pulse'
                        : 'bg-[#16A34A] shadow-[0_0_0_3px_rgba(22,163,74,0.15)]'
                    }`}
                  />
                  <span className="text-[14px] font-medium text-[#0B1829]">
                    {twin.product_name}
                  </span>
                  <span
                    className={`ml-auto text-[10px] px-2 py-0.5 rounded-full ${
                      hasAlert
                        ? 'bg-[#FEF3C7] text-[#92400E]'
                        : 'bg-[#ECFDF5] text-[#166534]'
                    }`}
                  >
                    {hasAlert ? '2 alerts' : 'Clear'}
                  </span>
                </div>

                <p className="text-[12px] text-[#6B7280] leading-relaxed line-clamp-2 mb-3">
                  {twin.product_description}
                </p>

                <div className="flex gap-1.5 mb-3">
                  {twin.jurisdictions?.map((j) => (
                    <span
                      key={j}
                      className="bg-[#0B1829] text-white text-[10px] px-2 py-0.5 rounded-sm"
                    >
                      {j}
                    </span>
                  ))}
                </div>

                <div className="pt-3 border-t border-[#E8EBF0] flex justify-between text-[11px]">
                  <span className="text-[#9CA3AF]">Last assessed: today</span>
                  <button
                    onClick={() => handleAssess(twin.twin_id)}
                    disabled={assessing === twin.twin_id}
                    className="text-[#1A5FA8] hover:underline cursor-pointer"
                  >
                    {assessing === twin.twin_id ? 'Running…' : 'Run assessment →'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-[#E8EBF0] flex justify-between text-[12px]">
          <span className="text-[#9CA3AF]">
            {twins.length} entities monitored · next assessment in 24h
          </span>
          {pendingAlerts > 0 ? (
            <span className="text-[#C4922A] font-medium">
              {pendingAlerts} alert{pendingAlerts !== 1 ? 's' : ''} require attention
            </span>
          ) : (
            <span className="text-[#0F7A5F] flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3" />
              All entities clear
            </span>
          )}
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
            {REG_UPDATES.map((item, i) => {
              const inner = (
                <div className="py-3 flex gap-3 hover:bg-[#F5F7FA] transition-colors duration-100 rounded-lg -mx-2 px-2">
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
                  <div className="flex items-start gap-2 flex-shrink-0">
                    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full uppercase ${TYPE_COLORS[item.type] ?? ''}`}>
                      {item.type}
                    </span>
                    {item.external && (
                      <ExternalLink className="h-[10px] w-[10px] text-[#9CA3AF] mt-1" />
                    )}
                  </div>
                </div>
              )

              return item.external ? (
                <a key={i} href={item.href} target="_blank" rel="noopener noreferrer" className="block">
                  {inner}
                </a>
              ) : (
                <Link key={i} href={item.href} className="block">
                  {inner}
                </Link>
              )
            })}
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
