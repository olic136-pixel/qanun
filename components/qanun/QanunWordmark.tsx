import { cn } from '@/lib/utils'

type WordmarkSize = 'lg' | 'md' | 'sm'

interface QanunWordmarkProps {
  size?: WordmarkSize
  dark?: boolean
  className?: string
}

const config: Record<WordmarkSize, { name: string; pron: string; gap: string }> = {
  lg: { name: 'text-5xl', pron: 'text-base', gap: 'mt-1' },
  md: { name: 'text-[18px]', pron: 'text-[10px]', gap: 'mt-0.5' },
  sm: { name: 'text-[15px]', pron: 'text-[9px]', gap: 'mt-0' },
}

export function QanunWordmark({ size = 'md', dark = false, className }: QanunWordmarkProps) {
  const s = config[size]
  return (
    <div className={cn('flex flex-col leading-none', className)}>
      <span
        className={cn(
          s.name,
          'font-medium tracking-[0.04em]',
          dark ? 'text-white' : 'text-[#111827]'
        )}
      >
        QANUN
      </span>
      <span
        className={cn(
          'font-mono',
          s.pron,
          s.gap,
          dark ? 'text-white/40' : 'text-[#6B7280]'
        )}
      >
        {'/k\u0251\u02D0\u02C8nu\u02D0n/'}
      </span>
    </div>
  )
}
