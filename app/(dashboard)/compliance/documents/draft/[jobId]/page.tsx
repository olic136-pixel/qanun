'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Download, ArrowLeft, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { getJobStatus, getDownloadUrl, type JobStatus } from '@/lib/api/drafting'

export default function DraftProgressPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const jobId = params.jobId as string

  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken || ''

  const [status, setStatus] = useState<JobStatus | null>(null)
  const [error, setError] = useState('')

  const poll = useCallback(async () => {
    if (!token || !jobId) return 'waiting'
    try {
      const s = await getJobStatus(jobId, token)
      setStatus(s)
      return s.status
    } catch (e: any) {
      setError(e.message)
      return 'failed'
    }
  }, [jobId, token])

  useEffect(() => {
    if (!token) return

    let intervalId: ReturnType<typeof setInterval>

    const startPolling = async () => {
      const initial = await poll()
      if (initial === 'complete' || initial === 'failed') return

      intervalId = setInterval(async () => {
        const s = await poll()
        if (s === 'complete' || s === 'failed') {
          clearInterval(intervalId)
        }
      }, 4000)
    }

    startPolling()
    return () => clearInterval(intervalId)
  }, [poll, token])

  const isComplete = status?.status === 'complete'
  const isFailed = status?.status === 'failed'
  const progress = status?.progress ?? 0
  const sectionsTotal = status?.total_sections ?? 0
  const sectionsDone = status?.sections_drafted ?? 0

  return (
    <div className="flex items-start justify-center pt-12 pb-24">
      <div className="w-full max-w-[560px] bg-white border border-[#E8EBF0] rounded-xl p-10">
        {/* Status heading */}
        <div className="text-center mb-8">
          <StatusIcon status={status?.status ?? 'queued'} progress={progress} />
          <h1 className="text-xl font-bold text-[#0B1829] mt-4 mb-1">
            {isComplete
              ? 'Document Ready'
              : isFailed
                ? 'Drafting Failed'
                : 'Drafting Document…'}
          </h1>
          <p className="text-[13px] text-gray-500">
            {isComplete
              ? 'Your document has been drafted and is ready to download.'
              : isFailed
                ? status?.error ?? 'An unexpected error occurred.'
                : `Section ${sectionsDone} of ${sectionsTotal}`}
          </p>
        </div>

        {/* Progress bar */}
        {!isFailed && (
          <div className="mb-8">
            <div className="flex justify-between mb-2 text-[12px]">
              <span className="text-gray-500">Progress</span>
              <span className="font-semibold text-[#0B1829]">{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isComplete ? 'bg-emerald-500' : 'bg-[#0B1829]'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Section dots */}
        {!isComplete && !isFailed && sectionsTotal > 0 && (
          <div className="mb-6 p-4 bg-[#F5F7FA] rounded-lg">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-2.5">
              Sections drafted
            </p>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: sectionsTotal }, (_, i) => (
                <div
                  key={i}
                  className={`w-7 h-7 rounded flex items-center justify-center text-[10px] font-semibold transition-colors duration-300 ${
                    i < sectionsDone
                      ? 'bg-[#0B1829] text-white'
                      : i === sectionsDone
                        ? 'bg-[#1A5FA8] text-white animate-pulse'
                        : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Complete: stats + download */}
        {isComplete && (
          <>
            <div className="flex gap-3 mb-5">
              <StatCard label="Citations" value={status?.unique_citations ?? 0} />
              <StatCard label="Sections" value={sectionsTotal} />
              <StatCard
                label="Warnings"
                value={status?.coverage_warnings?.length ?? 0}
                highlight={(status?.coverage_warnings?.length ?? 0) > 0}
              />
            </div>

            {(status?.coverage_warnings?.length ?? 0) > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md mb-4">
                <p className="text-[11px] font-semibold text-amber-800 mb-1">Coverage notes</p>
                {status!.coverage_warnings!.slice(0, 3).map((w, i) => (
                  <p key={i} className="text-[11px] text-amber-700 leading-relaxed">
                    {w}
                  </p>
                ))}
              </div>
            )}

            <a
              href={getDownloadUrl(jobId, token)}
              download={status?.output_filename ?? 'document.docx'}
              className="flex items-center justify-center gap-2 w-full py-3 bg-[#0B1829] text-white rounded-md text-[14px] font-semibold hover:bg-[#1D2D44] transition-colors mb-3"
            >
              <Download size={16} /> Download DOCX
            </a>

            <button
              onClick={() => router.push('/compliance/documents')}
              className="w-full py-2.5 bg-transparent text-gray-500 border border-[#E8EBF0] rounded-md text-[13px] font-medium hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Back to documents
            </button>
          </>
        )}

        {isFailed && (
          <div className="space-y-3">
            <button
              onClick={() => router.push('/compliance/documents/new')}
              className="w-full py-3 bg-[#0B1829] text-white rounded-md text-[13px] font-semibold hover:bg-[#1D2D44] transition-colors cursor-pointer"
            >
              Try again
            </button>
            <button
              onClick={() => router.push('/compliance/documents')}
              className="w-full py-2.5 bg-transparent text-gray-500 border border-[#E8EBF0] rounded-md text-[13px] font-medium hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Back to documents
            </button>
          </div>
        )}

        {/* Job ID */}
        <p className="text-[10px] text-gray-300 text-center mt-6">Job ID: {jobId}</p>
      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────

function StatusIcon({ status, progress }: { status: string; progress: number }) {
  if (status === 'complete') {
    return (
      <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
        <CheckCircle2 size={28} className="text-emerald-500" />
      </div>
    )
  }
  if (status === 'failed') {
    return (
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
        <XCircle size={28} className="text-red-500" />
      </div>
    )
  }
  // Running: conic gradient ring
  return (
    <div
      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
      style={{
        background: `conic-gradient(#0B1829 ${progress}%, #E5E7EB ${progress}%)`,
      }}
    >
      <div className="w-[50px] h-[50px] rounded-full bg-white flex items-center justify-center">
        <span className="text-[12px] font-bold text-[#0B1829]">{progress}%</span>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: number
  highlight?: boolean
}) {
  return (
    <div className="flex-1 p-3 bg-[#F5F7FA] rounded-md text-center">
      <p className={`text-xl font-bold ${highlight ? 'text-amber-600' : 'text-[#0B1829]'}`}>
        {value}
      </p>
      <p className="text-[11px] text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}
