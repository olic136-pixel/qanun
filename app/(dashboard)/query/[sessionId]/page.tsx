'use client'

import { useState } from 'react'
import {
  Clock,
  FileText,
  Globe,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronUp,
  Copy,
} from 'lucide-react'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'

type SessionStatus = 'running' | 'complete' | 'error'
type ClaimConfidence = 'VERIFIED' | 'SUPPORTED' | 'INFERRED' | 'CONTESTED'

interface Claim {
  id: string
  text: string
  confidence: ClaimConfidence
  agent: string
  sectionRef?: string
}

interface AgentOutput {
  name: string
  status: 'pending' | 'complete'
  output?: string
  citations?: string[]
  claimCount?: number
}

interface SessionData {
  id: string
  query: string
  jurisdictions: string[]
  timestamp: Date
  status: SessionStatus
  currentAgentIndex: number
  agents: AgentOutput[]
  claims: Claim[]
}

const AGENTS_ORDER = [
  'orchestrator',
  'retriever',
  'analyst',
  'devils_advocate',
  'blue_sky',
  'rsa',
  'stress_tester',
  'ux_advocate',
  'memory_scribe',
  'task_director',
]

// Mock data for demo
const MOCK_SESSION: SessionData = {
  id: 'session-123',
  query:
    'What are the four conditions for dealing as Matched Principal under PRU 1.3.3(2), and does a dual-entity CFD structure satisfy each condition?',
  jurisdictions: ['ADGM', 'FSRA'],
  timestamp: new Date(Date.now() - 2 * 60 * 1000),
  status: 'complete',
  currentAgentIndex: 10,
  agents: [
    {
      name: 'orchestrator',
      status: 'complete',
      output:
        'Query analysis complete. This question concerns matched principal exemptions under ADGM Prudential Rules. Routing to retriever for corpus search, then analyst for regulatory interpretation.',
      claimCount: 2,
    },
    {
      name: 'retriever',
      status: 'complete',
      output:
        'Retrieved 14 relevant sections from the ADGM corpus. Primary sources: PRU 1.3.3(1)-(4), COBS 23.12, GEN 2.2.1. Secondary references: FSRA Guidance Note 12/2023.',
      citations: [
        'PRU 1.3.3(2)(a)-(d)',
        'COBS 23.12.2',
        'GEN 2.2.1(3)',
        'FSRA-GN-12-2023',
      ],
      claimCount: 3,
    },
    {
      name: 'analyst',
      status: 'complete',
      output:
        'PRU 1.3.3(2) sets out four cumulative conditions for the matched principal exemption:\n\n1. The firm acts as principal in back-to-back trades\n2. No retained market risk at end of each business day\n3. Client orders are matched before execution\n4. All trades are subject to automatic netting\n\nA dual-entity CFD structure may satisfy conditions (1) and (4) but presents challenges for conditions (2) and (3) where intercompany exposures create retained risk.',
      citations: ['PRU 1.3.3(2)(a)', 'PRU 1.3.3(2)(b)', 'PRU 1.3.3(2)(c)', 'PRU 1.3.3(2)(d)'],
      claimCount: 4,
    },
    {
      name: 'devils_advocate',
      status: 'complete',
      output:
        'Challenging the dual-entity analysis: The FSRA has not explicitly ruled on CFD structures. The phrase "retained market risk" in PRU 1.3.3(2)(b) could be interpreted narrowly to exclude intercompany hedging arrangements where risk transfer is contractually guaranteed.',
      claimCount: 1,
    },
    {
      name: 'blue_sky',
      status: 'complete',
      output:
        'Alternative structuring approaches: Consider a single-entity model with internal risk desks, or seek a formal FSRA waiver under GEN 2.2.1(3) for the specific CFD arrangement.',
      claimCount: 1,
    },
    { name: 'rsa', status: 'complete', output: 'No RSA implications identified.', claimCount: 0 },
    {
      name: 'stress_tester',
      status: 'complete',
      output:
        'Stress scenario: If intercompany netting fails during market stress, the dual-entity structure would breach condition (2). Recommend capital buffer for this contingency.',
      claimCount: 1,
    },
    { name: 'ux_advocate', status: 'complete', claimCount: 0 },
    { name: 'memory_scribe', status: 'complete', claimCount: 0 },
    { name: 'task_director', status: 'complete', claimCount: 0 },
  ],
  claims: [
    {
      id: '1',
      text: 'PRU 1.3.3(2) requires four cumulative conditions for matched principal exemption',
      confidence: 'VERIFIED',
      agent: 'analyst',
      sectionRef: 'PRU 1.3.3(2)',
    },
    {
      id: '2',
      text: 'Dual-entity CFD structures satisfy conditions (1) and (4) for matched principal',
      confidence: 'SUPPORTED',
      agent: 'analyst',
      sectionRef: 'PRU 1.3.3(2)(a),(d)',
    },
    {
      id: '3',
      text: 'Intercompany exposures may breach the "no retained market risk" requirement',
      confidence: 'INFERRED',
      agent: 'analyst',
      sectionRef: 'PRU 1.3.3(2)(b)',
    },
    {
      id: '4',
      text: 'FSRA has not explicitly ruled on CFD dual-entity structures',
      confidence: 'CONTESTED',
      agent: 'devils_advocate',
    },
    {
      id: '5',
      text: 'GEN 2.2.1(3) provides waiver mechanism for alternative structures',
      confidence: 'VERIFIED',
      agent: 'blue_sky',
      sectionRef: 'GEN 2.2.1(3)',
    },
  ],
}

function formatAgentName(name: string): string {
  if (name === 'devils_advocate') return "Devil's Advocate"
  if (name === 'rsa') return 'RSA'
  if (name === 'ux_advocate') return 'UX Advocate'
  return name
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins === 1) return '1 minute ago'
  if (diffMins < 60) return `${diffMins} minutes ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours === 1) return '1 hour ago'
  if (diffHours < 24) return `${diffHours} hours ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return '1 day ago'
  return `${diffDays} days ago`
}

function getConfidenceBadgeStyles(confidence: ClaimConfidence): string {
  switch (confidence) {
    case 'VERIFIED':
      return 'bg-[#ECFDF5] text-[#166534]'
    case 'SUPPORTED':
      return 'bg-[#EFF6FF] text-[#0C447C]'
    case 'INFERRED':
      return 'bg-[#FFFBEB] text-[#92400E]'
    case 'CONTESTED':
      return 'bg-[#FEF2F2] text-[#991B1B]'
  }
}

function StatusBadge({ status }: { status: SessionStatus }) {
  const styles = {
    running: 'bg-[#EFF6FF] text-[#1A5FA8] animate-pulse',
    complete: 'bg-[#ECFDF5] text-[#166534]',
    error: 'bg-[#FEF2F2] text-[#991B1B]',
  }

  const labels = {
    running: 'Running',
    complete: 'Complete',
    error: 'Error',
  }

  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}

function ProgressBar({
  currentIndex,
}: {
  currentIndex: number
}) {
  const currentAgent = AGENTS_ORDER[currentIndex] || AGENTS_ORDER[AGENTS_ORDER.length - 1]

  return (
    <div className="mb-4">
      <p className="text-[12px] text-[#6B7280] mb-2">Pipeline running...</p>
      <div className="flex gap-1">
        {AGENTS_ORDER.map((agent, idx) => {
          let segmentStyle = 'bg-[#E8EBF0]' // pending
          if (idx < currentIndex) {
            segmentStyle = 'bg-[#0F7A5F]' // complete
          } else if (idx === currentIndex) {
            segmentStyle = 'bg-[#1A5FA8] animate-pulse' // active
          }
          return (
            <div
              key={agent}
              className={`h-[4px] flex-1 rounded-full transition-all duration-300 ${segmentStyle}`}
            />
          )
        })}
      </div>
      <p className="text-[11px] text-[#9CA3AF] mt-1">{formatAgentName(currentAgent)}</p>
    </div>
  )
}

function CitationBlock({ citations }: { citations: string[] }) {
  return (
    <div className="border-l-2 border-[#1A5FA8] pl-3 py-1 bg-[#F8FAFC] rounded-r-md mt-2">
      <p className="text-[12px] font-mono text-[#1E40AF]">{citations.join(' · ')}</p>
    </div>
  )
}

function ClaimCard({ claim }: { claim: Claim }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(claim.text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="bg-[#F5F7FA] rounded-lg p-3">
      <p className="text-[12px] text-[#111827] leading-relaxed">{claim.text}</p>
      <div className="flex items-center gap-2 mt-1.5">
        <span
          className={`text-[9px] font-medium px-2 py-0.5 rounded-full uppercase ${getConfidenceBadgeStyles(claim.confidence)}`}
        >
          {claim.confidence}
        </span>
        <span className="text-[10px] text-[#9CA3AF]">{formatAgentName(claim.agent)}</span>
        {claim.sectionRef && (
          <span className="text-[10px] font-mono text-[#6B7280]">{claim.sectionRef}</span>
        )}
        <button
          onClick={handleCopy}
          className="ml-auto cursor-pointer text-[#9CA3AF] hover:text-[#111827] transition-colors"
          aria-label="Copy claim"
        >
          <Copy size={12} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}

export function SessionDetailPage() {
  const session = MOCK_SESSION

  const totalClaims = session.claims.length

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-full">
      {/* Left Panel */}
      <div className="w-full lg:w-[380px] flex-shrink-0">
        <div className="bg-white border border-[#E8EBF0] rounded-xl p-5 h-fit lg:sticky lg:top-6">
          {/* Query text */}
          <p className="text-[14px] font-medium text-[#0B1829] leading-snug">
            {session.query}
          </p>

          {/* Jurisdiction badges */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {session.jurisdictions.map((j) => (
              <span
                key={j}
                className="bg-[#EFF6FF] text-[#0C447C] border border-[#85B7EB] text-[10px] px-2 py-0.5 rounded-full"
              >
                {j}
              </span>
            ))}
          </div>

          {/* Metadata row */}
          <div className="mt-3 flex items-center gap-3 text-[11px] text-[#9CA3AF]">
            <span className="flex items-center gap-1">
              <Clock size={12} strokeWidth={1.5} />
              {getRelativeTime(session.timestamp)}
            </span>
            <span className="flex items-center gap-1">
              <FileText size={12} strokeWidth={1.5} />
              {totalClaims} claims
            </span>
            <span className="flex items-center gap-1">
              <Globe size={12} strokeWidth={1.5} />
              {session.jurisdictions.join(' / ')}
            </span>
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex gap-2">
            <button className="border border-[#E8EBF0] text-[#6B7280] hover:bg-[#F5F7FA] rounded-md px-3 h-[32px] text-[12px] flex items-center gap-1.5 cursor-pointer transition-colors">
              <RefreshCw size={12} strokeWidth={1.5} />
              Re-run
            </button>
            <button className="border border-[#E8EBF0] text-[#6B7280] hover:bg-[#F5F7FA] rounded-md px-3 h-[32px] text-[12px] flex items-center gap-1.5 cursor-pointer transition-colors">
              <Download size={12} strokeWidth={1.5} />
              Export memo
            </button>
          </div>

          {/* Divider */}
          <div className="mt-4 border-t border-[#E8EBF0]" />

          {/* Status section */}
          <div className="mt-4">
            <p className="text-[11px] text-[#9CA3AF] uppercase tracking-[0.06em] mb-2">
              Pipeline status
            </p>
            <StatusBadge status={session.status} />
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {/* Progress Bar (only when running) */}
        {session.status === 'running' && (
          <ProgressBar currentIndex={session.currentAgentIndex} />
        )}

        {/* Agent Sections */}
        <Accordion defaultValue={['orchestrator']}>
          {session.agents.map((agent) => {
            const hasContent = agent.output || (agent.citations && agent.citations.length > 0)
            if (!hasContent && agent.status === 'complete') return null

            return (
              <AccordionItem
                key={agent.name}
                value={agent.name}
                className="bg-white border border-[#E8EBF0] rounded-xl mb-2 overflow-hidden"
              >
                <AccordionTrigger className="px-4 py-2.5 hover:no-underline [&>svg]:hidden">
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-[13px] font-medium text-[#0B1829]">
                      {formatAgentName(agent.name)}
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                      {agent.status === 'pending' && (
                        <span className="text-[#9CA3AF] text-[10px]">Pending</span>
                      )}
                      {agent.status === 'complete' && agent.claimCount && agent.claimCount > 0 && (
                        <span className="bg-[#EFF6FF] text-[#0C447C] rounded-full px-2 py-0.5 text-[10px]">
                          {agent.claimCount} claims
                        </span>
                      )}
                      {agent.status === 'complete' && (!agent.claimCount || agent.claimCount === 0) && (
                        <span className="bg-[#ECFDF5] text-[#166534] rounded-full px-2 py-0.5 text-[10px]">
                          Complete
                        </span>
                      )}
                      <ChevronDown
                        size={14}
                        strokeWidth={1.5}
                        className="text-[#9CA3AF] transition-transform group-aria-expanded/accordion-trigger:hidden"
                      />
                      <ChevronUp
                        size={14}
                        strokeWidth={1.5}
                        className="text-[#9CA3AF] hidden group-aria-expanded/accordion-trigger:inline"
                      />
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  {agent.output && (
                    <p className="text-[13px] text-[#111827] leading-relaxed whitespace-pre-line">
                      {agent.output}
                    </p>
                  )}
                  {agent.citations && agent.citations.length > 0 && (
                    <CitationBlock citations={agent.citations} />
                  )}
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>

        {/* Claims Panel */}
        {session.claims.length > 0 && (
          <div className="mt-2 bg-white border border-[#E8EBF0] rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-[13px] font-medium text-[#0B1829]">Claims extracted</span>
              <span className="bg-[#EFF6FF] text-[#0C447C] text-[11px] px-2 py-0.5 rounded-full">
                {session.claims.length}
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {session.claims.map((claim) => (
                <ClaimCard key={claim.id} claim={claim} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SessionDetailPage
