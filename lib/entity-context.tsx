'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { useSession } from 'next-auth/react'
import { listEntities, type EntitySummary } from '@/lib/api/entities'

// ── Types ──────────────────────────────────────────────────────

export interface Entity {
  id: string
  name: string
  category: string
}

interface EntityContextValue {
  selectedEntity: Entity | null
  setSelectedEntity: (entity: Entity | null) => void
  entities: Entity[]
  loading: boolean
  error: string | null
  refreshEntities: () => Promise<void>
}

const STORAGE_KEY = 'qanun_selected_entity'

// ── Context ────────────────────────────────────────────────────

const EntityContext = createContext<EntityContextValue | null>(null)

// ── Helpers ────────────────────────────────────────────────────

function toEntity(summary: EntitySummary): Entity {
  return {
    id: summary.entity_id,
    name: summary.entity_name,
    category: summary.entity_type,
  }
}

function readStoredEntity(): Entity | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      'id' in parsed &&
      'name' in parsed &&
      'category' in parsed
    ) {
      const obj = parsed as Record<string, unknown>
      if (
        typeof obj.id === 'string' &&
        typeof obj.name === 'string' &&
        typeof obj.category === 'string'
      ) {
        return { id: obj.id, name: obj.name, category: obj.category }
      }
    }
  } catch {
    // ignore corrupt localStorage
  }
  return null
}

function persistEntity(entity: Entity | null) {
  if (typeof window === 'undefined') return
  if (entity) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entity))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

// ── Provider ───────────────────────────────────────────────────

export function EntityProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const token =
    (session?.user as { accessToken?: string } | undefined)?.accessToken || ''

  const [entities, setEntities] = useState<Entity[]>([])
  const [selectedEntity, setSelectedEntityState] = useState<Entity | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const setSelectedEntity = useCallback((entity: Entity | null) => {
    setSelectedEntityState(entity)
    persistEntity(entity)
  }, [])

  const fetchEntities = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const res = await listEntities(token)
      const mapped = res.entities.map(toEntity)
      setEntities(mapped)

      const stored = readStoredEntity()
      if (stored && mapped.some((e) => e.id === stored.id)) {
        setSelectedEntityState(stored)
      } else if (mapped.length > 0) {
        const first = mapped[0]
        setSelectedEntityState(first)
        persistEntity(first)
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to load entities'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchEntities()
  }, [fetchEntities])

  return (
    <EntityContext.Provider
      value={{ selectedEntity, setSelectedEntity, entities, loading, error, refreshEntities: fetchEntities }}
    >
      {children}
    </EntityContext.Provider>
  )
}

// ── Hook ───────────────────────────────────────────────────────

export function useEntity(): EntityContextValue {
  const ctx = useContext(EntityContext)
  if (!ctx) {
    throw new Error('useEntity must be used within an EntityProvider')
  }
  return ctx
}
