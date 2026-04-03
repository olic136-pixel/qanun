import { apiFetch } from './client'

// ── Types ─────────────────────────────────────────────────────

export interface JurisdictionContext {
  jurisdiction_code: string
  context_document: string
  section_count: number
  cached: boolean
  assembled_at: string
}

export interface EntitySetupSession {
  session_id: string
  jurisdiction_code: string
  confirmed_fields: Record<string, unknown>
  conversation_summary: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface EntitySetupSessionRequest {
  session_id?: string
  jurisdiction_code: string
  confirmed_fields?: Record<string, unknown>
  conversation_summary?: string
  status?: string
}

export interface EntityValidationRequest {
  jurisdiction_code: string
  licence_category: string
  entity_name: string
  permitted_activities: string[]
  entity_type: string
  mlro_name?: string
  compliance_name?: string
  seo_name?: string
  jurisdiction_specific?: Record<string, unknown>
  viability_confirmed?: boolean
  alternative_jurisdiction?: string
}

export interface EntityValidationResult {
  validation_passed: boolean
  validation_summary: string
  corpus_citations: string[]
  flags: string[]
  jurisdiction_code: string
  licence_category: string
}

export interface ExtractedEntityFields {
  entity_name: string
  jurisdiction_code: string
  regulatory_status: 'regulated' | 'unregulated' | 'pending_assessment'
  jurisdiction_confirmed: boolean
  licence_category: string | null
  permitted_activities: string[]
  entity_type: string
  mlro_name: string | null
  compliance_name: string | null
  seo_name: string | null
  aum_range: string | null
  jurisdiction_specific: Record<string, unknown>
  recommended_tiers: number[]
  validation_summary: string
  viability_confirmed: boolean
  alternative_jurisdiction: string | null
}

// ── API functions ──────────────────────────────────────────────

export const getJurisdictionContext = (
  code: string,
  token: string
): Promise<JurisdictionContext> =>
  apiFetch<JurisdictionContext>(`/api/corpus/jurisdiction-context/${code}`, { token })

export const createOrUpdateSetupSession = (
  payload: EntitySetupSessionRequest,
  token: string
): Promise<EntitySetupSession> =>
  apiFetch<EntitySetupSession>('/api/entity-setup/session', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  })

export const getSetupSession = (
  sessionId: string,
  token: string
): Promise<EntitySetupSession> =>
  apiFetch<EntitySetupSession>(`/api/entity-setup/session/${sessionId}`, { token })

export const validateEntityExtraction = (
  payload: EntityValidationRequest,
  token: string
): Promise<EntityValidationResult> =>
  apiFetch<EntityValidationResult>('/api/entity-setup/validate', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  })
