import { apiFetch } from './client'

export interface CorpusSource {
  doc_id: number
  source_key: string
  title: string
  doc_type: string
  source_tier: number
  rulebook_code: string | null
  version: string | null
  pub_date: string | null
  is_current: boolean
  word_count: number
}

export interface CorpusSearchResult {
  chunk_text: string
  section_ref: string
  doc_title: string
  doc_type: string
  source_entity: string
  source_tier: number
  rulebook_code: string
  version: string | null
  effective_date: string | null
  is_current: boolean
  source_url: string
  source: string
  relevance_score: number
}

export const listSources = (token: string, params?: {
  source_entity?: string
  doc_type?: string
}) => {
  const qs = new URLSearchParams()
  if (params?.source_entity) qs.set('source_entity', params.source_entity)
  if (params?.doc_type) qs.set('doc_type', params.doc_type)
  return apiFetch<CorpusSource[]>(
    `/api/corpus/sources${qs.toString() ? '?' + qs.toString() : ''}`,
    { token }
  )
}

export const searchCorpus = (q: string, token: string, params?: {
  source_entity?: string
  doc_type?: string
  max_results?: number
}) => {
  const qs = new URLSearchParams({ q })
  if (params?.source_entity) qs.set('source_entity', params.source_entity)
  if (params?.doc_type) qs.set('doc_type', params.doc_type)
  if (params?.max_results) qs.set('max_results', String(params.max_results))
  return apiFetch<{ results: CorpusSearchResult[]; total: number; query: string }>(
    `/api/corpus/search?${qs}`, { token }
  )
}
