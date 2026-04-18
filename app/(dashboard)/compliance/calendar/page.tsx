'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  ListTodo,
  GitBranch,
  CheckCircle2,
  X,
} from 'lucide-react'
import { useEntity } from '@/lib/entity-context'
import {
  getCalendar,
  updateMilestones,
  updateObligation,
  type Obligation,
  type RagStatus,
  type LifecycleStage,
  type LinkedDocStatus,
  type CalendarMilestones,
} from '@/lib/api/calendar'
import { ControlTestResult } from '@/components/compliance/ControlTestResult'

type TabKey = 'obligations' | 'timeline' | 'calendar'

// TODO(phase5-gate): gate this entire page on entity.monitor_enabled once the
// flag lands on EntitySummary. Until then, every user sees the page.

const LIFECYCLE_STAGES: { key: LifecycleStage; label: string }[] = [
  { key: 'PRE_APPLICATION', label: 'Pre-application' },
  { key: 'IN_APPLICATION', label: 'In application' },
  { key: 'IPA_GRANTED', label: 'IPA granted' },
  { key: 'LICENSED', label: 'Licensed' },
]

const RAG_CONFIG: Record<RagStatus, { label: string; tw: string; dot: string }> = {
  OVERDUE: { label: 'Overdue', tw: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-600' },
  RED:     { label: 'Red',     tw: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
  AMBER:   { label: 'Amber',   tw: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  GREEN:   { label: 'Green',   tw: 'bg-[#EAF4F1] text-[#0F7A5F] border-[#0F7A5F]/20', dot: 'bg-[#0F7A5F]' },
}

const RAG_ORDER: Record<RagStatus, number> = { OVERDUE: 0, RED: 1, AMBER: 2, GREEN: 3 }

const LINKED_DOC_CONFIG: Record<LinkedDocStatus, { label: string; tw: string }> = {
  NOT_DRAFTED: { label: 'Not drafted', tw: 'bg-gray-100 text-gray-500' },
  DRAFTED:     { label: 'Drafted',     tw: 'bg-[#EAF4F1] text-[#0F7A5F]' },
  REVIEW_DUE:  { label: 'Review due',  tw: 'bg-amber-50 text-amber-700' },
  IN_PROGRESS: { label: 'In progress', tw: 'bg-blue-50 text-blue-700' },
  COMPLETE:    { label: 'Complete',    tw: 'bg-[#EAF4F1] text-[#0F7A5F]' },
}

export default function CompliancCalendarPage() {
  const { data: session } = useSession()
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken || ''
  const { selectedEntity, entities, setSelectedEntity } = useEntity()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<TabKey>('obligations')

  const entityId = selectedEntity?.id ?? ''

  const { data, isLoading, error } = useQuery({
    queryKey: ['calendar', entityId],
    queryFn: () => getCalendar(entityId, token),
    enabled: !!token && !!entityId,
  })

  const obligations = data?.obligations ?? []
  const summary = data?.summary ?? { overdue: 0, due_soon: 0, upcoming: 0, complete: 0 }

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['calendar', entityId] })

  const markComplete = useMutation({
    mutationFn: (obligationId: string) =>
      updateObligation(entityId, obligationId, { status: 'COMPLETE' }, token),
    onSuccess: invalidate,
  })

  if (!selectedEntity) {
    return (
      <div className="max-w-2xl mx-auto mt-12 text-center text-sm text-gray-500">
        Select an entity to view its compliance calendar.
      </div>
    )
  }

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400 mb-1">
            Compliance Calendar
          </p>
          <h2 className="text-xl font-bold text-[#0B1829]">{selectedEntity.name}</h2>
        </div>
        {entities.length > 1 && (
          <select
            value={entityId}
            onChange={(e) => {
              const next = entities.find((en) => en.id === e.target.value)
              if (next) setSelectedEntity(next)
            }}
            className="text-[12px] border border-[#E8EBF0] rounded-md px-2.5 py-1.5 bg-white"
          >
            {entities.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#E8EBF0] mb-6">
        <TabButton active={tab === 'obligations'} onClick={() => setTab('obligations')}
          icon={ListTodo} label="Obligations" />
        <TabButton active={tab === 'timeline'} onClick={() => setTab('timeline')}
          icon={GitBranch} label="Timeline" />
        <TabButton active={tab === 'calendar'} onClick={() => setTab('calendar')}
          icon={CalendarDays} label="Calendar" />
      </div>

      {isLoading && (
        <div className="py-16 text-center text-sm text-gray-500">Loading calendar…</div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {(error as Error).message}
        </div>
      )}

      {!isLoading && !error && data && (
        <>
          {tab === 'obligations' && (
            <ObligationsTab
              summary={summary}
              obligations={obligations}
              onMarkComplete={(id) => markComplete.mutate(id)}
              pendingId={markComplete.isPending ? (markComplete.variables as string) : null}
            />
          )}
          {tab === 'timeline' && (
            <TimelineTab
              stage={data.lifecycle_stage}
              milestones={data.milestones}
              entityId={entityId}
              token={token}
              onSaved={invalidate}
            />
          )}
          {tab === 'calendar' && <CalendarTab obligations={obligations} />}
        </>
      )}
    </div>
  )
}

// ── Tab bar ───────────────────────────────────────────────────

function TabButton({
  active, onClick, icon: Icon, label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ElementType
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-[12px] font-semibold transition-colors border-b-2 -mb-px ${
        active
          ? 'text-[#0B1829] border-[#0B1829]'
          : 'text-gray-500 border-transparent hover:text-[#0B1829]'
      }`}
    >
      <Icon size={14} strokeWidth={1.5} />
      {label}
    </button>
  )
}

// ── Obligations tab ───────────────────────────────────────────

function ObligationsTab({
  summary, obligations, onMarkComplete, pendingId,
}: {
  summary: { overdue: number; due_soon: number; upcoming: number; complete: number }
  obligations: Obligation[]
  onMarkComplete: (id: string) => void
  pendingId: string | null
}) {
  const sorted = [...obligations].sort((a, b) => RAG_ORDER[a.rag] - RAG_ORDER[b.rag])

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Overdue" value={summary.overdue}
          tw="bg-red-50 border-red-200 text-red-700" />
        <StatCard label="Due soon (≤14d)" value={summary.due_soon}
          tw="bg-amber-50 border-amber-200 text-amber-700" />
        <StatCard label="Upcoming" value={summary.upcoming}
          tw="bg-[#EAF4F1] border-[#0F7A5F]/20 text-[#0F7A5F]" />
        <StatCard label="Complete" value={summary.complete}
          tw="bg-gray-50 border-gray-200 text-gray-600" />
      </div>

      {/* Obligation cards */}
      {sorted.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-500 bg-white border border-[#E8EBF0] rounded-lg">
          No obligations scheduled.
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((o) => (
            <ObligationCard
              key={o.id}
              obligation={o}
              onMarkComplete={() => onMarkComplete(o.id)}
              pending={pendingId === o.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, tw }: { label: string; value: number; tw: string }) {
  return (
    <div className={`border rounded-lg p-4 ${tw}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] opacity-80 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

function ObligationCard({
  obligation, onMarkComplete, pending,
}: {
  obligation: Obligation
  onMarkComplete: () => void
  pending: boolean
}) {
  const rag = RAG_CONFIG[obligation.rag]
  const docCfg = obligation.linked_doc_status ? LINKED_DOC_CONFIG[obligation.linked_doc_status] : null
  const done = obligation.status === 'COMPLETE'
  const daysLabel =
    obligation.days_remaining < 0
      ? `${Math.abs(obligation.days_remaining)}d overdue`
      : obligation.days_remaining === 0
        ? 'Due today'
        : `${obligation.days_remaining}d remaining`

  return (
    <div className="bg-white border border-[#E8EBF0] rounded-lg p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[14px] font-bold text-[#0B1829]">{obligation.title}</h3>
            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${rag.tw}`}>
              {rag.label.toUpperCase()}
            </span>
          </div>

          <div className="mt-1.5 flex items-center gap-2 text-[11px] text-gray-500">
            <Clock size={11} strokeWidth={1.5} />
            <span>{formatDate(obligation.due_date)}</span>
            <span className="text-gray-300">·</span>
            <span className={obligation.days_remaining < 0 ? 'text-red-600 font-semibold' : ''}>
              {daysLabel}
            </span>
          </div>

          {obligation.regulatory_reference && (
            <p className="mt-1.5 text-[10px] text-gray-400 font-mono">
              {obligation.regulatory_reference}
            </p>
          )}

          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {docCfg && (
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${docCfg.tw}`}>
                {docCfg.label}
              </span>
            )}
            <ControlTestResult
              status={obligation.control_test?.status ?? 'not_configured'}
              message={obligation.control_test?.message}
              control_id={obligation.control_test?.control_id}
            />
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <button
            disabled
            title="Examination Mode — Qanun Monitor Pro"
            className="px-3 py-1.5 text-[11px] font-semibold rounded-md bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
          >
            Add to Examination Pack
          </button>

          <div className="flex items-center gap-2">
            {obligation.linked_doc_type && !done && (
              <Link
                href={`/compliance/documents/new?type=${obligation.linked_doc_type}`}
                className="px-3 py-1.5 text-[11px] font-semibold rounded-md bg-[#0B1829] text-white hover:bg-[#1D2D44] transition-colors"
              >
                Draft document
              </Link>
            )}
            {!done && (
              <button
                onClick={onMarkComplete}
                disabled={pending}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold rounded-md border border-[#E8EBF0] text-[#0B1829] hover:bg-[#F5F7FA] transition-colors disabled:opacity-50"
              >
                <CheckCircle2 size={12} strokeWidth={1.5} />
                Mark complete
              </button>
            )}
            {done && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold rounded-md bg-[#EAF4F1] text-[#0F7A5F]">
                <CheckCircle2 size={12} strokeWidth={1.5} />
                Complete
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Timeline tab ──────────────────────────────────────────────

function TimelineTab({
  stage, milestones, entityId, token, onSaved,
}: {
  stage: LifecycleStage
  milestones: CalendarMilestones
  entityId: string
  token: string
  onSaved: () => void
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const currentIdx = LIFECYCLE_STAGES.findIndex((s) => s.key === stage)

  const milestoneDisplay: Record<LifecycleStage, { label: string; value?: string | null }> = {
    PRE_APPLICATION: { label: 'Incorporation', value: milestones.incorporation_date },
    IN_APPLICATION: { label: 'First board', value: milestones.first_board_date },
    IPA_GRANTED: { label: 'IPA granted', value: milestones.ipa_granted_date },
    LICENSED: { label: 'FSP granted', value: milestones.fsp_granted_date },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-bold text-[#0B1829]">Lifecycle</h3>
        <button
          onClick={() => setModalOpen(true)}
          className="px-3 py-1.5 text-[11px] font-semibold rounded-md border border-[#E8EBF0] text-[#0B1829] hover:bg-[#F5F7FA] transition-colors"
        >
          Record milestone
        </button>
      </div>

      <div className="bg-white border border-[#E8EBF0] rounded-lg p-8">
        <div className="flex items-stretch justify-between gap-2">
          {LIFECYCLE_STAGES.map((s, i) => {
            const active = s.key === stage
            const passed = i < currentIdx
            const ms = milestoneDisplay[s.key]
            return (
              <div key={s.key} className="flex-1 flex flex-col items-center text-center relative">
                <div className={`w-3 h-3 rounded-full mb-3 ${
                  active ? 'bg-[#0F7A5F] ring-4 ring-[#0F7A5F]/20'
                  : passed ? 'bg-[#0F7A5F]'
                  : 'bg-gray-300'
                }`} />
                <p className={`text-[11px] font-semibold uppercase tracking-[0.05em] ${
                  active ? 'text-[#0F7A5F]' : passed ? 'text-[#0B1829]' : 'text-gray-400'
                }`}>{s.label}</p>
                <p className="text-[10px] text-gray-400 font-mono mt-1.5">
                  {ms.value ? formatDate(ms.value) : '—'}
                </p>
                <p className="text-[9px] text-gray-400 mt-0.5">{ms.label}</p>
                {i < LIFECYCLE_STAGES.length - 1 && (
                  <div className={`absolute top-1.5 left-[calc(50%+12px)] right-[calc(-50%+12px)] h-px ${
                    passed ? 'bg-[#0F7A5F]' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {modalOpen && (
        <MilestoneModal
          initial={milestones}
          onClose={() => setModalOpen(false)}
          onSave={async (payload) => {
            await updateMilestones(entityId, payload, token)
            onSaved()
            setModalOpen(false)
          }}
        />
      )}
    </div>
  )
}

function MilestoneModal({
  initial, onClose, onSave,
}: {
  initial: CalendarMilestones
  onClose: () => void
  onSave: (payload: CalendarMilestones) => Promise<void>
}) {
  const [form, setForm] = useState<CalendarMilestones>({
    ipa_granted_date: initial.ipa_granted_date ?? '',
    fsp_granted_date: initial.fsp_granted_date ?? '',
    first_board_date: initial.first_board_date ?? '',
    financial_year_end: initial.financial_year_end ?? '',
    incorporation_date: initial.incorporation_date ?? '',
  })
  const [saving, setSaving] = useState(false)

  const update = (key: keyof CalendarMilestones, value: string) =>
    setForm((f) => ({ ...f, [key]: value || null }))

  const fields: { key: keyof CalendarMilestones; label: string }[] = [
    { key: 'ipa_granted_date', label: 'IPA Granted Date' },
    { key: 'fsp_granted_date', label: 'FSP Granted Date' },
    { key: 'first_board_date', label: 'First Board Date' },
    { key: 'financial_year_end', label: 'Financial Year End' },
    { key: 'incorporation_date', label: 'Incorporation Date' },
  ]

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-[14px] font-bold text-[#0B1829]">Record milestone</h4>
          <button onClick={onClose} className="text-gray-400 hover:text-[#0B1829]">
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-1">
                {f.label}
              </label>
              <input
                type="date"
                value={(form[f.key] as string) ?? ''}
                onChange={(e) => update(f.key, e.target.value)}
                className="w-full border border-[#E8EBF0] rounded-md px-2.5 py-1.5 text-[12px]"
              />
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-3 py-1.5 text-[11px] font-semibold rounded-md border border-[#E8EBF0] text-[#0B1829]"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              setSaving(true)
              try { await onSave(form) } finally { setSaving(false) }
            }}
            disabled={saving}
            className="px-3 py-1.5 text-[11px] font-semibold rounded-md bg-[#0B1829] text-white hover:bg-[#1D2D44] disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Calendar tab ──────────────────────────────────────────────

function CalendarTab({ obligations }: { obligations: Obligation[] }) {
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const byDate = useMemo(() => {
    const map = new Map<string, Obligation[]>()
    for (const o of obligations) {
      const key = o.due_date?.slice(0, 10)
      if (!key) continue
      const arr = map.get(key) ?? []
      arr.push(o)
      map.set(key, arr)
    }
    return map
  }, [obligations])

  const firstDayOffset = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleString('en', { month: 'long', year: 'numeric' })

  const goPrev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1) }
    else setViewMonth(viewMonth - 1)
  }
  const goNext = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1) }
    else setViewMonth(viewMonth + 1)
  }

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDayOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const selectedObligations = selectedDate ? byDate.get(selectedDate) ?? [] : []

  return (
    <div className="space-y-4">
      <div className="bg-white border border-[#E8EBF0] rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={goPrev} className="p-1 text-gray-500 hover:text-[#0B1829]">
            <ChevronLeft size={16} strokeWidth={1.5} />
          </button>
          <h3 className="text-[13px] font-bold text-[#0B1829]">{monthLabel}</h3>
          <button onClick={goNext} className="p-1 text-gray-500 hover:text-[#0B1829]">
            <ChevronRight size={16} strokeWidth={1.5} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-px bg-[#E8EBF0] border border-[#E8EBF0] rounded-md overflow-hidden">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="bg-[#F5F7FA] py-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400">
              {d}
            </div>
          ))}
          {cells.map((d, i) => {
            if (d === null) return <div key={i} className="bg-white min-h-[72px]" />
            const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
            const dayObligations = byDate.get(dateKey) ?? []
            const isSelected = selectedDate === dateKey
            return (
              <button
                key={i}
                onClick={() => setSelectedDate(dayObligations.length > 0 ? dateKey : null)}
                className={`bg-white min-h-[72px] p-1.5 text-left hover:bg-[#F5F7FA] transition-colors ${
                  isSelected ? 'ring-2 ring-[#0B1829] ring-inset' : ''
                }`}
              >
                <p className="text-[11px] font-semibold text-[#0B1829]">{d}</p>
                {dayObligations.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {dayObligations.slice(0, 4).map((o) => (
                      <span
                        key={o.id}
                        className={`w-1.5 h-1.5 rounded-full ${RAG_CONFIG[o.rag].dot}`}
                        title={o.title}
                      />
                    ))}
                    {dayObligations.length > 4 && (
                      <span className="text-[9px] text-gray-400">+{dayObligations.length - 4}</span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {selectedDate && selectedObligations.length > 0 && (
        <div className="bg-white border border-[#E8EBF0] rounded-lg p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-2">
            Due {formatDate(selectedDate)}
          </p>
          <ul className="divide-y divide-[#E8EBF0]">
            {selectedObligations.map((o) => (
              <li key={o.id} className="py-2 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${RAG_CONFIG[o.rag].dot}`} />
                <span className="text-[12px] text-[#0B1829]">{o.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ── Utils ─────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return iso
  }
}
