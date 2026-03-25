const LAYER_CONFIG = {
  0: { label: 'Universal', abbr: 'FATF', tw: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500',
       title: 'FATF basis — portable to all FATF member jurisdictions' },
  1: { label: 'UAE Regional', abbr: 'UAE', tw: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500',
       title: 'UAE Federal Law basis — portable across ADGM, DIFC, VARA' },
  2: { label: 'ADGM', abbr: 'ADGM', tw: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500',
       title: 'FSRA rulebook — ADGM jurisdiction only as-is' },
  3: { label: 'Category', abbr: 'Cat', tw: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500',
       title: 'Entity category specific — requires adaptation' },
  4: { label: 'Entity', abbr: 'Ent', tw: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500',
       title: 'Entity-locked — must be generated fresh' },
} as const

interface Props {
  layer: number
  showLabel?: boolean
  size?: 'sm' | 'md'
}

export function PortabilityBadge({ layer, showLabel = true, size = 'md' }: Props) {
  const config = LAYER_CONFIG[layer as keyof typeof LAYER_CONFIG] ?? LAYER_CONFIG[2]
  const px = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'

  return (
    <span
      title={config.title}
      className={`inline-flex items-center gap-1 rounded border font-semibold tracking-wide whitespace-nowrap cursor-help ${config.tw} ${px}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
      {showLabel ? `L${layer} ${config.label}` : `L${layer}`}
    </span>
  )
}
