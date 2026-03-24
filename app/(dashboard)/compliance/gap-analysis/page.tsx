'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { getGapAnalysis, type GapAnalysis, type GapItem } from '@/lib/api/twins'
import { PortabilityBadge } from '@/components/qanun/PortabilityBadge'

const ENTITY_ID = 'tradedarcateg3a-demo-0001'

const READINESS_CONFIG = {
  not_started: {
    label: 'Not started',
    tw: 'bg-red-50 border-red-200 text-red-700',
    description: 'No compliance documents have been drafted yet.',
  },
  in_progress: {
    label: 'In progress',
    tw: 'bg-amber-50 border-amber-200 text-amber-700',
    description: 'Document suite is partially complete.',
  },
  review_required: {
    label: 'Review required',
    tw: 'bg-violet-50 border-violet-200 text-violet-700',
    description: 'All documents drafted but some require review due to regulatory updates.',
  },
  submission_ready: {
    label: 'Submission ready',
    tw: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    description: 'All required documents are drafted and citations are current.',
  },
} as const

export default function GapAnalysisPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken || ''

  const [gap, setGap] = useState<GapAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    getGapAnalysis(ENTITY_ID, token)
      .then(setGap)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-500">
        <Loader2 size={16} className="animate-spin mr-2" />
        Analysing document suite…
      </div>
    )
  }

  if (error || !gap) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error || 'Gap analysis unavailable'}
        </div>
      </div>
    )
  }

  const readiness =
    READINESS_CONFIG[gap.readiness_status as keyof typeof READINESS_CONFIG] ??
    READINESS_CONFIG.not_started

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#0B1829]">Gap Analysis</h1>
        <p className="text-[13px] text-gray-500 mt-1">
          {gap.entity_name} · {gap.entity_type.replace(/_/g, ' ').toUpperCase()}
        </p>
      </div>

      {/* Readiness card */}
      <div className={`rounded-lg p-6 border ${readiness.tw}`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide opacity-80">
              Submission readiness
            </p>
            <p className="text-2xl font-bold mt-1">{readiness.label}</p>
            <p className="text-[13px] mt-1 opacity-80">{readiness.description}</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold">{gap.completion_pct}%</p>
            <p className="text-[11px] opacity-60 mt-1">
              {gap.completed_count + gap.stale_count}/{gap.total_required} documents
            </p>
          </div>
        </div>
        <div className="mt-4 h-2 rounded-full bg-white/60 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 bg-current opacity-50"
            style={{ width: `${gap.completion_pct}%` }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Required', value: gap.total_required, tw: 'text-[#0B1829]' },
          { label: 'Complete', value: gap.completed_count, tw: 'text-emerald-600' },
          { label: 'Needs review', value: gap.stale_count, tw: 'text-amber-600' },
          { label: 'Missing', value: gap.missing_count, tw: 'text-red-600' },
        ].map(({ label, value, tw }) => (
          <div
            key={label}
            className="bg-white border border-[#E8EBF0] rounded-lg p-4 text-center"
          >
            <p className={`text-3xl font-bold ${tw}`}>{value}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mt-1">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Missing documents */}
      {gap.missing.length > 0 && (
        <div className="bg-white border border-[#E8EBF0] rounded-lg">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-[11px] font-bold text-[#0B1829] uppercase tracking-wide">
              Missing Documents
            </h2>
            <span className="text-[10px] text-gray-400">Priority order for FSRA submission</span>
          </div>
          <div className="divide-y divide-gray-50">
            {gap.missing.map((item, i) => (
              <div key={item.doc_type} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-gray-200 w-6 text-right shrink-0">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-[#1D2D44]">
                      {item.display_name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <PortabilityBadge
                        layer={item.primary_portability_layer ?? 2}
                        size="sm"
                      />
                      {item.has_waystone_examples && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                          Waystone
                        </span>
                      )}
                      {item.has_stark_examples && !item.has_waystone_examples && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                          Stark
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Link
                  href={`/compliance/documents/new?type=${item.doc_type}`}
                  className="px-4 py-2 bg-[#0B1829] text-white text-[11px] font-bold rounded-md hover:bg-[#1D2D44] transition-colors shrink-0"
                >
                  Draft →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stale documents */}
      {gap.stale.length > 0 && (
        <div className="bg-white border border-amber-200 rounded-lg">
          <div className="px-6 py-4 border-b border-amber-100">
            <h2 className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">
              Review Required ({gap.stale.length})
            </h2>
            <p className="text-[11px] text-amber-700 mt-0.5">
              These documents have been drafted but regulatory updates may affect their
              citations.
            </p>
          </div>
          <div className="divide-y divide-amber-50">
            {gap.stale.map((item) => (
              <div
                key={item.doc_type}
                className="px-6 py-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-[13px] font-semibold text-[#1D2D44]">
                    {item.display_name}
                  </p>
                  <p className="text-[11px] text-amber-600 mt-0.5">
                    {item.active_alert_count ?? 0} open alert(s)
                  </p>
                </div>
                <Link
                  href={`/compliance/documents/${item.job_id}`}
                  className="text-[11px] font-semibold text-amber-700 hover:text-amber-900"
                >
                  Review alerts →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed documents */}
      {gap.completed.length > 0 && (
        <div className="bg-white border border-[#E8EBF0] rounded-lg">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-[11px] font-bold text-[#0B1829] uppercase tracking-wide">
              Complete ({gap.completed.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {gap.completed.map((item) => (
              <div
                key={item.doc_type}
                className="px-6 py-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-emerald-500 text-sm">✓</span>
                  <p className="text-[13px] font-semibold text-[#1D2D44]">
                    {item.display_name}
                  </p>
                </div>
                <Link
                  href={`/compliance/documents/${item.job_id}`}
                  className="text-[11px] text-gray-400 hover:text-gray-600"
                >
                  View →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] text-gray-400 text-right">
        Analysed {new Date(gap.analysed_at).toLocaleString('en-GB')}
      </p>
    </div>
  )
}
