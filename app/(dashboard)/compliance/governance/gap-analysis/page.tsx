'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Loader2, CheckCircle2, FileEdit, Upload,
  AlertTriangle, Link2,
} from 'lucide-react'
import { useEntity } from '@/lib/entity-context'
import { getTemplateSlug } from '@/lib/governance/document-template-map'
import {
  getGapAnalysis, type GapAnalysisResponse, type GapAnalysisItem,
} from '@/lib/api/governance'

// ── Constants ──────────────────────────────────────────────────

const PHASE_DISPLAY: Record<string, { label: string; description: string; order: number }> = {
  pre_application: { label: 'Pre-Application', description: 'Required for FSP application submission', order: 1 },
  pre_final_approval: { label: 'Pre-Final Approval', description: 'Required between IPA and Final Approval', order: 2 },
  post_authorisation: { label: 'Post-Authorisation', description: 'Required for operational compliance', order: 3 },
  pre_fund_launch: { label: 'Pre-Fund Launch', description: 'Required before fund launch (Cat 3C)', order: 4 },
}

const CATEGORY_LABELS: Record<string, string> = {
  governance: 'Governance',
  compliance: 'Compliance',
  aml_cft: 'AML/CFT',
  risk: 'Risk',
  operations: 'Operations',
  commercial: 'Commercial',
  hr_people: 'HR',
  financial: 'Financial',
  funds: 'Funds',
}

const STATUS_COLORS: Record<string, string> = {
  not_started: '#94A3B8',
  in_progress: '#3B82F6',
}

// ── Page ──────────────────────────────────────────────────────

export default function GapAnalysisPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { selectedEntity } = useEntity()

  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken || ''
  const entityId = selectedEntity?.id ?? ''

  const [data, setData] = useState<GapAnalysisResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token || !entityId) return
    let cancelled = false
    setLoading(true)

    getGapAnalysis(entityId, token)
      .then((res) => { if (!cancelled) setData(res) })
      .catch(() => { if (!cancelled) setData(null) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [token, entityId])

  // Group gaps by phase
  const phaseGroups = useMemo(() => {
    if (!data) return []
    const groups = new Map<string, GapAnalysisItem[]>()
    for (const gap of data.gaps) {
      if (!groups.has(gap.phase_required)) groups.set(gap.phase_required, [])
      groups.get(gap.phase_required)!.push(gap)
    }
    return [...groups.entries()]
      .map(([phase, gaps]) => ({
        phase,
        display: PHASE_DISPLAY[phase] ?? { label: phase, description: '', order: 99 },
        gaps,
      }))
      .sort((a, b) => a.display.order - b.display.order)
  }, [data])

  const blockingCount = useMemo(
    () => data?.gaps.filter((g) => g.blocks_count > 0).length ?? 0,
    [data],
  )

  if (!entityId) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-500">
        Select an entity to view gap analysis.
      </div>
    )
  }

  return (
    <div className="max-w-[1000px] mx-auto">
      {/* Back + header */}
      <div className="mb-5">
        <button
          onClick={() => router.push('/compliance/governance')}
          className="flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 mb-3 transition-colors cursor-pointer"
        >
          <ArrowLeft size={12} /> Back to dashboard
        </button>
        <h1 className="text-xl font-bold text-[#0B1829]">Gap Analysis</h1>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : !data || data.total_gaps === 0 ? (
        <EmptyState onBack={() => router.push('/compliance/governance')} />
      ) : (
        <div className="space-y-6">
          {/* Summary metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MetricCard
              value={data.total_gaps}
              label="Total Gaps"
              description="Documents not started or in progress"
              accent="#94A3B8"
            />
            <MetricCard
              value={data.phase_gaps}
              label="Phase-Critical Gaps"
              description="Required for current regulatory phase"
              accent="#6366F1"
            />
            <MetricCard
              value={blockingCount}
              label="Blocking Documents"
              description="Block other documents from being finalised"
              accent="#F59E0B"
            />
          </div>

          {/* Phase groups */}
          {phaseGroups.map((group) => (
            <div key={group.phase}>
              {/* Phase header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-[14px] font-bold text-[#0B1829]">{group.display.label}</h2>
                  <p className="text-[11px] text-gray-400">{group.display.description}</p>
                </div>
                <span className="text-[11px] font-medium text-gray-400">
                  {group.gaps.length} gap{group.gaps.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Gap cards */}
              <div className="space-y-2 mb-2">
                {group.gaps.map((gap) => (
                  <GapCard key={gap.document_id} gap={gap} allGaps={data.gaps} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Metric Card ──────────────────────────────────────────────

function MetricCard({
  value, label, description, accent,
}: {
  value: number; label: string; description: string; accent: string
}) {
  return (
    <div className="bg-white border border-[#E8EBF0] rounded-lg p-4 border-t-[3px]" style={{ borderTopColor: accent }}>
      <div className="text-2xl font-bold text-[#0B1829]">{value}</div>
      <div className="text-[12px] font-medium text-[#1D2D44] mt-0.5">{label}</div>
      <div className="text-[10px] text-gray-400 mt-0.5">{description}</div>
    </div>
  )
}

// ── Gap Card ──────────────────────────────────────────────────

function GapCard({ gap, allGaps }: { gap: GapAnalysisItem; allGaps: GapAnalysisItem[] }) {
  const [showBlocked, setShowBlocked] = useState(false)
  const router = useRouter()
  const templateSlug = gap.is_qanun_draftable === 1 ? getTemplateSlug(gap.document_id) : null

  return (
    <div className="bg-white border border-[#E8EBF0] rounded-lg px-4 py-3">
      <div className="flex items-start gap-3">
        {/* Rank */}
        <div className="shrink-0 w-7 h-7 rounded-full bg-[#F5F7FA] flex items-center justify-center text-[11px] font-bold text-[#0B1829] mt-0.5">
          #{gap.priority_rank}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <code className="text-[11px] font-mono text-gray-500">{gap.document_id}</code>
            <span className="text-[13px] font-semibold text-[#0B1829]">{gap.name}</span>
          </div>

          {/* Metadata line */}
          <div className="flex items-center gap-2 flex-wrap mt-1.5">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-gray-100 text-gray-500">
              {CATEGORY_LABELS[gap.category] ?? gap.category}
            </span>
            {gap.is_required_current_phase === 1 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-100 text-indigo-700">
                Phase Critical
              </span>
            )}
            {gap.blocks_count > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowBlocked(!showBlocked)}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  <Link2 size={10} />
                  Blocks {gap.blocks_count} other{gap.blocks_count !== 1 ? 's' : ''}
                </button>
                {showBlocked && (
                  <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-[#E8EBF0] rounded-lg shadow-lg p-3 min-w-[260px]">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                      Blocked documents
                    </p>
                    <div className="space-y-1">
                      {gap.blocks.map((id) => {
                        const blocked = allGaps.find((g) => g.document_id === id)
                        return (
                          <div key={id} className="flex items-center gap-2 text-[11px]">
                            <code className="font-mono text-[10px] text-gray-500">{id}</code>
                            <span className="text-[#1D2D44] truncate">
                              {blocked?.name ?? 'Unknown document'}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Status */}
            <span className="flex items-center gap-1 ml-auto">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: STATUS_COLORS[gap.status] ?? '#94A3B8' }}
              />
              <span className="text-[10px] text-gray-400">
                {gap.status === 'in_progress' ? 'In Progress' : 'Not Started'}
              </span>
            </span>
          </div>
        </div>

        {/* Action button */}
        <div className="shrink-0 mt-1">
          {gap.is_qanun_draftable === 1 ? (
            <button
              onClick={() => templateSlug && router.push(`/compliance/documents/new?type=${templateSlug}`)}
              disabled={!templateSlug}
              title={!templateSlug ? 'Template not yet available' : undefined}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors ${
                templateSlug
                  ? 'bg-[#0B1829] text-white hover:bg-[#1D2D44] cursor-pointer'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <FileEdit size={12} /> {templateSlug ? 'Draft with Qanun' : 'Draft (coming soon)'}
            </button>
          ) : (
            <button
              onClick={() => router.push(`/compliance/governance/documents?status=not_started`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold border border-[#E8EBF0] text-[#1D2D44] hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <Upload size={12} /> Upload
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Empty State ──────────────────────────────────────────────

function EmptyState({ onBack }: { onBack: () => void }) {
  return (
    <div className="text-center py-16">
      <CheckCircle2 size={48} className="text-[#10B981] mx-auto mb-4" />
      <h2 className="text-lg font-bold text-[#0B1829] mb-1">Governance framework complete</h2>
      <p className="text-[13px] text-gray-500 max-w-md mx-auto mb-6">
        All applicable documents for your FSRA category have been started or completed.
        Your governance framework is on track.
      </p>
      <button
        onClick={onBack}
        className="px-4 py-2 rounded-md text-[13px] font-semibold bg-[#0B1829] text-white hover:bg-[#1D2D44] transition-colors cursor-pointer"
      >
        Back to dashboard
      </button>
    </div>
  )
}

// ── Loading Skeleton ──────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-[#E8EBF0] rounded-lg p-4 animate-pulse">
            <div className="h-7 w-12 bg-gray-200 rounded mb-2" />
            <div className="h-3 w-24 bg-gray-100 rounded mb-1" />
            <div className="h-2.5 w-36 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
      {[1, 2].map((i) => (
        <div key={i}>
          <div className="h-4 w-32 bg-gray-200 rounded mb-3" />
          <div className="space-y-2">
            {[1, 2, 3].map((j) => (
              <div key={j} className="bg-white border border-[#E8EBF0] rounded-lg px-4 py-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-2/3 bg-gray-200 rounded" />
                    <div className="h-2.5 w-1/3 bg-gray-100 rounded" />
                  </div>
                  <div className="h-8 w-28 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
