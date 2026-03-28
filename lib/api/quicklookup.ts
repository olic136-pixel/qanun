import { apiFetch } from './client'

export interface QuickLookupPassage {
  section_ref: string
  text: string
  rulebook_code: string
  source_entity: string
  relevance_score: number
  doc_title?: string
  source_url?: string
  version_str?: string
  is_current?: boolean
}

export interface QuickLookupResult {
  answer: string
  passages: QuickLookupPassage[]
  query: string
  jurisdiction: string
}

export const quickLookup = (
  query: string,
  jurisdiction: string,
  token: string
): Promise<QuickLookupResult> =>
  apiFetch<QuickLookupResult>('/api/quicklookup', {
    method: 'POST',
    body: JSON.stringify({ query, jurisdiction }),
    token,
  })
