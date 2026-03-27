'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, ArrowRight, Check, Loader2, Shield } from 'lucide-react'
import { useEntity } from '@/lib/entity-context'
import { createGovernanceProfile, type CreateProfileResponse } from '@/lib/api/governance'

// ── Constants ──────────────────────────────────────────────────

const FSRA_CATEGORIES = [
  {
    value: 'cat_3c',
    label: 'Category 3C — Fund Manager',
    description: 'Manages collective investment funds',
  },
  {
    value: 'cat_3a',
    label: 'Category 3A — Matched Principal Dealer',
    description: 'Deals as principal with professional clients',
  },
  {
    value: 'cat_2',
    label: 'Category 2 — Full Dealer',
    description: 'Deals as principal/agent, retail and professional',
  },
  {
    value: 'cat_1',
    label: 'Category 1 — Bank / Full Licence',
    description: 'Deposits, credit, full scope',
  },
] as const

const REGULATORY_STAGES = [
  {
    value: 'pre_application',
    label: 'Pre-application',
    description: 'Preparing for FSP application',
  },
  {
    value: 'ipa_received',
    label: 'IPA received',
    description: 'In-Principle Approval granted, working toward Final Approval conditions',
  },
  {
    value: 'authorised',
    label: 'Authorised',
    description: 'Entity is authorised and operational',
  },
  {
    value: 'compliance_audit',
    label: 'Compliance audit',
    description: 'Reviewing governance completeness for an existing authorised entity',
  },
] as const

const APPROXIMATE_COUNTS: Record<string, { total: number; draftable: number }> = {
  cat_3c: { total: 49, draftable: 45 },
  cat_3a: { total: 58, draftable: 54 },
  cat_2: { total: 62, draftable: 58 },
  cat_1: { total: 61, draftable: 57 },
}

const CATEGORY_LABELS: Record<string, string> = {
  cat_3c: 'Category 3C — Fund Manager',
  cat_3a: 'Category 3A — Matched Principal Dealer',
  cat_2: 'Category 2 — Full Dealer',
  cat_1: 'Category 1 — Bank / Full Licence',
}

const STAGE_LABELS: Record<string, string> = {
  pre_application: 'Pre-application',
  ipa_received: 'IPA received',
  authorised: 'Authorised',
  compliance_audit: 'Compliance audit',
}

// ── Component ──────────────────────────────────────────────────

export function GovernanceOnboardingWizard() {
  const { data: session } = useSession()
  const router = useRouter()
  const { selectedEntity } = useEntity()

  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken || ''

  const [step, setStep] = useState(1)
  const [fsraCategory, setFsraCategory] = useState<string | null>(null)
  const [regulatoryStage, setRegulatoryStage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [createStep, setCreateStep] = useState(0)
  const [error, setError] = useState('')

  const entityName = selectedEntity?.name ?? 'Entity'
  const entityId = selectedEntity?.id ?? ''

  const CREATE_STEPS = [
    'Creating governance profile…',
    `Mapping ${APPROXIMATE_COUNTS[fsraCategory ?? '']?.total ?? ''} applicable documents…`,
    'Redirecting to dashboard…',
  ]

  async function handleCreate() {
    if (!fsraCategory || !regulatoryStage || !entityId || !token) return
    setSubmitting(true)
    setCreateStep(1)
    setError('')
    try {
      const stepTimer = setTimeout(() => setCreateStep(2), 800)
      await createGovernanceProfile(
        entityId,
        { fsra_category: fsraCategory, regulatory_stage: regulatoryStage },
        token,
      )
      clearTimeout(stepTimer)
      setCreateStep(3)
      await new Promise((r) => setTimeout(r, 400))
      router.push('/compliance/governance')
      router.refresh()
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to create governance framework'
      setError(message)
      setSubmitting(false)
      setCreateStep(0)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Shield size={20} className="text-[#1A5FA8]" />
          <h1 className="text-xl font-bold text-[#0B1829]">Governance Framework Setup</h1>
        </div>
        <p className="text-[13px] text-gray-500">
          Configure the regulatory governance framework for{' '}
          <span className="font-medium text-[#1D2D44]">{entityName}</span>.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-full text-[12px] font-semibold transition-colors ${
                s < step
                  ? 'bg-[#0F7A5F] text-white'
                  : s === step
                    ? 'bg-[#0B1829] text-white'
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              {s < step ? <Check size={14} /> : s}
            </div>
            {s < 3 && (
              <div
                className={`w-16 h-[2px] transition-colors ${
                  s < step ? 'bg-[#0F7A5F]' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
        <span className="ml-2 text-[11px] text-gray-400">Step {step} of 3</span>
      </div>

      {/* Card wrapper */}
      <div className="bg-white border border-[#E8EBF0] rounded-lg p-6">
        {/* Step 1: FSRA Category */}
        {step === 1 && (
          <div>
            <h2 className="text-[15px] font-bold text-[#0B1829] mb-1">
              What type of FSRA entity is this?
            </h2>
            <p className="text-[12px] text-gray-500 mb-5">
              This determines which governance documents are applicable.
            </p>
            <div className="grid gap-3">
              {FSRA_CATEGORIES.map((cat) => (
                <SelectableCard
                  key={cat.value}
                  label={cat.label}
                  description={cat.description}
                  selected={fsraCategory === cat.value}
                  onClick={() => setFsraCategory(cat.value)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Regulatory Stage */}
        {step === 2 && (
          <div>
            <h2 className="text-[15px] font-bold text-[#0B1829] mb-1">
              Where are you in the regulatory process?
            </h2>
            <p className="text-[12px] text-gray-500 mb-5">
              This determines which documents are required at your current phase.
            </p>
            <div className="grid gap-3">
              {REGULATORY_STAGES.map((stage) => (
                <SelectableCard
                  key={stage.value}
                  label={stage.label}
                  description={stage.description}
                  selected={regulatoryStage === stage.value}
                  onClick={() => setRegulatoryStage(stage.value)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && fsraCategory && regulatoryStage && (
          <div>
            <h2 className="text-[15px] font-bold text-[#0B1829] mb-4">
              Confirm governance framework
            </h2>

            <div className="bg-[#F5F7FA] border border-[#E8EBF0] rounded-lg p-4 space-y-3">
              <ConfirmRow label="Entity" value={entityName} />
              <ConfirmRow label="FSRA category" value={CATEGORY_LABELS[fsraCategory]} />
              <ConfirmRow label="Regulatory stage" value={STAGE_LABELS[regulatoryStage]} />
              <div className="border-t border-[#E8EBF0] pt-3 mt-3">
                <ConfirmRow
                  label="Applicable documents"
                  value={`${APPROXIMATE_COUNTS[fsraCategory]?.total ?? '—'} documents`}
                />
                <ConfirmRow
                  label="Qanun-draftable"
                  value={`${APPROXIMATE_COUNTS[fsraCategory]?.draftable ?? '—'} documents`}
                />
              </div>
            </div>

            <p className="text-[11px] text-gray-400 mt-4 leading-relaxed">
              This will create the governance document register for this entity, mapping all
              applicable regulatory documents to your FSRA category and current phase.
              You can update the regulatory stage at any time.
            </p>

            {submitting && (
              <div className="mt-5 space-y-2">
                {CREATE_STEPS.map((label, i) => {
                  const stepNum = i + 1
                  const done = createStep > stepNum
                  const active = createStep === stepNum
                  return (
                    <div key={i} className="flex items-center gap-2.5">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          done
                            ? 'bg-[#0F7A5F]'
                            : active
                              ? 'bg-[#1A5FA8]'
                              : 'bg-gray-100'
                        }`}
                      >
                        {done ? (
                          <Check size={11} className="text-white" />
                        ) : active ? (
                          <Loader2 size={11} className="text-white animate-spin" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                        )}
                      </div>
                      <span
                        className={`text-[12px] transition-colors ${
                          done
                            ? 'text-[#0F7A5F] font-medium'
                            : active
                              ? 'text-[#1D2D44] font-medium'
                              : 'text-gray-400'
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-[13px]">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#E8EBF0]">
          <div>
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                disabled={submitting}
                className="flex items-center gap-1 text-[13px] text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
              >
                <ArrowLeft size={14} /> Back
              </button>
            )}
          </div>
          <div>
            {step < 3 && (
              <button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && !fsraCategory) ||
                  (step === 2 && !regulatoryStage)
                }
                className={`flex items-center gap-1 px-4 py-2 rounded-md text-[13px] font-semibold transition-colors ${
                  (step === 1 && !fsraCategory) || (step === 2 && !regulatoryStage)
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-[#0B1829] text-white hover:bg-[#1D2D44] cursor-pointer'
                }`}
              >
                Continue <ArrowRight size={14} />
              </button>
            )}
            {step === 3 && !submitting && (
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-5 py-2.5 rounded-md text-[13px] font-semibold transition-colors bg-[#0B1829] text-white hover:bg-[#1D2D44] cursor-pointer"
              >
                <Shield size={14} /> Create governance framework
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────

function SelectableCard({
  label,
  description,
  selected,
  onClick,
}: {
  label: string
  description: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left w-full px-4 py-3.5 rounded-lg border-2 transition-all cursor-pointer ${
        selected
          ? 'border-[#1A5FA8] bg-blue-50/40'
          : 'border-[#E8EBF0] bg-white hover:border-gray-300'
      }`}
    >
      <span className="text-[13px] font-semibold text-[#0B1829]">{label}</span>
      <p className="text-[11px] text-gray-500 mt-0.5">{description}</p>
    </button>
  )
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[12px] text-gray-500">{label}</span>
      <span className="text-[12px] font-semibold text-[#1D2D44]">{value}</span>
    </div>
  )
}
