'use client'

import { useState } from 'react'
import { ArrowLeft, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import type { PreflightQuestion } from '@/lib/api/drafting'

interface Props {
  displayName: string
  questions: PreflightQuestion[]
  onSubmit: (answers: Record<string, unknown>) => void
  onBack: () => void
  submitting: boolean
}

const JURISDICTION_OPTIONS = [
  'UAE', 'Saudi Arabia', 'Kuwait', 'Qatar', 'Bahrain', 'Oman',
  'Egypt', 'Jordan', 'UK', 'Switzerland', 'Luxembourg',
  'Cayman Islands', 'BVI', 'Singapore', 'Hong Kong', 'United States',
  'Worldwide (ex-US)', 'Worldwide (inc. US)', 'Other',
]

const AUM_OPTIONS = [
  'Under USD 10m', 'USD 10–50m', 'USD 50–100m',
  'USD 100–500m', 'USD 500m–1bn', 'Over USD 1bn',
]

export function PreDraftQuestionnaire({ displayName, questions, onSubmit, onBack, submitting }: Props) {
  // Initialise state from prefilled values
  const [answers, setAnswers] = useState<Record<string, unknown>>(() => {
    const init: Record<string, unknown> = {}
    for (const q of questions) {
      if (q.current_value !== null && q.current_value !== '' &&
          !(Array.isArray(q.current_value) && q.current_value.length === 0)) {
        init[q.key] = q.current_value
      }
    }
    return init
  })

  // Track which required fields are still empty
  const missingRequired = questions
    .filter((q) => q.required)
    .filter((q) => {
      const v = answers[q.key]
      if (v === undefined || v === null || v === '') return true
      if (Array.isArray(v) && v.length === 0) return true
      return false
    })

  function set(key: string, value: unknown) {
    setAnswers((prev) => ({ ...prev, [key]: value }))
  }

  function toggleMulti(key: string, option: string) {
    const current = (answers[key] as string[]) ?? []
    set(key, current.includes(option)
      ? current.filter((x) => x !== option)
      : [...current, option])
  }

  function handleSubmit() {
    // Only pass non-empty answers — missing ones become [TO BE CONFIRMED] in the draft
    const nonEmpty: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(answers)) {
      if (v !== '' && v !== null && v !== undefined) {
        if (!Array.isArray(v) || v.length > 0) {
          nonEmpty[k] = v
        }
      }
    }
    onSubmit(nonEmpty)
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-5">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 mb-3 transition-colors"
        >
          <ArrowLeft size={12} /> Back to template selection
        </button>
        <h2 className="text-[17px] font-bold text-[#0B1829]">{displayName}</h2>
        <p className="text-[13px] text-gray-500 mt-1">
          Answer the questions below before drafting begins. Your answers are injected directly
          into the document — Claude will not guess or invent facts you do not provide.
        </p>
      </div>

      {missingRequired.length > 0 && (
        <div className="flex items-start gap-2 mb-5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-[12px] text-amber-800">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>
            <strong>{missingRequired.length} required field{missingRequired.length > 1 ? 's' : ''} unanswered.</strong>{' '}
            You can still proceed — those fields will appear as{' '}
            <code className="bg-amber-100 px-1 rounded">[TO BE CONFIRMED BY ENTITY]</code>{' '}
            in the document.
          </span>
        </div>
      )}

      <div className="space-y-5">
        {questions.map((q) => (
          <QuestionField
            key={q.key}
            question={q}
            value={answers[q.key]}
            onChange={(v) => set(q.key, v)}
            onToggleMulti={(opt) => toggleMulti(q.key, opt)}
          />
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-[13px] text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-[13px] font-semibold transition-colors ${
            submitting
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-[#0B1829] text-white hover:bg-[#1D2D44] cursor-pointer'
          }`}
        >
          {submitting ? (
            <><Loader2 size={14} className="animate-spin" /> Starting draft…</>
          ) : (
            <>Start drafting <ArrowRight size={14} /></>
          )}
        </button>
      </div>
    </div>
  )
}

// ── Individual question renderer ─────────────────────────

function QuestionField({
  question: q,
  value,
  onChange,
  onToggleMulti,
}: {
  question: PreflightQuestion
  value: unknown
  onChange: (v: unknown) => void
  onToggleMulti: (opt: string) => void
}) {
  const isEmpty = value === undefined || value === null || value === '' ||
    (Array.isArray(value) && value.length === 0)

  return (
    <div className="bg-white border border-[#E8EBF0] rounded-lg px-4 py-4">
      <div className="flex items-start justify-between mb-1">
        <label className="text-[13px] font-semibold text-[#0B1829] leading-snug">
          {q.question}
          {q.required && <span className="text-red-400 ml-1">*</span>}
        </label>
        {!isEmpty && (
          <span className="text-[10px] text-[#0F7A5F] font-medium ml-3 shrink-0 mt-0.5">
            ✓ answered
          </span>
        )}
      </div>
      <p className="text-[11px] text-gray-400 mb-3">{q.hint}</p>

      {q.field_type === 'text' && (
        <input
          type="text"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Leave blank to use [TO BE CONFIRMED BY ENTITY]"
          className="w-full text-[13px] px-3 py-2 border border-[#E8EBF0] rounded focus:outline-none focus:border-[#1A5FA8] bg-white"
        />
      )}

      {q.field_type === 'textarea' && (
        <textarea
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          placeholder="Leave blank to use [TO BE CONFIRMED BY ENTITY]"
          className="w-full text-[13px] px-3 py-2 border border-[#E8EBF0] rounded focus:outline-none focus:border-[#1A5FA8] bg-white resize-none"
        />
      )}

      {q.field_type === 'jurisdiction_multi' && (
        <div className="flex flex-wrap gap-1.5">
          {(q.options.length ? q.options : JURISDICTION_OPTIONS).map((opt) => {
            const selected = ((value as string[]) ?? []).includes(opt)
            return (
              <button
                key={opt}
                onClick={() => onToggleMulti(opt)}
                className={`text-[11px] px-2 py-1 rounded-full border transition-colors cursor-pointer ${
                  selected
                    ? 'border-[#1A5FA8] bg-blue-50 text-[#1A5FA8] font-medium'
                    : 'border-[#E8EBF0] text-gray-500 hover:border-gray-300'
                }`}
              >
                {opt}
              </button>
            )
          })}
        </div>
      )}

      {q.field_type === 'aum_select' && (
        <div className="flex flex-wrap gap-2">
          {(q.options.length ? q.options : AUM_OPTIONS).map((opt) => (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className={`text-[12px] px-3 py-1.5 rounded border transition-colors cursor-pointer ${
                value === opt
                  ? 'border-[#1A5FA8] bg-blue-50 text-[#1A5FA8] font-medium'
                  : 'border-[#E8EBF0] text-gray-500 hover:border-gray-300'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {q.field_type === 'boolean' && (
        <div className="flex gap-3">
          {[{ label: 'Yes', val: true }, { label: 'No', val: false }].map(({ label, val }) => (
            <button
              key={label}
              onClick={() => onChange(val)}
              className={`px-4 py-2 rounded border text-[12px] font-medium transition-colors cursor-pointer ${
                value === val
                  ? 'border-[#1A5FA8] bg-blue-50 text-[#1A5FA8]'
                  : 'border-[#E8EBF0] text-gray-500 hover:border-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
          {value !== undefined && value !== null && (
            <button
              onClick={() => onChange(undefined)}
              className="text-[11px] text-gray-400 hover:text-gray-600 underline cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  )
}
