'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import {
  getTemplates,
  filterTemplatesByJurisdiction,
  validateDraftRequest,
  startDraft,
  getPreflightQuestions,
  type Template,
  type PreflightResponse,
} from '@/lib/api/drafting'
import { getEntity, type EntityProfile } from '@/lib/api/entities'
import { PortabilityBadge } from '@/components/qanun/PortabilityBadge'
import { EntityProfilePanel } from '@/components/qanun/EntityProfilePanel'
import { PreDraftQuestionnaire } from '@/components/qanun/PreDraftQuestionnaire'
import { useEntity } from '@/lib/entity-context'

function NewDocumentContent() {
  const { data: session } = useSession()
  const { selectedEntity } = useEntity()
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
  const [entityDetail, setEntityDetail] = useState<{
    mlro_name: string; compliance_name: string; seo_name: string; entity_profile: EntityProfile
  } | null>(null)
  const [view, setView] = useState<'select' | 'questionnaire'>('select')
  const [preflight, setPreflight] = useState<PreflightResponse | null>(null)
  const [loadingPreflight, setLoadingPreflight] = useState(false)

  const JURISDICTIONS = [
    { code: 'ADGM', label: 'ADGM / FSRA', active: true },
    { code: 'VARA', label: 'VARA — Dubai', active: true },
    { code: 'EL_SALVADOR', label: 'El Salvador — CNAD', active: false },
  ]

  const [jurisdiction, setJurisdiction] = useState<string>('ADGM')

  useEffect(() => {
    if (!token) return
    getTemplates(token)
      .then((r) => setTemplates(filterTemplatesByJurisdiction(r.templates, jurisdiction)))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [token, jurisdiction])

  useEffect(() => {
    if (!token || !selectedEntity?.id) return
    getEntity(selectedEntity.id, token)
      .then((e) => setEntityDetail({
        mlro_name: e.mlro_name,
        compliance_name: e.compliance_name,
        seo_name: e.seo_name,
        entity_profile: e.entity_profile ?? {},
      }))
      .catch(() => {/* non-fatal */})
  }, [token, selectedEntity?.id])

  useEffect(() => {
    if (!selected || !token) {
      setValidation(null)
      return
    }
    validateDraftRequest(selectedEntity?.id ?? '', selected, token)
      .then(setValidation)
      .catch((e) => setError(e.message))
  }, [selected, token])

  async function handleStartDraftClick() {
    if (!selected || !token) return
    setLoadingPreflight(true)
    setError('')
    try {
      const res = await getPreflightQuestions(selectedEntity?.id ?? '', selected, token)
      setPreflight(res)
      setView('questionnaire')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoadingPreflight(false)
    }
  }

  async function handleConfirmDraft(answers: Record<string, unknown>) {
    if (!selected || !token) return
    setStarting(true)
    try {
      const res = await startDraft(selectedEntity?.id ?? '', selected, token, jurisdiction, answers)
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

  if (view === 'questionnaire' && preflight) {
    return (
      <div className="max-w-[1200px] mx-auto">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-[13px] mb-5">
            {error}
          </div>
        )}
        <PreDraftQuestionnaire
          displayName={preflight.display_name}
          questions={preflight.questions}
          onSubmit={handleConfirmDraft}
          onBack={() => setView('select')}
          submitting={starting}
        />
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
          Choose which compliance document to draft for {selectedEntity?.name ?? 'this entity'}.
          Documents are grounded in the live {jurisdiction === 'ADGM' ? 'ADGM / FSRA' : jurisdiction === 'VARA' ? 'VARA' : 'El Salvador CNAD'} regulatory corpus.
        </p>
      </div>

      {/* Jurisdiction selector */}
      <div className="flex gap-2 mb-5">
        {JURISDICTIONS.filter(j => j.active).map((j) => (
          <button
            key={j.code}
            onClick={() => { setJurisdiction(j.code); setSelected(null); }}
            className={`px-4 py-2 rounded-lg text-[12px] font-semibold border transition-colors ${
              jurisdiction === j.code
                ? 'bg-[#0B1829] text-white border-[#0B1829]'
                : 'bg-white text-gray-600 border-[#E8EBF0] hover:border-gray-300'
            }`}
          >
            {j.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-[13px] mb-5">
          {error}
        </div>
      )}

      {/* Entity profile — shown when entity detail is loaded */}
      {entityDetail && selectedEntity && (
        <div className="mb-5">
          <EntityProfilePanel
            entityId={selectedEntity.id}
            entityName={selectedEntity.name}
            profile={entityDetail.entity_profile}
            mlroName={entityDetail.mlro_name}
            complianceName={entityDetail.compliance_name}
            seoName={entityDetail.seo_name}
            token={token}
            onSaved={(updated) => setEntityDetail({
              mlro_name: updated.mlro_name,
              compliance_name: updated.compliance_name,
              seo_name: updated.seo_name,
              entity_profile: updated,
            })}
          />
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
            {templates.length === 0 && !loading && jurisdiction !== 'ADGM' && (
              <div className="col-span-3 py-12 text-center">
                <p className="text-[13px] text-gray-500 mb-3">
                  No individual templates available for {jurisdiction} yet.
                </p>
                <p className="text-[12px] text-gray-400 mb-4">
                  Use the Governance Suite to draft a complete{' '}
                  {jurisdiction === 'VARA' ? 'VASP' : 'DASP'} compliance package.
                </p>
                <button
                  onClick={() => router.push('/compliance/governance-suite')}
                  className="px-4 py-2 bg-[#0F7A5F] text-white rounded-lg text-[12px] font-semibold hover:bg-[#0F6E56] transition-colors"
                >
                  → Open Governance Suite
                </button>
              </div>
            )}
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
              onClick={handleStartDraftClick}
              disabled={loadingPreflight}
              className={`w-full py-3 rounded-md text-[13px] font-semibold transition-colors ${
                loadingPreflight
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[#0B1829] text-white hover:bg-[#1D2D44] cursor-pointer'
              }`}
            >
              {loadingPreflight ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Loading…
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
