'use client'

import { use, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Download,
  Loader2,
  RotateCcw,
  X,
} from 'lucide-react'
import {
  getGiraPreflight,
  generateGira,
  getGiraStatus,
  getGiraDownloadUrl,
  type Jurisdiction,
  type CeeQuestion,
} from '@/lib/api/gira'

export default function GiraPage({
  params,
}: {
  params: Promise<{ entityId: string }>
}) {
  const { entityId } = use(params)
  const { data: session } = useSession()
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken || ''

  const [jurisdiction, setJurisdiction] = useState<Jurisdiction>('ADGM')
  const [jobId, setJobId] = useState<string | null>(null)

  if (jobId) {
    return (
      <GenerationState
        jobId={jobId}
        jurisdiction={jurisdiction}
        token={token}
        onReset={() => setJobId(null)}
      />
    )
  }

  return (
    <PreflightState
      entityId={entityId}
      jurisdiction={jurisdiction}
      setJurisdiction={setJurisdiction}
      token={token}
      onGenerated={(id) => setJobId(id)}
    />
  )
}

// ── GIRA field section maps ───────────────────────────────────
// Defines canonical field order and labels per jurisdiction.
// Status is derived from the preflight response:
//   field not in missing_fields → COMPLETE (green)
//   field in blocking_fields    → REQUIRED (red)
//   field in optional_missing   → OPTIONAL (amber)

interface GiraField {
  field: string
  label: string
  hint?: string
}

interface GiraSection {
  key: string
  title: string
  fields: GiraField[]
}

const ADGM_SECTIONS: GiraSection[] = [
  {
    key: 'A', title: 'Section A — Applicant Details',
    fields: [
      { field: 'entity_name',                   label: 'Entity Name' },
      { field: 'legal_form',                    label: 'Legal Form' },
      { field: 'jurisdiction_of_incorporation', label: 'Jurisdiction of Incorporation' },
      { field: 'adgm_registration_number',      label: 'ADGM Registration Number',
        hint: 'Leave blank if not yet incorporated in ADGM' },
      { field: 'registered_address',            label: 'Registered Address' },
      { field: 'proposed_commencement_date',    label: 'Proposed Commencement Date' },
    ],
  },
  {
    key: 'B', title: 'Section B — Proposed Regulated Activities',
    fields: [
      { field: 'regulated_activities', label: 'Regulated Activities' },
      { field: 'client_categories',    label: 'Client Categories' },
      { field: 'fsra_category',        label: 'FSRA Licence Category' },
      { field: 'activity_description', label: 'Activity Description',
        hint: 'Auto-populated from Business Plan if drafted' },
    ],
  },
  {
    key: 'C', title: 'Section C — Controllers and Shareholders',
    fields: [
      { field: 'controllers',                label: 'Controllers / Shareholders' },
      { field: 'group_structure_description', label: 'Group Structure Description' },
    ],
  },
  {
    key: 'D', title: 'Section D — Approved Persons',
    fields: [
      { field: 'approved_persons', label: 'Approved Persons',
        hint: 'CEO, CFO, MLRO, Compliance Officer' },
    ],
  },
  {
    key: 'E', title: 'Section E — Financial Resources',
    fields: [
      { field: 'initial_capital_usd',    label: 'Initial Capital (USD)' },
      { field: 'regulatory_capital_usd', label: 'Regulatory Capital (USD)' },
      { field: 'projections',            label: '3-Year Financial Projections' },
    ],
  },
  {
    key: 'F', title: 'Section F — Systems and Controls',
    fields: [
      { field: 'compliance_function_description', label: 'Compliance Function',
        hint: 'Auto-populated from Compliance Manual if drafted' },
      { field: 'it_systems_description',          label: 'IT Systems' },
      { field: 'outsourcing_arrangements',        label: 'Outsourcing Arrangements' },
    ],
  },
  {
    key: 'G', title: 'Section G — Declaration',
    fields: [
      { field: 'signatory_name',  label: 'Signatory Name' },
      { field: 'signatory_title', label: 'Signatory Title' },
      { field: 'declaration_date', label: 'Declaration Date' },
    ],
  },
]

const VARA_SECTIONS: GiraSection[] = [
  {
    key: '1', title: 'Section 1 — Applicant Details',
    fields: [
      { field: 'entity_name',                   label: 'Entity Name' },
      { field: 'legal_form',                    label: 'Legal Form' },
      { field: 'jurisdiction_of_incorporation', label: 'Jurisdiction of Incorporation' },
      { field: 'vara_registration_number',      label: 'VARA Registration Number',
        hint: 'Leave blank if not yet registered with VARA' },
      { field: 'uae_trn',                       label: 'UAE Tax Registration Number' },
      { field: 'registered_address',            label: 'Registered Address' },
    ],
  },
  {
    key: '2', title: 'Section 2 — Virtual Asset Activities',
    fields: [
      { field: 'vara_licence_type',    label: 'VARA Licence Type' },
      { field: 'va_activities',        label: 'Virtual Asset Activities' },
      { field: 'va_types_handled',     label: 'Virtual Asset Types Handled' },
      { field: 'activity_description', label: 'Activity Description',
        hint: 'Auto-populated from Business Plan if drafted' },
    ],
  },
  {
    key: '3', title: 'Section 3 — Governance and Controllers',
    fields: [
      { field: 'controllers',       label: 'Controllers / UBO' },
      { field: 'senior_management', label: 'Senior Management' },
      { field: 'board_composition', label: 'Board Composition' },
    ],
  },
  {
    key: '4', title: 'Section 4 — Financial Resources',
    fields: [
      { field: 'initial_capital_usd',    label: 'Initial Capital (USD)' },
      { field: 'projected_revenue_yr1',  label: 'Projected Year 1 Revenue (USD)' },
    ],
  },
  {
    key: '5', title: 'Section 5 — Technology Architecture',
    fields: [
      { field: 'technology_description',  label: 'Technology Architecture',
        hint: 'Auto-populated from Technology Assessment if drafted' },
      { field: 'cybersecurity_framework', label: 'Cybersecurity Framework' },
    ],
  },
  {
    key: '6', title: 'Section 6 — AML/CFT Programme',
    fields: [
      { field: 'aml_programme_summary', label: 'AML/CFT Programme Summary',
        hint: 'Auto-populated from AML/CFT Policy if drafted' },
    ],
  },
  {
    key: '7', title: 'Section 7 — Declaration',
    fields: [
      { field: 'signatory_name',   label: 'Signatory Name' },
      { field: 'signatory_title',  label: 'Signatory Title' },
      { field: 'declaration_date', label: 'Declaration Date' },
    ],
  },
]

type FieldStatus = 'complete' | 'required' | 'optional'

function getFieldStatus(
  fieldName: string,
  blockingFields: { field: string }[],
  optionalMissing: { field: string }[],
): FieldStatus {
  if (blockingFields.some((f) => f.field === fieldName)) return 'required'
  if (optionalMissing.some((f) => f.field === fieldName)) return 'optional'
  return 'complete'
}

// ── STATE A: Preflight ────────────────────────────────────────

function PreflightState({
  entityId, jurisdiction, setJurisdiction, token, onGenerated,
}: {
  entityId: string
  jurisdiction: Jurisdiction
  setJurisdiction: (j: Jurisdiction) => void
  token: string
  onGenerated: (jobId: string) => void
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['gira-preflight', entityId, jurisdiction],
    queryFn: () => getGiraPreflight(entityId, jurisdiction, token),
    enabled: !!token && !!entityId,
  })

  const generate = useMutation({
    mutationFn: () => generateGira(entityId, jurisdiction, token),
    onSuccess: (res) => onGenerated(res.job_id),
  })

  return (
    <div className="max-w-[1000px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400 mb-1">
            GIRA Application Form
          </p>
          <h2 className="text-xl font-bold text-[#0B1829]">Pre-flight check</h2>
        </div>
        <div className="flex items-center rounded-md border border-[#E8EBF0] overflow-hidden">
          {(['ADGM', 'VARA'] as Jurisdiction[]).map((j) => (
            <button
              key={j}
              onClick={() => setJurisdiction(j)}
              className={`px-4 py-1.5 text-[11px] font-semibold transition-colors ${
                jurisdiction === j
                  ? 'bg-[#0B1829] text-white'
                  : 'bg-white text-[#0B1829] hover:bg-[#F5F7FA]'
              }`}
            >
              {j}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="py-16 text-center text-sm text-gray-500">Loading preflight…</div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {(error as Error).message}
        </div>
      )}

      {data && (
        <>
          {/* Completion ring + readiness banner */}
          <div className="bg-white border border-[#E8EBF0]
                          rounded-lg p-6 flex items-center gap-8">
            <CompletionRing
              pct={Math.round((data.completion_pct ?? 0) * 100)}
            />
            <div className="flex-1">
              {data.ready_to_generate ? (
                <div className="flex items-start gap-3 p-4
                                bg-[#EAF4F1] border
                                border-[#0F7A5F]/20 rounded-md">
                  <CheckCircle2
                    size={18} strokeWidth={1.5}
                    className="text-[#0F7A5F] shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="text-[13px] font-bold
                                  text-[#0F7A5F]">
                      Ready to generate
                    </p>
                    <p className="text-[11px] text-[#0F7A5F]/80
                                  mt-0.5">
                      All required fields are complete.
                      Optional fields marked below will appear
                      as "To be confirmed" in the form.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-4
                                bg-amber-50 border border-amber-200
                                rounded-md">
                  <AlertTriangle
                    size={18} strokeWidth={1.5}
                    className="text-amber-700 shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="text-[13px] font-bold
                                  text-amber-700">
                      {data.blocking_fields.length} required{' '}
                      {data.blocking_fields.length === 1
                        ? 'field'
                        : 'fields'}{' '}
                      incomplete
                    </p>
                    <p className="text-[11px] text-amber-700/80
                                  mt-0.5">
                      Complete the fields marked{' '}
                      <span className="font-semibold">Required</span>{' '}
                      below before generating the{' '}
                      {jurisdiction} application form.
                    </p>
                  </div>
                </div>
              )}

              {/* Legend */}
              <div className="mt-3 flex items-center gap-4
                              text-[10px] text-gray-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2
                    size={12} strokeWidth={1.5}
                    className="text-[#0F7A5F]"
                  />
                  Complete
                </span>
                <span className="flex items-center gap-1.5">
                  <X size={12} strokeWidth={2}
                     className="text-red-600" />
                  Required
                </span>
                <span className="flex items-center gap-1.5">
                  <AlertCircle
                    size={12} strokeWidth={1.5}
                    className="text-amber-500"
                  />
                  Optional
                </span>
              </div>
            </div>
          </div>

          {/* Unified field list by section */}
          <GiraSectionList
            sections={
              jurisdiction === 'ADGM'
                ? ADGM_SECTIONS
                : VARA_SECTIONS
            }
            blockingFields={data.blocking_fields}
            optionalMissing={data.optional_missing}
          />

          {/* CEE questions — only if missing fields exist */}
          {data.cee_questions.length > 0 && (
            <div className="bg-white border border-[#E8EBF0]
                            rounded-lg p-6">
              <p className="text-[10px] font-semibold uppercase
                            tracking-[0.1em] text-gray-400 mb-1">
                Questions to complete your profile
              </p>
              <p className="text-[11px] text-gray-500 mb-4">
                Answer these to fill in missing fields before
                generating the form.
              </p>
              <div className="space-y-4">
                {data.cee_questions.map((q) => (
                  <CeeQuestionCard key={q.id} question={q} />
                ))}
              </div>
            </div>
          )}

          {/* Generate button */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => generate.mutate()}
              disabled={
                !data.ready_to_generate || generate.isPending
              }
              title={
                !data.ready_to_generate
                  ? 'Complete required fields first'
                  : undefined
              }
              className="px-5 py-2.5 text-[12px] font-semibold
                         rounded-md bg-[#0B1829] text-white
                         hover:bg-[#1D2D44] transition-colors
                         disabled:bg-gray-200 disabled:text-gray-400
                         disabled:cursor-not-allowed"
            >
              {generate.isPending
                ? 'Generating…'
                : `Generate ${jurisdiction} Application Form`}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function CompletionRing({ pct }: { pct: number }) {
  const radius = 48
  const circumference = 2 * Math.PI * radius
  const dash = (circumference * pct) / 100

  return (
    <div className="relative w-[120px] h-[120px] shrink-0">
      <svg width={120} height={120} className="-rotate-90">
        <circle
          cx={60} cy={60} r={radius}
          stroke="#E8EBF0" strokeWidth={8} fill="none"
        />
        <circle
          cx={60} cy={60} r={radius}
          stroke="#0F7A5F" strokeWidth={8} fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-2xl font-bold text-[#0B1829]">{pct}%</p>
        <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-gray-400">Complete</p>
      </div>
    </div>
  )
}

function FieldStatusIcon({ status }: { status: FieldStatus }) {
  if (status === 'complete') {
    return (
      <CheckCircle2
        size={15}
        strokeWidth={1.5}
        className="text-[#0F7A5F] shrink-0"
      />
    )
  }
  if (status === 'required') {
    return (
      <X
        size={15}
        strokeWidth={2}
        className="text-red-600 shrink-0"
      />
    )
  }
  return (
    <AlertCircle
      size={15}
      strokeWidth={1.5}
      className="text-amber-500 shrink-0"
    />
  )
}

function GiraSectionList({
  sections,
  blockingFields,
  optionalMissing,
}: {
  sections: GiraSection[]
  blockingFields: { field: string; label: string }[]
  optionalMissing: { field: string; label: string }[]
}) {
  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <div
          key={section.key}
          className="bg-white border border-[#E8EBF0] rounded-lg overflow-hidden"
        >
          <div className="px-5 py-3 bg-[#F5F7FA] border-b border-[#E8EBF0]">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em]
                          text-[#0B1829]">
              {section.title}
            </p>
          </div>
          <div className="divide-y divide-[#F0F2F5]">
            {section.fields.map((f) => {
              const status = getFieldStatus(
                f.field, blockingFields, optionalMissing)
              return (
                <div
                  key={f.field}
                  className="flex items-center gap-3 px-5 py-3"
                >
                  <FieldStatusIcon status={status} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] font-medium ${
                      status === 'complete'
                        ? 'text-[#0B1829]'
                        : status === 'required'
                          ? 'text-[#0B1829]'
                          : 'text-gray-500'
                    }`}>
                      {f.label}
                      {status === 'required' && (
                        <span className="ml-1.5 text-[10px] font-semibold
                                         text-red-600 bg-red-50 px-1.5 py-0.5
                                         rounded">
                          Required
                        </span>
                      )}
                    </p>
                    {f.hint && status !== 'complete' && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {f.hint}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0">
                    {status === 'complete' ? (
                      <span className="text-[10px] font-mono
                                       text-[#0F7A5F]">
                        Complete
                      </span>
                    ) : status === 'required' ? (
                      <span className="text-[10px] font-mono
                                       text-red-500">
                        Missing
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono
                                       text-amber-500">
                        Optional
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function CeeQuestionCard({ question }: { question: CeeQuestion }) {
  // Phase 7 will wire cross-population — inputs are display-only for now.
  const [value, setValue] = useState(question.answer ?? '')

  return (
    <div className="border border-[#E8EBF0] rounded-md p-4">
      <p className="text-[12px] font-semibold text-[#0B1829]">{question.prompt}</p>
      {question.helper_text && (
        <p className="mt-1 text-[11px] text-gray-500">{question.helper_text}</p>
      )}
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={2}
        className="mt-2 w-full border border-[#E8EBF0] rounded-md px-2.5 py-1.5 text-[12px]"
        placeholder="Your answer…"
      />
    </div>
  )
}

// ── STATE B: Generation ───────────────────────────────────────

function GenerationState({
  jobId, jurisdiction, token, onReset,
}: {
  jobId: string
  jurisdiction: Jurisdiction
  token: string
  onReset: () => void
}) {
  const { data } = useQuery({
    queryKey: ['gira-status', jobId],
    queryFn: () => getGiraStatus(jobId, token),
    enabled: !!token,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === 'exported' || status === 'stub_pending_phase4' || status === 'failed') {
        return false
      }
      return 3000
    },
  })

  const status = data?.status ?? 'queued'

  return (
    <div className="max-w-[800px] mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400 mb-1">
            GIRA Application Form
          </p>
          <h2 className="text-xl font-bold text-[#0B1829]">
            {status === 'exported' ? 'Ready to download' : 'Generating application'}
          </h2>
        </div>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-md border border-[#E8EBF0] text-[#0B1829] hover:bg-[#F5F7FA]"
        >
          <RotateCcw size={12} strokeWidth={1.5} />
          Generate new version
        </button>
      </div>

      {(status === 'queued' || status === 'running') && (
        <div className="bg-white border border-[#E8EBF0] rounded-lg p-8 flex items-center gap-4">
          <Loader2 size={20} className="text-[#0B1829] animate-spin" />
          <div>
            <p className="text-[13px] font-semibold text-[#0B1829]">
              Generating {jurisdiction} application form…
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              This may take a moment. Status refreshes every 3 seconds.
            </p>
          </div>
        </div>
      )}

      {status === 'exported' && (
        <div className="bg-white border border-[#E8EBF0] rounded-lg p-6">
          <div className="flex items-start gap-3 p-4 bg-[#EAF4F1] border border-[#0F7A5F]/20 rounded-md">
            <CheckCircle2 size={18} strokeWidth={1.5} className="text-[#0F7A5F] shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-[13px] font-bold text-[#0F7A5F]">Application form ready</p>
              <p className="text-[11px] text-[#0F7A5F]/80 mt-0.5">
                Your {jurisdiction} GIRA application form has been generated.
              </p>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <a
              href={getGiraDownloadUrl(jobId, token)}
              className="inline-flex items-center gap-2 px-4 py-2 text-[12px] font-semibold rounded-md bg-[#0B1829] text-white hover:bg-[#1D2D44] transition-colors"
            >
              <Download size={13} strokeWidth={1.5} />
              Download Application Form
            </a>
          </div>
        </div>
      )}

      {status === 'stub_pending_phase4' && (
        <div className="bg-white border border-[#E8EBF0] rounded-lg p-6">
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-md">
            <AlertCircle size={18} strokeWidth={1.5} className="text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-bold text-amber-700">
                GIRA renderer building — Phase 4 in progress
              </p>
              <p className="text-[11px] text-amber-700/80 mt-0.5">
                Form structure ready. DOCX export coming soon.
              </p>
            </div>
          </div>
        </div>
      )}

      {status === 'failed' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-[13px] font-bold text-red-700">Generation failed</p>
          <p className="text-[11px] text-red-700/80 mt-0.5">
            {data?.message ?? 'An unexpected error occurred. Try again.'}
          </p>
        </div>
      )}
    </div>
  )
}
