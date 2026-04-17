'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Plus, X, Send } from 'lucide-react'
import {
  submitReview,
  type ReviewSectionInput,
  type DiscrepancyInput,
} from '@/lib/api/drafting'

interface ParsedSection {
  section_id: string
  title: string
  content: string
}

interface ReviewPanelProps {
  jobId: string
  sectionsJson: string
  jurisdiction?: string
  token: string
  onComplete: (pairsStored: number) => void
}

const QUALITY_TIERS = [
  { value: 'excellent', label: 'Excellent', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { value: 'good', label: 'Good', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  { value: 'acceptable', label: 'Acceptable', color: 'text-gray-700 bg-gray-50 border-gray-200' },
  { value: 'poor', label: 'Poor', color: 'text-red-700 bg-red-50 border-red-200' },
] as const

const DISCREPANCY_TYPES = [
  { value: 'MISSTATEMENT', label: 'Misstatement' },
  { value: 'OVERSTATEMENT', label: 'Overstatement' },
  { value: 'MATERIAL_OMISSION', label: 'Material omission' },
  { value: 'SCOPE_ERROR', label: 'Scope error' },
  { value: 'STRENGTH_ERROR', label: 'Strength error' },
] as const

export function ReviewPanel({
  jobId,
  sectionsJson,
  jurisdiction = 'ADGM',
  token,
  onComplete,
}: ReviewPanelProps) {
  const sections: ParsedSection[] = (() => {
    try {
      return JSON.parse(sectionsJson) as ParsedSection[]
    } catch {
      return []
    }
  })()

  const [expanded, setExpanded] = useState<string | null>(null)
  const [reviews, setReviews] = useState<
    Record<string, ReviewSectionInput>
  >({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  function getReview(sectionId: string): ReviewSectionInput {
    return (
      reviews[sectionId] ?? {
        section_id: sectionId,
        discrepancies: [],
        quality_tier: 'acceptable',
        reviewed: false,
      }
    )
  }

  function updateReview(
    sectionId: string,
    update: Partial<ReviewSectionInput>
  ) {
    setReviews((prev) => ({
      ...prev,
      [sectionId]: { ...getReview(sectionId), ...update },
    }))
  }

  function addDiscrepancy(sectionId: string) {
    const rev = getReview(sectionId)
    const blank: DiscrepancyInput = {
      discrepancy_type: 'MISSTATEMENT',
      original_text: '',
      corrected_text: '',
      provision_ref: '',
    }
    updateReview(sectionId, {
      discrepancies: [...rev.discrepancies, blank],
    })
  }

  function updateDiscrepancy(
    sectionId: string,
    idx: number,
    patch: Partial<DiscrepancyInput>
  ) {
    const rev = getReview(sectionId)
    const updated = rev.discrepancies.map((d, i) =>
      i === idx ? { ...d, ...patch } : d
    )
    updateReview(sectionId, { discrepancies: updated })
  }

  function removeDiscrepancy(sectionId: string, idx: number) {
    const rev = getReview(sectionId)
    updateReview(sectionId, {
      discrepancies: rev.discrepancies.filter((_, i) => i !== idx),
    })
  }

  function markReviewed(sectionId: string) {
    updateReview(sectionId, { reviewed: true })
    setExpanded(null)
  }

  const reviewedCount = Object.values(reviews).filter(
    (r) => r.reviewed
  ).length

  async function handleSubmit() {
    if (reviewedCount === 0) return
    setSubmitting(true)
    setError('')
    try {
      const payload = {
        sections: Object.values(reviews).filter((r) => r.reviewed),
        jurisdiction,
      }
      const result = await submitReview(jobId, payload, token)
      setSubmitted(true)
      onComplete(result.pairs_stored)
    } catch (e: any) {
      setError(e.message ?? 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (sections.length === 0) {
    return (
      <div className="text-[12px] text-gray-400 px-6 py-4">
        No section data available for review.
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="px-6 py-5 text-[13px] text-emerald-800 bg-emerald-50 rounded-lg border border-emerald-200">
        Review submitted. Feedback stored for future drafts.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {sections.map((section) => {
        const rev = getReview(section.section_id)
        const isOpen = expanded === section.section_id
        const tier = QUALITY_TIERS.find(
          (t) => t.value === rev.quality_tier
        )

        return (
          <div
            key={section.section_id}
            className="border border-[#E8EBF0] rounded-lg bg-white overflow-hidden"
          >
            {/* Section header */}
            <button
              className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-gray-50 transition-colors"
              onClick={() =>
                setExpanded(isOpen ? null : section.section_id)
              }
            >
              <div className="flex items-center gap-3">
                <span className="text-[12px] font-semibold text-[#0B1829]">
                  {section.title}
                </span>
                {rev.reviewed && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${tier?.color}`}
                  >
                    {tier?.label}
                  </span>
                )}
                {rev.discrepancies.length > 0 && (
                  <span className="text-[10px] text-amber-600 font-semibold">
                    {rev.discrepancies.length} issue
                    {rev.discrepancies.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {isOpen ? (
                <ChevronUp size={14} className="text-gray-400" />
              ) : (
                <ChevronDown size={14} className="text-gray-400" />
              )}
            </button>

            {/* Expanded review form */}
            {isOpen && (
              <div className="border-t border-[#E8EBF0] px-5 py-4 space-y-4">
                {/* Section content preview */}
                <div className="bg-gray-50 rounded p-3 text-[11px] text-gray-600 font-mono max-h-32 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                  {section.content.slice(0, 600)}
                  {section.content.length > 600 && '…'}
                </div>

                {/* Quality tier */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">
                    Quality
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {QUALITY_TIERS.map((t) => (
                      <button
                        key={t.value}
                        onClick={() =>
                          updateReview(section.section_id, {
                            quality_tier: t.value,
                          })
                        }
                        className={`text-[11px] font-semibold px-3 py-1 rounded border transition-colors ${
                          rev.quality_tier === t.value
                            ? t.color
                            : 'border-gray-200 text-gray-400 bg-white hover:bg-gray-50'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Discrepancies */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                      Discrepancies
                    </p>
                    <button
                      onClick={() => addDiscrepancy(section.section_id)}
                      className="flex items-center gap-1 text-[11px] text-blue-600 font-semibold hover:text-blue-800"
                    >
                      <Plus size={12} /> Add
                    </button>
                  </div>

                  {rev.discrepancies.length === 0 && (
                    <p className="text-[11px] text-gray-400 italic">
                      No discrepancies — leave blank if section is accurate.
                    </p>
                  )}

                  {rev.discrepancies.map((disc, idx) => (
                    <div
                      key={idx}
                      className="border border-amber-200 bg-amber-50 rounded p-3 space-y-2 mb-2"
                    >
                      <div className="flex items-center justify-between">
                        <select
                          value={disc.discrepancy_type}
                          onChange={(e) =>
                            updateDiscrepancy(
                              section.section_id,
                              idx,
                              {
                                discrepancy_type: e.target
                                  .value as DiscrepancyInput['discrepancy_type'],
                              }
                            )
                          }
                          className="text-[11px] border border-amber-300 rounded px-2 py-1 bg-white"
                        >
                          {DISCREPANCY_TYPES.map((dt) => (
                            <option key={dt.value} value={dt.value}>
                              {dt.label}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() =>
                            removeDiscrepancy(section.section_id, idx)
                          }
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <input
                        placeholder="Provision ref (e.g. AML 6.1.1)"
                        value={disc.provision_ref ?? ''}
                        onChange={(e) =>
                          updateDiscrepancy(section.section_id, idx, {
                            provision_ref: e.target.value,
                          })
                        }
                        className="w-full text-[11px] border border-gray-200 rounded px-2 py-1 font-mono"
                      />
                      <textarea
                        placeholder="Original text from the draft (verbatim excerpt)"
                        value={disc.original_text}
                        onChange={(e) =>
                          updateDiscrepancy(section.section_id, idx, {
                            original_text: e.target.value,
                          })
                        }
                        className="w-full text-[11px] border border-gray-200 rounded px-2 py-1 h-16 resize-none"
                      />
                      <textarea
                        placeholder="Corrected text — what it should say instead"
                        value={disc.corrected_text}
                        onChange={(e) =>
                          updateDiscrepancy(section.section_id, idx, {
                            corrected_text: e.target.value,
                          })
                        }
                        className="w-full text-[11px] border border-gray-200 rounded px-2 py-1 h-16 resize-none"
                      />
                    </div>
                  ))}
                </div>

                {/* Mark reviewed */}
                <button
                  onClick={() => markReviewed(section.section_id)}
                  className="w-full py-2 text-[12px] font-semibold bg-[#0B1829] text-white rounded hover:bg-[#1D2D44] transition-colors"
                >
                  Mark reviewed
                </button>
              </div>
            )}
          </div>
        )
      })}

      {/* Submit bar */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <p className="text-[12px] text-gray-500">
          {reviewedCount} of {sections.length} section
          {sections.length > 1 ? 's' : ''} reviewed
        </p>
        <button
          onClick={handleSubmit}
          disabled={submitting || reviewedCount === 0}
          className="flex items-center gap-2 px-4 py-2 text-[12px] font-semibold bg-[#0F7A5F] text-white rounded hover:bg-[#0F6E56] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Send size={13} />
          {submitting ? 'Submitting…' : 'Submit review'}
        </button>
      </div>

      {error && (
        <p className="text-[12px] text-red-600 bg-red-50 rounded px-3 py-2">
          {error}
        </p>
      )}
    </div>
  )
}
