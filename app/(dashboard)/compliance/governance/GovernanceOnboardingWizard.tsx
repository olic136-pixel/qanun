'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, ArrowRight, Check, Loader2, Shield } from 'lucide-react'
import { useEntity } from '@/lib/entity-context'
import { createGovernanceProfile, type CreateProfileResponse } from '@/lib/api/governance'

// ── Constants ──────────────────────────────────────────────────

interface CategoryOption {
  value: string
  label: string
  description: string
}

interface CategoryGroup {
  jurisdiction: string
  options: CategoryOption[]
}

const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    jurisdiction: 'ADGM / FSRA',
    options: [
      { value: 'cat_3c', label: 'Category 3C — Fund Manager', description: 'Manages collective investment funds' },
      { value: 'cat_3a', label: 'Category 3A — Matched Principal Dealer', description: 'Deals as principal with professional clients' },
      { value: 'cat_2', label: 'Category 2 — Full Dealer', description: 'Deals as principal/agent, retail and professional' },
      { value: 'cat_1', label: 'Category 1 — Bank / Full Licence', description: 'Deposits, credit, full scope' },
    ],
  },
  {
    jurisdiction: 'VARA — Dubai',
    options: [
      { value: 'vara_vasp_bd', label: 'VASP-BD — Broker-Dealer', description: 'Virtual asset broker-dealer activities' },
      { value: 'vara_vasp_ex', label: 'VASP-EX — Exchange', description: 'Virtual asset exchange operations' },
      { value: 'vara_vasp_cust', label: 'VASP-CUST — Custody', description: 'Virtual asset custody services' },
      { value: 'vara_vasp_mgmt', label: 'VASP-MGMT — Management', description: 'Virtual asset portfolio management' },
      { value: 'vara_vasp_adv', label: 'VASP-ADV — Advisory', description: 'Virtual asset investment advisory' },
    ],
  },
  {
    jurisdiction: 'El Salvador — CNAD',
    options: [
      { value: 'sv_dasp_ex', label: 'DASP-EX — Exchange', description: 'Digital asset exchange / trading platform' },
      { value: 'sv_dasp_cust', label: 'DASP-CUST — Custody', description: 'Digital asset custody and safekeeping' },
      { value: 'sv_dasp_plat', label: 'DASP-PLAT — Platform', description: 'Digital asset service platform' },
      { value: 'sv_dasp_xfer', label: 'DASP-XFER — Transfer', description: 'Digital asset transfer and settlement' },
    ],
  },
  {
    jurisdiction: 'BVI — FSC',
    options: [
      { value: 'bvi_approved_manager', label: 'Approved Manager', description: 'Approved manager of investment funds' },
      { value: 'bvi_investment_business', label: 'Investment Business', description: 'Licensed investment business' },
      { value: 'bvi_mutual_fund', label: 'Mutual Fund', description: 'Registered or recognised mutual fund' },
    ],
  },
  {
    jurisdiction: 'Panama — SMV',
    options: [
      { value: 'pan_casa_valores', label: 'Casa de Valores', description: 'Securities broker-dealer (casa de valores)' },
      { value: 'pan_asesor', label: 'Asesor de Inversión', description: 'Investment adviser (asesor de inversión)' },
    ],
  },
]

// Flat list for lookups
const ALL_CATEGORIES: CategoryOption[] = CATEGORY_GROUPS.flatMap(g => g.options)

interface StageOption {
  value: string
  label: string
  description: string
}

interface StageGroup {
  jurisdiction: string
  options: StageOption[]
}

const STAGE_GROUPS: StageGroup[] = [
  {
    jurisdiction: 'ADGM / FSRA',
    options: [
      { value: 'pre_application', label: 'Pre-application', description: 'Preparing for FSP application' },
      { value: 'ipa_received', label: 'IPA received', description: 'In-Principle Approval granted' },
      { value: 'authorised', label: 'Authorised', description: 'Entity is authorised and operational' },
      { value: 'compliance_audit', label: 'Compliance audit', description: 'Reviewing governance completeness' },
    ],
  },
  {
    jurisdiction: 'VARA — Dubai',
    options: [
      { value: 'vara_registration_pending', label: 'Registration Pending', description: 'VARA registration application in progress' },
      { value: 'vara_registered', label: 'Registered', description: 'VARA registration granted' },
    ],
  },
  {
    jurisdiction: 'El Salvador — CNAD',
    options: [
      { value: 'sv_registered', label: 'Registered — CNAD', description: 'CNAD registration granted' },
    ],
  },
  {
    jurisdiction: 'BVI — FSC',
    options: [
      { value: 'bvi_pre_application', label: 'Pre-application', description: 'Preparing FSC licence application' },
      { value: 'bvi_registered', label: 'Registered / Licensed', description: 'FSC licence granted' },
    ],
  },
  {
    jurisdiction: 'Panama — SMV',
    options: [
      { value: 'pan_pre_application', label: 'Pre-application', description: 'Preparing SMV licence application' },
      { value: 'pan_registered', label: 'Registered', description: 'SMV licence granted' },
    ],
  },
]

// Flat list for lookups
const ALL_STAGES: StageOption[] = STAGE_GROUPS.flatMap(g => g.options)

const APPROXIMATE_COUNTS: Record<string, { total: number; draftable: number }> = {
  cat_3c: { total: 49, draftable: 45 },
  cat_3a: { total: 58, draftable: 54 },
  cat_2: { total: 62, draftable: 58 },
  cat_1: { total: 61, draftable: 57 },
}

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  ALL_CATEGORIES.map(c => [c.value, c.label])
)

const STAGE_LABELS: Record<string, string> = Object.fromEntries(
  ALL_STAGES.map(s => [s.value, s.label])
)

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
        {/* Step 1: Licence Category */}
        {step === 1 && (
          <div>
            <h2 className="text-[15px] font-bold text-[#0B1829] mb-1">
              What is the licence category for this entity?
            </h2>
            <p className="text-[12px] text-gray-500 mb-5">
              This determines which governance documents are applicable.
            </p>
            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
              {CATEGORY_GROUPS.map((group) => (
                <div key={group.jurisdiction}>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-400 mb-2">
                    {group.jurisdiction}
                  </p>
                  <div className="grid gap-2">
                    {group.options.map((cat) => (
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
            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
              {STAGE_GROUPS.map((group) => (
                <div key={group.jurisdiction}>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-400 mb-2">
                    {group.jurisdiction}
                  </p>
                  <div className="grid gap-2">
                    {group.options.map((stage) => (
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
              <ConfirmRow label="Licence category" value={CATEGORY_LABELS[fsraCategory] ?? fsraCategory} />
              <ConfirmRow label="Regulatory stage" value={STAGE_LABELS[regulatoryStage] ?? regulatoryStage} />
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
              applicable regulatory documents to your licence category and current phase.
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
