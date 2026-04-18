'use client'

import { Settings2, Check, X, AlertTriangle } from 'lucide-react'

type ControlTestStatus = 'not_configured' | 'pass' | 'fail' | 'partial'

interface ControlTestResultProps {
  status: ControlTestStatus
  message?: string
  control_id?: string | null
}

export function ControlTestResult({ status, message, control_id }: ControlTestResultProps) {
  const config: Record<ControlTestStatus, { icon: React.ElementType; label: string; tw: string }> = {
    not_configured: {
      icon: Settings2,
      label: 'Control testing — Monitor Pro',
      tw: 'bg-gray-100 text-gray-500 border-gray-200',
    },
    pass: {
      icon: Check,
      label: 'Control passing',
      tw: 'bg-[#EAF4F1] text-[#0F7A5F] border-[#0F7A5F]/20',
    },
    fail: {
      icon: X,
      label: 'Control failed',
      tw: 'bg-red-50 text-red-700 border-red-200',
    },
    partial: {
      icon: AlertTriangle,
      label: 'Partial',
      tw: 'bg-amber-50 text-amber-700 border-amber-200',
    },
  }

  const cfg = config[status]
  const Icon = cfg.icon
  const label = message ?? cfg.label

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${cfg.tw}`}
      title={control_id ? `Control: ${control_id}` : undefined}
    >
      <Icon size={10} strokeWidth={1.5} />
      {label}
    </span>
  )
}

export default ControlTestResult
