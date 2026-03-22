import { apiFetch } from './client'

export interface CreateSessionInput {
  query: string
  jurisdictions: string[]
  agents?: string[]
}

export interface SessionSummary {
  session_id: string
  query_text: string
  jurisdictions: string[]
  status: 'pending' | 'running' | 'complete' | 'error'
  claims_count: number
  created_at: string
}

export interface SessionDetail extends SessionSummary {
  agent_outputs: Record<string, unknown>
  compressed_digest: string
  completed_at: string | null
  claims: ClaimObject[]
}

export interface ClaimObject {
  claim_id: string
  claim_text: string
  confidence_tier: 'VERIFIED' | 'SUPPORTED' | 'INFERRED' | 'CONTESTED'
  agent_name: string
  section_ref: string
}

export const createSession = (data: CreateSessionInput, token: string) =>
  apiFetch<{ session_id: string }>('/api/query', {
    method: 'POST',
    body: JSON.stringify(data),
    token,
  })

export const getSession = (sessionId: string, token: string) =>
  apiFetch<SessionDetail>(`/api/sessions/${sessionId}`, { token })

export const getSessions = (token: string, params?: { q?: string; limit?: number }) => {
  const qs = new URLSearchParams()
  if (params?.q) qs.set('q', params.q)
  if (params?.limit) qs.set('limit', String(params.limit))
  return apiFetch<{ sessions: SessionSummary[]; total: number }>(
    `/api/sessions${qs.toString() ? '?' + qs.toString() : ''}`,
    { token }
  )
}
