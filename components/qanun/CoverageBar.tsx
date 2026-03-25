interface Props {
  percentage: number
  warnings?: string[]
  showLabel?: boolean
}

export function CoverageBar({ percentage, warnings = [], showLabel = true }: Props) {
  const color =
    percentage >= 90 ? 'bg-emerald-500'
    : percentage >= 70 ? 'bg-amber-500'
    : 'bg-red-500'

  const labelColor =
    percentage >= 90 ? 'text-emerald-600'
    : percentage >= 70 ? 'text-amber-600'
    : 'text-red-600'

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
      {showLabel && (
        <span className={`text-xs font-semibold min-w-[36px] text-right ${labelColor}`}>
          {Math.round(percentage)}%
        </span>
      )}
      {warnings.length > 0 && (
        <span
          title={warnings.join('\n')}
          className="text-[11px] text-amber-600 cursor-help shrink-0"
        >
          ⚠ {warnings.length}
        </span>
      )}
    </div>
  )
}
