'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const agents = [
  'Orchestrator', 'Retriever', 'Analyst', 'Devil\'s advocate', 'Blue sky',
  'RSA', 'Stress tester', 'UX advocate', 'Memory scribe', 'Task director',
]

const jurisdictions = ['ADGM / FSRA', 'DIFC / DFSA', 'El Salvador', 'Cross-jurisdiction']

const kpis = [
  { label: 'Sessions this week', value: '14', sub: '+3 vs prior week' },
  { label: 'Active product twins', value: '3', sub: '1 alert pending' },
  { label: 'Claims generated', value: '105', sub: 'Across all sessions' },
  { label: 'Corpus documents', value: '2,484', sub: 'Updated today' },
]

const twins = [
  { name: 'Fuutura Treasury Inc.', meta: 'BVI · Token issuer', status: 'Clear', statusColor: 'text-[#0F7A5F] bg-green-50' },
  { name: 'TradeDar Ltd', meta: 'ADGM · 3A applicant', status: '1 alert', statusColor: 'text-amber-700 bg-amber-50' },
  { name: 'Fuutura El Salvador', meta: 'El Salvador · DASP', status: 'Clear', statusColor: 'text-[#0F7A5F] bg-green-50' },
]

const sessions = [
  { query: '3A licence: custody and client money models', meta: 'Today · 7 claims · ADGM' },
  { query: 'COBS 23.12.2 — copy trading characterisation', meta: 'Today · 5 claims · ADGM' },
  { query: 'PRU 8.1.2/8.1.3 group consolidation framework', meta: 'Yesterday · 9 claims · ADGM' },
]

export default function DashboardPage() {
  const router = useRouter()
  const [queryText, setQueryText] = useState('')
  const [activeJurisdiction, setActiveJurisdiction] = useState('ADGM / FSRA')

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
            <p className="text-xl font-medium text-[#0B1829] mt-1">{kpi.value}</p>
            <p className="text-[10px] text-[#9CA3AF] mt-0.5">{kpi.sub}</p>
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
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {agents.map((agent) => (
            <div key={agent} className="bg-[#F5F7FA] rounded-md p-2">
              <p className="text-[10px] font-medium text-[#111827] capitalize">{agent}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F7A5F] animate-pulse" />
                <span className="text-[9px] text-[#6B7280]">Live</span>
              </div>
            </div>
          ))}
        </div>
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
            <button className="text-xs text-[#1A5FA8] hover:underline">view all</button>
          </div>
          <div className="space-y-2">
            {twins.map((twin) => (
              <div
                key={twin.name}
                className="bg-[#F5F7FA] rounded-md p-2.5 flex justify-between items-center"
              >
                <div>
                  <p className="text-[11px] font-medium text-[#0B1829]">{twin.name}</p>
                  <p className="text-[10px] text-[#9CA3AF]">{twin.meta}</p>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${twin.statusColor}`}
                >
                  {twin.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent sessions summary */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-[#111827]">Recent sessions</h3>
            <button className="text-xs text-[#1A5FA8] hover:underline">view all</button>
          </div>
          <div className="space-y-2">
            {sessions.map((s) => (
              <div
                key={s.query}
                className="bg-[#F5F7FA] rounded-md p-2.5 cursor-pointer hover:bg-[#EBEDF2] transition-colors"
              >
                <p className="text-[11px] font-medium text-[#0B1829] truncate">
                  {s.query}
                </p>
                <p className="text-[10px] text-[#9CA3AF] mt-0.5">{s.meta}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
