import { apiFetch } from './client'

// ── Input types ────────────────────────────────────────────────────

export interface CreateProjectInput {
  title: string
  objective: string
  jurisdiction?: string
  focus_areas?: string[]
}

export interface PatchProjectInput {
  title?: string
  objective?: string
  status?: string
}

export interface StartCycleInput {
  focus_question: string
  agents?: string[]
}

export interface ClaimFilters {
  tier?: string
  cycle_number?: number
}

// ── Response types ─────────────────────────────────────────────────

export interface Project {
  project_id: string
  title: string
  status: 'active' | 'complete' | 'archived'
  cycle_count: number
  confidence_score: number
  created_at: string
}

export interface ProjectListItem {
  project_id: string
  title: string
  objective: string
  jurisdiction: string
  status: 'active' | 'complete' | 'archived'
  cycle_count: number
  confidence_score: number
  open_questions_count: number
  updated_at: string
  created_at: string
}

export interface Cycle {
  cycle_id: string
  cycle_number: number
  focus_question: string
  status: 'pending' | 'running' | 'complete' | 'error'
  cycle_summary: string | null
  new_claims_count: number
  open_questions_count: number
  session_id: string | null
  created_at: string
  completed_at: string | null
}

export interface ProjectClaim {
  id: number
  project_id: string
  session_id: string
  cycle_number: number
  claim_text: string
  confidence_tier: 'VERIFIED' | 'SUPPORTED' | 'INFERRED' | 'SPECULATIVE' | 'CONTESTED'
  agent_name: string | null
  section_ref: string | null
  source_key: string | null
  lifecycle_status: 'active' | 'superseded' | 'contested'
  superseded_by: number | null
  created_at: string
}

export interface ProjectDetail {
  project_id: string
  title: string
  objective: string
  jurisdiction: string
  status: 'active' | 'complete' | 'archived'
  cycle_count: number
  confidence_score: number
  living_opinion: string | null
  open_questions: string[]
  focus_areas: string[]
  updated_at: string
  created_at: string
  cycles: Cycle[]
  claims: ProjectClaim[]
}

export interface CycleStarted {
  cycle_id: string
  session_id: string | null
  cycle_number: number
  status: string
  message: string
}

export interface ObsidianWriteResult {
  path: string
  files_written: number
}

// ── API functions ──────────────────────────────────────────────────

export const createProject = (data: CreateProjectInput, token: string) =>
  apiFetch<Project>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(data),
    token,
  })

export const getProjects = (token: string) =>
  apiFetch<ProjectListItem[]>('/api/projects', { token })

export const getProject = (projectId: string, token: string) =>
  apiFetch<ProjectDetail>(`/api/projects/${projectId}`, { token })

export const patchProject = (projectId: string, data: PatchProjectInput, token: string) =>
  apiFetch<ProjectDetail>(`/api/projects/${projectId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    token,
  })

export const startCycle = (projectId: string, data: StartCycleInput, token: string) =>
  apiFetch<CycleStarted>(`/api/projects/${projectId}/cycle`, {
    method: 'POST',
    body: JSON.stringify(data),
    token,
  })

export const getCycles = (projectId: string, token: string) =>
  apiFetch<Cycle[]>(`/api/projects/${projectId}/cycles`, { token })

export const getProjectClaims = (
  projectId: string,
  token: string,
  filters?: ClaimFilters
) => {
  const qs = new URLSearchParams()
  if (filters?.tier) qs.set('tier', filters.tier)
  if (filters?.cycle_number !== undefined) qs.set('cycle_number', String(filters.cycle_number))
  const query = qs.toString()
  return apiFetch<ProjectClaim[]>(
    `/api/projects/${projectId}/claims${query ? '?' + query : ''}`,
    { token }
  )
}

export const exportToObsidian = async (
  projectId: string,
  token: string,
  writeToVault?: boolean
): Promise<Blob | ObsidianWriteResult> => {
  const qs = writeToVault ? '?write_to_vault=true' : ''
  return apiFetch<ObsidianWriteResult>(
    `/api/projects/${projectId}/export/obsidian${qs}`,
    { method: 'POST', token }
  )
}

export const exportMemo = (projectId: string, token: string) =>
  apiFetch<string>(`/api/projects/${projectId}/export/memo`, { token })

// ── Vault annotations ──────────────────────────────────────────

export interface VaultAnnotation {
  id: number
  vault_path: string
  annotation_text: string
  source_section: string
  detected_at: string
  surfaced: boolean
}

export interface AnnotationsResponse {
  project_id: string
  annotations: VaultAnnotation[]
  count: number
}

export const getAnnotations = (
  projectId: string,
  token: string,
  unsurfacedOnly: boolean = true
) => {
  const qs = unsurfacedOnly ? '?unsurfaced_only=true' : '?unsurfaced_only=false'
  return apiFetch<AnnotationsResponse>(
    `/api/projects/${projectId}/annotations${qs}`,
    { token }
  )
}
