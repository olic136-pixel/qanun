import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { getTemplateSlug } from './document-template-map'

/**
 * Returns a handler that navigates to the drafting engine for a given document.
 * If no template exists, returns { available: false }.
 */
export function useDraftAction() {
  const router = useRouter()

  const handleDraft = useCallback(
    (documentId: string) => {
      const slug = getTemplateSlug(documentId)
      if (!slug) return
      router.push(`/compliance/documents/new?type=${slug}`)
    },
    [router],
  )

  return { handleDraft, getTemplateSlug }
}
