import { apiFetch } from './client'

export interface TwinSummary {
  twin_id: string
  product_name: string
  product_description: string
  jurisdictions: string[]
  status: 'clear' | 'alert' | 'archived'
  last_assessed_at: string | null
}

export const getTwins = (token: string) =>
  apiFetch<{ twins: TwinSummary[]; total: number }>('/api/twins', { token })

export const assessTwin = (twinId: string, token: string) =>
  apiFetch<{ assessment_id: string }>(
    `/api/twins/${twinId}/assess`,
    { method: 'POST', body: JSON.stringify({}), token }
  )
