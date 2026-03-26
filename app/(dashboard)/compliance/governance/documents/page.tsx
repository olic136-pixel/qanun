'use client'

import { useEffect, useState, useMemo, useCallback, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Search, Loader2, Filter } from 'lucide-react'
import { useEntity } from '@/lib/entity-context'
import {
  getGovernanceDocuments, type GovernanceDocument,
} from '@/lib/api/governance'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select'
import { DocumentDetailSheet } from './DocumentDetailSheet'
import { getTemplateSlug } from '@/lib/governance/document-template-map'

// ── Constants ──────────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  { value: '', label: 'All categories' },
  { value: 'governance', label: 'Governance & Board' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'aml_cft', label: 'AML / CFT' },
  { value: 'risk', label: 'Risk Management' },
  { value: 'operations', label: 'Operations' },
  { value: 'commercial', label: 'Commercial & Client' },
  { value: 'hr_people', label: 'HR & People' },
  { value: 'financial', label: 'Financial' },
  { value: 'funds', label: 'Funds' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'drafted', label: 'Drafted' },
  { value: 'uploaded', label: 'Uploaded' },
  { value: 'current', label: 'Current' },
  { value: 'review_due', label: 'Review Due' },
  { value: 'overdue', label: 'Overdue' },
]

const STATUS_COLORS: Record<string, string> = {
  not_started: '#94A3B8',
  in_progress: '#3B82F6',
  drafted: '#10B981',
  uploaded: '#10B981',
  current: '#22C55E',
  review_due: '#F59E0B',
  overdue: '#EF4444',
}

const CATEGORY_LABELS: Record<string, string> = {
  governance: 'Governance',
  compliance: 'Compliance',
  aml_cft: 'AML/CFT',
  risk: 'Risk',
  operations: 'Operations',
  commercial: 'Commercial',
  hr_people: 'HR',
  financial: 'Financial',
  funds: 'Funds',
}

const PHASE_LABELS: Record<string, string> = {
  pre_application: 'Pre-App',
  pre_final_approval: 'Pre-FA',
  post_authorisation: 'Post-Auth',
  pre_fund_launch: 'Pre-Fund',
}

// ── Page ──────────────────────────────────────────────────────

function DocumentRegisterContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { selectedEntity } = useEntity()

  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken || ''
  const entityId = selectedEntity?.id ?? ''

  // Filters from URL
  const [category, setCategory] = useState(searchParams.get('category') ?? '')
  const [status, setStatus] = useState(searchParams.get('status') ?? '')
  const [phaseRequired, setPhaseRequired] = useState(searchParams.get('phase_required') === 'true')
  const [search, setSearch] = useState('')

  // Data
  const [documents, setDocuments] = useState<GovernanceDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState<GovernanceDocument | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // Fetch documents when filters or entity change
  const fetchDocuments = useCallback(async () => {
    if (!token || !entityId) return
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (category) params.category = category
      if (status) params.status = status
      if (phaseRequired) params.phase_required = 'true'
      const res = await getGovernanceDocuments(entityId, token, params)
      setDocuments(res.documents)
    } catch {
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }, [token, entityId, category, status, phaseRequired])

  useEffect(() => { fetchDocuments() }, [fetchDocuments])

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (status) params.set('status', status)
    if (phaseRequired) params.set('phase_required', 'true')
    const qs = params.toString()
    router.replace(`/compliance/governance/documents${qs ? `?${qs}` : ''}`, { scroll: false })
  }, [category, status, phaseRequired, router])

  // Client-side search filter
  const filteredDocs = useMemo(() => {
    if (!search.trim()) return documents
    const q = search.toLowerCase()
    return documents.filter(
      (d) => d.name.toLowerCase().includes(q) || d.document_id.toLowerCase().includes(q),
    )
  }, [documents, search])

  function handleRowClick(doc: GovernanceDocument) {
    setSelectedDoc(doc)
    setSheetOpen(true)
  }

  function handleDocumentUpdated(updated: GovernanceDocument) {
    setDocuments((prev) =>
      prev.map((d) => (d.document_id === updated.document_id ? { ...d, ...updated } : d)),
    )
    setSelectedDoc((prev) => (prev?.document_id === updated.document_id ? { ...prev, ...updated } : prev))
  }

  if (!entityId) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-500">
        Select an entity to view documents.
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Back + header */}
      <div className="mb-5">
        <button
          onClick={() => router.push('/compliance/governance')}
          className="flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 mb-3 transition-colors cursor-pointer"
        >
          <ArrowLeft size={12} /> Back to dashboard
        </button>
        <h1 className="text-xl font-bold text-[#0B1829]">Document Register</h1>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        {/* Category */}
        <Select value={category} onValueChange={(v) => setCategory(v ?? '')}>
          <SelectTrigger size="sm" className="min-w-[150px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status */}
        <Select value={status} onValueChange={(v) => setStatus(v ?? '')}>
          <SelectTrigger size="sm" className="min-w-[130px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Phase toggle */}
        <button
          onClick={() => setPhaseRequired(!phaseRequired)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium border transition-colors cursor-pointer ${
            phaseRequired
              ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
              : 'bg-white text-gray-500 border-[#E8EBF0] hover:border-gray-300'
          }`}
        >
          <Filter size={12} />
          Phase required
        </button>

        {/* Search */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#E8EBF0] bg-white ml-auto">
          <Search size={12} className="text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="text-[12px] text-[#1D2D44] placeholder:text-gray-400 bg-transparent outline-none w-[160px]"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-sm text-gray-500">
          <Loader2 size={16} className="animate-spin mr-2" /> Loading documents...
        </div>
      ) : (
        <>
          <div className="bg-white border border-[#E8EBF0] rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F5F7FA]">
                  <TableHead className="w-10 text-[10px]">Status</TableHead>
                  <TableHead className="text-[10px]">ID</TableHead>
                  <TableHead className="text-[10px]">Document Name</TableHead>
                  <TableHead className="text-[10px]">Category</TableHead>
                  <TableHead className="text-[10px]">Phase</TableHead>
                  <TableHead className="text-[10px] hidden lg:table-cell">Owner</TableHead>
                  <TableHead className="text-[10px] hidden lg:table-cell">Last Reviewed</TableHead>
                  <TableHead className="text-[10px] hidden lg:table-cell">Next Due</TableHead>
                  <TableHead className="text-[10px] w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-[13px] text-gray-500">
                      No documents match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocs.map((doc) => (
                    <TableRow
                      key={doc.document_id}
                      onClick={() => handleRowClick(doc)}
                      className="cursor-pointer hover:bg-blue-50/30"
                    >
                      <TableCell>
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{ backgroundColor: STATUS_COLORS[doc.status] ?? '#94A3B8' }}
                          title={doc.status}
                        />
                      </TableCell>
                      <TableCell>
                        <code className="text-[11px] font-mono text-gray-600">{doc.document_id}</code>
                      </TableCell>
                      <TableCell>
                        <span className="text-[12px] font-medium text-[#0B1829] truncate block max-w-[260px]">
                          {doc.name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-gray-100 text-gray-500">
                          {CATEGORY_LABELS[doc.category] ?? doc.category}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-600">
                          {PHASE_LABELS[doc.phase_required] ?? doc.phase_required}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-[11px] text-gray-500">{doc.owner_role}</span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-[11px] text-gray-500">
                          {formatDate(doc.last_reviewed_at)}
                        </span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className={`text-[11px] ${isOverdue(doc.next_review_due) ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                          {formatDate(doc.next_review_due)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {doc.is_qanun_draftable === 1 &&
                            (doc.status === 'not_started' || doc.status === 'in_progress') && (() => {
                              const slug = getTemplateSlug(doc.document_id)
                              return (
                                <button
                                  onClick={() => slug && router.push(`/compliance/documents/new?type=${slug}`)}
                                  disabled={!slug}
                                  title={!slug ? 'Template not yet available' : undefined}
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                                    slug
                                      ? 'bg-[#0B1829] text-white hover:bg-[#1D2D44] cursor-pointer'
                                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                  }`}
                                >
                                  {slug ? 'Draft' : 'Soon'}
                                </button>
                              )
                            })()}
                          {(doc.status === 'not_started' || doc.status === 'in_progress') && (
                            <button className="px-2 py-0.5 rounded text-[10px] font-semibold border border-[#E8EBF0] text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
                              Upload
                            </button>
                          )}
                          {(doc.status === 'drafted' || doc.status === 'uploaded' || doc.status === 'current') && (
                            <button className="px-2 py-0.5 rounded text-[10px] font-semibold border border-[#E8EBF0] text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
                              Review
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Footer count */}
          <div className="mt-3 text-[11px] text-gray-400">
            Showing {filteredDocs.length} of {documents.length} documents
          </div>
        </>
      )}

      {/* Detail Sheet */}
      <DocumentDetailSheet
        doc={selectedDoc}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        allDocuments={documents}
        entityId={entityId}
        token={token}
        onDocumentUpdated={handleDocumentUpdated}
      />
    </div>
  )
}

export default function DocumentRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64 text-sm text-gray-500">
          Loading...
        </div>
      }
    >
      <DocumentRegisterContent />
    </Suspense>
  )
}

// ── Helpers ──────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false
  try {
    return new Date(dateStr) < new Date()
  } catch {
    return false
  }
}
