'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import {
  getTemplates,
  getApplicableTemplates,
  validateDraftRequest,
  startDraft,
  ENTITY_ID,
  type Template,
} from '@/lib/api/drafting'
import { PortabilityBadge } from '@/components/qanun/PortabilityBadge'

function NewDocumentContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselected = searchParams.get('type')

  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken || ''

  const [templates, setTemplates] = useState<Template[]>([])
  const [selected, setSelected] = useState<string | null>(preselected)
  const [validation, setValidation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    getTemplates(token)
      .then((r) => setTemplates(getApplicableTemplates(r.templates)))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  useEffect(() => {
    if (!selected || !token) {
      setValidation(null)
      return
    }
    validateDraftRequest(ENTITY_ID, selected, token)
      .then(setValidation)
      .catch((e) => setError(e.message))
  }, [selected, token])

  async function handleStartDraft() {
    if (!selected || !token) return
    setStarting(true)
    try {
      const res = await startDraft(ENTITY_ID, selected, token)
      router.push(`/compliance/documents/draft/${res.job_id}`)
    } catch (e: any) {
      setError(e.message)
      setStarting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-500">
        <Loader2 size={16} className="animate-spin mr-2" />
        Loading templates…
      </div>
    )
  }

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/compliance/documents')}
          className="flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 mb-3 transition-colors"
        >
          <ArrowLeft size={12} /> Back to documents
        </button>
        <h1 className="text-xl font-bold text-[#0B1829]">Select Document Type</h1>
        <p className="text-[13px] text-gray-500 mt-1">
          Choose which compliance document to draft for TradeDar Capital Management Ltd.
          Documents are grounded in the live ADGM regulatory corpus.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-[13px] mb-5">
          {error}
        </div>
      )}

      <div className="flex gap-6">
        {/* Template grid */}
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {templates.map((t) => (
              <TemplateCard
                key={t.doc_type}
                template={t}
                isSelected={selected === t.doc_type}
                onSelect={() => setSelected(selected === t.doc_type ? null : t.doc_type)}
              />
            ))}
          </div>
        </div>

        {/* Validation panel */}
        {validation && selected && (
          <div className="w-[300px] shrink-0 bg-white border border-[#E8EBF0] rounded-lg p-5 h-fit sticky top-6">
            <h3 className="text-[15px] font-bold text-[#0B1829] mb-4">
              {validation.display_name}
            </h3>

            <div className="space-y-2 mb-4">
              <InfoRow label="Sections" value={validation.active_section_count} />
              <InfoRow
                label="Source"
                value={
                  validation.has_waystone_examples
                    ? 'Waystone examples'
                    : validation.has_stark_examples
                      ? 'Stark examples'
                      : 'Corpus provisions only'
                }
              />
            </div>

            {!validation.applicable && (
              <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 mb-4">
                <span className="mt-0.5 shrink-0">ⓘ</span>
                <span>
                  This document type is not typically required for{' '}
                  <strong>{validation.entity_type?.replace(/_/g, ' ')}</strong> entities,
                  but you may draft it if needed. Corpus grounding
                  will focus on generally applicable provisions.
                </span>
              </div>
            )}

            <div className="mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-2">
                Sections
              </p>
              <div className="space-y-1">
                {validation.sections.slice(0, 8).map((s: any) => (
                  <div
                    key={s.section_id}
                    className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0"
                  >
                    <span className="text-[11px] text-[#1D2D44] truncate mr-2">
                      {s.section_id}. {s.title}
                    </span>
                    <PortabilityBadge layer={s.portability_layer} showLabel={false} size="sm" />
                  </div>
                ))}
                {validation.sections.length > 8 && (
                  <p className="text-[11px] text-gray-400 mt-1">
                    +{validation.sections.length - 8} more sections
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleStartDraft}
              disabled={starting}
              className={`w-full py-3 rounded-md text-[13px] font-semibold transition-colors ${
                starting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[#0B1829] text-white hover:bg-[#1D2D44] cursor-pointer'
              }`}
            >
              {starting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Starting…
                </span>
              ) : (
                '→ Start Drafting'
              )}
            </button>
            <p className="text-[10px] text-gray-400 text-center mt-2">
              Typically takes 3–8 minutes
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function NewDocumentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64 text-sm text-gray-500">
          Loading…
        </div>
      }
    >
      <NewDocumentContent />
    </Suspense>
  )
}

// ── Sub-components ──────────────────────────────────────────────

function TemplateCard({
  template,
  isSelected,
  onSelect,
}: {
  template: Template
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={`text-left p-4 rounded-lg border-2 transition-all cursor-pointer w-full ${
        isSelected
          ? 'border-[#1A5FA8] bg-blue-50/40'
          : 'border-[#E8EBF0] bg-white hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-[13px] font-semibold text-[#0B1829] leading-tight flex-1 mr-2">
          {template.display_name}
        </span>
        <PortabilityBadge layer={template.primary_portability_layer} showLabel={false} size="sm" />
      </div>
      <p className="text-[11px] text-gray-500 leading-relaxed mb-2.5 line-clamp-2">
        {template.description}
      </p>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] text-gray-400">{template.section_count} sections</span>
        <span className="text-gray-300">·</span>
        {template.has_waystone_examples ? (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
            Waystone
          </span>
        ) : template.has_stark_examples ? (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
            Stark
          </span>
        ) : (
          <span className="text-[10px] text-gray-400">Corpus only</span>
        )}
      </div>
    </button>
  )
}

function InfoRow({
  label,
  value,
  valueClass,
}: {
  label: string
  value: any
  valueClass?: string
}) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
      <span className="text-[12px] text-gray-500">{label}</span>
      <span className={`text-[12px] font-semibold ${valueClass ?? 'text-[#1D2D44]'}`}>
        {value}
      </span>
    </div>
  )
}
