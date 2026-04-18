import { apiFetch } from './client'

// ── Types ──────────────────────────────────────────────────────

export type RagStatus = 'OVERDUE' | 'RED' | 'AMBER' | 'GREEN'

export type ObligationStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETE'
  | 'OVERDUE'

export type LinkedDocStatus =
  | 'NOT_DRAFTED'
  | 'DRAFTED'
  | 'REVIEW_DUE'
  | 'IN_PROGRESS'
  | 'COMPLETE'

export type LifecycleStage =
  | 'PRE_APPLICATION'
  | 'IN_APPLICATION'
  | 'IPA_GRANTED'
  | 'LICENSED'

export type ControlTestStatus = 'not_configured' | 'pass' | 'fail' | 'partial'

export interface ControlTestResultPayload {
  status: ControlTestStatus
  message?: string
  control_id?: string | null
}

export interface Obligation {
  id: string
  title: string
  due_date: string
  days_remaining: number
  rag: RagStatus
  status: ObligationStatus
  regulatory_reference?: string | null
  linked_doc_type?: string | null
  linked_doc_status?: LinkedDocStatus | null
  control_test?: ControlTestResultPayload | null
}

export interface CalendarMilestones {
  ipa_granted_date?: string | null
  fsp_granted_date?: string | null
  first_board_date?: string | null
  financial_year_end?: string | null
  incorporation_date?: string | null
}

export interface CalendarResponse {
  entity_id: string
  lifecycle_stage: LifecycleStage
  milestones: CalendarMilestones
  obligations: Obligation[]
  summary: {
    overdue: number
    due_soon: number
    upcoming: number
    complete: number
  }
  monitor_enabled?: boolean
}

export interface MilestonePayload {
  ipa_granted_date?: string | null
  fsp_granted_date?: string | null
  first_board_date?: string | null
  financial_year_end?: string | null
  incorporation_date?: string | null
}

// ── API Functions ──────────────────────────────────────────────

export const getCalendar = (entityId: string, token: string) =>
  apiFetch<CalendarResponse>(`/api/calendar/${entityId}`, { token })

export const updateMilestones = (
  entityId: string,
  payload: MilestonePayload,
  token: string,
) =>
  apiFetch<{ entity_id: string; milestones: CalendarMilestones }>(
    `/api/calendar/${entityId}/milestone`,
    { method: 'PATCH', body: JSON.stringify(payload), token },
  )

export const updateObligation = (
  entityId: string,
  obligationId: string,
  payload: { status: ObligationStatus },
  token: string,
) =>
  apiFetch<{ id: string; status: ObligationStatus }>(
    `/api/lifecycle/${entityId}/obligation/${obligationId}`,
    { method: 'PATCH', body: JSON.stringify(payload), token },
  )
