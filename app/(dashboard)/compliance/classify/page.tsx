'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight, ArrowLeft, Loader2, AlertTriangle, CheckCircle2,
  ChevronDown, ChevronUp, Info, FileText, Sparkles, ExternalLink,
} from 'lucide-react'
import {
  classifyBusinessModel,
  getClassificationResult,
  type ClassificationRequest,
  type ClassificationSession,
  type DocumentManifestItem,
  type RedFlag,
} from '@/lib/api/compliance'

// ── Category display helpers ───────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  category_1: 'Category 1',
  category_2: 'Category 2',
  category_3a: 'Category 3A',
  category_3b: 'Category 3B',
  category_3c: 'Category 3C',
  category_4: 'Category 4',
  category_5: 'Category 5',
  representative_office: 'Representative Office',
}

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  category_1: 'Accepting Deposits or Managing a PSIAu',
  category_2: 'Providing Credit or Dealing as Principal',
  category_3a: 'Dealing as Agent or Matched Principal',
  category_3b: 'Dealing as Principal (own account)',
  category_3c: 'Managing assets without retail clients',
  category_4: 'Arranging, advising, or operating a CIS',
  category_5: 'Insurance management',
  representative_office: 'Marketing and introduction only',
}

const STATUS_MESSAGES = [
  'Reviewing ADGM regulatory framework...',
  'Analysing your activity types...',
  'Matching to FSP categories...',
  'Checking threshold conditions...',
  'Building document manifest...',
]

// ── Step indicator ─────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
              i + 1 === current
                ? 'bg-[#1A5FA8] text-white'
                : i + 1 < current
                  ? 'bg-[#0F7A5F] text-white'
                  : 'bg-[#E8EBF0] text-[#6B7280]'
            }`}
          >
            {i + 1 < current ? <CheckCircle2 size={14} /> : i + 1}
          </div>
          {i < total - 1 && (
            <div
              className={`w-12 h-0.5 ${
                i + 1 < current ? 'bg-[#0F7A5F]' : 'bg-[#E8EBF0]'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Toggle question component ──────────────────────────────────

function ToggleQuestion({
  label,
  value,
  onChange,
  warning,
  options,
}: {
  label: string
  value: boolean | null
  onChange: (v: boolean | null) => void
  warning?: string
  options?: { label: string; value: boolean | null }[]
}) {
  const opts = options || [
    { label: 'Yes', value: true },
    { label: 'No', value: false },
  ]
  return (
    <div className="bg-white border border-[#E8EBF0] rounded-lg p-4">
      <p className="text-sm font-medium text-[#111827] mb-3">{label}</p>
      <div className="flex gap-2">
        {opts.map((opt) => (
          <button
            key={opt.label}
            onClick={() => onChange(opt.value)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              value === opt.value
                ? 'bg-[#0B1829] text-white'
                : 'bg-[#F5F7FA] text-[#6B7280] hover:bg-[#E8EBF0]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {warning && value === true && (
        <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-md p-3">
          <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800">{warning}</p>
        </div>
      )}
    </div>
  )
}

// ── Main page component ────────────────────────────────────────

export default function ClassifyPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken || ''

  const [step, setStep] = useState(1)

  // Step 1 state
  const [description, setDescription] = useState('')

  // Step 2 state
  const [retailClients, setRetailClients] = useState<boolean | null>(null)
  const [managesAssets, setManagesAssets] = useState<boolean | null>(null)
  const [fundManager, setFundManager] = useState<boolean | null>(null)
  const [virtualAssets, setVirtualAssets] = useState<boolean | null>(null)
  const [existingLicence, setExistingLicence] = useState<boolean | null>(null)
  const [existingJurisdiction, setExistingJurisdiction] = useState('')
  const [islamicFinance, setIslamicFinance] = useState<boolean | null>(null)

  // Step 3 state
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [statusMsgIdx, setStatusMsgIdx] = useState(0)
  const [classificationError, setClassificationError] = useState<string | null>(null)
  const hasSubmitted = useRef(false)

  // Step 4 state
  const [result, setResult] = useState<ClassificationSession | null>(null)
  const [showReasoning, setShowReasoning] = useState(false)
  const [showThresholds, setShowThresholds] = useState(false)
  const [savedConfirm, setSavedConfirm] = useState(false)

  // Step 3: Submit classification on mount
  useEffect(() => {
    if (step !== 3 || hasSubmitted.current || !token) return
    hasSubmitted.current = true

    const request: ClassificationRequest = {
      business_description: description,
      has_retail_clients: retailClients,
      manages_client_assets: managesAssets,
      is_fund_manager: fundManager,
      involves_virtual_assets: virtualAssets,
      islamic_finance: islamicFinance,
      has_existing_licence: existingLicence,
      existing_jurisdiction: existingLicence ? existingJurisdiction || null : null,
    }

    classifyBusinessModel(request, token)
      .then((resp) => setSessionId(resp.session_id))
      .catch((e) => setClassificationError(e.message || 'Failed to submit'))
  }, [step, token, description, retailClients, managesAssets, fundManager, virtualAssets, islamicFinance, existingLicence, existingJurisdiction])

  // Step 3: Rotate status messages
  useEffect(() => {
    if (step !== 3) return
    const timer = setInterval(() => {
      setStatusMsgIdx((i) => (i + 1) % STATUS_MESSAGES.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [step])

  // Step 3: Poll for result
  useEffect(() => {
    if (step !== 3 || !sessionId || !token) return
    let cancelled = false

    const poll = async () => {
      while (!cancelled) {
        await new Promise((r) => setTimeout(r, 2000))
        if (cancelled) break
        try {
          const res = await getClassificationResult(sessionId, token)
          if (res.status === 'complete') {
            setResult(res)
            setTimeout(() => { if (!cancelled) setStep(4) }, 500)
            return
          }
          if (res.status === 'failed') {
            setClassificationError(res.error_message || 'Classification failed')
            return
          }
        } catch {
          // keep polling
        }
      }
    }
    poll()
    return () => { cancelled = true }
  }, [step, sessionId, token])

  const confidencePct = result?.category_confidence
    ? Math.round(result.category_confidence * 100)
    : 0
  const confidenceLabel =
    confidencePct >= 80 ? 'High confidence' : confidencePct >= 60 ? 'Moderate confidence' : 'Low confidence'

  const mandatoryDocs = (result?.document_manifest || []).filter((d) => d.mandatory)
  const conditionalDocs = (result?.document_manifest || []).filter((d) => !d.mandatory)
  const totalDocs = (result?.document_manifest || []).length

  return (
    <div className="max-w-3xl mx-auto">
      <StepIndicator current={step} total={4} />

      {/* ── STEP 1 ──────────────────────────────────────────── */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-semibold text-[#111827] mb-2">
            What do you want to do in ADGM?
          </h2>
          <p className="text-sm text-[#6B7280] mb-6">
            Describe your business model, the clients you will serve, the assets or
            instruments you will work with, and any existing regulatory permissions
            elsewhere. Be specific.
          </p>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
            placeholder="e.g. We are a fund manager seeking ADGM authorisation to manage segregated accounts for professional investors..."
            className="w-full min-h-[160px] p-4 border border-[#E8EBF0] rounded-lg text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1A5FA8]/30 focus:border-[#1A5FA8] resize-y"
          />
          <div className="flex items-center justify-between mt-2">
            <p
              className={`text-xs ${
                2000 - description.length < 200
                  ? 'text-[#C4922A]'
                  : 'text-[#6B7280]'
              }`}
            >
              {2000 - description.length} characters remaining
            </p>
            {description.length < 50 && description.length > 0 && (
              <p className="text-xs text-[#991B1B]">Minimum 50 characters</p>
            )}
          </div>
          <div className="flex justify-end mt-6">
            <button
              onClick={() => setStep(2)}
              disabled={description.trim().length < 50}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#0B1829] text-white text-sm font-medium rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#162a42] transition-colors"
            >
              Continue
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2 ──────────────────────────────────────────── */}
      {step === 2 && (
        <div>
          <h2 className="text-xl font-semibold text-[#111827] mb-2">
            Help us classify your business
          </h2>
          <p className="text-sm text-[#6B7280] mb-6">
            These optional questions improve accuracy. Skip any you are unsure about.
          </p>
          <div className="space-y-4">
            <ToggleQuestion
              label="Will you have retail clients?"
              value={retailClients}
              onChange={setRetailClients}
              warning="Retail client activities require Category 2 minimum and additional FSRA permissions."
              options={[
                { label: 'Yes', value: true },
                { label: 'No', value: false },
                { label: 'Unsure', value: null },
              ]}
            />
            <ToggleQuestion
              label="Will you manage client assets on a discretionary basis?"
              value={managesAssets}
              onChange={setManagesAssets}
            />
            <ToggleQuestion
              label="Are you a fund manager or will you operate an investment fund?"
              value={fundManager}
              onChange={setFundManager}
            />
            <ToggleQuestion
              label="Will your business involve crypto, tokens, or virtual assets?"
              value={virtualAssets}
              onChange={setVirtualAssets}
              warning="Virtual asset activities are subject to additional FSRA requirements under the VA Framework."
            />
            <div className="bg-white border border-[#E8EBF0] rounded-lg p-4">
              <p className="text-sm font-medium text-[#111827] mb-3">
                Is this entity part of a regulated group with an existing licence elsewhere?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setExistingLicence(true)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    existingLicence === true
                      ? 'bg-[#0B1829] text-white'
                      : 'bg-[#F5F7FA] text-[#6B7280] hover:bg-[#E8EBF0]'
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => { setExistingLicence(false); setExistingJurisdiction('') }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    existingLicence === false
                      ? 'bg-[#0B1829] text-white'
                      : 'bg-[#F5F7FA] text-[#6B7280] hover:bg-[#E8EBF0]'
                  }`}
                >
                  No
                </button>
              </div>
              {existingLicence && (
                <input
                  type="text"
                  value={existingJurisdiction}
                  onChange={(e) => setExistingJurisdiction(e.target.value)}
                  placeholder="Jurisdiction (e.g. UK, Singapore)"
                  className="mt-3 w-full px-3 py-2 border border-[#E8EBF0] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5FA8]/30"
                />
              )}
            </div>
            <ToggleQuestion
              label="Does your business need to comply with Islamic finance principles?"
              value={islamicFinance}
              onChange={setIslamicFinance}
            />
          </div>
          <div className="flex justify-between mt-6">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#6B7280] hover:text-[#111827] transition-colors"
            >
              <ArrowLeft size={14} />
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#0B1829] text-white text-sm font-medium rounded-lg hover:bg-[#162a42] transition-colors"
            >
              Classify
              <Sparkles size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3 ──────────────────────────────────────────── */}
      {step === 3 && (
        <div className="flex flex-col items-center justify-center py-16">
          {classificationError ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-[#111827] mb-2">
                Classification failed
              </h3>
              <p className="text-sm text-[#6B7280] mb-6 max-w-md">
                {classificationError}
              </p>
              <button
                onClick={() => {
                  setClassificationError(null)
                  hasSubmitted.current = false
                  setSessionId(null)
                  setStep(1)
                }}
                className="px-6 py-2.5 bg-[#0B1829] text-white text-sm font-medium rounded-lg hover:bg-[#162a42]"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              <Loader2 size={32} className="text-[#1A5FA8] animate-spin mb-6" />
              <h3 className="text-lg font-medium text-[#111827] mb-2">
                Classifying your business model...
              </h3>
              <p className="text-sm text-[#6B7280] animate-pulse">
                {STATUS_MESSAGES[statusMsgIdx]}
              </p>
            </>
          )}
        </div>
      )}

      {/* ── STEP 4 ──────────────────────────────────────────── */}
      {step === 4 && result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN — Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Category Card */}
            <div className="bg-[#0B1829] rounded-lg p-6">
              <p className="text-xs text-white/50 uppercase tracking-wider mb-1">
                Recommended Category
              </p>
              <h3 className="text-2xl font-semibold text-white mb-1">
                {CATEGORY_LABELS[result.recommended_category || ''] ||
                  result.recommended_category}
              </h3>
              <p className="text-sm text-white/60 mb-4">
                {CATEGORY_DESCRIPTIONS[result.recommended_category || ''] || ''}
              </p>
              <div className="mb-2">
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0F7A5F] rounded-full transition-all duration-700"
                    style={{ width: `${confidencePct}%` }}
                  />
                </div>
              </div>
              <p className="text-xs text-white/70">
                {confidenceLabel} — {confidencePct}%
              </p>
              {result.alternative_category && (
                <div className="mt-3 inline-flex items-center gap-1.5 bg-[#C4922A]/20 text-[#C4922A] text-xs px-3 py-1 rounded-full">
                  Also consider: {CATEGORY_LABELS[result.alternative_category] || result.alternative_category}
                </div>
              )}
            </div>

            {/* Red Flags */}
            {result.red_flags && result.red_flags.length > 0 && (
              <div className="space-y-3">
                {result.red_flags.map((flag: RedFlag, i: number) => (
                  <div
                    key={i}
                    className={`border-l-4 rounded-md p-4 ${
                      flag.severity === 'high'
                        ? 'border-red-500 bg-red-50'
                        : flag.severity === 'medium'
                          ? 'border-[#C4922A] bg-amber-50'
                          : 'border-[#1A5FA8] bg-blue-50'
                    }`}
                  >
                    <p className="text-sm font-medium text-[#111827]">{flag.flag}</p>
                    <p className="text-xs text-[#6B7280] mt-1">{flag.description}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Regulated Activities */}
            {result.regulated_activities && result.regulated_activities.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-[#111827] mb-3">
                  Regulated Activities Required
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.regulated_activities.map((act, i) => (
                    <span
                      key={i}
                      className="bg-[#F5F7FA] text-[#374151] text-xs px-3 py-1.5 rounded-md"
                    >
                      {act}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Classification Reasoning */}
            {result.classification_reasoning && (
              <div className="border border-[#E8EBF0] rounded-lg">
                <button
                  onClick={() => setShowReasoning(!showReasoning)}
                  className="w-full flex items-center justify-between p-4 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors"
                >
                  View classification reasoning
                  {showReasoning ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {showReasoning && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-[#6B7280] leading-relaxed">
                      {result.classification_reasoning}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Document Manifest Table */}
            <div>
              <h4 className="text-sm font-medium text-[#111827] mb-1">
                Your Document Manifest
              </h4>
              <p className="text-xs text-[#6B7280] mb-4">
                {totalDocs} documents required for your submission
              </p>
              <div className="bg-white border border-[#E8EBF0] rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E8EBF0] bg-[#F9FAFB]">
                      <th className="text-left text-xs font-medium text-[#6B7280] px-4 py-3">
                        Document
                      </th>
                      <th className="text-left text-xs font-medium text-[#6B7280] px-4 py-3 w-28">
                        Required
                      </th>
                      <th className="text-left text-xs font-medium text-[#6B7280] px-4 py-3">
                        Regulatory Basis
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(result.document_manifest || []).map(
                      (doc: DocumentManifestItem, i: number) => (
                        <tr
                          key={i}
                          className="border-b border-[#E8EBF0] last:border-0"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <FileText size={14} className="text-[#6B7280] shrink-0" />
                              <div>
                                <p className="text-sm text-[#111827]">
                                  {doc.display_name || doc.doc_type}
                                </p>
                                {doc.conditional_note && (
                                  <p className="text-xs text-[#9CA3AF] italic">
                                    {doc.conditional_note}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`flex items-center gap-1.5 text-xs ${
                                doc.mandatory
                                  ? 'text-[#0F7A5F]'
                                  : 'text-[#C4922A]'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  doc.mandatory
                                    ? 'bg-[#0F7A5F]'
                                    : 'bg-[#C4922A]'
                                }`}
                              />
                              {doc.mandatory ? 'Required' : 'Conditional'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs text-[#9CA3AF]">
                              {(doc.corpus_basis || []).join(', ')}
                            </p>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Threshold Conditions */}
            {result.threshold_conditions &&
              result.threshold_conditions.length > 0 && (
                <div className="border border-[#E8EBF0] rounded-lg">
                  <button
                    onClick={() => setShowThresholds(!showThresholds)}
                    className="w-full flex items-center justify-between p-4 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] transition-colors"
                  >
                    View threshold conditions ({result.threshold_conditions.length})
                    {showThresholds ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>
                  {showThresholds && (
                    <div className="px-4 pb-4 space-y-3">
                      {result.threshold_conditions.map((tc, i) => (
                        <div key={i} className="border-b border-[#F3F4F6] pb-3 last:border-0">
                          <p className="text-sm font-medium text-[#111827]">
                            {tc.condition}
                          </p>
                          <p className="text-xs text-[#9CA3AF] mt-0.5">
                            {tc.corpus_basis}
                          </p>
                          <p className="text-xs text-[#6B7280] italic mt-1">
                            {tc.met_by}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            {/* Special Considerations */}
            {result.special_considerations &&
              result.special_considerations.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Info size={14} className="text-[#1A5FA8] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-[#1A5FA8] mb-2">
                        Additional Considerations
                      </p>
                      <ul className="space-y-1">
                        {result.special_considerations.map((sc, i) => (
                          <li key={i} className="text-xs text-[#374151]">
                            {sc}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
          </div>

          {/* RIGHT COLUMN — Actions */}
          <div className="space-y-4">
            {/* Primary action */}
            <div className="border-2 border-[#0B1829] rounded-lg p-5">
              <h4 className="text-sm font-semibold text-[#111827] mb-2">
                Generate Full Submission Package
              </h4>
              <p className="text-xs text-[#6B7280] mb-4">
                Generate all {totalDocs} required documents in one job.
                Takes approximately 15-30 minutes.
              </p>
              <button
                onClick={() => {
                  // Stub — coming in next sprint
                  alert('Coming in next sprint')
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0F7A5F] text-white text-sm font-medium rounded-lg hover:bg-[#0a6249] transition-colors"
              >
                Generate Package
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Secondary actions */}
            <div className="bg-white border border-[#E8EBF0] rounded-lg p-5 space-y-3">
              <button
                onClick={() => {
                  const config = result.entity_config_draft
                    ? encodeURIComponent(JSON.stringify(result.entity_config_draft))
                    : ''
                  router.push(`/compliance/draft${config ? `?entity_config=${config}` : ''}`)
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#F5F7FA] text-[#374151] text-sm font-medium rounded-lg hover:bg-[#E8EBF0] transition-colors"
              >
                <FileText size={14} />
                Draft Individual Document
              </button>

              <button
                onClick={() => {
                  setSavedConfirm(true)
                  setTimeout(() => setSavedConfirm(false), 2000)
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#F5F7FA] text-[#374151] text-sm font-medium rounded-lg hover:bg-[#E8EBF0] transition-colors"
              >
                {savedConfirm ? (
                  <>
                    <CheckCircle2 size={14} className="text-[#0F7A5F]" />
                    Saved
                  </>
                ) : (
                  'Save Classification'
                )}
              </button>
            </div>

            {/* Tertiary link */}
            <button
              onClick={() => {
                setStep(1)
                setDescription('')
                setRetailClients(null)
                setManagesAssets(null)
                setFundManager(null)
                setVirtualAssets(null)
                setExistingLicence(null)
                setExistingJurisdiction('')
                setIslamicFinance(null)
                setSessionId(null)
                setResult(null)
                setClassificationError(null)
                hasSubmitted.current = false
              }}
              className="w-full text-center text-xs text-[#1A5FA8] hover:underline"
            >
              Start a new classification
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
