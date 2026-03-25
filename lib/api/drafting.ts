import { apiFetch } from './client'

// ── Types ──────────────────────────────────────────────────────

export interface Template {
  doc_type: string
  display_name: string
  description: string
  applicable_entity_types: string[]
  section_count: number
  coverage_rulebooks: string[]
  primary_portability_layer: number
  has_stark_examples: boolean
  has_waystone_examples: boolean
  render_mode_breakdown: Record<string, number>
  section_portability_breakdown: Record<string, number>
}

export interface TemplatesResponse {
  templates: Template[]
  total: number
  waystone_grounded: string[]
  stark_grounded: string[]
  corpus_only: string[]
}

export interface ValidateResponse {
  valid: boolean
  applicable: boolean
  entity_name: string
  entity_type: string
  doc_type: string
  display_name: string
  has_stark_examples: boolean
  has_waystone_examples: boolean
  active_section_count: number
  sections: {
    section_id: string
    title: string
    portability_layer: number
    render_mode: string
    mandatory: boolean
  }[]
  error?: string
}

export interface DraftResponse {
  job_id: string
  status: string
  message: string
  poll_url: string
}

export interface JobStatus {
  job_id: string
  status: 'queued' | 'running' | 'complete' | 'failed' | 'not_found'
  progress: number
  sections_drafted: number
  total_sections: number
  download_url?: string
  output_filename?: string
  unique_citations?: number
  coverage_warnings?: string[]
  completed_at?: string
  error?: string
}

// ── API Functions ──────────────────────────────────────────────

export const getTemplates = (token: string) =>
  apiFetch<TemplatesResponse>('/api/drafting/templates', { token })

export const validateDraftRequest = (
  entityId: string,
  docType: string,
  token: string
) =>
  apiFetch<ValidateResponse>('/api/drafting/validate', {
    method: 'POST',
    body: JSON.stringify({ entity_id: entityId, doc_type: docType.toLowerCase() }),
    token,
  })

export const startDraft = (
  entityId: string,
  docType: string,
  token: string,
  targetJurisdiction: string = 'ADGM'
) =>
  apiFetch<DraftResponse>('/api/drafting/draft', {
    method: 'POST',
    body: JSON.stringify({
      entity_id: entityId,
      doc_type: docType.toLowerCase(),
      target_jurisdiction: targetJurisdiction,
    }),
    token,
  })

export const getJobStatus = (jobId: string, token: string) =>
  apiFetch<JobStatus>(`/api/drafting/status/${jobId}`, { token })

export function getDownloadUrl(jobId: string, token: string): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.qanun.io'
  return `${base}/api/drafting/download/${jobId}?token=${encodeURIComponent(token)}`
}
