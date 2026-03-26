import { apiFetch, ApiError } from './client'

// ── Types ──────────────────────────────────────────────────────

export interface GovernanceProfile {
  profile_id: string
  entity_id: string
  fsra_category: string
  regulatory_stage: string
  created_at: string
  updated_at: string
  summary: GovernanceSummary
  categories: GovernanceCategorySummary[]
}

export interface GovernanceSummary {
  total_applicable: number
  completed: number
  review_due: number
  overdue: number
  pending: number
  phase_gaps: number
}

export interface GovernanceCategorySummary extends GovernanceSummary {
  category: string
}

export interface GapAnalysisItem {
  document_id: string
  name: string
  category: string
  phase_required: string
  status: string
  blocks_count: number
  blocks: string[]
  is_qanun_draftable: number
  is_required_current_phase: number
  priority_rank: number
}

export interface GapAnalysisResponse {
  entity_id: string
  fsra_category: string
  regulatory_stage: string
  total_gaps: number
  phase_gaps: number
  gaps: GapAnalysisItem[]
}

export interface GovernanceAlert {
  id: string
  entity_id: string
  document_id: string
  document_name: string
  rule_changed: string
  change_summary: string
  severity: string
  status: string
  detected_at: string
}

export interface GovernanceAlertsResponse {
  alerts: GovernanceAlert[]
}

export interface GovernanceDocument {
  id: string
  entity_id: string
  document_id: string
  name: string
  category: string
  regulatory_source: string
  owner_role: string
  review_cycle: string
  phase_required: string
  status: string
  is_applicable: number
  is_required_current_phase: number
  is_qanun_draftable: number
  version: number
  last_drafted_at: string | null
  last_uploaded_at: string | null
  last_reviewed_at: string | null
  next_review_due: string | null
  file_path: string | null
  notes: string | null
  folder_path: string
  depends_on: string[]
  referenced_by: string[]
  display_order: number
  description: string
}

export interface GovernanceDocumentsResponse {
  documents: GovernanceDocument[]
}

export interface UpdateDocumentPayload {
  status?: string
  last_reviewed_at?: string
  file_path?: string
  notes?: string
}

export interface CreateProfilePayload {
  fsra_category: string
  regulatory_stage: string
}

export interface CreateProfileResponse {
  profile_id: string
  entity_id: string
  fsra_category: string
  regulatory_stage: string
  documents_total: number
  documents_phase_required: number
}

// ── API Functions ──────────────────────────────────────────────

export const getGovernanceProfile = (entityId: string, token: string) =>
  apiFetch<GovernanceProfile>(`/api/governance/entities/${entityId}/profile`, { token })

export const createGovernanceProfile = (
  entityId: string,
  payload: CreateProfilePayload,
  token: string,
) =>
  apiFetch<CreateProfileResponse>(`/api/governance/entities/${entityId}/profile`, {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  })

export const getGovernanceDocuments = (
  entityId: string,
  token: string,
  params?: { category?: string; status?: string; phase_required?: string },
) => {
  const qs = new URLSearchParams()
  if (params?.category) qs.set('category', params.category)
  if (params?.status) qs.set('status', params.status)
  if (params?.phase_required) qs.set('phase_required', params.phase_required)
  const query = qs.toString()
  return apiFetch<GovernanceDocumentsResponse>(
    `/api/governance/entities/${entityId}/documents${query ? `?${query}` : ''}`,
    { token },
  )
}

export const updateGovernanceDocument = (
  entityId: string,
  documentId: string,
  payload: UpdateDocumentPayload,
  token: string,
) =>
  apiFetch<GovernanceDocument>(
    `/api/governance/entities/${entityId}/documents/${documentId}`,
    { method: 'PATCH', body: JSON.stringify(payload), token },
  )

export const getGapAnalysis = (entityId: string, token: string) =>
  apiFetch<GapAnalysisResponse>(`/api/governance/entities/${entityId}/gap-analysis`, { token })

export const getGovernanceAlerts = (entityId: string, token: string) =>
  apiFetch<GovernanceAlertsResponse>(`/api/governance/entities/${entityId}/alerts`, { token })

export const acknowledgeAlert = (entityId: string, alertId: string, status: string, token: string) =>
  apiFetch<GovernanceAlert>(`/api/governance/entities/${entityId}/alerts/${alertId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
    token,
  })

/**
 * Check whether a governance profile exists for an entity.
 * Returns the profile if found, or null if 404.
 */
export async function checkGovernanceProfile(
  entityId: string,
  token: string,
): Promise<GovernanceProfile | null> {
  try {
    return await getGovernanceProfile(entityId, token)
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null
    throw e
  }
}
