import { cn } from '@/lib/utils'

type WordmarkSize = 'lg' | 'md' | 'sm'

interface QanunWordmarkProps {
  size?: WordmarkSize
  dark?: boolean
  className?: string
}

const config: Record<WordmarkSize, { name: string }> = {
  lg: { name: 'text-5xl' },
  md: { name: 'text-[18px]' },
  sm: { name: 'text-[15px]' },
}

export function QanunWordmark({ size = 'md', dark = false, className }: QanunWordmarkProps) {
  const s = config[size]
  return (
    <span
      className={cn(
        s.name,
        'font-black uppercase tracking-tighter leading-none',
        dark ? 'text-white' : 'text-black',
        className
      )}
    >
      QANUN
    </span>
  )
}
