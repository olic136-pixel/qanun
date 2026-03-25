'use client'

import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { useEntity } from '@/lib/entity-context'

export function EntitySelector() {
  const { selectedEntity, setSelectedEntity, entities, loading, error } = useEntity()

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 text-white/50 text-[11px]">
        <Loader2 size={12} className="animate-spin" />
        <span>Loading…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-2 py-1 text-[11px] text-red-400 truncate max-w-[180px]" title={error}>
        Entity error
      </div>
    )
  }

  if (entities.length === 0) {
    return (
      <Link
        href="/compliance/entities/new"
        className="flex items-center gap-1 px-2 py-1 text-[11px] text-[#C4922A] hover:text-[#E0B84D] transition-colors"
      >
        + Add entity
      </Link>
    )
  }

  return (
    <select
      value={selectedEntity?.id ?? ''}
      onChange={(e) => {
        const entity = entities.find((ent) => ent.id === e.target.value)
        setSelectedEntity(entity ?? null)
      }}
      className="bg-white/10 text-white/90 text-[11px] border border-white/[0.15] rounded px-2 py-1 outline-none hover:bg-white/15 focus:border-[#C4922A]/50 transition-colors max-w-[170px] truncate"
    >
      {entities.map((entity) => (
        <option
          key={entity.id}
          value={entity.id}
          className="bg-[#0B1829] text-white"
        >
          {entity.name}
        </option>
      ))}
    </select>
  )
}
