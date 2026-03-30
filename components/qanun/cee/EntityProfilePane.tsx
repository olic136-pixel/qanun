'use client'

import { Check, Loader2 } from 'lucide-react'
import type { ExtractedEntityFields } from '@/lib/api/entitySetup'

interface Props {
  fields: Partial<ExtractedEntityFields>
  validationSummary: string | null
  flags: string[]
  isExtracting: boolean
}

const FIELD_LABELS: Array<{ key: keyof ExtractedEntityFields; label: string }> = [
  { key: 'entity_name', label: 'Entity name' },
  { key: 'jurisdiction_code', label: 'Jurisdiction' },
  { key: 'licence_category', label: 'Licence category' },
  { key: 'permitted_activities', label: 'Activities' },
  { key: 'entity_type', label: 'Entity type' },
  { key: 'mlro_name', label: 'MLRO' },
  { key: 'compliance_name', label: 'Compliance Officer' },
  { key: 'seo_name', label: 'Senior Executive Officer' },
  { key: 'aum_range', label: 'AUM range' },
]

function formatValue(key: keyof ExtractedEntityFields, value: unknown): string {
  if (Array.isArray(value)) return value.join(', ')
  if (value === null || value === undefined) return ''
  return String(value)
}

export function EntityProfilePane({ fields, validationSummary, flags, isExtracting }: Props) {
  const hasAnyField = FIELD_LABELS.some(({ key }) => {
    const v = fields[key]
    return v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)
  })

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6B7280]">
          Entity profile
        </p>
        {isExtracting && (
          <div className="flex items-center gap-1 text-[10px] text-[#6B7280]">
            <Loader2 size={10} className="animate-spin" />
            <span>Extracting…</span>
          </div>
        )}
      </div>

      {!hasAnyField ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 rounded-full border border-dashed border-[#E8EBF0] flex items-center justify-center mx-auto mb-2">
              <span className="text-[#9CA3AF] text-xs">Q</span>
            </div>
            <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
              Listening to your answers…<br />Fields will appear here as confirmed.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-1.5">
          {FIELD_LABELS.map(({ key, label }) => {
            const value = fields[key]
            const hasValue = value !== null && value !== undefined && value !== '' &&
              !(Array.isArray(value) && value.length === 0)
            if (!hasValue) return null
            return (
              <div key={key} className="flex items-start gap-2 py-1.5 border-b border-[#F5F7FA]">
                <div className="w-3 h-3 rounded-full bg-[#0F7A5F] flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={8} className="text-white" strokeWidth={3} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
                    {label}
                  </p>
                  <p className="text-[12px] text-[#1D2D44] leading-snug mt-0.5 break-words">
                    {formatValue(key, value)}
                  </p>
                </div>
              </div>
            )
          })}

          {fields.recommended_tiers && fields.recommended_tiers.length > 0 && (
            <div className="mt-2 pt-2 border-t border-[#E8EBF0]">
              <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF] mb-1">
                Recommended tiers
              </p>
              <div className="flex gap-1">
                {fields.recommended_tiers.map((t) => (
                  <span key={t} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#0B1829] text-white">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Flags */}
      {flags.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {flags.map((flag, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
              <span className="text-[10px] text-amber-700 leading-relaxed">{flag}</span>
            </div>
          ))}
        </div>
      )}

      {/* Validation summary */}
      {validationSummary && (
        <div className="mt-3 p-3 rounded-lg bg-[#EAF4F1] border-l-4 border-[#0F7A5F]">
          <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#0F7A5F] mb-1">
            Validation complete
          </p>
          <p className="text-[10px] text-[#1D2D44] leading-relaxed whitespace-pre-wrap">
            {validationSummary}
          </p>
        </div>
      )}
    </div>
  )
}
