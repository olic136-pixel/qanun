import { apiFetch } from './client'

// ── Types ──────────────────────────────────────────────────────

export type Jurisdiction = 'ADGM' | 'VARA'

export interface CeeQuestion {
  id: string
  prompt: string
  helper_text?: string | null
  answer?: string | null
}

export interface GiraPreflightResponse {
  entity_id: string
  jurisdiction: Jurisdiction
  completion_pct: number
  ready_to_generate: boolean
  blocking_fields: { field: string; label: string }[]
  optional_missing: { field: string; label: string }[]
  cee_questions: CeeQuestion[]
}

export type GiraJobStatus =
  | 'queued'
  | 'running'
  | 'exported'
  | 'stub_pending_phase4'
  | 'failed'

export interface GiraJobStatusResponse {
  job_id: string
  status: GiraJobStatus
  jurisdiction: Jurisdiction
  message?: string | null
  download_url?: string | null
}

// ── API Functions ──────────────────────────────────────────────

export const getGiraPreflight = (
  entityId: string,
  jurisdiction: Jurisdiction,
  token: string,
) =>
  apiFetch<GiraPreflightResponse>(
    `/api/gira/preflight/${entityId}?jurisdiction=${encodeURIComponent(jurisdiction)}`,
    { token },
  )

export const generateGira = (
  entityId: string,
  jurisdiction: Jurisdiction,
  token: string,
) =>
  apiFetch<{ job_id: string; status: GiraJobStatus }>(
    `/api/gira/generate/${entityId}`,
    { method: 'POST', body: JSON.stringify({ jurisdiction }), token },
  )

export const getGiraStatus = (jobId: string, token: string) =>
  apiFetch<GiraJobStatusResponse>(`/api/gira/status/${jobId}`, { token })

export function getGiraDownloadUrl(jobId: string, token: string): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.qanun.io'
  return `${base}/api/gira/download/${jobId}?token=${encodeURIComponent(token)}`
}
