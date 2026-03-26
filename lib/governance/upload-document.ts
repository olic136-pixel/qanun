/**
 * Upload a file to a governance document via the FastAPI endpoint.
 *
 * POST /api/governance/entities/{entity_id}/documents/{document_id}/upload
 * Content-Type: multipart/form-data
 */
export async function uploadGovernanceDocument(
  entityId: string,
  documentId: string,
  file: File,
  token: string,
): Promise<{ success: boolean; data?: UploadResponse; error?: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL

  const formData = new FormData()
  formData.append('file', file)

  try {
    const res = await fetch(
      `${baseUrl}/api/governance/entities/${entityId}/documents/${documentId}/upload`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      },
    )

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }))
      return { success: false, error: err.detail || 'Upload failed' }
    }

    const data: UploadResponse = await res.json()
    return { success: true, data }
  } catch {
    return { success: false, error: 'Network error — unable to upload' }
  }
}

export interface UploadResponse {
  document_id: string
  file_path: string
  version: number
  status: string
}
