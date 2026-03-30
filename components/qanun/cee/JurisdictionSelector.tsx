'use client'

import { Building2, Globe, MapPin } from 'lucide-react'

export interface JurisdictionOption {
  code: string
  label: string
  regulator: string
  description: string
}

const JURISDICTIONS: JurisdictionOption[] = [
  {
    code: 'ADGM',
    label: 'ADGM / FSRA',
    regulator: 'Financial Services Regulatory Authority',
    description: 'Abu Dhabi — fund managers, investment firms, broker-dealers',
  },
  {
    code: 'VARA',
    label: 'VARA — Dubai',
    regulator: 'Virtual Assets Regulatory Authority',
    description: 'Dubai — virtual asset service providers',
  },
  {
    code: 'EL_SALVADOR',
    label: 'El Salvador — CNAD',
    regulator: 'Comisión Nacional de Activos Digitales',
    description: 'El Salvador — digital asset service providers (DASP)',
  },
]

const ICONS = [Building2, Globe, MapPin]

interface Props {
  selected: string
  onSelect: (code: string) => void
  locked: boolean
}

export function JurisdictionSelector({ selected, onSelect, locked }: Props) {
  return (
    <div className="flex flex-col gap-2 mb-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#6B7280]">
        Select jurisdiction
      </p>
      <div className="flex gap-2">
        {JURISDICTIONS.map((j, i) => {
          const Icon = ICONS[i]
          const isSelected = selected === j.code
          const isDisabled = locked && !isSelected
          return (
            <button
              key={j.code}
              onClick={() => !locked && onSelect(j.code)}
              disabled={isDisabled}
              title={locked ? 'Jurisdiction locked — restart to change' : j.description}
              className={`flex-1 text-left p-3 rounded-xl border transition-all duration-150 ${
                isSelected
                  ? 'bg-[#0B1829] border-[#0B1829] text-white'
                  : locked
                    ? 'border-[#E8EBF0] text-[#9CA3AF] cursor-not-allowed opacity-40 bg-white'
                    : 'border-[#E8EBF0] text-[#0B1829] hover:border-[#0B1829] bg-white cursor-pointer'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={12} strokeWidth={1.5} className={isSelected ? 'text-[#C4922A]' : 'text-[#6B7280]'} />
                <span className="text-[12px] font-semibold">{j.label}</span>
              </div>
              <p className={`text-[10px] leading-relaxed ${isSelected ? 'text-white/70' : 'text-[#9CA3AF]'}`}>
                {j.description}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
