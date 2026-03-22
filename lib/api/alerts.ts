import { apiFetch } from './client'

export interface AlertObject {
  alert_id: string
  twin_id: string
  twin_name: string
  title: string
  description: string
  affected_rule: string
  alert_level: 'high' | 'medium' | 'low'
  resolved: boolean
  created_at: string
}

export const getAlerts = (token: string, resolved?: boolean) => {
  const qs = resolved !== undefined ? `?resolved=${resolved}` : ''
  return apiFetch<{ alerts: AlertObject[]; total: number; unresolved_count: number }>(
    `/api/alerts${qs}`,
    { token }
  )
}

export const dismissAlert = (alertId: string, token: string) =>
  apiFetch(`/api/alerts/${alertId}`, {
    method: 'PATCH',
    body: JSON.stringify({ actions_taken: 'Dismissed by user' }),
    token,
  })
