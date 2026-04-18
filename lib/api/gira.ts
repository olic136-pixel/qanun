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

// ── Normalisation helpers ──────────────────────────────────────

type RawField = string | { field: string; label: string }
type RawCee  = string | CeeQuestion

function toFieldLabel(f: RawField): { field: string; label: string } {
  if (typeof f === 'string') {
    return {
      field: f,
      label: f
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase()),
    }
  }
  return f
}

function toCeeQuestion(q: RawCee, i: number): CeeQuestion {
  if (typeof q === 'string') {
    return { id: `q_${i}`, prompt: q, helper_text: null, answer: null }
  }
  return q
}

export const getGiraPreflight = async (
  entityId: string,
  jurisdiction: Jurisdiction,
  token: string,
): Promise<GiraPreflightResponse> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = await apiFetch<any>(
    `/api/gira/preflight/${entityId}?jurisdiction=${encodeURIComponent(jurisdiction)}`,
    { token },
  )
  return {
    ...raw,
    blocking_fields:  (raw.blocking_fields  ?? []).map(toFieldLabel),
    optional_missing: (raw.optional_missing ?? []).map(toFieldLabel),
    cee_questions:    (raw.cee_questions    ?? []).map(toCeeQuestion),
  }
}

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
