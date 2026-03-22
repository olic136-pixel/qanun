import { apiFetch } from './client'

export const getSystemStatus = (token: string) =>
  apiFetch<{
    vault_health: string
    agents: Record<string, string>
    corpus: { documents: number; sections: number; last_updated: string }
    claims_total: number
  }>('/api/system/status', { token })

export const getDashboardKPIs = (token: string) =>
  apiFetch<{
    sessions_this_week: number
    active_twins: number
    pending_alerts: number
    claims_total: number
    corpus_documents: number
  }>('/api/dashboard/kpis', { token })
