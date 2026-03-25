'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FilePlus, Download, FileText, ExternalLink } from 'lucide-react'
import { getTemplates, type Template, type TemplatesResponse } from '@/lib/api/drafting'
import { PortabilityBadge } from '@/components/qanun/PortabilityBadge'

const ENTITY_ID = 'tradedarcateg3a-demo-0001'
const ENTITY_NAME = 'TradeDar Capital Management Ltd'
const ENTITY_TYPE = 'Category 3C'

const REQUIRED_DOCS = [
  'aml_cft_policy',
  'compliance_manual',
  'kyc_cdd_procedures',
  'business_risk_assessment',
  'conflicts_policy',
  'board_governance_charter',
  'outsourcing_policy',
  'cyber_risk_framework',
  'whistleblowing_policy',
  'suitability_policy',
]

export default function DocumentSuitePage() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const [templates, setTemplates] = useState<TemplatesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken || ''

  useEffect(() => {
    if (authStatus === 'loading') return
    if (!session) return
    if (!token) return

    getTemplates(token)
      .then(setTemplates)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [session, authStatus, token])

  if (authStatus === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-500">
        Loading document suite…
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-6 bg-red-50 border border-red-200 rounded-lg text-center">
        <p className="text-red-700 font-medium text-sm">{error}</p>
      </div>
    )
  }

  const templateMap = Object.fromEntries(
    (templates?.templates ?? []).map((t) => [t.doc_type, t])
  )

  const completedDocs = 0
  const completionPct = Math.round((completedDocs / REQUIRED_DOCS.length) * 100)

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Entity header */}
      <div className="bg-white border border-[#E8EBF0] rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400 mb-1">
              ADGM FSP Application · {ENTITY_TYPE}
            </p>
            <h2 className="text-xl font-bold text-[#0B1829]">{ENTITY_NAME}</h2>
          </div>
          <Link
            href="/compliance/documents/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0B1829] text-white rounded-md text-[13px] font-semibold hover:bg-[#1D2D44] transition-colors"
          >
            <FilePlus size={14} />
            Draft document
          </Link>
        </div>

        {/* Completion bar */}
        <div className="mt-5 flex items-center gap-8">
          <Stat label="Required" value={REQUIRED_DOCS.length} />
          <Stat label="Completed" value={completedDocs} />
          <Stat label="Remaining" value={REQUIRED_DOCS.length - completedDocs} />
          <div className="flex-1 max-w-[240px]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-1.5">
              Submission Readiness
            </p>
            <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  completionPct === 100 ? 'bg-emerald-500' : 'bg-[#0B1829]'
                }`}
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">{completionPct}% complete</p>
          </div>
        </div>
      </div>

      {/* Document suite table */}
      <div className="bg-white border border-[#E8EBF0] rounded-lg overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#0B1829]">
              {['Document', 'Portability', 'Source', 'Sections', 'Status', ''].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-white/80"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {REQUIRED_DOCS.map((docType, i) => {
              const tmpl = templateMap[docType]
              return (
                <tr
                  key={docType}
                  className={`border-b border-[#E8EBF0] last:border-0 ${
                    i % 2 === 0 ? 'bg-white' : 'bg-[#F5F7FA]'
                  } hover:bg-blue-50/30 transition-colors`}
                >
                  <td className="px-4 py-3">
                    <p className="text-[13px] font-semibold text-[#1D2D44]">
                      {tmpl?.display_name ?? docType.replace(/_/g, ' ')}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {tmpl?.coverage_rulebooks?.join(', ')}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {tmpl && (
                      <PortabilityBadge layer={tmpl.primary_portability_layer} size="sm" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <SourceBadge tmpl={tmpl} />
                  </td>
                  <td className="px-4 py-3 text-center text-[13px] text-gray-500">
                    {tmpl?.section_count ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusChip status="not_started" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/compliance/documents/new?type=${docType}`}
                      className="text-[12px] font-semibold text-[#1A5FA8] hover:text-[#0B1829] transition-colors"
                    >
                      Draft →
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Portability legend */}
      <div className="mt-4 flex items-center gap-3 flex-wrap">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400">
          Portability:
        </span>
        {[0, 1, 2].map((l) => (
          <PortabilityBadge key={l} layer={l} size="sm" />
        ))}
      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-0.5">
        {label}
      </p>
      <p className="text-2xl font-bold text-[#0B1829]">{value}</p>
    </div>
  )
}

function StatusChip({ status }: { status: string }) {
  const configs: Record<string, { label: string; tw: string }> = {
    not_started: { label: 'Not started', tw: 'bg-gray-100 text-gray-500' },
    complete: { label: 'Complete', tw: 'bg-emerald-50 text-emerald-700' },
    running: { label: 'Drafting…', tw: 'bg-blue-50 text-blue-700' },
    failed: { label: 'Failed', tw: 'bg-red-50 text-red-700' },
    drafted: { label: 'Drafted', tw: 'bg-amber-50 text-amber-700' },
    exporting: { label: 'Exporting…', tw: 'bg-blue-50 text-blue-700 animate-pulse' },
    export_failed: { label: 'Export failed', tw: 'bg-amber-50 text-amber-700' },
  }
  const cfg = configs[status] ?? configs.not_started
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${cfg.tw}`}>
      {cfg.label}
    </span>
  )
}

function SourceBadge({ tmpl }: { tmpl?: Template }) {
  if (!tmpl) return <span className="text-[11px] text-gray-300">—</span>
  if (tmpl.has_waystone_examples) {
    return (
      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        Waystone
      </span>
    )
  }
  if (tmpl.has_stark_examples) {
    return (
      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
        Stark
      </span>
    )
  }
  return (
    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-500">
      Corpus only
    </span>
  )
}
