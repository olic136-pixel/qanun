import { apiFetch } from './client'

// ── Entity types ──────────────────────────────────────────────

export interface EntitySummary {
  entity_id: string
  entity_name: string
  entity_type: string
  fsp_status: string
  target_jurisdiction: string
  permitted_activities: string[]
  is_fund_manager: boolean
  completion_pct: number
  readiness_status: string
  total_required: number
  completed_count: number
}

export interface EntityProfile {
  primary_jurisdictions?: string[]
  client_composition?: string
  aum_range?: string
  has_foreign_branches?: boolean
  pep_exposure?: string
  high_risk_jurisdiction_exposure?: string
  key_products?: string[]
  prime_broker?: string
  custodian?: string
  year_established?: number
  staff_count_range?: string
}

export interface EntityProfileUpdatePayload {
  mlro_name?: string
  compliance_name?: string
  seo_name?: string
  licence_number?: string
  registration_number?: string
  primary_jurisdictions?: string[]
  client_composition?: string
  aum_range?: string
  has_foreign_branches?: boolean
  pep_exposure?: string
  high_risk_jurisdiction_exposure?: string
  key_products?: string[]
  prime_broker?: string
  custodian?: string
  year_established?: number
  staff_count_range?: string
}

export interface CreateEntityPayload {
  entity_name: string
  entity_type: string
  permitted_activities: string[]
  is_fund_manager?: boolean
  has_retail_clients?: boolean
  mlro_name?: string
  compliance_name?: string
  seo_name?: string
  target_jurisdiction?: string
}

export interface DocumentStatus {
  doc_type: string
  display_name: string
  tier: 1 | 2 | 3
  status: 'complete' | 'review_required' | 'running' | 'queued' | 'not_started' | 'failed' | 'skipped'
  twin_id?: string
  job_id?: string
  progress?: number
  sections_drafted?: number
  total_sections?: number
  active_alert_count?: number
  output_filename?: string
  created_at?: string
  error?: string
}

export interface PackageStatus {
  entity_id: string
  package_id: string | null
  package_status: string | null
  overall_status: string
  total_documents: number
  complete_count: number
  running_count: number
  failed_count: number
  completion_pct: number
  documents: DocumentStatus[]
  consistency_result: Record<string, unknown> | null
}

// ── API Functions ──────────────────────────────────────────────

export const listEntities = (token: string) =>
  apiFetch<{ entities: EntitySummary[]; total: number }>('/api/entities', { token })

export const getEntity = (entityId: string, token: string) =>
  apiFetch<EntitySummary & { gap_analysis: Record<string, unknown>; mlro_name: string; compliance_name: string; seo_name: string; entity_profile: EntityProfile }>(
    `/api/entities/${entityId}`, { token }
  )

export const updateEntityProfile = (entityId: string, payload: EntityProfileUpdatePayload, token: string) =>
  apiFetch<{ entity_id: string; entity_profile: EntityProfile }>(
    `/api/entities/${entityId}`,
    { method: 'PATCH', body: JSON.stringify(payload), token }
  )

export const createEntity = (payload: CreateEntityPayload, token: string) =>
  apiFetch<{ entity_id: string; entity_name: string; created: boolean }>(
    '/api/entities', { method: 'POST', body: JSON.stringify(payload), token }
  )

export const getSubmissionStatus = (entityId: string, token: string) =>
  apiFetch<PackageStatus>(`/api/submission/${entityId}/status`, { token })

export const startSubmissionPackage = (entityId: string, token: string) =>
  apiFetch<{ package_id: string; status: string }>(
    `/api/submission/${entityId}/start`,
    { method: 'POST', body: JSON.stringify({ target_jurisdiction: 'ADGM', skip_existing: true }), token }
  )

export function getReportUrl(entityId: string, token: string): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.qanun.io'
  return `${base}/api/submission/${entityId}/report?token=${encodeURIComponent(token)}`
}

export function getExportUrl(entityId: string, token: string): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.qanun.io'
  return `${base}/api/submission/${entityId}/export?token=${encodeURIComponent(token)}`
}

// ── Entity Logo ──────────────────────────────────────────────

export function getEntityLogoUrl(entityId: string, token: string): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.qanun.io'
  return `${base}/api/entities/${entityId}/logo?token=${encodeURIComponent(token)}`
}

export async function uploadEntityLogo(entityId: string, file: File, token: string): Promise<{ status: string; logo_path: string }> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.qanun.io'
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${base}/api/entities/${entityId}/logo`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }))
    throw new Error(err.detail || 'Upload failed')
  }
  return res.json()
}

export async function deleteEntityLogo(entityId: string, token: string): Promise<void> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.qanun.io'
  const res = await fetch(`${base}/api/entities/${entityId}/logo`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok && res.status !== 404) {
    throw new Error('Failed to delete logo')
  }
}
