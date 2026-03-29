'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api/client'
import { Download, ArrowLeft, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react'

interface DocumentStatus {
  doc_type: string
  job_id: string
  status: string
  progress: number
  download_url: string | null
}

interface SuiteStatus {
  suite_job_id: string
  status: string
  jurisdiction: string
  total_documents: number
  completed_documents: number
  failed_documents: number
  document_statuses: DocumentStatus[]
  created_at: string
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'complete') return <CheckCircle2 size={14} className="text-emerald-500" />
  if (status === 'failed') return <XCircle size={14} className="text-red-500" />
  if (status === 'running' || status === 'exporting') return <Loader2 size={14} className="animate-spin text-blue-500" />
  return <Clock size={14} className="text-gray-400" />
}

export default function SuiteStatusPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const suiteJobId = params.suiteJobId as string
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken || ''

  const [suite, setSuite] = useState<SuiteStatus | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token || !suiteJobId) return
    let active = true

    async function poll() {
      try {
        const data = await apiFetch<SuiteStatus>(
          `/api/drafting/suite/${suiteJobId}/status`, { token }
        )
        if (active) setSuite(data)
      } catch (e: any) {
        if (active) setError(e.message)
      }
    }

    poll()
    const id = setInterval(() => {
      if (suite?.status === 'complete' || suite?.status === 'partial') {
        clearInterval(id)
        return
      }
      poll()
    }, 4000)

    return () => { active = false; clearInterval(id) }
  }, [token, suiteJobId, suite?.status])

  function getDownloadAllUrl() {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.qanun.io'
    return `${base}/api/drafting/suite/${suiteJobId}/download?token=${encodeURIComponent(token)}`
  }

  if (error) return (
    <div className="max-w-[720px] mx-auto py-8 px-4">
      <p className="text-red-600 text-[13px]">{error}</p>
    </div>
  )

  if (!suite) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={20} className="animate-spin text-gray-400" />
    </div>
  )

  const isTerminal = suite.status === 'complete' || suite.status === 'partial'
  const progressPct = suite.total_documents > 0
    ? Math.round((suite.completed_documents / suite.total_documents) * 100)
    : 0

  return (
    <div className="max-w-[720px] mx-auto py-8 px-4">
      <button
        onClick={() => router.push('/compliance/governance-suite')}
        className="flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 mb-4"
      >
        <ArrowLeft size={12} /> Back
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#0B1829]">Governance Suite</h1>
          <p className="text-[12px] text-gray-500 mt-0.5">
            {suite.jurisdiction} · {suite.total_documents} documents
          </p>
        </div>
        {isTerminal && (
          <a
            href={getDownloadAllUrl()}
            className="flex items-center gap-2 px-4 py-2 bg-[#0B1829] text-white rounded-lg text-[12px] font-semibold hover:bg-[#1D2D44] transition-colors"
          >
            <Download size={14} /> Download all
          </a>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-6">
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

      {/* Document list */}
      <div className="space-y-2">
        {suite.document_statuses.map((doc) => (
          <div
            key={doc.doc_type}
            className="flex items-center justify-between p-3 bg-white border border-[#E8EBF0] rounded-lg"
          >
            <div className="flex items-center gap-3">
              <StatusIcon status={doc.status} />
              <div>
                <p className="text-[13px] font-medium text-[#0B1829]">
                  {doc.doc_type.replace(/_/g, ' ')}
                </p>
                <p className="text-[11px] text-gray-400 capitalize">{doc.status}</p>
              </div>
            </div>
            {doc.download_url && (
              <a
                href={`${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.qanun.io'}${doc.download_url}?token=${encodeURIComponent(token)}`}
                className="text-[11px] text-[#1A5FA8] hover:underline flex items-center gap-1"
              >
                <Download size={11} /> DOCX
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
