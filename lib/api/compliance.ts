import { apiFetch } from './client'

// ── Types ──────────────────────────────────────────────────────

export interface ClassificationRequest {
  business_description: string
  intended_clients?: string[] | null
  intended_activities?: string[] | null
  has_retail_clients?: boolean | null
  manages_client_assets?: boolean | null
  is_fund_manager?: boolean | null
  involves_virtual_assets?: boolean | null
  islamic_finance?: boolean | null
  has_existing_licence?: boolean | null
  existing_jurisdiction?: string | null
  entity_type_hint?: string | null
}

export interface DocumentManifestItem {
  doc_type: string
  display_name?: string
  mandatory: boolean
  corpus_basis?: string[]
  notes?: string
  conditional_note?: string
}

export interface ThresholdCondition {
  condition: string
  description: string
  corpus_basis: string
  met_by: string
}

export interface RedFlag {
  flag: string
  severity: 'high' | 'medium' | 'low'
  description: string
}

export interface ClassificationSession {
  session_id: string
  status: 'pending' | 'classifying' | 'complete' | 'failed'
  recommended_category?: string | null
  category_confidence?: number | null
  alternative_category?: string | null
  regulated_activities?: string[] | null
  document_manifest?: DocumentManifestItem[] | null
  threshold_conditions?: ThresholdCondition[] | null
  red_flags?: RedFlag[] | null
  special_considerations?: string[] | null
  classification_reasoning?: string | null
  entity_config_draft?: Record<string, unknown> | null
  error_message?: string | null
  created_at?: string | null
  completed_at?: string | null
}

export interface ClassificationHistoryItem {
  session_id: string
  status: string
  recommended_category?: string | null
  category_confidence?: number | null
  created_at?: string | null
  completed_at?: string | null
}

// ── API Functions ──────────────────────────────────────────────

export const classifyBusinessModel = (
  request: ClassificationRequest,
  token: string
) =>
  apiFetch<{ session_id: string; status: string }>('/api/classify', {
    method: 'POST',
    body: JSON.stringify(request),
    token,
  })

export const getClassificationResult = (sessionId: string, token: string) =>
  apiFetch<ClassificationSession>(`/api/classify/${sessionId}`, { token })

export const getClassificationManifest = (sessionId: string, token: string) =>
  apiFetch<{
    session_id: string
    recommended_category: string
    document_manifest: DocumentManifestItem[]
    entity_config_draft: Record<string, unknown>
    regulated_activities: string[]
    threshold_conditions: ThresholdCondition[]
  }>(`/api/classify/${sessionId}/manifest`, { token })

export const listClassificationHistory = (token: string) =>
  apiFetch<ClassificationHistoryItem[]>('/api/classify/history', { token })
