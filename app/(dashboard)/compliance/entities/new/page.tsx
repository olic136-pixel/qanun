'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useEntity } from '@/lib/entity-context'
import { apiFetch } from '@/lib/api/client'
import {
  getJurisdictionContext,
  type ExtractedEntityFields,
  type EntityValidationResult,
} from '@/lib/api/entitySetup'
import { createEntity, updateEntityProfile } from '@/lib/api/entities'
import { JurisdictionSelector } from '@/components/qanun/cee/JurisdictionSelector'
import { EntityProfilePane } from '@/components/qanun/cee/EntityProfilePane'
import { ConversationEngine } from '@/components/qanun/cee/ConversationEngine'
import { ValidationSummary } from '@/components/qanun/cee/ValidationSummary'

type PageState = 'selecting' | 'loading_context' | 'ready' | 'confirmed' | 'creating' | 'done' | 'error'

export default function NewEntityPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { refreshEntities } = useEntity()
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken || ''

  const [jurisdiction, setJurisdiction] = useState('ADGM')
  const [pageState, setPageState] = useState<PageState>('selecting')
  const [contextDocument, setContextDocument] = useState('')
  const [contextError, setContextError] = useState('')
  const [conversationLocked, setConversationLocked] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [extractedFields, setExtractedFields] = useState<Partial<ExtractedEntityFields>>({})
  const [validationResult, setValidationResult] = useState<EntityValidationResult | null>(null)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  async function handleJurisdictionSelect(code: string) {
    if (conversationLocked) return
    setJurisdiction(code)
    setPageState('loading_context')
    setContextError('')
    setContextDocument('')
    setExtractedFields({})
    setValidationResult(null)
    setSessionId(null)
    try {
      const ctx = await getJurisdictionContext(code, token)
      setContextDocument(ctx.context_document)
      setPageState('ready')
    } catch {
      setContextError('Failed to load regulatory context. Please try again.')
      setPageState('error')
    }
  }

  function handleFieldsUpdated(fields: Partial<ExtractedEntityFields>) {
    setConversationLocked(true)
    setExtractedFields(prev => ({ ...prev, ...fields }))
  }

  function handleExtractionComplete(fields: ExtractedEntityFields, validation: EntityValidationResult) {
    setExtractedFields(fields)
    setValidationResult(validation)
    setPageState('confirmed')
  }

  async function handleConfirm() {
    if (!validationResult || !extractedFields.entity_name) return
    setCreating(true)
    setCreateError('')
    try {
      // 1. Create entity
      const created = await createEntity({
        entity_name: extractedFields.entity_name!,
        entity_type: extractedFields.entity_type ?? extractedFields.licence_category ?? 'category_3c',
        permitted_activities: extractedFields.permitted_activities ?? [],
        mlro_name: extractedFields.mlro_name ?? undefined,
        compliance_name: extractedFields.compliance_name ?? undefined,
        seo_name: extractedFields.seo_name ?? undefined,
        target_jurisdiction: jurisdiction,
        is_fund_manager: false,
      }, token)

      // 2. Update entity profile with full extracted data
      await updateEntityProfile(created.entity_id, {
        mlro_name: extractedFields.mlro_name ?? undefined,
        compliance_name: extractedFields.compliance_name ?? undefined,
        seo_name: extractedFields.seo_name ?? undefined,
        aum_range: extractedFields.aum_range ?? undefined,
        ...(extractedFields.jurisdiction_specific ?? {}),
      }, token)

      // 3. Refresh entity list in sidebar
      await refreshEntities()

      // 4. Initiate governance suite
      const tiers = extractedFields.recommended_tiers ?? [1, 2]
      const suite = await apiFetch<{ suite_job_id: string }>('/api/drafting/suite', {
        method: 'POST',
        body: JSON.stringify({
          entity_id: created.entity_id,
          jurisdiction,
          tiers,
          doc_types: [],
        }),
        token,
      })

      // 5. Route to suite status
      router.push(`/compliance/governance-suite/${suite.suite_job_id}`)
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : 'Failed to create entity')
      setCreating(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-52px)] overflow-hidden -m-6">
      {/* LEFT PANEL — 58% */}
      <div className="flex flex-col w-[58%] border-r border-[#E8EBF0] bg-white overflow-hidden">
        <div className="p-5 border-b border-[#E8EBF0]">
          <JurisdictionSelector
            selected={jurisdiction}
            onSelect={handleJurisdictionSelect}
            locked={conversationLocked}
          />
        </div>
        <div className="flex-1 overflow-hidden flex flex-col p-5">
          {pageState === 'selecting' && (
            <div className="flex-1 flex items-center justify-center text-[13px] text-[#9CA3AF]">
              Select a jurisdiction above to begin.
            </div>
          )}
          {pageState === 'loading_context' && (
            <div className="flex-1 flex items-center justify-center gap-2 text-[13px] text-[#6B7280]">
              <Loader2 size={16} className="animate-spin" />
              Loading regulatory context…
            </div>
          )}
          {contextError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-[13px] text-[#991B1B] mb-4">
              {contextError}
            </div>
          )}
          {(pageState === 'ready' || pageState === 'confirmed') && (
            <ConversationEngine
              key={`${jurisdiction}-cee`}
              jurisdictionCode={jurisdiction}
              contextDocument={contextDocument}
              token={token}
              sessionId={sessionId}
              onFieldsUpdated={handleFieldsUpdated}
              onExtractionComplete={handleExtractionComplete}
              onSessionPersisted={setSessionId}
            />
          )}
        </div>
        {/* Confirmation area — only when confirmed */}
        {pageState === 'confirmed' && validationResult && (
          <div className="p-5 border-t border-[#E8EBF0] bg-[#F5F7FA]">
            <ValidationSummary
              result={validationResult}
              entityName={extractedFields.entity_name ?? 'Entity'}
            />
            {createError && (
              <p className="text-[12px] text-[#991B1B] mb-3">{createError}</p>
            )}
            <button
              onClick={handleConfirm}
              disabled={creating}
              className="w-full py-3 rounded-xl bg-[#0F7A5F] text-white text-[14px] font-semibold hover:bg-[#0F6E56] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {creating
                ? <><Loader2 size={16} className="animate-spin" />Creating entity and initiating suite…</>
                : <>Confirm and Create Entity →</>
              }
            </button>
            <p className="text-[10px] text-[#9CA3AF] text-center mt-2">
              This will create the entity record and initiate the governance suite
            </p>
          </div>
        )}
      </div>

      {/* RIGHT PANEL — 42% */}
      <div className="flex flex-col w-[42%] bg-[#F5F7FA] overflow-hidden">
        <div className="p-5 border-b border-[#E8EBF0]">
          <p className="text-[15px] font-semibold text-[#0B1829]">
            {extractedFields.entity_name ?? 'New Entity'}
          </p>
          {jurisdiction && (
            <p className="text-[11px] text-[#6B7280] mt-0.5">{jurisdiction}</p>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <EntityProfilePane
            fields={extractedFields}
            validationSummary={validationResult?.validation_summary ?? null}
            flags={validationResult?.flags ?? []}
            isExtracting={false}
          />
        </div>
      </div>
    </div>
  )
}
