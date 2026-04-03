'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Download, ArrowLeft, CheckCircle2, XCircle, Loader2, AlertTriangle, RefreshCw } from 'lucide-react'
import { getJobStatus, getDownloadUrl, retryDraft, type JobStatus } from '@/lib/api/drafting'
import { DocumentReviewModal } from '@/components/qanun/DocumentReviewModal'

export default function DraftProgressPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const jobId = params.jobId as string

  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken || ''

  const [status, setStatus] = useState<JobStatus | null>(null)
  const [error, setError] = useState('')
  const [retrying, setRetrying] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

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

    const terminalStates = ['complete', 'failed', 'export_failed']

    const startPolling = async () => {
      const initial = await poll()
      if (terminalStates.includes(initial)) return

      intervalRef.current = setInterval(async () => {
        const s = await poll()
        if (terminalStates.includes(s)) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }, 3000)
    }

    startPolling()
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [poll, token])

  const handleRetry = async () => {
    if (!token || !jobId || retrying) return
    setRetrying(true)
    try {
      await retryDraft(jobId, token)
      // Resume polling
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = setInterval(async () => {
        const s = await poll()
        if (['complete', 'failed', 'export_failed'].includes(s)) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }, 3000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setRetrying(false)
    }
  }

  const isComplete = status?.status === 'complete'
  const isFailed = status?.status === 'failed'
  const isExportFailed = status?.status === 'export_failed'
  const isDrafted = status?.status === 'drafted'
  const isExporting = status?.status === 'exporting'
  const isRunning = status?.status === 'running' || status?.status === 'queued' || status?.status === 'created'
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
              : isExportFailed
                ? 'Document Drafted — Export Failed'
                : isFailed
                  ? 'Drafting Failed'
                  : isDrafted || isExporting
                    ? 'Exporting Document…'
                    : 'Drafting Document…'}
          </h1>
          <p className="text-[13px] text-gray-500">
            {isComplete
              ? 'Your document has been drafted and is ready to download.'
              : isExportFailed
                ? `All ${sectionsDone} sections were successfully drafted and preserved.`
                : isFailed
                  ? `Drafting failed at section ${sectionsDone} of ${sectionsTotal}.`
                  : isDrafted || isExporting
                    ? 'Assembling DOCX from drafted sections…'
                    : `Section ${sectionsDone} of ${sectionsTotal}`}
          </p>
        </div>

        {/* Progress bar — show for running, exporting, drafted states */}
        {(isRunning || isDrafted || isExporting) && (
          <div className="mb-8">
            <div className="flex justify-between mb-2 text-[12px]">
              <span className="text-gray-500">Progress</span>
              <span className="font-semibold text-[#0B1829]">{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 bg-[#0B1829]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Section dots — running state only */}
        {isRunning && sectionsTotal > 0 && (
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
              onClick={() => { setTimeout(() => setReviewOpen(true), 500) }}
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

            <DocumentReviewModal
              jobId={jobId}
              documentTitle={status?.output_filename?.replace('.docx', '') ?? 'Document'}
              entityName=""
              token={token}
              isOpen={reviewOpen}
              onClose={() => setReviewOpen(false)}
            />
          </>
        )}

        {/* Export failed: re-export screen */}
        {isExportFailed && (
          <div className="space-y-3">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md mb-2">
              <p className="text-[11px] text-amber-700 leading-relaxed">
                {status?.error ?? 'Export to DOCX failed.'}
              </p>
            </div>

            <button
              onClick={handleRetry}
              disabled={retrying}
              className="flex items-center justify-center gap-2 w-full py-3 bg-[#0B1829] text-white rounded-md text-[13px] font-semibold hover:bg-[#1D2D44] transition-colors cursor-pointer disabled:opacity-50"
            >
              {retrying ? (
                <><Loader2 size={14} className="animate-spin" /> Exporting…</>
              ) : (
                <><RefreshCw size={14} /> Re-export Document</>
              )}
            </button>

            <button
              onClick={() => router.push('/compliance/documents')}
              className="w-full py-2.5 bg-transparent text-gray-500 border border-[#E8EBF0] rounded-md text-[13px] font-medium hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Back to documents
            </button>

            <p className="text-[11px] text-gray-400 text-center">
              No Claude API calls required — all sections are preserved.
            </p>
          </div>
        )}

        {/* Generation failed: re-draft screen */}
        {isFailed && (
          <div className="space-y-3">
            <div className="p-3 bg-red-50 border border-red-200 rounded-md mb-2">
              <p className="text-[11px] text-red-700 leading-relaxed">
                {status?.error ?? 'An unexpected error occurred.'}
              </p>
            </div>

            <button
              onClick={handleRetry}
              disabled={retrying}
              className="flex items-center justify-center gap-2 w-full py-3 bg-[#0B1829] text-white rounded-md text-[13px] font-semibold hover:bg-[#1D2D44] transition-colors cursor-pointer disabled:opacity-50"
            >
              {retrying ? (
                <><Loader2 size={14} className="animate-spin" /> Re-drafting…</>
              ) : (
                <><RefreshCw size={14} /> Re-draft Document</>
              )}
            </button>

            <button
              onClick={() => router.push('/compliance/documents')}
              className="w-full py-2.5 bg-transparent text-gray-500 border border-[#E8EBF0] rounded-md text-[13px] font-medium hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Back to documents
            </button>

            <p className="text-[11px] text-gray-400 text-center">
              {sectionsTotal} Claude API calls will be made
            </p>
          </div>
        )}

        {/* Exporting state */}
        {(isDrafted || isExporting) && (
          <div className="text-center">
            <Loader2 size={20} className="animate-spin text-[#1A5FA8] mx-auto mb-2" />
            <p className="text-[12px] text-gray-400">Assembling document…</p>
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
  if (status === 'export_failed') {
    return (
      <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto">
        <AlertTriangle size={28} className="text-amber-500" />
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
  // Running / exporting: conic gradient ring
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
