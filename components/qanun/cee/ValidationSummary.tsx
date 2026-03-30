'use client'

import { CheckCircle2, AlertTriangle } from 'lucide-react'
import type { EntityValidationResult } from '@/lib/api/entitySetup'

interface Props {
  result: EntityValidationResult
  entityName: string
}

export function ValidationSummary({ result, entityName }: Props) {
  return (
    <div className={`rounded-xl border-2 p-4 mb-4 ${
      result.validation_passed
        ? 'border-[#0F7A5F] bg-[#EAF4F1]'
        : 'border-[#C4922A] bg-amber-50'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        {result.validation_passed
          ? <CheckCircle2 size={16} className="text-[#0F7A5F] shrink-0" />
          : <AlertTriangle size={16} className="text-[#C4922A] shrink-0" />
        }
        <p className={`text-[13px] font-semibold ${result.validation_passed ? 'text-[#0F7A5F]' : 'text-[#C4922A]'}`}>
          {result.validation_passed
            ? `${entityName} — validated`
            : 'Validation flagged — review before confirming'
          }
        </p>
      </div>
      <p className="text-[11px] text-[#1D2D44] leading-relaxed whitespace-pre-wrap mb-2">
        {result.validation_summary}
      </p>
      {result.corpus_citations.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {result.corpus_citations.map((c, i) => (
            <span key={i} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-[#E8EBF0] text-[#1A5FA8]">
              {c}
            </span>
          ))}
        </div>
      )}
      {result.flags.length > 0 && (
        <div className="mt-2 space-y-1">
          {result.flags.map((f, i) => (
            <p key={i} className="text-[11px] text-[#C4922A]">⚠ {f}</p>
          ))}
        </div>
      )}
    </div>
  )
}
