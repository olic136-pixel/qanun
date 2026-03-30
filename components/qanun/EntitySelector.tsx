'use client'

import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { useEntity } from '@/lib/entity-context'

export function EntitySelector() {
  const { selectedEntity, setSelectedEntity, entities, loading, error } = useEntity()

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 font-mono text-[10px] text-black/30 uppercase tracking-[0.15em]">
        <Loader2 size={12} className="animate-spin" />
        <span>Loading…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-2 py-1 text-[10px] text-black/40 truncate max-w-[148px]" title={error}>
        Entity error
      </div>
    )
  }

  if (entities.length === 0) {
    return (
      <Link
        href="/compliance/entities/new"
        className="flex items-center gap-1 px-2 py-1 font-mono text-[10px] text-[#0047FF] hover:text-black uppercase tracking-[0.15em] transition-colors"
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
      className="bg-white text-black text-[10px] font-mono border border-black/10 rounded-none px-2 py-1 outline-none focus:border-[#0047FF] transition-colors max-w-[148px] truncate"
    >
      {entities.map((entity) => (
        <option
          key={entity.id}
          value={entity.id}
          className="bg-white text-black"
        >
          {entity.name}
        </option>
      ))}
    </select>
  )
}
