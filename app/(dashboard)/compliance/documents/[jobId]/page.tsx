'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Download, RefreshCw, CheckCircle2 } from 'lucide-react'
import { getJobStatus, getDownloadUrl, type JobStatus } from '@/lib/api/drafting'
import {
  getDocTwins,
  getDocTwinAlerts,
  refreshDocTwin,
  resolveDocAlert,
  getMethodology,
  type DocTwin,
  type DocAlert,
  type MethodologyNote,
} from '@/lib/api/twins'

const ENTITY_ID = 'tradedarcateg3a-demo-0001'

const SEVERITY_CONFIG = {
  high: { label: 'High', tw: 'bg-red-50 text-red-700 border-red-200' },
  medium: { label: 'Medium', tw: 'bg-amber-50 text-amber-700 border-amber-200' },
  low: { label: 'Low', tw: 'bg-green-50 text-green-700 border-green-200' },
} as const

const TWIN_STATUS_CONFIG = {
  current: { label: 'Current', tw: 'bg-emerald-50 text-emerald-700' },
  stale: { label: 'Stale — review required', tw: 'bg-amber-50 text-amber-700' },
  review_required: { label: 'Review required', tw: 'bg-red-50 text-red-700' },
  archived: { label: 'Archived', tw: 'bg-gray-100 text-gray-500' },
} as const

export default function DocumentDetailPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const jobId = params.jobId as string

  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken || ''

  const [job, setJob] = useState<JobStatus | null>(null)
  const [twin, setTwin] = useState<DocTwin | null>(null)
  const [alerts, setAlerts] = useState<DocAlert[]>([])
  const [methodology, setMethodology] = useState<MethodologyNote | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function loadData() {
    if (!token) return
    try {
      const [jobData, twinsData] = await Promise.all([
        getJobStatus(jobId, token),
        getDocTwins(ENTITY_ID, token),
      ])
      setJob(jobData)
      const t = twinsData.twins.find((tw) => tw.job_id === jobId)
      if (t) {
        setTwin(t)
        const alertData = await getDocTwinAlerts(t.twin_id, token)
        setAlerts(alertData.alerts)
        // Load methodology for the document type
        try {
          const m = await getMethodology(t.doc_type, token)
          setMethodology(m)
        } catch {
          // Methodology not available — non-fatal
        }
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [jobId, token])

  async function handleRefresh() {
    if (!twin || !token) return
    setRefreshing(true)
    try {
      await refreshDocTwin(twin.twin_id, token)
      setTimeout(() => {
        loadData()
        setRefreshing(false)
      }, 3000)
    } catch (e: any) {
      setError(e.message)
      setRefreshing(false)
    }
  }

  async function handleResolve(alertId: string) {
    if (!token) return
    setResolvingId(alertId)
    try {
      await resolveDocAlert(alertId, 'Reviewed and acknowledged', token)
      setAlerts((prev) =>
        prev.map((a) =>
          a.alert_id === alertId ? { ...a, status: 'resolved' as const } : a
        )
      )
    } catch (e: any) {
      setError(e.message)
    } finally {
      setResolvingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-500">
        Loading…
      </div>
    )
  }

  const twinStatus = twin
    ? TWIN_STATUS_CONFIG[twin.status as keyof typeof TWIN_STATUS_CONFIG] ??
      TWIN_STATUS_CONFIG.current
    : null

  const openAlerts = alerts.filter((a) => a.status === 'open')
  const resolvedAlerts = alerts.filter((a) => a.status !== 'open')

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => router.push('/compliance/documents')}
        className="flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 transition-colors"
      >
        <ArrowLeft size={12} /> Documents
      </button>

      {/* Document header */}
      <div className="bg-white border border-[#E8EBF0] rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#0B1829]">
              {job?.output_filename
                ?.replace(/_/g, ' ')
                .replace('.docx', '') ?? 'Document'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Drafted{' '}
              {twin?.created_at
                ? new Date(twin.created_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : '—'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {twinStatus && (
              <span
                className={`text-[11px] font-semibold px-3 py-1 rounded-full ${twinStatus.tw}`}
              >
                {twinStatus.label}
              </span>
            )}
            {token && job?.status === 'complete' && (
              <a
                href={getDownloadUrl(jobId, token)}
                download={job.output_filename ?? 'document.docx'}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#0B1829] text-white text-[13px] font-semibold rounded-md hover:bg-[#1D2D44] transition-colors"
              >
                <Download size={14} /> Download
              </a>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
          <StatCard label="Citations" value={job?.unique_citations ?? 0} />
          <StatCard
            label="Open Alerts"
            value={openAlerts.length}
            highlight={openAlerts.length > 0}
          />
          <StatCard
            label="Coverage Warnings"
            value={job?.coverage_warnings?.length ?? 0}
          />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-1">
              Last Checked
            </p>
            <p className="text-sm font-semibold text-[#0B1829]">
              {twin?.last_checked_at
                ? new Date(twin.last_checked_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                  })
                : 'Not yet'}
            </p>
          </div>
        </div>
      </div>

      {/* Open alerts */}
      {openAlerts.length > 0 && (
        <div className="bg-white border border-[#E8EBF0] rounded-lg">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-[11px] font-bold text-[#0B1829] uppercase tracking-wide">
              Open Alerts ({openAlerts.length})
            </h2>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1 text-[11px] text-blue-600 font-semibold disabled:text-gray-400"
            >
              <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Checking…' : 'Check now'}
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {openAlerts.map((alert) => {
              const sev =
                SEVERITY_CONFIG[alert.severity as keyof typeof SEVERITY_CONFIG] ??
                SEVERITY_CONFIG.medium
              return (
                <div key={alert.alert_id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 mt-0.5 ${sev.tw}`}
                      >
                        {sev.label}
                      </span>
                      <div>
                        <p className="text-[13px] font-semibold text-[#1D2D44]">
                          {alert.provision_ref
                            ? `${alert.provision_ref} — version updated`
                            : (alert.alert_type ?? '').replace(/_/g, ' ')}
                        </p>
                        <p className="text-[12px] text-gray-600 mt-0.5">
                          {alert.description}
                        </p>
                        {alert.old_version && alert.new_version && (
                          <p className="text-[11px] text-gray-400 mt-1 font-mono">
                            {alert.old_version} → {alert.new_version}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleResolve(alert.alert_id)}
                      disabled={resolvingId === alert.alert_id}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 shrink-0 disabled:text-gray-400"
                    >
                      {resolvingId === alert.alert_id ? 'Resolving…' : 'Resolve'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* No alerts */}
      {twin && openAlerts.length === 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-6 py-4 flex items-center gap-3">
          <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
          <p className="text-[13px] text-emerald-800 font-medium flex-1">
            All citations are current. No regulatory updates affect this document.
          </p>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold disabled:text-gray-400 shrink-0"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Checking…' : 'Check now'}
          </button>
        </div>
      )}

      {!twin && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-6 py-4 text-[13px] text-gray-500">
          Twin monitor not yet active for this document.
        </div>
      )}

      {/* Methodology info */}
      {methodology && (
        <details className="bg-white border border-[#E8EBF0] rounded-lg">
          <summary className="px-6 py-4 cursor-pointer text-[12px] font-semibold text-[#0B1829]">
            Regulatory Reasoning Framework — {methodology.methodology_type.replace(/_/g, ' ')}
            {methodology.corpus_verified_twice && (
              <span className="ml-2 text-[10px] text-emerald-600 font-normal">✓ corpus-verified</span>
            )}
          </summary>
          <div className="px-6 pb-4 border-t border-gray-100 pt-3 space-y-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">
                Analytical Pattern
              </p>
              <p className="text-[12px] text-[#1D2D44] font-mono">
                {methodology.analytical_pattern}
              </p>
            </div>
            {methodology.fatal_failures.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-red-500 mb-1">
                  Fatal Compliance Failures
                </p>
                {methodology.fatal_failures.map((f, i) => (
                  <p key={i} className="text-[11px] text-red-700 bg-red-50 rounded px-2 py-1 mb-1">
                    {f}
                  </p>
                ))}
              </div>
            )}
            {methodology.absent_from_stark_corpus && (
              <p className="text-[11px] text-amber-700 bg-amber-50 rounded px-2 py-1">
                No entity corpus examples available — drafted from corpus provisions and methodology only
              </p>
            )}
            {methodology.effective_date_note && (
              <p className="text-[10px] text-gray-500 italic">
                {methodology.effective_date_note}
              </p>
            )}
          </div>
        </details>
      )}

      {/* Coverage warnings */}
      {(job?.coverage_warnings?.length ?? 0) > 0 && (
        <div className="bg-white border border-[#E8EBF0] rounded-lg">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-[11px] font-bold text-[#0B1829] uppercase tracking-wide">
              Coverage Notes
            </h2>
          </div>
          <div className="px-6 py-4 space-y-2">
            {job!.coverage_warnings!.map((w, i) => (
              <p key={i} className="text-[12px] text-amber-800 bg-amber-50 rounded px-3 py-2">
                {w}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Resolved alerts */}
      {resolvedAlerts.length > 0 && (
        <details className="bg-white border border-[#E8EBF0] rounded-lg">
          <summary className="px-6 py-4 cursor-pointer text-[12px] font-semibold text-gray-500">
            Resolved alerts ({resolvedAlerts.length})
          </summary>
          <div className="divide-y divide-gray-50 border-t border-gray-100">
            {resolvedAlerts.map((alert) => (
              <div key={alert.alert_id} className="px-6 py-3 text-[12px] text-gray-500">
                <span className="line-through">
                  {alert.provision_ref ?? alert.alert_type}
                </span>
                {alert.resolution_notes && (
                  <span className="ml-2 text-gray-400">— {alert.resolution_notes}</span>
                )}
              </div>
            ))}
          </div>
        </details>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-6 py-4 text-[13px] text-red-700">
          {error}
        </div>
      )}
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
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-1">
        {label}
      </p>
      <p className={`text-2xl font-bold ${highlight ? 'text-amber-600' : 'text-[#0B1829]'}`}>
        {value}
      </p>
    </div>
  )
}
