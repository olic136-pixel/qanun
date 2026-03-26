'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, ChevronRight, ChevronDown, Folder, FolderOpen,
  FileText, Loader2, CheckCircle2, FileEdit, Upload,
} from 'lucide-react'
import { useEntity } from '@/lib/entity-context'
import { getTemplateSlug } from '@/lib/governance/document-template-map'
import { getGovernanceDocuments, type GovernanceDocument } from '@/lib/api/governance'
import { DocumentDetailSheet } from '../documents/DocumentDetailSheet'

// ── Folder display names ──────────────────────────────────────

const FOLDER_NAMES: Record<string, string> = {
  '01_governance': '01 — Governance & Board',
  '01_governance/01.01_constitutional': '01.01 — Constitutional Documents',
  '01_governance/01.02_board_tor': '01.02 — Board Terms of Reference',
  '01_governance/01.03_delegation': '01.03 — Delegation of Authority',
  '01_governance/01.04_corporate_governance': '01.04 — Corporate Governance Statement',
  '01_governance/01.05_org_chart': '01.05 — Organisational Chart',
  '01_governance/01.06_board_packs': '01.06 — Board Packs & Minutes',
  '01_governance/01.07_committees': '01.07 — Committee TORs & Records',
  '02_compliance': '02 — Regulatory & Compliance',
  '02_compliance/02.01_manual': '02.01 — Compliance Manual',
  '02_compliance/02.02_monitoring': '02.02 — Compliance Monitoring Plan',
  '02_compliance/02.03_co_tor': '02.03 — Compliance Officer TOR',
  '02_compliance/02.04_breaches': '02.04 — Breaches & Incidents Register',
  '02_compliance/02.05_conflicts': '02.05 — Conflicts of Interest',
  '02_compliance/02.06_gifts': '02.06 — Gifts & Entertainment',
  '02_compliance/02.07_pa_dealing': '02.07 — Personal Account Dealing',
  '02_compliance/02.08_notifications': '02.08 — Regulatory Notifications',
  '02_compliance/02.09_complaints': '02.09 — Complaints Handling',
  '02_compliance/02.10_whistleblowing': '02.10 — Whistleblowing',
  '02_compliance/02.11_annual_reports': '02.11 — Annual Compliance Reports',
  '03_aml_cft': '03 — AML / CFT',
  '03_aml_cft/03.01_policy': '03.01 — AML/CFT Policy & Procedures',
  '03_aml_cft/03.02_bra': '03.02 — Business Risk Assessment',
  '03_aml_cft/03.03_cra': '03.03 — Customer Risk Assessment',
  '03_aml_cft/03.04_cdd': '03.04 — CDD/EDD/SDD Procedures',
  '03_aml_cft/03.05_sanctions': '03.05 — Sanctions Screening',
  '03_aml_cft/03.06_sar': '03.06 — Suspicious Activity Reporting',
  '03_aml_cft/03.07_mlro': '03.07 — MLRO',
  '03_aml_cft/03.08_training': '03.08 — AML Training',
  '03_aml_cft/03.09_correspondent': '03.09 — Correspondent Banking',
  '03_aml_cft/03.10_annual_return': '03.10 — Annual AML Return',
  '04_risk': '04 — Risk Management',
  '04_risk/04.01_framework': '04.01 — Enterprise Risk Framework',
  '04_risk/04.02_appetite': '04.02 — Risk Appetite Statement',
  '04_risk/04.03_register': '04.03 — Risk Register',
  '04_risk/04.04_icaap': '04.04 — ICAAP / Capital Self-Assessment',
  '05_operations': '05 — Operations',
  '05_operations/05.01_bcp': '05.01 — Business Continuity & DR',
  '05_operations/05.02_cyber': '05.02 — Cyber Risk Framework',
  '05_operations/05.03_infosec': '05.03 — Information Security',
  '05_operations/05.04_data_protection': '05.04 — Data Protection & DPIA',
  '05_operations/05.05_outsourcing': '05.05 — Outsourcing',
  '05_operations/05.06_retention': '05.06 — Record Retention',
  '05_operations/05.07_incident': '05.07 — Incident Response',
  '06_commercial': '06 — Commercial & Client',
  '06_commercial/06.01_client_agreements': '06.01 — Client Agreements',
  '06_commercial/06.02_risk_disclosure': '06.02 — Risk Disclosure',
  '06_commercial/06.03_fees': '06.03 — Fee Schedule',
  '06_commercial/06.04_categorisation': '06.04 — Client Categorisation',
  '06_commercial/06.05_suitability': '06.05 — Suitability / Appropriateness',
  '06_commercial/06.06_client_money': '06.06 — Client Money',
  '06_commercial/06.07_custody': '06.07 — Safe Custody',
  '06_commercial/06.08_marketing': '06.08 — Marketing & Promotions',
  '06_commercial/06.09_best_execution': '06.09 — Best Execution',
  '06_commercial/06.10_order_handling': '06.10 — Order Handling & Allocation',
  '07_hr': '07 — HR & People',
  '07_hr/07.01_approved_persons': '07.01 — Approved Persons',
  '07_hr/07.02_training': '07.02 — Training & Competency',
  '07_hr/07.03_code_of_conduct': '07.03 — Code of Conduct',
  '07_hr/07.04_remuneration': '07.04 — Remuneration Policy',
  '07_hr/07.05_succession': '07.05 — Succession Plan',
  '08_financial': '08 — Financial',
  '08_financial/08.01_business_plan': '08.01 — Business Plan & Projections',
  '08_financial/08.02_capital': '08.02 — Capital Adequacy Monitoring',
  '08_financial/08.03_returns': '08.03 — Regulatory Returns',
  '08_financial/08.04_client_money_recon': '08.04 — Client Money Reconciliation',
  '08_financial/08.05_audit': '08.05 — Audit',
  '09_funds': '09 — Funds',
  '09_funds/09.01_prospectus': '09.01 — Fund Prospectus / OM',
  '09_funds/09.02_constitution': '09.02 — Fund Constitution',
  '09_funds/09.03_ima': '09.03 — Investment Management Agreement',
  '09_funds/09.04_valuation': '09.04 — Valuation Policy',
  '09_funds/09.05_sub_redemption': '09.05 — Subscription / Redemption',
}

const STATUS_COLORS: Record<string, string> = {
  not_started: '#94A3B8',
  in_progress: '#3B82F6',
  drafted: '#10B981',
  uploaded: '#10B981',
  current: '#22C55E',
  review_due: '#F59E0B',
  overdue: '#EF4444',
}

const STATUS_LABELS: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  drafted: 'Drafted',
  uploaded: 'Uploaded',
  current: 'Current',
  review_due: 'Review Due',
  overdue: 'Overdue',
}

const COMPLETED_STATUSES = new Set(['drafted', 'uploaded', 'current'])

// ── Types ──────────────────────────────────────────────────────

interface CategoryFolder {
  key: string
  label: string
  subFolders: SubFolder[]
  total: number
  completed: number
  hasOverdue: boolean
}

interface SubFolder {
  key: string
  label: string
  docs: GovernanceDocument[]
}

// ── Page ──────────────────────────────────────────────────────

export default function FoldersPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { selectedEntity } = useEntity()

  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken || ''
  const entityId = selectedEntity?.id ?? ''

  const [documents, setDocuments] = useState<GovernanceDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [selectedDoc, setSelectedDoc] = useState<GovernanceDocument | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    if (!token || !entityId) return
    let cancelled = false
    setLoading(true)

    getGovernanceDocuments(entityId, token)
      .then((res) => {
        if (cancelled) return
        const applicable = res.documents.filter((d) => d.is_applicable === 1)
        setDocuments(applicable)
        // Expand all top-level folders by default
        const topKeys = new Set(applicable.map((d) => d.folder_path.split('/')[0]))
        setExpanded(topKeys)
      })
      .catch(() => { if (!cancelled) setDocuments([]) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [token, entityId])

  // Build tree
  const tree = useMemo(() => buildTree(documents), [documents])

  function toggleFolder(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function handleDocClick(doc: GovernanceDocument) {
    setSelectedDoc(doc)
    setSheetOpen(true)
  }

  function handleDocumentUpdated(updated: GovernanceDocument) {
    setDocuments((prev) =>
      prev.map((d) => (d.document_id === updated.document_id ? { ...d, ...updated } : d)),
    )
    setSelectedDoc((prev) =>
      prev?.document_id === updated.document_id ? { ...prev, ...updated } : prev,
    )
  }

  if (!entityId) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-500">
        Select an entity to view the folder structure.
      </div>
    )
  }

  return (
    <div className="max-w-[1000px] mx-auto">
      {/* Back + header */}
      <div className="mb-5">
        <button
          onClick={() => router.push('/compliance/governance')}
          className="flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 mb-3 transition-colors cursor-pointer"
        >
          <ArrowLeft size={12} /> Back to dashboard
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#0B1829]">Governance Folders</h1>
          <button
            onClick={() => router.push('/compliance/governance/documents')}
            className="text-[12px] text-[#1A5FA8] hover:underline cursor-pointer"
          >
            Switch to table view
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-sm text-gray-500">
          <Loader2 size={16} className="animate-spin mr-2" /> Loading folders...
        </div>
      ) : tree.length === 0 ? (
        <div className="text-center py-12 text-[13px] text-gray-500">
          No applicable documents for this entity&apos;s FSRA category.
        </div>
      ) : (
        <div className="space-y-1">
          {tree.map((cat) => (
            <CategoryFolderNode
              key={cat.key}
              folder={cat}
              isExpanded={expanded.has(cat.key)}
              onToggle={() => toggleFolder(cat.key)}
              onDocClick={handleDocClick}
            />
          ))}
        </div>
      )}

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

// ── Tree Builder ──────────────────────────────────────────────

function buildTree(docs: GovernanceDocument[]): CategoryFolder[] {
  // Group by top-level key then sub-folder
  const catMap = new Map<string, Map<string, GovernanceDocument[]>>()

  for (const doc of docs) {
    const topKey = doc.folder_path.split('/')[0]
    if (!catMap.has(topKey)) catMap.set(topKey, new Map())
    const subMap = catMap.get(topKey)!
    if (!subMap.has(doc.folder_path)) subMap.set(doc.folder_path, [])
    subMap.get(doc.folder_path)!.push(doc)
  }

  const result: CategoryFolder[] = []

  for (const [topKey, subMap] of catMap) {
    const subFolders: SubFolder[] = []
    let total = 0
    let completed = 0
    let hasOverdue = false

    // Sort sub-folder keys naturally
    const sortedSubKeys = [...subMap.keys()].sort()

    for (const subKey of sortedSubKeys) {
      const subDocs = subMap.get(subKey)!
      subDocs.sort((a, b) => a.display_order - b.display_order)

      for (const d of subDocs) {
        total++
        if (COMPLETED_STATUSES.has(d.status)) completed++
        if (d.status === 'overdue') hasOverdue = true
      }

      subFolders.push({
        key: subKey,
        label: FOLDER_NAMES[subKey] ?? subKey,
        docs: subDocs,
      })
    }

    result.push({
      key: topKey,
      label: FOLDER_NAMES[topKey] ?? topKey,
      subFolders,
      total,
      completed,
      hasOverdue,
    })
  }

  result.sort((a, b) => a.key.localeCompare(b.key))
  return result
}

// ── Category Folder Node ──────────────────────────────────────

function CategoryFolderNode({
  folder,
  isExpanded,
  onToggle,
  onDocClick,
}: {
  folder: CategoryFolder
  isExpanded: boolean
  onToggle: () => void
  onDocClick: (doc: GovernanceDocument) => void
}) {
  const allComplete = folder.completed === folder.total && folder.total > 0

  return (
    <div className="bg-white border border-[#E8EBF0] rounded-lg overflow-hidden">
      {/* Top-level folder header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-[#F5F7FA] transition-colors cursor-pointer"
      >
        {isExpanded ? (
          <ChevronDown size={14} className="text-gray-400 shrink-0" />
        ) : (
          <ChevronRight size={14} className="text-gray-400 shrink-0" />
        )}
        {isExpanded ? (
          <FolderOpen size={16} className="text-[#C4922A] shrink-0" />
        ) : (
          <Folder size={16} className="text-[#C4922A] shrink-0" />
        )}
        <span className="text-[13px] font-semibold text-[#0B1829] flex-1 text-left">
          {folder.label}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {folder.hasOverdue && (
            <span className="w-2 h-2 rounded-full bg-[#EF4444]" title="Has overdue documents" />
          )}
          <span className={`text-[11px] font-medium ${allComplete ? 'text-[#10B981]' : 'text-gray-400'}`}>
            {folder.completed} / {folder.total}
          </span>
          {allComplete && <CheckCircle2 size={14} className="text-[#10B981]" />}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-[#E8EBF0]">
          {folder.subFolders.map((sub) => (
            <SubFolderNode key={sub.key} sub={sub} onDocClick={onDocClick} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Sub-folder Node ──────────────────────────────────────────

function SubFolderNode({
  sub,
  onDocClick,
}: {
  sub: SubFolder
  onDocClick: (doc: GovernanceDocument) => void
}) {
  return (
    <div>
      {/* Sub-folder header */}
      <div className="flex items-center gap-2 pl-10 pr-4 py-2 bg-[#F5F7FA]/50">
        <Folder size={14} className="text-gray-400 shrink-0" />
        <span className="text-[12px] font-medium text-[#1D2D44]">{sub.label}</span>
      </div>

      {/* Document nodes */}
      {sub.docs.map((doc) => (
        <DocumentNode key={doc.document_id} doc={doc} onClick={() => onDocClick(doc)} />
      ))}
    </div>
  )
}

// ── Document Node ──────────────────────────────────────────────

function DocumentNode({
  doc,
  onClick,
}: {
  doc: GovernanceDocument
  onClick: () => void
}) {
  const router = useRouter()
  const statusColor = STATUS_COLORS[doc.status] ?? '#94A3B8'
  const statusLabel = STATUS_LABELS[doc.status] ?? doc.status
  const templateSlug = doc.is_qanun_draftable === 1 ? getTemplateSlug(doc.document_id) : null

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-2 pl-16 pr-4 py-2 hover:bg-blue-50/30 transition-colors cursor-pointer group"
    >
      <FileText size={14} className="text-gray-300 shrink-0" />
      <span className="text-[12px] text-[#0B1829] flex-1 truncate group-hover:text-[#1A5FA8] transition-colors">
        {doc.name}
      </span>
      <div className="flex items-center gap-3 shrink-0">
        {/* Status */}
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: statusColor }} />
          <span className="text-[10px] text-gray-500 hidden sm:inline">{statusLabel}</span>
        </span>
        {/* Action button */}
        <div onClick={(e) => e.stopPropagation()}>
          {doc.is_qanun_draftable === 1 &&
            (doc.status === 'not_started' || doc.status === 'in_progress') ? (
            <button
              onClick={() => templateSlug && router.push(`/compliance/documents/new?type=${templateSlug}`)}
              disabled={!templateSlug}
              title={!templateSlug ? 'Template not yet available' : undefined}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-colors ${
                templateSlug
                  ? 'bg-[#0B1829] text-white hover:bg-[#1D2D44] cursor-pointer'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <span className="flex items-center gap-1"><FileEdit size={10} /> {templateSlug ? 'Draft' : 'Soon'}</span>
            </button>
          ) : (doc.status === 'not_started' || doc.status === 'in_progress') ? (
            <button className="px-2 py-0.5 rounded text-[10px] font-semibold border border-[#E8EBF0] text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer opacity-0 group-hover:opacity-100">
              <span className="flex items-center gap-1"><Upload size={10} /> Upload</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
