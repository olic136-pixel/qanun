'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Download, Loader2, CheckCircle2, Package } from 'lucide-react'
import {
  getSubmissionStatus, startSubmissionPackage,
  getReportUrl, getExportUrl,
  listEntities,
  type PackageStatus, type DocumentStatus, type EntitySummary,
} from '@/lib/api/entities'

const ENTITY_ID = 'tradedarcateg3a-demo-0001'

const STATUS_CFG = {
  complete: { label: 'Complete', tw: 'bg-emerald-50 text-emerald-700', icon: '✓' },
  review_required: { label: 'Review', tw: 'bg-amber-50 text-amber-700', icon: '⚠' },
  running: { label: 'Drafting…', tw: 'bg-blue-50 text-blue-700', icon: '⟳' },
  queued: { label: 'Queued', tw: 'bg-blue-50 text-blue-600', icon: '⟳' },
  not_started: { label: 'Not Started', tw: 'bg-gray-100 text-gray-500', icon: '○' },
  failed: { label: 'Failed', tw: 'bg-red-50 text-red-700', icon: '✗' },
  skipped: { label: 'Skipped', tw: 'bg-gray-100 text-gray-500', icon: '↷' },
} as const

export default function SubmissionPage() {
  const { data: session } = useSession()
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken || ''

  const [entities, setEntities] = useState<EntitySummary[]>([])
  const [activeEntityId, setActiveEntityId] = useState(ENTITY_ID)
  const [status, setStatus] = useState<PackageStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')

  // Load entities
  useEffect(() => {
    if (!token) return
    listEntities(token)
      .then((r) => {
        setEntities(r.entities)
        if (r.entities.length > 0 && !r.entities.find((e) => e.entity_id === activeEntityId)) {
          setActiveEntityId(r.entities[0].entity_id)
        }
      })
      .catch((e) => setError(e.message))
  }, [token])

  const load = useCallback(async () => {
    if (!token || !activeEntityId) return
    try {
      const s = await getSubmissionStatus(activeEntityId, token)
      setStatus(s)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [token, activeEntityId])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  // Poll when running
  useEffect(() => {
    if (!status) return
    const isRunning = status.running_count > 0 || status.overall_status === 'running'
    if (!isRunning) return
    const interval = setInterval(load, 10000)
    return () => clearInterval(interval)
  }, [status, load])

  async function handleStart() {
    if (!token || !activeEntityId) return
    setStarting(true)
    try {
      await startSubmissionPackage(activeEntityId, token)
      await load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setStarting(false)
    }
  }

  const activeEntity = entities.find((e) => e.entity_id === activeEntityId)
  const isRunning = (status?.running_count ?? 0) > 0
  const isComplete = (status?.complete_count ?? 0) === (status?.total_documents ?? 10)
  const canStart = !isRunning && !isComplete && !starting

  const tier1 = status?.documents.filter((d) => d.tier === 1) ?? []
  const tier2 = status?.documents.filter((d) => d.tier === 2) ?? []
  const tier3 = status?.documents.filter((d) => d.tier === 3) ?? []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-500">
        <Loader2 size={16} className="animate-spin mr-2" /> Loading…
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0B1829]">Submission Package</h1>
          <div className="flex items-center gap-2 mt-1">
            {entities.length > 1 && (
              <select
                value={activeEntityId}
                onChange={(e) => setActiveEntityId(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                {entities.map((e) => (
                  <option key={e.entity_id} value={e.entity_id}>
                    {e.entity_name} ({e.completion_pct}%)
                  </option>
                ))}
              </select>
            )}
            <p className="text-sm text-gray-500">
              {activeEntity?.entity_name ?? '…'} · {activeEntity?.entity_type?.replace('_', ' ').toUpperCase() ?? '…'} · ADGM
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isComplete && token && (
            <>
              <a
                href={getReportUrl(activeEntityId, token)}
                download
                className="flex items-center gap-1.5 px-4 py-2 border border-[#0B1829] text-[#0B1829] text-sm font-semibold rounded-md hover:bg-gray-50"
              >
                <Download size={14} /> Report
              </a>
              <a
                href={getExportUrl(activeEntityId, token)}
                download
                className="flex items-center gap-1.5 px-4 py-2 bg-[#0B1829] text-white text-sm font-semibold rounded-md hover:bg-[#1D2D44]"
              >
                <Package size={14} /> Export ZIP
              </a>
            </>
          )}
          {canStart && (
            <button
              onClick={handleStart}
              disabled={starting}
              className="px-4 py-2 bg-[#0B1829] text-white text-sm font-semibold rounded-md hover:bg-[#1D2D44] disabled:bg-gray-400"
            >
              {starting ? 'Starting…' : '→ Draft All Documents'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Progress */}
      {status && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                Submission Readiness
              </p>
              <p className="text-3xl font-bold text-[#0B1829] mt-1">{status.completion_pct}%</p>
            </div>
            <div className="grid grid-cols-3 gap-8 text-center">
              {[
                { l: 'Complete', v: status.complete_count, c: '#059669' },
                { l: 'In Progress', v: status.running_count, c: '#2563EB' },
                { l: 'Remaining', v: status.total_documents - status.complete_count - status.running_count, c: '#6B7280' },
              ].map(({ l, v, c }) => (
                <div key={l}>
                  <p className="text-2xl font-bold" style={{ color: c }}>{v}</p>
                  <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mt-1">{l}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${status.completion_pct}%`, backgroundColor: isComplete ? '#059669' : '#0B1829' }}
            />
          </div>
          {isRunning && <p className="text-[10px] text-blue-600 mt-2 text-right">Live — updating every 10 seconds</p>}
        </div>
      )}

      {/* Document tiers */}
      {status &&
        [
          { tier: 1, docs: tier1, label: 'Tier 1 — Foundation Documents', note: null },
          { tier: 2, docs: tier2, label: 'Tier 2 — Policy Layer', note: 'Drafted after Tier 1' },
          { tier: 3, docs: tier3, label: 'Tier 3 — Compliance Framework', note: 'Drafted last' },
        ].map(({ tier, docs, label, note }) => (
          <div key={tier} className="bg-white border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-[11px] font-bold text-[#0B1829] uppercase tracking-wide">{label}</h2>
              {note && <p className="text-[10px] text-gray-500 mt-0.5">{note}</p>}
            </div>
            <div className="divide-y divide-gray-50">
              {docs.map((doc) => {
                const cfg = STATUS_CFG[doc.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.not_started
                return (
                  <div key={doc.doc_type} className="px-6 py-4 flex items-center gap-4">
                    <span className="text-sm font-bold w-5 text-center shrink-0" style={{ color: cfg.icon === '✓' ? '#059669' : cfg.icon === '✗' ? '#DC2626' : '#6B7280' }}>
                      {cfg.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1D2D44]">{doc.display_name}</p>
                      {(doc.status === 'running' || doc.status === 'queued') && (doc.total_sections ?? 0) > 0 && (
                        <div className="mt-1.5">
                          <div className="h-1 bg-gray-100 rounded-full overflow-hidden w-48">
                            <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${doc.progress ?? 0}%` }} />
                          </div>
                          <p className="text-[10px] text-blue-600 mt-0.5">Section {doc.sections_drafted} of {doc.total_sections}</p>
                        </div>
                      )}
                      {doc.status === 'failed' && doc.error && <p className="text-[10px] text-red-500 mt-0.5">{doc.error.slice(0, 80)}</p>}
                    </div>
                    {(doc.active_alert_count ?? 0) > 0 && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 shrink-0">
                        {doc.active_alert_count} alert{doc.active_alert_count !== 1 ? 's' : ''}
                      </span>
                    )}
                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${cfg.tw}`}>{cfg.label}</span>
                    {doc.job_id && doc.status === 'complete' && (
                      <Link href={`/compliance/documents/${doc.job_id}`} className="text-[10px] text-gray-400 hover:text-gray-600 shrink-0">View →</Link>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

      {/* Complete banner */}
      {isComplete && token && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={20} className="text-emerald-600" />
            <h3 className="text-emerald-800 font-bold">Submission Package Complete</h3>
          </div>
          <p className="text-emerald-700 text-sm mb-4">
            All {status?.total_documents} compliance documents are drafted and citation-current.
          </p>
          <div className="flex gap-3">
            <a href={getReportUrl(activeEntityId, token)} download className="px-4 py-2 border border-emerald-700 text-emerald-700 text-sm font-semibold rounded-md hover:bg-emerald-100">
              ↓ Readiness Report
            </a>
            <a href={getExportUrl(activeEntityId, token)} download className="px-4 py-2 bg-emerald-700 text-white text-sm font-semibold rounded-md hover:bg-emerald-800">
              ↓ Full Package (ZIP)
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
