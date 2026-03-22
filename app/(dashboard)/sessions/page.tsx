'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Clock, FileText } from 'lucide-react'

type SessionStatus = 'complete' | 'running' | 'error'

interface Session {
  id: string
  query: string
  status: SessionStatus
  claims: number
  timestamp: string
  jurisdiction: string
}

const sessions: Session[] = [
  {
    id: 'c306ba2e-375',
    query: 'What are the capital requirements for a Category 3C Authorised Person under PRU?',
    status: 'complete',
    claims: 42,
    timestamp: '2 days ago',
    jurisdiction: 'ADGM/FSRA',
  },
  {
    id: '3046dcb2-dde',
    query: 'What is the ADGM suitability framework for retail clients under COBS?',
    status: 'complete',
    claims: 28,
    timestamp: '2 days ago',
    jurisdiction: 'ADGM/FSRA',
  },
  {
    id: 'c78c627d-ea7',
    query: 'How must an Authorised Person categorise retail clients before carrying on a Regulated Activity?',
    status: 'complete',
    claims: 15,
    timestamp: '3 days ago',
    jurisdiction: 'ADGM/FSRA',
  },
  {
    id: '5a9f4d79-933',
    query: 'What are the regulated activities under Schedule 2 of FSMR and which require authorisation?',
    status: 'complete',
    claims: 15,
    timestamp: '3 days ago',
    jurisdiction: 'ADGM/FSRA',
  },
  {
    id: '12b50df0-871a',
    query: 'What are the four conditions for dealing as Matched Principal under PRU 1.3.3(2)?',
    status: 'complete',
    claims: 0,
    timestamp: '5 days ago',
    jurisdiction: 'ADGM/FSRA',
  },
  {
    id: '633b994f-ee9c',
    query: 'When does a copy trading service require a Managing Assets FSP under COBS 23.12.2?',
    status: 'complete',
    claims: 0,
    timestamp: '5 days ago',
    jurisdiction: 'ADGM/FSRA',
  },
]

const statusStyles: Record<SessionStatus, string> = {
  complete: 'bg-[#ECFDF5] text-[#166534]',
  running: 'bg-[#EFF6FF] text-[#1A5FA8] animate-pulse',
  error: 'bg-[#FEF2F2] text-[#991B1B]',
}

export default function SessionsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredSessions = sessions.filter((session) =>
    session.query.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const hasNoSessions = sessions.length === 0

  if (hasNoSessions) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Clock size={40} className="text-[#E8EBF0] mb-4" strokeWidth={1.5} />
        <p className="text-[14px] text-[#0B1829] font-medium">No sessions yet</p>
        <p className="text-[12px] text-[#9CA3AF] mt-1">
          Run your first query to get started
        </p>
        <Link
          href="/query"
          className="mt-4 text-[13px] text-[#1A5FA8] hover:underline"
        >
          New query →
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-[28px] font-medium text-[#0B1829]">Sessions</h1>
        <Link
          href="/query"
          className="bg-[#0B1829] text-[#C4922A] hover:bg-[#1A5FA8] hover:text-white rounded-md px-4 h-[38px] text-[13px] font-medium inline-flex items-center transition-colors duration-100"
        >
          New query →
        </Link>
      </div>

      {/* Search Bar */}
      <div className="mb-4 relative">
        <Search
          size={14}
          className="text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2"
          strokeWidth={1.5}
        />
        <input
          type="text"
          placeholder="Search sessions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-white border border-[#E8EBF0] rounded-lg pl-9 pr-3 h-[38px] w-full max-w-[400px] text-[14px] placeholder:text-[#9CA3AF] text-[#0B1829] focus:outline-none focus:border-[#1A5FA8] transition-colors"
        />
      </div>

      {/* Sessions List */}
      <div className="space-y-2">
        {filteredSessions.map((session) => (
          <div
            key={session.id}
            onClick={() => router.push(`/query/${session.id}`)}
            className="bg-white border border-[#E8EBF0] rounded-lg p-4 hover:border-[#1A5FA8] transition-all duration-100 cursor-pointer"
          >
            {/* Top Row */}
            <div className="flex justify-between items-start gap-4">
              <p className="text-[13px] font-medium text-[#0B1829] line-clamp-2 max-w-[600px]">
                {session.query}
              </p>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full uppercase shrink-0 ${statusStyles[session.status]}`}
              >
                {session.status}
              </span>
            </div>

            {/* Bottom Row */}
            <div className="flex items-center gap-3 mt-2 text-[11px] text-[#9CA3AF]">
              <span className="flex items-center gap-1">
                <Clock size={11} strokeWidth={1.5} />
                {session.timestamp}
              </span>
              <span className="flex items-center gap-1">
                <FileText size={11} strokeWidth={1.5} />
                {session.claims} claims
              </span>
              <span className="bg-[#F5F7FA] px-2 py-0.5 rounded-full text-[#6B7280]">
                {session.jurisdiction}
              </span>
            </div>
          </div>
        ))}

        {filteredSessions.length === 0 && searchQuery && (
          <div className="text-center py-8">
            <p className="text-[14px] text-[#9CA3AF]">
              No sessions match your search
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
