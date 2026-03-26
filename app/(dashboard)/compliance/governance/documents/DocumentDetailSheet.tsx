'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { X, FileEdit, Upload, CheckCircle2, Loader2 } from 'lucide-react'
import { uploadGovernanceDocument } from '@/lib/governance/upload-document'
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose,
} from '@/components/ui/drawer'
import {
  type GovernanceDocument, updateGovernanceDocument,
} from '@/lib/api/governance'
import { getTemplateSlug } from '@/lib/governance/document-template-map'

// ── Constants ──────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  not_started: { label: 'Not Started', color: '#94A3B8' },
  in_progress: { label: 'In Progress', color: '#3B82F6' },
  drafted: { label: 'Drafted', color: '#10B981' },
  uploaded: { label: 'Uploaded', color: '#10B981' },
  current: { label: 'Current', color: '#22C55E' },
  review_due: { label: 'Review Due', color: '#F59E0B' },
  overdue: { label: 'Overdue', color: '#EF4444' },
}

const CATEGORY_LABELS: Record<string, string> = {
  governance: 'Governance & Board',
  compliance: 'Compliance',
  aml_cft: 'AML / CFT',
  risk: 'Risk Management',
  operations: 'Operations',
  commercial: 'Commercial & Client',
  hr_people: 'HR & People',
  financial: 'Financial',
  funds: 'Funds',
}

const PHASE_LABELS: Record<string, string> = {
  pre_application: 'Pre-Application',
  pre_final_approval: 'Pre-Final Approval',
  post_authorisation: 'Post-Authorisation',
  pre_fund_launch: 'Pre-Fund Launch',
}

// ── Component ──────────────────────────────────────────────────

interface DocumentDetailSheetProps {
  doc: GovernanceDocument | null
  open: boolean
  onOpenChange: (open: boolean) => void
  allDocuments: GovernanceDocument[]
  entityId: string
  token: string
  onDocumentUpdated: (doc: GovernanceDocument) => void
}

export function DocumentDetailSheet({
  doc, open, onOpenChange, allDocuments, entityId, token, onDocumentUpdated,
}: DocumentDetailSheetProps) {
  const [notes, setNotes] = useState(doc?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset notes when doc changes
  if (doc && notes !== (doc.notes ?? '') && !saving) {
    // only reset if we haven't edited
  }

  const router = useRouter()

  if (!doc) return null

  const status = STATUS_CONFIG[doc.status] ?? { label: doc.status, color: '#94A3B8' }
  const templateSlug = doc.is_qanun_draftable === 1 ? getTemplateSlug(doc.document_id) : null

  function lookupDoc(id: string) {
    return allDocuments.find((d) => d.document_id === id)
  }

  async function handleSaveNotes() {
    if (!doc) return
    setSaving(true)
    setSaved(false)
    try {
      const updated = await updateGovernanceDocument(entityId, doc.document_id, { notes }, token)
      onDocumentUpdated(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      // fail silently
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusUpdate(newStatus: string) {
    if (!doc) return
    setStatusUpdating(true)
    try {
      const updated = await updateGovernanceDocument(entityId, doc.document_id, { status: newStatus }, token)
      onDocumentUpdated(updated)
    } catch {
      // fail silently
    } finally {
      setStatusUpdating(false)
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !doc) return
    setUploading(true)
    setUploadError('')
    const result = await uploadGovernanceDocument(entityId, doc.document_id, file, token)
    if (result.success) {
      onDocumentUpdated({ ...doc, status: 'uploaded', version: (doc.version || 0) + 1 })
    } else {
      setUploadError(result.error ?? 'Upload failed')
    }
    setUploading(false)
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="sm:max-w-lg w-full">
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Header */}
          <DrawerHeader className="border-b border-[#E8EBF0]">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <DrawerTitle className="text-[15px] font-bold text-[#0B1829] leading-tight">
                  {doc.name}
                </DrawerTitle>
                <DrawerDescription className="mt-1">
                  <code className="text-[11px] font-mono text-gray-500">{doc.document_id}</code>
                  <span className="text-gray-300 mx-1.5">·</span>
                  <span className="text-[11px] text-gray-500">{CATEGORY_LABELS[doc.category] ?? doc.category}</span>
                </DrawerDescription>
              </div>
              <DrawerClose className="shrink-0 p-1 rounded hover:bg-gray-100 transition-colors">
                <X size={16} className="text-gray-400" />
              </DrawerClose>
            </div>
          </DrawerHeader>

          {/* Body */}
          <div className="flex-1 p-4 space-y-5">
            {/* Status & meta */}
            <div className="space-y-2">
              <MetaRow label="Status">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: status.color }} />
                  <span className="text-[12px] font-medium text-[#1D2D44]">{status.label}</span>
                </span>
              </MetaRow>
              <MetaRow label="Phase" value={PHASE_LABELS[doc.phase_required] ?? doc.phase_required} />
              <MetaRow label="Owner" value={doc.owner_role} />
              <MetaRow label="Review Cycle" value={doc.review_cycle} />
              <MetaRow label="Regulatory Source" value={doc.regulatory_source} />
              {doc.is_required_current_phase === 1 && (
                <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-700">
                  Required for current phase
                </div>
              )}
            </div>

            {/* Description */}
            {doc.description && (
              <Section title="Description">
                <p className="text-[12px] text-gray-600 leading-relaxed">{doc.description}</p>
              </Section>
            )}

            {/* Dependencies */}
            {(doc.depends_on.length > 0 || doc.referenced_by.length > 0) && (
              <Section title="Dependencies">
                {doc.depends_on.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Depends on</p>
                    <div className="space-y-1">
                      {doc.depends_on.map((id) => {
                        const dep = lookupDoc(id)
                        return <DepRow key={id} id={id} name={dep?.name} status={dep?.status} />
                      })}
                    </div>
                  </div>
                )}
                {doc.referenced_by.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Referenced by</p>
                    <div className="space-y-1">
                      {doc.referenced_by.map((id) => {
                        const ref = lookupDoc(id)
                        return <DepRow key={id} id={id} name={ref?.name} status={ref?.status} />
                      })}
                    </div>
                  </div>
                )}
              </Section>
            )}

            {/* Version history */}
            <Section title="Version History">
              <div className="space-y-1.5">
                <MetaRow label="Version" value={String(doc.version)} />
                <MetaRow label="Last Drafted" value={formatDate(doc.last_drafted_at)} />
                <MetaRow label="Last Uploaded" value={formatDate(doc.last_uploaded_at)} />
                <MetaRow label="Last Reviewed" value={formatDate(doc.last_reviewed_at)} />
                <MetaRow label="Next Due" value={formatDate(doc.next_review_due)} />
              </div>
            </Section>

            {/* Notes */}
            <Section title="Notes">
              <textarea
                value={notes}
                onChange={(e) => { setNotes(e.target.value); setSaved(false) }}
                placeholder="Add notes about this document..."
                className="w-full h-20 px-3 py-2 text-[12px] border border-[#E8EBF0] rounded-md bg-white text-[#1D2D44] placeholder:text-gray-400 focus:outline-none focus:border-[#1A5FA8] resize-none"
              />
              <div className="flex items-center justify-end gap-2 mt-1.5">
                {saved && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-600">
                    <CheckCircle2 size={12} /> Saved
                  </span>
                )}
                <button
                  onClick={handleSaveNotes}
                  disabled={saving || notes === (doc.notes ?? '')}
                  className="px-3 py-1 rounded-md text-[11px] font-semibold bg-[#0B1829] text-white hover:bg-[#1D2D44] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {saving ? <Loader2 size={12} className="animate-spin" /> : 'Save'}
                </button>
              </div>
            </Section>

            {/* Status update */}
            {(doc.status === 'not_started' || doc.status === 'in_progress') && (
              <Section title="Update Status">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStatusUpdate('drafted')}
                    disabled={statusUpdating}
                    className="px-3 py-1.5 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    {statusUpdating ? <Loader2 size={12} className="animate-spin" /> : 'Mark as Drafted'}
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('uploaded')}
                    disabled={statusUpdating}
                    className="px-3 py-1.5 rounded-md text-[11px] font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    Mark as Uploaded
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5">
                  Use after completing a draft in the drafting engine or uploading externally.
                </p>
              </Section>
            )}
          </div>

          {/* Footer actions */}
          <div className="border-t border-[#E8EBF0] p-4 flex items-center gap-2">
            {doc.is_qanun_draftable === 1 && (
              <button
                onClick={() => templateSlug && router.push(`/compliance/documents/new?type=${templateSlug}`)}
                disabled={!templateSlug}
                title={!templateSlug ? 'Template not yet available' : undefined}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors ${
                  templateSlug
                    ? 'bg-[#0B1829] text-white hover:bg-[#1D2D44] cursor-pointer'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <FileEdit size={12} /> {templateSlug ? 'Draft with Qanun' : 'Draft (coming soon)'}
              </button>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold border border-[#E8EBF0] text-[#1D2D44] hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.pdf,.doc,.xlsx"
              onChange={handleUpload}
              className="hidden"
            />
            {uploadError && (
              <span className="text-[11px] text-red-600">{uploadError}</span>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

// ── Sub-components ──────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">{title}</h3>
      {children}
    </div>
  )
}

function MetaRow({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[11px] text-gray-500">{label}</span>
      {children ?? <span className="text-[12px] font-medium text-[#1D2D44]">{value ?? '—'}</span>}
    </div>
  )
}

function DepRow({ id, name, status }: { id: string; name?: string; status?: string }) {
  const isGap = status === 'not_started' || status === 'in_progress'
  const statusCfg = status ? STATUS_CONFIG[status] : undefined

  return (
    <div className={`flex items-center gap-2 py-1 px-2 rounded text-[11px] ${isGap ? 'bg-amber-50' : 'bg-gray-50'}`}>
      {statusCfg && (
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: statusCfg.color }} />
      )}
      <span className={`font-mono text-[10px] ${isGap ? 'text-amber-700' : 'text-gray-500'}`}>{id}</span>
      <span className={`truncate ${isGap ? 'text-amber-700' : 'text-gray-600'}`}>{name ?? 'Unknown'}</span>
    </div>
  )
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}
