'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Loader2, ArrowLeft } from 'lucide-react'
import {
  getPreflightQuestions,
  startDraft,
  type PreflightResponse,
} from '@/lib/api/drafting'
import { PreflightConversation } from '@/components/qanun/cee/PreflightConversation'

function PreflightContent() {
  const { data: session } = useSession()
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()

  const docType = params.docType as string
  const entityId = searchParams.get('entity_id') ?? ''
  const jurisdiction = searchParams.get('jurisdiction') ?? 'ADGM'
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken || ''

  const [preflight, setPreflight] = useState<PreflightResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    if (!token || !docType || !entityId) return
    getPreflightQuestions(entityId, docType, token)
      .then(setPreflight)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [token, docType, entityId])

  async function handleComplete(answers: Record<string, unknown>) {
    if (!entityId || !docType || !token) return
    setStarting(true)
    try {
      const res = await startDraft(entityId, docType, token, jurisdiction, answers)
      router.push(`/compliance/documents/draft/${res.job_id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to start draft')
      setStarting(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-sm text-[#6B7280]">
      <Loader2 size={16} className="animate-spin mr-2" /> Loading preflight…
    </div>
  )

  if (error) return (
    <div className="max-w-2xl mx-auto mt-8">
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-[#991B1B] text-sm">{error}</div>
      <button onClick={() => router.push('/compliance/documents/new')}
        className="mt-4 flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#0B1829]">
        <ArrowLeft size={14} /> Back to documents
      </button>
    </div>
  )

  if (!preflight) return null

  return (
    <PreflightConversation
      docType={docType}
      displayName={preflight.display_name}
      questions={preflight.questions}
      token={token}
      onComplete={handleComplete}
      onBack={() => router.push('/compliance/documents/new')}
    />
  )
}

export default function PreflightPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64 text-sm text-[#6B7280]">
        <Loader2 size={16} className="animate-spin mr-2" /> Loading…
      </div>
    }>
      <PreflightContent />
    </Suspense>
  )
}
