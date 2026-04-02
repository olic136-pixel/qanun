'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEntity } from '@/lib/entity-context'
import {
  Loader2, ArrowLeft, ArrowRight, Play, FileStack, Check,
} from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import { getEntity } from '@/lib/api/entities'

// ── Constants ────────────────────────────────────────────────────

const JURISDICTIONS = [
  { code: 'ADGM', label: 'ADGM / FSRA' },
  { code: 'VARA', label: 'VARA — Dubai' },
  { code: 'EL_SALVADOR', label: 'El Salvador — CNAD' },
  { code: 'BVI', label: 'BVI — FSC' },
  { code: 'PANAMA', label: 'Panama — SMV' },
]

const LICENCE_TYPES: Record<string, { code: string; label: string }[]> = {
  ADGM: [
    { code: 'cat_1', label: 'Category 1' },
    { code: 'cat_2', label: 'Category 2' },
    { code: 'cat_3a', label: 'Category 3A' },
    { code: 'cat_3c', label: 'Category 3C' },
  ],
  VARA: [
    { code: 'vasp_bd', label: 'VASP-BD — Broker-Dealer' },
    { code: 'vasp_ex', label: 'VASP-EX — Exchange' },
    { code: 'vasp_cust', label: 'VASP-CUST — Custody' },
    { code: 'vasp_mgmt', label: 'VASP-MGMT — Management & Investment' },
    { code: 'vasp_adv', label: 'VASP-ADV — Advisory' },
    { code: 'vasp_trs', label: 'VASP-TRS — Transfer & Settlement' },
  ],
  EL_SALVADOR: [
    { code: 'dasp_ex', label: 'DASP-EX — Exchange' },
    { code: 'dasp_cust', label: 'DASP-CUST — Custody' },
    { code: 'dasp_plat', label: 'DASP-PLAT — Platform' },
    { code: 'dasp_xfer', label: 'DASP-XFER — Transfer' },
    { code: 'dasp_inv', label: 'DASP-INV — Investment' },
    { code: 'bsp', label: 'BSP — Bitcoin Service Provider' },
    { code: 'issu', label: 'ISSU — Issuance' },
    { code: 'stbl_iss', label: 'STBL-ISS — Stablecoin Issuer' },
    { code: 'cert', label: 'CERT — Certification' },
  ],
  BVI: [
    { code: 'approved_manager', label: 'Approved Manager' },
    { code: 'investment_business', label: 'Investment Business' },
    { code: 'company_formation', label: 'Company Formation' },
  ],
  PANAMA: [
    { code: 'sociedad_anonima', label: 'Sociedad Anonima' },
    { code: 'casa_de_valores', label: 'Casa de Valores' },
    { code: 'asesor_de_inversion', label: 'Asesor de Inversion' },
  ],
}

const TIER_OPTIONS = [
  { tier: 1, label: 'Registration Pack', description: 'Documents submitted with licence application' },
  { tier: 2, label: 'Mandatory Compliance Framework', description: 'Policies required as licence conditions' },
  { tier: 3, label: 'Corporate Governance Framework', description: 'Board structure and authority documents' },
  { tier: 4, label: 'Operational Procedures', description: 'Step-by-step activity instructions' },
  { tier: 5, label: 'Regulatory Filings & Monitoring', description: 'Ongoing filing templates' },
]

const DOC_COUNTS: Record<string, number[]> = {
  ADGM:        [0, 7, 8, 5, 5, 5],
  VARA:        [0, 7, 11, 8, 6, 5],
  EL_SALVADOR: [0, 11, 13, 7, 9, 10],
  BVI:         [0, 7, 9, 6, 5, 4],
  PANAMA:      [0, 6, 8, 5, 4, 3],
}

const STEP_LABELS = ['Jurisdiction', 'Licence Type', 'Tiers', 'Review']

function estimateMinutes(jurisdiction: string, tiers: number[]): number {
  const counts = DOC_COUNTS[jurisdiction] ?? DOC_COUNTS.ADGM
  return tiers.reduce((sum, t) => sum + (counts[t] ?? 0), 0) * 6
}

function formatEstimate(minutes: number): string {
  if (minutes < 60) return `~${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `~${h}h ${m}m` : `~${h}h`
}

// ── Types ────────────────────────────────────────────────────────

interface SuiteJob {
  suite_job_id: string
  status: string
  total_documents: number
  doc_types: string[]
  poll_url: string
}

// ── Step Indicator ───────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEP_LABELS.map((label, i) => {
        const step = i + 1
        const done = step < current
        const active = step === current
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 flex items-center justify-center text-[12px] font-semibold border-2 transition-colors ${
                  done
                    ? 'bg-[#0F7A5F] border-[#0F7A5F] text-white'
                    : active
                      ? 'bg-[#0B1829] border-[#0B1829] text-white'
                      : 'bg-white border-[#E8EBF0] text-gray-400'
                }`}
              >
                {done ? <Check size={14} strokeWidth={2.5} /> : step}
              </div>
              <span
                className={`text-[10px] mt-1.5 font-medium whitespace-nowrap ${
                  active ? 'text-[#0B1829]' : done ? 'text-[#0F7A5F]' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={`flex-1 h-[2px] mx-3 mt-[-18px] ${
                  done ? 'bg-[#0F7A5F]' : 'bg-[#E8EBF0]'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────

export default function GovernanceSuitePage() {
  const { data: session } = useSession()
  const { selectedEntity } = useEntity()
  const router = useRouter()
  const searchParams = useSearchParams()
  const entityCreated = searchParams.get('entity_created')
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken || ''

  const [step, setStep] = useState(1)
  const [jurisdiction, setJurisdiction] = useState('ADGM')
  const [licenceType, setLicenceType] = useState('')
  const [selectedTiers, setSelectedTiers] = useState<number[]>([1, 2])
  const [fullBuild, setFullBuild] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')

  // Pre-fill from entity profile
  useEffect(() => {
    if (!selectedEntity?.id || !token) return
    getEntity(selectedEntity.id, token)
      .then(entity => {
        if (
          entity.target_jurisdiction &&
          ['ADGM', 'VARA', 'EL_SALVADOR', 'BVI', 'PANAMA'].includes(entity.target_jurisdiction)
        ) {
          setJurisdiction(entity.target_jurisdiction)
        }
        const profile = entity.entity_profile as Record<string, unknown> | null
        if (profile?.recommended_tiers && Array.isArray(profile.recommended_tiers)) {
          const tiers = (profile.recommended_tiers as number[]).filter(t => t >= 1 && t <= 5)
          if (tiers.length > 0) {
            setSelectedTiers(tiers)
            if (tiers.length === 5) setFullBuild(true)
          }
        }
      })
      .catch(() => { /* non-fatal */ })
  }, [selectedEntity?.id, token])

  // Reset licence type when jurisdiction changes
  useEffect(() => {
    setLicenceType('')
  }, [jurisdiction])

  function toggleTier(tier: number) {
    setSelectedTiers(prev =>
      prev.includes(tier) ? prev.filter(t => t !== tier) : [...prev, tier]
    )
  }

  function canAdvance(): boolean {
    if (step === 1) return !!jurisdiction
    if (step === 2) return !!licenceType
    if (step === 3) return selectedTiers.length > 0
    return true
  }

  async function handleStartSuite() {
    if (!selectedEntity?.id || !token) return
    setStarting(true)
    setError('')
    try {
      const res = await apiFetch<SuiteJob>('/api/drafting/suite', {
        method: 'POST',
        body: JSON.stringify({
          entity_id: selectedEntity.id,
          jurisdiction,
          licence_type: licenceType,
          tiers: selectedTiers.sort(),
          doc_types: [],
        }),
        token,
      })
      router.push(`/compliance/governance-suite/${res.suite_job_id}`)
    } catch (e: any) {
      setError(e.message)
      setStarting(false)
    }
  }

  const licenceOptions = LICENCE_TYPES[jurisdiction] ?? []
  const selectedLicenceLabel = licenceOptions.find(l => l.code === licenceType)?.label ?? ''
  const est = formatEstimate(estimateMinutes(jurisdiction, selectedTiers))

  return (
    <div className="max-w-[720px] mx-auto py-8 px-4">
      {/* Header */}
      <button
        onClick={() => router.push('/compliance/documents')}
        className="flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 mb-4 transition-colors"
      >
        <ArrowLeft size={12} strokeWidth={1.5} /> Back to documents
      </button>

      <div className="flex items-center gap-3 mb-2">
        <FileStack size={20} strokeWidth={1.5} className="text-[#0F7A5F]" />
        <h1 className="text-xl font-bold text-[#0B1829]">Governance Suite</h1>
      </div>
      <p className="text-[13px] text-gray-500 mb-7">
        Draft a complete governance package for {selectedEntity?.name ?? 'this entity'} across
        selected tiers. Each document is drafted sequentially and can be downloaded individually
        or as a ZIP.
      </p>

      {entityCreated && (
        <div className="mb-4 p-3 bg-[#0F7A5F]/10 border border-[#0F7A5F]/20
                        text-[#0F7A5F] text-[12px] font-medium">
          Entity created. Configure your governance suite below.
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-[13px] mb-5">
          {error}
        </div>
      )}

      {/* Step indicator */}
      <StepIndicator current={step} />

      {/* ─── Step 1: Jurisdiction ─── */}
      {step === 1 && (
        <div className="border border-[#E8EBF0] bg-white p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-3">
            Jurisdiction
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {JURISDICTIONS.map(j => (
              <button
                key={j.code}
                onClick={() => setJurisdiction(j.code)}
                className={`px-4 py-2.5 text-[12px] font-semibold border transition-colors ${
                  jurisdiction === j.code
                    ? 'bg-[#0B1829] text-white border-[#0B1829]'
                    : 'bg-white text-gray-600 border-[#E8EBF0] hover:border-gray-300'
                }`}
              >
                {j.label}
              </button>
            ))}
          </div>

          {!selectedEntity && (
            <p className="text-[11px] text-amber-600 mt-4">
              Select an entity from the sidebar before starting a suite.
            </p>
          )}
        </div>
      )}

      {/* ─── Step 2: Licence Type ─── */}
      {step === 2 && (
        <div className="border border-[#E8EBF0] bg-white p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-1">
            Licence Type
          </p>
          <p className="text-[12px] text-gray-500 mb-4">
            Select the licence category for{' '}
            {JURISDICTIONS.find(j => j.code === jurisdiction)?.label ?? jurisdiction}.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {licenceOptions.map(l => (
              <button
                key={l.code}
                onClick={() => setLicenceType(l.code)}
                className={`text-left px-4 py-3 border-2 transition-all ${
                  licenceType === l.code
                    ? 'border-[#0F7A5F] bg-[#0F7A5F]/5'
                    : 'border-[#E8EBF0] bg-white hover:border-gray-300'
                }`}
              >
                <span className="text-[13px] font-semibold text-[#0B1829]">{l.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Step 3: Tier Selection ─── */}
      {step === 3 && (
        <div className="border border-[#E8EBF0] bg-white p-6">
          {/* Full Governance Build toggle */}
          <button
            onClick={() => {
              const next = !fullBuild
              setFullBuild(next)
              setSelectedTiers(next ? [1, 2, 3, 4, 5] : [1, 2])
            }}
            className={`w-full p-4 border-2 text-left transition-all mb-4 ${
              fullBuild
                ? 'border-[#0F7A5F] bg-[#0F7A5F]/5'
                : 'border-[#E8EBF0] bg-white hover:border-[#0F7A5F]/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[13px] font-semibold text-[#0B1829]">
                    Full Governance Build
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-[#0F7A5F]/10 text-[#0F7A5F] font-semibold">
                    All 5 tiers
                  </span>
                </div>
                <p className="text-[11px] text-gray-500">
                  Complete governance package — registration through ongoing monitoring.
                  {fullBuild && (
                    <span className="ml-1 text-[#0F7A5F] font-medium">
                      Estimated: {formatEstimate(estimateMinutes(jurisdiction, [1,2,3,4,5]))}
                    </span>
                  )}
                </p>
              </div>
              <div className={`w-5 h-5 border-2 flex items-center justify-center shrink-0 ml-4 ${
                fullBuild ? 'border-[#0F7A5F] bg-[#0F7A5F]' : 'border-gray-300'
              }`}>
                {fullBuild && <span className="text-white text-[10px] font-bold">&#10003;</span>}
              </div>
            </div>
          </button>

          {/* Individual tiers */}
          {!fullBuild && (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-2">
                Tiers to include
              </p>
              <div className="space-y-2">
                {TIER_OPTIONS.map(t => (
                  <button
                    key={t.tier}
                    onClick={() => toggleTier(t.tier)}
                    className={`w-full text-left p-4 border-2 transition-all ${
                      selectedTiers.includes(t.tier)
                        ? 'border-[#0F7A5F] bg-[#0F7A5F]/5'
                        : 'border-[#E8EBF0] bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[13px] font-semibold text-[#0B1829]">
                          Tier {t.tier} — {t.label}
                        </span>
                        <p className="text-[11px] text-gray-500 mt-0.5">{t.description}</p>
                      </div>
                      <div className={`w-5 h-5 border-2 flex items-center justify-center shrink-0 ml-4 ${
                        selectedTiers.includes(t.tier)
                          ? 'border-[#0F7A5F] bg-[#0F7A5F]'
                          : 'border-gray-300'
                      }`}>
                        {selectedTiers.includes(t.tier) && (
                          <span className="text-white text-[10px] font-bold">&#10003;</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── Step 4: Review + Launch ─── */}
      {step === 4 && (
        <div className="border border-[#E8EBF0] bg-white p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-4">
            Review
          </p>

          <div className="space-y-3 mb-6">
            <ReviewRow label="Jurisdiction" value={JURISDICTIONS.find(j => j.code === jurisdiction)?.label ?? jurisdiction} />
            <ReviewRow label="Licence Type" value={selectedLicenceLabel} />
            <ReviewRow
              label="Tiers"
              value={
                fullBuild
                  ? 'All 5 tiers (Full Governance Build)'
                  : selectedTiers.sort().map(t => `Tier ${t}`).join(', ')
              }
            />
            <ReviewRow label="Entity" value={selectedEntity?.name ?? '—'} />
            <ReviewRow label="Estimated time" value={est} />
          </div>

          {selectedTiers.length === 5 && (
            <p className="text-[11px] text-amber-600 mb-4">
              A full 5-tier build may take several hours. Suitable for an overnight session.
            </p>
          )}

          {!selectedEntity && (
            <p className="text-[11px] text-amber-600 mb-4">
              Select an entity from the sidebar before starting a suite.
            </p>
          )}

          <button
            onClick={handleStartSuite}
            disabled={starting || selectedTiers.length === 0 || !selectedEntity}
            className="flex items-center justify-center gap-2 w-full py-3 bg-[#0F7A5F] text-white text-[14px] font-semibold hover:bg-[#0F6E56] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {starting ? (
              <><Loader2 size={16} className="animate-spin" /> Starting suite...</>
            ) : (
              <><Play size={16} strokeWidth={1.5} /> Start Governance Suite</>
            )}
          </button>
        </div>
      )}

      {/* ─── Navigation ─── */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => setStep(s => Math.max(1, s - 1))}
          disabled={step === 1}
          className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold text-gray-500 border border-[#E8EBF0] hover:border-gray-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowLeft size={14} strokeWidth={1.5} /> Back
        </button>

        {step < 4 && (
          <button
            onClick={() => setStep(s => Math.min(4, s + 1))}
            disabled={!canAdvance()}
            className="flex items-center gap-1.5 px-5 py-2 text-[12px] font-semibold bg-[#0B1829] text-white hover:bg-[#1D2D44] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next <ArrowRight size={14} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-[12px] text-gray-500">{label}</span>
      <span className="text-[12px] font-semibold text-[#0B1829]">{value}</span>
    </div>
  )
}
