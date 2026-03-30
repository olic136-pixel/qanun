'use client'

import { CheckCircle2, AlertTriangle } from 'lucide-react'
import type { EntityValidationResult } from '@/lib/api/entitySetup'

interface Props {
  result: EntityValidationResult
  entityName: string
}

export function ValidationSummary({ result, entityName }: Props) {
  return (
    <div className={`border-2 p-4 mb-4 ${
      result.validation_passed
        ? 'border-[#059669] bg-[#059669]/5'
        : 'border-[#D97706] bg-[#D97706]/5'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        {result.validation_passed
          ? <CheckCircle2 size={16} className="text-[#059669] shrink-0" />
          : <AlertTriangle size={16} className="text-[#D97706] shrink-0" />
        }
        <p className={`text-[13px] font-black uppercase tracking-tighter ${result.validation_passed ? 'text-[#059669]' : 'text-[#D97706]'}`}>
          {result.validation_passed
            ? `${entityName} — validated`
            : 'Validation flagged — review before confirming'
          }
        </p>
      </div>
      <p className="text-[11px] text-black/70 leading-relaxed whitespace-pre-wrap mb-2">
        {result.validation_summary}
      </p>
      {result.corpus_citations.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {result.corpus_citations.map((c, i) => (
            <span key={i} className="text-[10px] font-mono px-1.5 py-0.5 bg-white border border-black/10 text-[#0047FF]">
              {c}
            </span>
          ))}
        </div>
      )}
      {result.flags.length > 0 && (
        <div className="mt-2 space-y-1">
          {result.flags.map((f, i) => (
            <p key={i} className="text-[11px] text-[#D97706]">⚠ {f}</p>
          ))}
        </div>
      )}
    </div>
  )
}
