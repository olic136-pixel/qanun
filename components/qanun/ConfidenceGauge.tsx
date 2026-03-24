'use client'

interface ConfidenceGaugeProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

function getColour(s: number): string {
  if (s < 0.30) return '#991B1B'
  if (s < 0.60) return '#C4922A'
  if (s < 0.80) return '#1A5FA8'
  return '#0F7A5F'
}

function getLabel(s: number): string {
  if (s < 0.30) return 'Early stage'
  if (s < 0.60) return 'Developing'
  if (s < 0.80) return 'Advanced'
  return 'Research grade'
}

export default function ConfidenceGauge({
  score,
  size = 'md',
  className = '',
}: ConfidenceGaugeProps) {
  const clamped = Math.min(1, Math.max(0, score))
  const pct = Math.round(clamped * 100)
  const colour = getColour(clamped)
  const label = getLabel(clamped)

  const barHeight = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-2.5' : 'h-2'

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center gap-2">
        <div className={`flex-1 rounded-full ${barHeight} overflow-hidden`} style={{ backgroundColor: `${colour}26` }}>
          <div
            className={`${barHeight} rounded-full transition-all duration-300`}
            style={{ width: `${pct}%`, backgroundColor: colour }}
          />
        </div>
        <span
          className={`font-semibold tabular-nums shrink-0 ${
            size === 'sm' ? 'text-[11px]' : 'text-[13px]'
          }`}
          style={{ color: colour }}
        >
          {pct}%
        </span>
      </div>
      {size !== 'sm' && (
        <p
          className={`mt-1 font-medium ${size === 'lg' ? 'text-[13px]' : 'text-[12px]'}`}
          style={{ color: colour }}
        >
          {label}
        </p>
      )}
    </div>
  )
}
