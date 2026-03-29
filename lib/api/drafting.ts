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

export interface PreflightQuestion {
  key: string
  label: string
  question: string
  hint: string
  field_type: 'text' | 'textarea' | 'jurisdiction_multi' | 'aum_select' | 'boolean'
  required: boolean
  options: string[]
  current_value: string | string[] | boolean | null
}

export interface PreflightResponse {
  doc_type: string
  display_name: string
  questions: PreflightQuestion[]
  total_questions: number
  prefilled_count: number
}

export type JobStatusValue =
  | 'created'
  | 'queued'
  | 'running'
  | 'drafted'
  | 'exporting'
  | 'complete'
  | 'export_failed'
  | 'failed'
  | 'not_found'

export interface JobStatus {
  job_id: string
  status: JobStatusValue
  progress: number
  sections_drafted: number
  total_sections: number
  download_url?: string
  output_filename?: string
  unique_citations?: number
  coverage_warnings?: string[]
  completed_at?: string
  error?: string
  phase?: string
  sections_preserved?: boolean
  export_attempts?: number
  retry_action?: 'none' | 're_export' | 'full_redraft' | 'wait' | 'unknown'
  phase_a_completed_at?: string
  exported_at?: string
}

// ── Entity Constants ──────────────────────────────────────────

export const ENTITY_ID = 'tradedarcateg3a-demo-0001'
export const ENTITY_NAME = 'TradeDar Capital Management Ltd'
export const ENTITY_TYPE = 'Category 3C'
export const ENTITY_CATEGORY = 'category_3c'

/** Filter templates to those applicable for the given entity category */
export function getApplicableTemplates(templates: Template[], entityCategory?: string): Template[] {
  const cat = entityCategory || ENTITY_CATEGORY
  return templates.filter((t) => {
    const types = t.applicable_entity_types
    if (!types || types.length === 0) return true
    return types.includes('all') || types.includes(cat)
  })
}

export function filterTemplatesByJurisdiction(
  templates: Template[],
  jurisdiction: string
): Template[] {
  if (jurisdiction === 'ADGM') {
    // All current templates are ADGM — return applicable ones
    return getApplicableTemplates(templates)
  }
  // For VARA and EL_SALVADOR: filter by coverage_rulebooks containing jurisdiction prefix
  // When no VARA/SV templates exist yet, return empty array with a placeholder
  const filtered = templates.filter(t =>
    t.coverage_rulebooks.some(rb =>
      rb.startsWith(jurisdiction === 'VARA' ? 'VARA-' : 'SV-')
    )
  )
  return filtered
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

export const getPreflightQuestions = (
  entityId: string,
  docType: string,
  token: string
) =>
  apiFetch<PreflightResponse>(
    `/api/drafting/preflight/${docType.toLowerCase()}?entity_id=${encodeURIComponent(entityId)}`,
    { token }
  )

export const startDraft = (
  entityId: string,
  docType: string,
  token: string,
  targetJurisdiction: string = 'ADGM',
  entityContext: Record<string, unknown> = {}
) =>
  apiFetch<DraftResponse>('/api/drafting/draft', {
    method: 'POST',
    body: JSON.stringify({
      entity_id: entityId,
      doc_type: docType.toLowerCase(),
      target_jurisdiction: targetJurisdiction,
      entity_context: entityContext,
    }),
    token,
  })

export const getJobStatus = (jobId: string, token: string) =>
  apiFetch<JobStatus>(`/api/drafting/status/${jobId}`, { token })

export function getDownloadUrl(jobId: string, token: string): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.qanun.io'
  return `${base}/api/drafting/download/${jobId}?token=${encodeURIComponent(token)}`
}

export const retryDraft = (jobId: string, token: string) =>
  apiFetch<{
    job_id: string
    action: string
    status: string
    sections_preserved: boolean
    claude_calls_required: number
    message: string
  }>(`/api/drafting/retry/${jobId}`, { method: 'POST', token })

export const exportDraft = (jobId: string, token: string) =>
  apiFetch<{
    job_id: string
    status: string
    claude_calls_required: number
    message: string
  }>(`/api/drafting/export/${jobId}`, { method: 'POST', token })

export const deleteJob = (jobId: string, token: string) =>
  apiFetch<void>(`/api/drafting/jobs/${jobId}`, { method: 'DELETE', token })
