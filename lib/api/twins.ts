import { apiFetch } from './client'

// ── Product Twins (existing) ─────────────────────────────────

export interface TwinSummary {
  twin_id: string
  product_name: string
  product_description: string
  jurisdictions: string[]
  status: 'clear' | 'alert' | 'archived'
  last_assessed_at: string | null
}

export const getProductTwins = (token: string) =>
  apiFetch<{ twins: TwinSummary[]; total: number }>('/api/twins', { token })

export const assessTwin = (twinId: string, token: string) =>
  apiFetch<{ assessment_id: string }>(
    `/api/twins/${twinId}/assess`,
    { method: 'POST', body: JSON.stringify({}), token }
  )

// ── Document Twins (S7) ──────────────────────────────────────

export interface DocTwin {
  twin_id: string
  job_id: string
  doc_type: string
  display_name: string
  status: 'current' | 'stale' | 'review_required' | 'archived'
  active_alert_count: number
  created_at: string | null
  last_checked_at: string | null
  output_path: string | null
}

export interface DocAlert {
  alert_id: string
  alert_type: string
  severity: 'high' | 'medium' | 'low'
  provision_ref: string | null
  old_version: string | null
  new_version: string | null
  description: string
  status: 'open' | 'acknowledged' | 'resolved'
  resolution_notes: string | null
  detected_at: string | null
  resolved_at: string | null
}

export interface GapItem {
  doc_type: string
  display_name: string
  twin_id?: string
  job_id?: string
  status?: string
  active_alert_count?: number
  created_at?: string
  last_checked_at?: string
  has_stark_examples?: boolean
  has_waystone_examples?: boolean
  primary_portability_layer?: number
  priority?: number
  progress?: number
}

export interface GapAnalysis {
  entity_id: string
  entity_name: string
  entity_type: string
  total_required: number
  completed_count: number
  stale_count: number
  missing_count: number
  in_progress_count: number
  completion_pct: number
  readiness_status: string
  completed: GapItem[]
  stale: GapItem[]
  missing: GapItem[]
  in_progress: GapItem[]
  analysed_at: string
}

export const getDocTwins = (entityId: string, token: string) =>
  apiFetch<{ entity_id: string; twins: DocTwin[]; total: number }>(
    `/api/twins/${entityId}`,
    { token }
  )

export const getDocTwinAlerts = (
  twinId: string,
  token: string,
  status?: string
) => {
  const q = status ? `?status=${status}` : ''
  return apiFetch<{ twin_id: string; alerts: DocAlert[]; total: number; open: number }>(
    `/api/twins/${twinId}/alerts${q}`,
    { token }
  )
}

export const refreshDocTwin = (twinId: string, token: string) =>
  apiFetch(`/api/twins/${twinId}/refresh`, { method: 'POST', token })

export const resolveDocAlert = (
  alertId: string,
  notes: string,
  token: string
) =>
  apiFetch(`/api/twins/alerts/${alertId}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ resolution_notes: notes }),
    token,
  })

export const getGapAnalysis = (entityId: string, token: string) =>
  apiFetch<GapAnalysis>(`/api/gap/${entityId}`, { token })

// ── Methodology (S9) ─────────────────────────────────────────

export interface MethodologyNote {
  doc_type: string
  methodology_type: string
  analytical_pattern: string
  primary_provisions: string[]
  section_output_requirements: { section_id: string; requirement: string }[]
  fatal_failures: string[]
  material_failures: string[]
  consumes_from: string[]
  provides_to: string[]
  absent_from_stark_corpus: boolean
  effective_date_note: string
  corpus_verified_twice: boolean
  last_verified: string
}

export interface ConsistencyResult {
  entity_id: string
  documents_checked: number
  consistency_issues: {
    doc_type: string
    issue_type: string
    severity: string
    description: string
  }[]
  issues_count: number
  is_consistent: boolean
}

export const getMethodology = (docType: string, token: string) =>
  apiFetch<MethodologyNote>(`/api/methodology/${docType}`, { token })

export const getConsistencyCheck = (entityId: string, token: string) =>
  apiFetch<ConsistencyResult>(`/api/consistency/${entityId}`, { token })
