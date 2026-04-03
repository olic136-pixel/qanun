'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useEntity } from '@/lib/entity-context'

// Map raw target_jurisdiction values to short display labels
function jurisdictionLabel(raw: string): string {
  const map: Record<string, string> = {
    ADGM: 'ADGM',
    VARA: 'VARA',
    EL_SALVADOR: 'SV',
    BVI: 'BVI',
    PANAMA: 'PAN',
  }
  return map[raw?.toUpperCase()] ?? raw?.slice(0, 4).toUpperCase() ?? '—'
}

// Dot colour based on completion percentage
function dotColor(pct: number): string {
  if (pct >= 100) return '#059669'   // green — complete
  if (pct > 0)   return '#D97706'   // amber — in progress
  return '#9CA3AF'                    // grey  — not started
}

export function EntityList() {
  const { entities, loading, error, setSelectedEntity } = useEntity()
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
        const dot = active ? '#ffffff' : dotColor(entity.completionPct)
        const jLabel = jurisdictionLabel(entity.jurisdiction)
        const pct = entity.completionPct > 0
          ? `${Math.round(entity.completionPct)}%`
          : null

        return (
          <Link
            key={entity.id}
            href={href}
            onClick={() => setSelectedEntity(entity)}
            className={`flex items-center gap-2 w-full px-2 py-2.5
                        font-mono text-[10px] uppercase tracking-[0.08em]
                        transition-all duration-150 ${
              active
                ? 'bg-black text-white'
                : 'text-black/55 hover:text-black hover:bg-black/[0.04]'
            }`}
          >
            {/* Status dot */}
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: dot }}
            />

            {/* Entity name */}
            <span className="truncate flex-1 min-w-0">{entity.name}</span>

            {/* Jurisdiction badge */}
            {jLabel && (
              <span className={`shrink-0 text-[9px] px-1 py-0.5 leading-none border ${
                active
                  ? 'border-white/30 text-white/70'
                  : 'border-black/15 text-black/35'
              }`}>
                {jLabel}
              </span>
            )}

            {/* Readiness % */}
            {pct && (
              <span className={`shrink-0 text-[9px] tabular-nums leading-none ${
                active ? 'text-white/70' : 'text-black/35'
              }`}>
                {pct}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}
