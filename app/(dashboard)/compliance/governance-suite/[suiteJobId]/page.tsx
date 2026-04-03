'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api/client'
import { Download, ArrowLeft, Loader2, RefreshCw } from 'lucide-react'

// ── Types matching backend B2 response ──────────────────────────

interface SuiteDocument {
  doc_type: string
  display_name: string
  tier: number
  status: 'queued' | 'drafting' | 'drafted' | 'exporting' | 'complete' | 'failed'
  job_id: string | null
  error_message: string | null
}

interface SuiteStatus {
  suite_job_id: string
  status: 'queued' | 'running' | 'complete' | 'partial' | 'failed'
  jurisdiction: string
  tiers: number[]
  total_documents: number
  completed_documents: number
  documents: SuiteDocument[]
  document_statuses: SuiteDocument[]
  created_at: string
  updated_at: string
}

// ── Constants ────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.qanun.io'

const TIER_LABELS: Record<number, string> = {
  1: 'Registration Pack',
  2: 'Mandatory Compliance Framework',
  3: 'Corporate Governance Framework',
  4: 'Operational Procedures',
  5: 'Regulatory Filings & Monitoring',
}

// ── Sub-components ───────────────────────────────────────────────

function StatusDot({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    complete:  'bg-[#0F7A5F]',
    failed:    'bg-red-500',
    drafting:  'bg-[#0047FF] animate-pulse',
    exporting: 'bg-[#0047FF] animate-pulse',
    drafted:   'bg-amber-400',
    queued:    'bg-gray-300',
  }
  return (
    <span className={`w-2 h-2 rounded-full shrink-0 ${cfg[status] ?? 'bg-gray-300'}`} />
  )
}

function DocumentRow({
  doc,
  token,
  suiteJobId,
  onRedraft,
}: {
  doc: SuiteDocument
  token: string
  suiteJobId: string
  onRedraft: (docType: string) => void
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-white border border-[#E8EBF0] rounded-lg mb-2">
      <div className="flex items-center gap-3">
        <StatusDot status={doc.status} />
        <div>
          <p className="text-[13px] font-medium text-[#0B1829]">
            {doc.display_name || doc.doc_type.replace(/_/g, ' ')}
          </p>
          <p className={`text-[11px] capitalize ${
            doc.status === 'failed'
              ? 'text-red-500'
              : doc.status === 'complete'
                ? 'text-[#0F7A5F]'
                : 'text-gray-400'
          }`}>
            {doc.status === 'failed' && doc.error_message
              ? doc.error_message.slice(0, 60)
              : doc.status}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {doc.status === 'complete' && doc.job_id && (
          <a
            href={`${BASE_URL}/api/drafting/download/${doc.job_id}?token=${encodeURIComponent(token)}`}
            className="flex items-center gap-1 text-[11px] text-[#1A5FA8] hover:text-[#0B1829] transition-colors"
          >
            <Download size={11} /> DOCX
          </a>
        )}
        {doc.status === 'failed' && (
          <button
            onClick={() => onRedraft(doc.doc_type)}
            className="text-[11px] text-[#1A5FA8] hover:text-[#0B1829] transition-colors flex items-center gap-1"
          >
            <RefreshCw size={11} /> Retry
          </button>
        )}
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────

export default function SuiteStatusPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const suiteJobId = params.suiteJobId as string
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken || ''

  const [suite, setSuite] = useState<SuiteStatus | null>(null)
  const [error, setError] = useState('')
  const isTerminalRef = useRef(false)

  useEffect(() => {
    if (!token || !suiteJobId) return
    let active = true
    isTerminalRef.current = false

    async function poll() {
      try {
        const data = await apiFetch<SuiteStatus>(
          `/api/drafting/suite/${suiteJobId}/status`, { token }
        )
        if (!active) return
        if (!data || !data.suite_job_id) {
          setError('Unexpected response from server')
          return
        }
        setSuite(data)
        const terminal = data.status === 'complete'
          || data.status === 'partial'
          || data.status === 'failed'
        if (terminal) isTerminalRef.current = true
      } catch (e: any) {
        if (active) setError(e.message)
      }
    }

    poll()
    const id = setInterval(() => {
      if (isTerminalRef.current) {
        clearInterval(id)
        return
      }
      poll()
    }, 5000)

    return () => {
      active = false
      clearInterval(id)
    }
  }, [token, suiteJobId])

  async function handleRedraft(docType: string) {
    try {
      await apiFetch(`/api/drafting/suite/${suiteJobId}/redraft/${docType}`, {
        method: 'POST',
        token,
      })
      // Re-poll immediately to reflect the new 'drafting' state
      isTerminalRef.current = false
      const data = await apiFetch<SuiteStatus>(
        `/api/drafting/suite/${suiteJobId}/status`, { token }
      )
      setSuite(data)
    } catch (e: any) {
      setError(e.message)
    }
  }

  function getDownloadAllUrl() {
    return `${BASE_URL}/api/drafting/suite/${suiteJobId}/download?token=${encodeURIComponent(token)}`
  }

  if (error) {
    return (
      <div className="max-w-[720px] mx-auto py-8 px-4">
        <p className="text-red-600 text-[13px] mb-4">{error}</p>
        <a
          href="/compliance/documents"
          className="text-[12px] text-[#1A5FA8] hover:underline"
        >
          ← Return to documents
        </a>
      </div>
    )
  }

  if (!suite) {
    return (
      <div className="max-w-[720px] mx-auto py-8 px-4">
        {/* Skeleton loading state */}
        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-4 w-40 bg-gray-100 rounded animate-pulse mb-6" />
        <div className="h-3 bg-gray-100 rounded-full animate-pulse mb-6" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse mb-2" />
        ))}
      </div>
    )
  }

  const isTerminal = suite.status === 'complete' || suite.status === 'partial' || suite.status === 'failed'
  const progressPct = suite.total_documents > 0
    ? Math.round((suite.completed_documents / suite.total_documents) * 100)
    : 0

  // Group documents by tier
  const byTier = (suite.document_statuses ?? suite.documents ?? []).reduce((acc, doc) => {
    const t = doc.tier || 1
    if (!acc[t]) acc[t] = []
    acc[t].push(doc)
    return acc
  }, {} as Record<number, SuiteDocument[]>)

  return (
    <div className="max-w-[720px] mx-auto py-8 px-4">
      <button
        onClick={() => router.push('/compliance/governance-suite')}
        className="flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 mb-4 transition-colors"
      >
        <ArrowLeft size={12} /> Back
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#0B1829]">Governance Suite</h1>
          <p className="text-[12px] text-gray-500 mt-0.5">
            {suite.jurisdiction} · {suite.total_documents} documents
            {!isTerminal && (
              <span className="ml-2 inline-flex items-center gap-1 text-[#0047FF]">
                <Loader2 size={10} className="animate-spin" /> Running
              </span>
            )}
          </p>
        </div>
        {suite.completed_documents > 0 && (
          <a
            href={getDownloadAllUrl()}
            className="flex items-center gap-2 px-4 py-2 bg-[#0B1829] text-white rounded-lg text-[12px] font-semibold hover:bg-[#1D2D44] transition-colors"
          >
            <Download size={14} /> Download all (ZIP)
          </a>
        )}
      </div>

      {/* Progress bar */}
      {suite.total_documents > 0 && (
        <div className="mb-8">
          <div className="flex justify-between text-[11px] text-gray-500 mb-1.5">
            <span>{suite.completed_documents} of {suite.total_documents} complete</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0F7A5F] rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Empty state: suite initiated but 0 documents */}
      {suite.total_documents === 0 && suite.status !== 'failed' && (
        <div className="text-center py-12">
          <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-black/40 mb-3">
            SUITE INITIATED
          </p>
          <p className="text-[14px] text-black/70 mb-6">
            Your governance suite for {suite.jurisdiction} has been created. Document drafting will begin shortly.
          </p>
          <p className="text-[12px] text-black/40 mb-6">
            Suite ID: {suiteJobId}
          </p>
          <a
            href="/compliance/documents"
            className="font-mono text-[11px] uppercase tracking-[0.15em] text-[#0047FF] hover:underline"
          >
            Draft individual documents →
          </a>
        </div>
      )}

      {/* Suite failed state */}
      {suite.status === 'failed' && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-[13px] text-red-700 font-medium">Suite failed.</p>
          <p className="text-[12px] text-red-600 mt-1">
            Use the Retry buttons on individual documents to re-draft failed items.
          </p>
        </div>
      )}

      {/* Documents grouped by tier */}
      {Object.entries(byTier)
        .sort(([a], [b]) => +a - +b)
        .map(([tier, docs]) => (
          <div key={tier} className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#0F7A5F]">
                Tier {tier}
              </span>
              <span className="text-[11px] text-black/40">
                {TIER_LABELS[+tier]}
              </span>
              <span className="text-[10px] text-gray-300">
                {docs.filter(d => d.status === 'complete').length}/{docs.length}
              </span>
            </div>
            {docs.map(doc => (
              <DocumentRow
                key={doc.doc_type}
                doc={doc}
                token={token}
                suiteJobId={suiteJobId}
                onRedraft={handleRedraft}
              />
            ))}
          </div>
        ))}
    </div>
  )
}
