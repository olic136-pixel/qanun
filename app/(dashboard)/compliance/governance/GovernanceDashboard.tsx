'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Landmark, Shield, ScanSearch, AlertTriangle, Settings,
  Handshake, Users, Calculator, PiggyBank, ChevronRight,
  CheckCircle2, FileEdit, Upload, Info, Bell, Loader2,
  FolderOpen, TableProperties,
} from 'lucide-react'
import { useEntity } from '@/lib/entity-context'
import { getTemplateSlug } from '@/lib/governance/document-template-map'
import {
  getGapAnalysis, getGovernanceAlerts, acknowledgeAlert,
  type GovernanceProfile, type GovernanceCategorySummary,
  type GapAnalysisResponse, type GovernanceAlertsResponse,
  type GapAnalysisItem, type GovernanceAlert,
} from '@/lib/api/governance'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

// ── Constants ──────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<string, { label: string; Icon: typeof Landmark }> = {
  governance: { label: 'Governance & Board', Icon: Landmark },
  compliance: { label: 'Compliance', Icon: Shield },
  aml_cft: { label: 'AML / CFT', Icon: ScanSearch },
  risk: { label: 'Risk Management', Icon: AlertTriangle },
  operations: { label: 'Operations', Icon: Settings },
  commercial: { label: 'Commercial & Client', Icon: Handshake },
  hr_people: { label: 'HR & People', Icon: Users },
  financial: { label: 'Financial', Icon: Calculator },
  funds: { label: 'Funds', Icon: PiggyBank },
}

const CATEGORY_LABELS: Record<string, string> = {
  cat_3c: 'Cat 3C',
  cat_3a: 'Cat 3A',
  cat_2: 'Cat 2',
  cat_1: 'Cat 1',
  vara_vasp_bd: 'VASP-BD',
  vara_vasp_ex: 'VASP-EX',
  vara_vasp_cust: 'VASP-CUST',
  vara_vasp_mgmt: 'VASP-MGMT',
  sv_dasp_ex: 'DASP-EX',
  sv_dasp_cust: 'DASP-CUST',
}

const STAGE_LABELS: Record<string, string> = {
  pre_application: 'Pre-Application',
  ipa_received: 'IPA Received',
  authorised: 'Authorised',
  compliance_audit: 'Compliance Audit',
  vara_registration_pending: 'Registration Pending',
  vara_registered: 'Registered',
  sv_registered: 'Registered — CNAD',
}

const STAGE_COLORS: Record<string, string> = {
  pre_application: 'bg-indigo-100 text-indigo-700',
  ipa_received: 'bg-blue-100 text-blue-700',
  authorised: 'bg-emerald-100 text-emerald-700',
  compliance_audit: 'bg-amber-100 text-amber-700',
  vara_registration_pending: 'bg-indigo-100 text-indigo-700',
  vara_registered: 'bg-emerald-100 text-emerald-700',
  sv_registered: 'bg-emerald-100 text-emerald-700',
}

// ── Main Component ──────────────────────────────────────────────

interface GovernanceDashboardProps {
  entityId: string
  profile: GovernanceProfile
}

export function GovernanceDashboard({ entityId, profile }: GovernanceDashboardProps) {
  const { data: session } = useSession()
  const { selectedEntity } = useEntity()
  const router = useRouter()

  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken || ''

  const [gapData, setGapData] = useState<GapAnalysisResponse | null>(null)
  const [alertsData, setAlertsData] = useState<GovernanceAlertsResponse | null>(null)
  const [tabsLoading, setTabsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('priority')

  useEffect(() => {
    if (!token || !entityId) return
    let cancelled = false

    Promise.all([
      getGapAnalysis(entityId, token).catch(() => null),
      getGovernanceAlerts(entityId, token).catch(() => null),
    ]).then(([gaps, alerts]) => {
      if (cancelled) return
      if (gaps) setGapData(gaps)
      if (alerts) setAlertsData(alerts)
    }).finally(() => {
      if (!cancelled) setTabsLoading(false)
    })

    return () => { cancelled = true }
  }, [entityId, token])

  const { summary, categories } = profile
  const entityName = selectedEntity?.name ?? 'Entity'
  const progressPct = summary.total_applicable > 0
    ? Math.round((summary.completed / summary.total_applicable) * 100)
    : 0

  const applicableCategories = categories.filter((c) => c.total_applicable > 0)

  return (
    <div className="max-w-[1200px] mx-auto space-y-5">
      {/* ── Entity Header ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-xl font-bold text-[#0B1829]">{entityName}</h1>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-600">
          {CATEGORY_LABELS[profile.fsra_category] ?? profile.fsra_category}
        </span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${STAGE_COLORS[profile.regulatory_stage] ?? 'bg-gray-100 text-gray-600'}`}>
          {STAGE_LABELS[profile.regulatory_stage] ?? profile.regulatory_stage}
        </span>
      </div>

      {/* ── Overall Progress ── */}
      <div className="bg-white border border-[#E8EBF0] rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-medium text-[#1D2D44]">
            {summary.completed} of {summary.total_applicable} documents complete
          </span>
          <span className="text-[12px] font-semibold text-[#0B1829]">{progressPct}%</span>
        </div>
        <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#10B981] rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {summary.phase_gaps > 0 && (
          <p className="text-[11px] text-amber-600 mt-2">
            {summary.phase_gaps} document{summary.phase_gaps !== 1 ? 's' : ''} required for current phase not yet complete
          </p>
        )}
      </div>

      {/* ── View Links ── */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.push('/compliance/governance/documents')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium border border-[#E8EBF0] text-[#1D2D44] hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <TableProperties size={13} /> Document Register
        </button>
        <button
          onClick={() => router.push('/compliance/governance/folders')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium border border-[#E8EBF0] text-[#1D2D44] hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <FolderOpen size={13} /> Folder View
        </button>
      </div>

      {/* ── Category Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {applicableCategories.map((cat) => (
          <CategoryCard
            key={cat.category}
            data={cat}
            onClick={() =>
              router.push(`/compliance/governance/documents?category=${cat.category}`)
            }
          />
        ))}
      </div>

      {/* ── Tabs: Priority Actions | Recent Alerts ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList variant="line">
          <TabsTrigger value="priority">Priority Actions</TabsTrigger>
          <TabsTrigger value="alerts">
            Recent Alerts
            {alertsData && alertsData.alerts.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                {alertsData.alerts.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="priority" className="mt-3">
          {tabsLoading ? (
            <SkeletonRows />
          ) : (
            <PriorityActionsPanel gaps={gapData?.gaps.slice(0, 5) ?? []} />
          )}
        </TabsContent>

        <TabsContent value="alerts" className="mt-3">
          {tabsLoading ? (
            <SkeletonRows />
          ) : (
            <AlertsPanel
              alerts={alertsData?.alerts.slice(0, 5) ?? []}
              entityId={entityId}
              token={token}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ── Category Card ──────────────────────────────────────────────

function CategoryCard({
  data,
  onClick,
}: {
  data: GovernanceCategorySummary
  onClick: () => void
}) {
  const config = CATEGORY_CONFIG[data.category]
  if (!config) return null

  const { Icon, label } = config
  const pct = data.total_applicable > 0
    ? Math.round((data.completed / data.total_applicable) * 100)
    : 0

  const borderClass = data.overdue > 0
    ? 'border-l-red-500'
    : data.review_due > 0
      ? 'border-l-amber-500'
      : 'border-l-transparent'

  return (
    <button
      onClick={onClick}
      className={`text-left w-full bg-white border border-[#E8EBF0] border-l-[3px] ${borderClass} rounded-lg p-4 hover:shadow-sm transition-all cursor-pointer group`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-gray-400" />
          <span className="text-[13px] font-semibold text-[#0B1829]">{label}</span>
        </div>
        <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
      </div>

      {/* Progress ring + count */}
      <div className="flex items-center gap-4 mb-3">
        <ProgressRing percentage={pct} size={44} />
        <div>
          <span className="text-[18px] font-bold text-[#0B1829]">{data.completed}</span>
          <span className="text-[13px] text-gray-400"> / {data.total_applicable}</span>
          <p className="text-[11px] text-gray-500">complete</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="flex items-center gap-3 flex-wrap text-[11px]">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
          <span className="text-gray-500">Completed: {data.completed}</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
          <span className="text-gray-500">Pending: {data.pending}</span>
        </span>
        {data.overdue > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
            <span className="text-gray-500">Overdue: {data.overdue}</span>
          </span>
        )}
      </div>
    </button>
  )
}

// ── SVG Progress Ring ──────────────────────────────────────────

function ProgressRing({
  percentage,
  size = 44,
}: {
  percentage: number
  size?: number
}) {
  const strokeWidth = 4
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#E2E8F0"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#10B981"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-500"
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fill: '#0B1829', fontSize: '10px', fontWeight: 600 }}
        transform={`rotate(90, ${size / 2}, ${size / 2})`}
      >
        {percentage}%
      </text>
    </svg>
  )
}

// ── Priority Actions Panel ─────────────────────────────────────

function PriorityActionsPanel({ gaps }: { gaps: GapAnalysisItem[] }) {
  if (gaps.length === 0) {
    return (
      <div className="flex items-center gap-3 p-6 bg-emerald-50 border border-emerald-200 rounded-lg">
        <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
        <div>
          <p className="text-[13px] font-semibold text-emerald-800">
            All applicable documents are complete
          </p>
          <p className="text-[12px] text-emerald-600 mt-0.5">
            Your governance framework is up to date.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {gaps.map((gap) => (
        <GapRow key={gap.document_id} gap={gap} />
      ))}
      <div className="text-right pt-1">
        <a
          href="/compliance/governance/gap-analysis"
          className="text-[12px] text-[#1A5FA8] hover:underline"
        >
          View all gaps &rarr;
        </a>
      </div>
    </div>
  )
}

function GapRow({ gap }: { gap: GapAnalysisItem }) {
  const catConfig = CATEGORY_CONFIG[gap.category]
  const router = useRouter()
  const templateSlug = gap.is_qanun_draftable === 1 ? getTemplateSlug(gap.document_id) : null

  return (
    <div className="flex items-center gap-3 bg-white border border-[#E8EBF0] rounded-lg px-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13px] font-semibold text-[#0B1829] truncate">
            {gap.name}
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500">
            {catConfig?.label ?? gap.category}
          </span>
          {gap.is_required_current_phase === 1 && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-700">
              Phase Critical
            </span>
          )}
        </div>
        {gap.blocks_count > 0 && (
          <p className="text-[11px] text-amber-600 mt-1">
            Blocks {gap.blocks_count} other document{gap.blocks_count !== 1 ? 's' : ''}
          </p>
        )}
      </div>
      <div className="shrink-0">
        {gap.is_qanun_draftable === 1 ? (
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
        ) : (
          <button
            onClick={() => router.push(`/compliance/governance/documents?status=not_started`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold border border-[#E8EBF0] text-[#1D2D44] hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Upload size={12} /> Upload
          </button>
        )}
      </div>
    </div>
  )
}

// ── Alerts Panel ───────────────────────────────────────────────

function AlertsPanel({
  alerts,
  entityId,
  token,
}: {
  alerts: GovernanceAlert[]
  entityId: string
  token: string
}) {
  const [localAlerts, setLocalAlerts] = useState(alerts)
  const [ackLoading, setAckLoading] = useState<string | null>(null)

  useEffect(() => {
    setLocalAlerts(alerts)
  }, [alerts])

  async function handleAcknowledge(alertId: string) {
    setAckLoading(alertId)
    try {
      await acknowledgeAlert(entityId, alertId, 'acknowledged', token)
      setLocalAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, status: 'acknowledged' } : a))
      )
    } catch {
      // silently fail — alert stays in current state
    } finally {
      setAckLoading(null)
    }
  }

  if (localAlerts.length === 0) {
    return (
      <div className="flex items-center gap-3 p-6 bg-[#F5F7FA] border border-[#E8EBF0] rounded-lg">
        <Info size={20} className="text-gray-400 shrink-0" />
        <div>
          <p className="text-[13px] font-medium text-gray-600">
            No open regulatory change alerts
          </p>
          <p className="text-[12px] text-gray-400 mt-0.5">
            You will be notified when corpus changes affect your governance documents.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {localAlerts.map((alert) => (
        <div
          key={alert.id}
          className="bg-white border border-[#E8EBF0] rounded-lg px-4 py-3"
        >
          <div className="flex items-start gap-3">
            <Bell size={14} className="text-gray-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <code className="text-[12px] font-mono font-semibold text-[#0B1829] bg-gray-100 px-1.5 py-0.5 rounded">
                  {alert.rule_changed}
                </code>
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    alert.severity === 'action_required'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {alert.severity === 'action_required' ? 'Action Required' : 'Review'}
                </span>
              </div>
              <p className="text-[12px] font-medium text-[#1D2D44]">
                {alert.document_name}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">
                {alert.change_summary}
              </p>
            </div>
            {alert.status === 'open' && (
              <button
                onClick={() => handleAcknowledge(alert.id)}
                disabled={ackLoading === alert.id}
                className="shrink-0 px-2.5 py-1 rounded-md text-[11px] font-semibold border border-[#E8EBF0] text-[#1D2D44] hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {ackLoading === alert.id ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  'Acknowledge'
                )}
              </button>
            )}
            {alert.status === 'acknowledged' && (
              <span className="shrink-0 text-[11px] text-gray-400">Acknowledged</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Skeleton Loader ────────────────────────────────────────────

function SkeletonRows() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white border border-[#E8EBF0] rounded-lg px-4 py-4">
          <div className="animate-pulse flex items-center gap-3">
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 rounded w-2/3" />
              <div className="h-2.5 bg-gray-100 rounded w-1/3" />
            </div>
            <div className="h-7 w-24 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}
