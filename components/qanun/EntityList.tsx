'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useEntity } from '@/lib/entity-context'

export function EntityList() {
  const { entities, loading, error } = useEntity()
  const pathname = usePathname()

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-1 py-1.5
                      font-mono text-[10px] text-black/25 uppercase tracking-[0.15em]">
        <Loader2 size={10} className="animate-spin" />
        <span>Loading…</span>
      </div>
    )
  }

  if (error) {
    return (
      <p className="px-1 py-1 font-mono text-[10px] text-black/25 uppercase tracking-[0.15em]">
        Error loading entities
      </p>
    )
  }

  if (entities.length === 0) {
    return (
      <Link
        href="/compliance/entities/new"
        className="flex items-center gap-1.5 px-1 py-2
                   font-mono text-[10px] text-[#0047FF] hover:text-black
                   uppercase tracking-[0.15em] transition-colors"
      >
        + Add entity
      </Link>
    )
  }

  return (
    <div className="space-y-0">
      {entities.map((entity) => {
        const href = `/entity/${entity.id}`
        const active = pathname === href || pathname.startsWith(href + '/')
        const dotClass = 'bg-[#0047FF]'

        return (
          <Link
            key={entity.id}
            href={href}
            className={`flex items-center gap-2.5 w-full px-2 py-2.5
                        font-mono text-[11px] uppercase tracking-[0.08em]
                        transition-all duration-150 group ${
              active
                ? 'bg-black text-white'
                : 'text-black/55 hover:text-black hover:bg-black/[0.04]'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              active ? 'bg-white' : dotClass
            }`} />
            <span className="truncate">{entity.name}</span>
          </Link>
        )
      })}
    </div>
  )
}
