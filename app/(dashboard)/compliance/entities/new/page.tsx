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
  const [suiteStarting, setSuiteStarting] = useState(false)
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
    } catch (err) {
      // Context load failed — proceed with empty
      // context. The CEE system prompt has full
      // jurisdiction-specific guidance hardcoded
      // and functions correctly without corpus
      // context. Log for debugging only.
      console.warn(
        'jurisdiction-context fetch failed:',
        err)
      setContextDocument('')
      setContextError(
        'Regulatory context unavailable — ' +
        'proceeding with standard guidance.')
      setPageState('ready')
    }
  }

  function handleFieldsUpdated(fields: Partial<ExtractedEntityFields>) {
    setConversationLocked(true)
    setExtractedFields(prev => ({ ...prev, ...fields }))
  }

  function handleExtractionComplete(fields: ExtractedEntityFields, validation: EntityValidationResult | null) {
    setExtractedFields(fields)
    setValidationResult(validation)
    setPageState('confirmed')
  }

  async function handleConfirm() {
    if (!extractedFields.entity_name) return
    setCreating(true)
    setCreateError('')
    try {
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

      await updateEntityProfile(created.entity_id, {
        mlro_name: extractedFields.mlro_name ?? undefined,
        compliance_name: extractedFields.compliance_name ?? undefined,
        seo_name: extractedFields.seo_name ?? undefined,
        aum_range: extractedFields.aum_range ?? undefined,
        ...(extractedFields.jurisdiction_specific ?? {}),
      }, token)

      await refreshEntities()

      // Entity created — now start governance suite
      setSuiteStarting(true)
      const tiers = extractedFields.recommended_tiers ?? [1, 2]
      try {
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
        router.push(`/compliance/governance-suite/${suite.suite_job_id}`)
      } catch {
        // Entity was created successfully but suite failed — redirect gracefully
        router.push('/compliance/governance-suite?entity_created=true&error=suite_failed')
      }
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : 'Failed to create entity')
      setCreating(false)
      setSuiteStarting(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-52px)] overflow-hidden -m-6">
      {/* LEFT PANEL — 58% */}
      <div className="flex flex-col w-[58%] border-r border-black/10 bg-white overflow-hidden">
        <div className="p-5 border-b border-black/10">
          <JurisdictionSelector
            selected={jurisdiction}
            onSelect={handleJurisdictionSelect}
            locked={conversationLocked}
          />
        </div>
        <div className="flex-1 overflow-hidden flex flex-col p-5">
          {pageState === 'selecting' && (
            <div className="flex-1 flex items-center justify-center text-[13px] text-black/30">
              Select a jurisdiction above to begin.
            </div>
          )}
          {pageState === 'loading_context' && (
            <div className="flex-1 flex items-center justify-center gap-2 text-[13px] text-black/40">
              <Loader2 size={16} className="animate-spin" />
              Loading regulatory context…
            </div>
          )}
          {contextError && (
            <div className="px-3 py-2 bg-amber-50 border
                            border-amber-200 text-[11px]
                            text-amber-700 mb-3 font-mono">
              ⚠ {contextError}
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
        {/* Confirmation area */}
        {pageState === 'confirmed' && (
          <div className="p-5 border-t border-black/10 bg-white">
            {validationResult ? (
              <ValidationSummary
                result={validationResult}
                entityName={extractedFields.entity_name ?? 'Entity'}
              />
            ) : (
              <p className="text-sm text-black/60 mb-3">
                {extractedFields.entity_name} is ready to be created in {jurisdiction}.
              </p>
            )}
            {createError && (
              <p className="text-[12px] text-black mb-3">{createError}</p>
            )}
            <button
              onClick={handleConfirm}
              disabled={creating}
              className="w-full py-3 bg-black text-white text-[13px] font-bold uppercase tracking-widest hover:bg-[#0047FF] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {suiteStarting
                ? <><Loader2 size={16} className="animate-spin" />Entity created. Starting governance suite…</>
                : creating
                  ? <><Loader2 size={16} className="animate-spin" />Creating entity…</>
                  : <>Confirm and Create Entity →</>
              }
            </button>
            <p className="font-mono text-[9px] text-black/20 uppercase tracking-[0.2em] text-center mt-2">
              This will create the entity record and initiate the governance suite
            </p>
          </div>
        )}
      </div>

      {/* RIGHT PANEL — 42% */}
      <div className="flex flex-col w-[42%] bg-white overflow-hidden">
        <div className="p-5 border-b border-black/10">
          <p className="text-[13px] font-black uppercase tracking-tighter text-black">
            {extractedFields.entity_name ?? 'New Entity'}
          </p>
          {jurisdiction && (
            <p className="font-mono text-[9px] text-black/30 uppercase tracking-[0.2em] mt-0.5">{jurisdiction}</p>
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
