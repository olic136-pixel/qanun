'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'

type QualityTier = 'exemplar' | 'good' | 'adequate' | 'poor'

interface DocumentReviewModalProps {
  jobId: string
  documentTitle: string
  entityName: string
  token: string
  isOpen: boolean
  onClose: () => void
  onSubmitted?: (reviewId: string) => void
}

const TIERS: { value: QualityTier; label: string; selectedClass: string }[] = [
  { value: 'exemplar', label: 'EXEMPLAR', selectedClass: 'bg-[#059669] text-white border-[#059669]' },
  { value: 'good', label: 'GOOD', selectedClass: 'bg-black text-white border-black' },
  { value: 'adequate', label: 'ADEQUATE', selectedClass: 'bg-black text-white border-black' },
  { value: 'poor', label: 'POOR', selectedClass: 'bg-[#991B1B] text-white border-[#991B1B]' },
]

export function DocumentReviewModal({
  jobId,
  documentTitle,
  entityName,
  token,
  isOpen,
  onClose,
  onSubmitted,
}: DocumentReviewModalProps) {
  const [selectedTier, setSelectedTier] = useState<QualityTier | null>(null)
  const [notes, setNotes] = useState('')
  const [correctedFile, setCorrectedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [correctionsExtracted, setCorrectionsExtracted] = useState(0)

  if (!isOpen) return null

  async function handleSubmit() {
    if (!selectedTier) return
    setIsSubmitting(true)
    setSubmitError('')
    try {
      const fd = new FormData()
      fd.append('quality_tier', selectedTier)
      if (notes.trim()) fd.append('notes', notes)
      if (correctedFile) fd.append('corrected_docx', correctedFile)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/drafting/${jobId}/review`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        }
      )
      if (!response.ok) throw new Error('Submit failed')
      const data = await response.json()
      setCorrectionsExtracted(data.corrections_extracted ?? 0)
      setSubmitted(true)
      onSubmitted?.(data.review_id)
    } catch {
      setSubmitError('Failed to submit. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Confirmation state ──────────────────────────────────────
  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center">
        <div className="bg-[#FAF9F7] border border-black/10 p-6 max-w-lg w-full mx-auto mt-[20vh]">
          <div className="text-center py-6">
            <div className="w-10 h-10 bg-[#059669] flex items-center justify-center mx-auto mb-4">
              <Check size={20} className="text-white" />
            </div>
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-black/40 mb-2">
              REVIEW RECORDED
            </p>
            <p className="font-mono text-sm font-bold text-black mb-1">
              {selectedTier?.toUpperCase()}
            </p>
            {correctionsExtracted > 0 && (
              <p className="text-[12px] text-black/50 mt-3">
                {correctionsExtracted} correction{correctionsExtracted !== 1 ? 's' : ''} extracted from your annotated document
              </p>
            )}
          </div>
          <div className="flex justify-center mt-4">
            <button
              onClick={onClose}
              className="font-mono text-[11px] uppercase tracking-[0.15em] px-4 py-2 bg-black text-white hover:bg-black/80 transition-colors"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Form state ──────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center">
      <div className="bg-[#FAF9F7] border border-black/10 p-6 max-w-lg w-full mx-auto mt-[20vh]">
        {/* Header */}
        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-black/40 mb-1">
          RATE THIS DRAFT
        </p>
        <p className="font-mono text-sm font-bold text-black mb-1">
          {documentTitle}
        </p>
        {entityName && (
          <p className="text-[12px] text-black/40 mb-4">{entityName}</p>
        )}

        {/* Tier buttons */}
        <div className="flex gap-2 mb-5">
          {TIERS.map(tier => (
            <button
              key={tier.value}
              onClick={() => setSelectedTier(tier.value)}
              className={`font-mono text-[10px] uppercase tracking-[0.15em] px-3 py-2 border transition-colors ${
                selectedTier === tier.value
                  ? tier.selectedClass
                  : 'border-black/20 bg-transparent text-black/60 hover:border-black/40'
              }`}
            >
              {tier.label}
            </button>
          ))}
        </div>

        {/* Notes */}
        <label className="block mb-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-black/40 mb-1 block">
            Notes
          </span>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={4}
            placeholder="Describe any errors or the reason for this rating..."
            className="w-full border border-black/20 bg-white p-2 text-sm font-mono resize-none focus:outline-none focus:border-black"
          />
        </label>

        {/* File upload */}
        <div className="mb-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-black/40 mb-1">
            Upload corrected version (optional)
          </p>
          <p className="text-[11px] text-black/30 mb-2">
            Enable Track Changes in Word, make corrections, save, then upload the corrected file.
          </p>
          <div className="flex items-center gap-3">
            <label className="font-mono text-[10px] uppercase tracking-[0.15em] px-3 py-1.5 border border-black/20 text-black/60 hover:border-black/40 cursor-pointer transition-colors">
              Choose file
              <input
                type="file"
                accept=".docx"
                className="hidden"
                onChange={e => setCorrectedFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <span className="text-[11px] text-black/40 font-mono">
              {correctedFile ? correctedFile.name : 'No file chosen'}
            </span>
            {correctedFile && (
              <button
                onClick={() => setCorrectedFile(null)}
                className="text-black/30 hover:text-black/60 transition-colors"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {submitError && (
          <p className="font-mono text-[10px] text-[#991B1B] mb-3">{submitError}</p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleSubmit}
            disabled={!selectedTier || isSubmitting}
            className="font-mono text-[11px] uppercase tracking-[0.15em] px-4 py-2 bg-black text-white disabled:opacity-30 transition-colors"
          >
            {isSubmitting ? 'SUBMITTING...' : 'SUBMIT REVIEW'}
          </button>
          <button
            onClick={onClose}
            className="font-mono text-[11px] uppercase tracking-[0.15em] text-black/40 hover:text-black transition-colors"
          >
            SKIP
          </button>
        </div>
      </div>
    </div>
  )
}
