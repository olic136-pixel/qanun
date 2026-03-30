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
        <p className="font-mono text-[9px] text-black/30 uppercase tracking-[0.2em]">
          Entity profile
        </p>
        {isExtracting && (
          <div className="flex items-center gap-1 text-[10px] text-black/30">
            <Loader2 size={10} className="animate-spin" />
            <span>Extracting…</span>
          </div>
        )}
      </div>

      {!hasAnyField ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border border-dashed border-black/10 flex items-center justify-center mx-auto mb-2">
              <span className="text-black/30 text-xs">Q</span>
            </div>
            <p className="text-[11px] text-black/30 leading-relaxed">
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
              <div key={key} className="flex items-start gap-2 py-1.5 border-b border-black/5">
                <div className="w-3 h-3 rounded-full bg-[#0047FF] flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={8} className="text-white" strokeWidth={3} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[9px] text-black/25 uppercase tracking-[0.15em]">
                    {label}
                  </p>
                  <p className="text-[12px] text-black leading-snug mt-0.5 break-words">
                    {formatValue(key, value)}
                  </p>
                </div>
              </div>
            )
          })}

          {fields.recommended_tiers && fields.recommended_tiers.length > 0 && (
            <div className="mt-2 pt-2 border-t border-black/10">
              <p className="font-mono text-[9px] text-black/25 uppercase tracking-[0.15em] mb-1">
                Recommended tiers
              </p>
              <div className="flex gap-1">
                {fields.recommended_tiers.map((t) => (
                  <span key={t} className="text-[10px] font-semibold px-1.5 py-0.5 bg-black text-white">
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
            <div key={i} className="flex items-start gap-2 p-2 bg-[#D97706]/5 border border-[#D97706]/20">
              <span className="text-[10px] text-[#D97706] leading-relaxed">{flag}</span>
            </div>
          ))}
        </div>
      )}

      {/* Validation summary */}
      {validationSummary && (
        <div className="mt-3 p-3 bg-[#059669]/5 border-l-4 border-[#059669]">
          <p className="font-mono text-[9px] text-[#059669] uppercase tracking-[0.15em] mb-1">
            Validation complete
          </p>
          <p className="text-[10px] text-black/70 leading-relaxed whitespace-pre-wrap">
            {validationSummary}
          </p>
        </div>
      )}
    </div>
  )
}
