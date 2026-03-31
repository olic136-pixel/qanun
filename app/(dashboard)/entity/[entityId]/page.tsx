'use client'

import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, AlertTriangle, ChevronRight, FileText, Plus } from 'lucide-react'
import Link from 'next/link'
import { getEntity } from '@/lib/api/entities'
import { getGapAnalysis, getDocTwins, type GapItem, type DocTwin } from '@/lib/api/twins'

// ── Readiness donut ───────────────────────────────────────────

function ReadinessDot({ pct }: { pct: number }) {
  const r = 54
  const cx = 64
  const cy = 64
  const circumference = 2 * Math.PI * r
  const filled = Math.max(0, Math.min(100, pct))
  const dash = (filled / 100) * circumference
  const gap = circumference - dash

  const colour =
    filled >= 80 ? '#059669' :
    filled >= 40 ? '#0047FF' :
    '#D97706'

  const label =
    filled >= 80 ? 'Governance ready' :
    filled >= 40 ? 'In progress' :
    'Action required'

  return (
    <div className="flex flex-col items-center">
      <svg width="128" height="128" viewBox="0 0 128 128">
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="rgba(0,0,0,0.08)"
          strokeWidth="10"
        />
        {/* Filled arc */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={colour}
          strokeWidth="10"
          strokeLinecap="butt"
          strokeDasharray={`${dash} ${gap}`}
          strokeDashoffset={circumference / 4}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        {/* Centre percentage */}
        <text
          x={cx} y={cy + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontFamily: 'var(--font-inter), ui-sans-serif, sans-serif',
            fontSize: '22px',
            fontWeight: 900,
            fill: '#000000',
          }}
        >
          {filled}%
        </text>
      </svg>
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] mt-2"
         style={{ color: colour }}>
        {label}
      </p>
    </div>
  )
}

// ── Status chip ───────────────────────────────────────────────

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; colour: string; bg: string }> = {
    complete:        { label: 'Complete',        colour: '#059669', bg: 'rgba(5,150,105,0.08)' },
    current:         { label: 'Current',         colour: '#059669', bg: 'rgba(5,150,105,0.08)' },
    review_required: { label: 'Review required', colour: '#D97706', bg: 'rgba(217,119,6,0.08)' },
    stale:           { label: 'Stale',           colour: '#D97706', bg: 'rgba(217,119,6,0.08)' },
    running:         { label: 'Drafting…',       colour: '#0047FF', bg: 'rgba(0,71,255,0.08)' },
    queued:          { label: 'Queued',          colour: '#000000', bg: 'rgba(0,0,0,0.05)' },
    not_started:     { label: 'Not started',     colour: '#000000', bg: 'rgba(0,0,0,0.05)' },
    missing:         { label: 'Missing',         colour: '#000000', bg: 'rgba(0,0,0,0.05)' },
    failed:          { label: 'Failed',          colour: '#D97706', bg: 'rgba(217,119,6,0.08)' },
  }
  const s = map[status] ?? { label: status, colour: '#000000', bg: 'rgba(0,0,0,0.05)' }
  return (
    <span
      className="font-mono text-[9px] uppercase tracking-[0.15em] px-2 py-0.5"
      style={{ color: s.colour, background: s.bg }}
    >
      {s.label}
    </span>
  )
}

// ── Severity bar ──────────────────────────────────────────────

function SeverityBar({ severity }: { severity: 'high' | 'medium' | 'low' }) {
  const colour =
    severity === 'high'   ? '#D97706' :
    severity === 'medium' ? '#0047FF' :
    'rgba(0,0,0,0.15)'
  return (
    <div
      className="w-1 min-h-[44px] flex-shrink-0"
      style={{ background: colour }}
    />
  )
}

// ── Document row ──────────────────────────────────────────────

function DocRow({
  name,
  status,
  alertCount,
  href,
}: {
  name: string
  status: string
  alertCount?: number
  href?: string
}) {
  const inner = (
    <div className="flex items-center justify-between w-full py-3
                    border-b border-black/[0.06] group">
      <div className="flex items-center gap-3 min-w-0">
        <FileText
          size={12} strokeWidth={1.5}
          className="text-black/20 shrink-0"
        />
        <span className="font-mono text-[11px] text-black/55
                         group-hover:text-black transition-colors truncate
                         uppercase tracking-[0.05em]">
          {name}
        </span>
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-4">
        {alertCount && alertCount > 0 ? (
          <span className="font-mono text-[9px] px-1.5 py-0.5
                           text-[#0047FF] bg-[#0047FF]/10">
            {alertCount} alert{alertCount > 1 ? 's' : ''}
          </span>
        ) : null}
        <StatusChip status={status} />
        {href && (
          <ChevronRight
            size={12} strokeWidth={1.5}
            className="text-black/20 group-hover:text-black/50 transition-colors"
          />
        )}
      </div>
    </div>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="block hover:bg-black/[0.02] -mx-4 px-4 transition-colors"
      >
        {inner}
      </Link>
    )
  }
  return <div className="-mx-4 px-4">{inner}</div>
}

// ── Main page ─────────────────────────────────────────────────

export default function EntityDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const token =
    (session?.user as { accessToken?: string } | undefined)?.accessToken ?? ''
  const entityId = params.entityId as string

  const {
    data: entity,
    isLoading: entityLoading,
    error: entityError,
  } = useQuery({
    queryKey: ['entity', entityId],
    queryFn: () => getEntity(entityId, token),
    enabled: !!token && !!entityId,
  })

  const { data: gapData, isLoading: gapLoading } = useQuery({
    queryKey: ['gap', entityId],
    queryFn: () => getGapAnalysis(entityId, token),
    enabled: !!token && !!entityId,
  })

  const { data: twinsData, isLoading: twinsLoading } = useQuery({
    queryKey: ['doctwins', entityId],
    queryFn: () => getDocTwins(entityId, token),
    enabled: !!token && !!entityId,
  })

  const loading = entityLoading || gapLoading || twinsLoading

  if (entityError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <p className="font-mono text-[11px] text-black/40 uppercase tracking-[0.15em]">
            Entity not found
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="font-mono text-[10px] text-[#0047FF] uppercase
                       tracking-[0.15em] hover:underline"
          >
            ← Back to Quick Lookup
          </button>
        </div>
      </div>
    )
  }

  const twins: DocTwin[] = twinsData?.twins ?? []
  const totalAlerts = twins.reduce(
    (sum, t) => sum + (t.active_alert_count ?? 0), 0
  )

  const completionPct = gapData?.completion_pct ?? entity?.completion_pct ?? 0
  const completedItems: GapItem[] = gapData?.completed ?? []
  const inProgressItems: GapItem[] = gapData?.in_progress ?? []
  const staleItems: GapItem[] = gapData?.stale ?? []
  const missingItems: GapItem[] = gapData?.missing ?? []
  const totalRequired = gapData?.total_required ?? entity?.total_required ?? 0

  return (
    <div className="w-full max-w-[1000px] space-y-5">

      {/* ── Row 1: Entity header ──────────────────────── */}
      <div className="bg-white border border-black/10 px-6 py-5
                      flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 min-w-0 flex-wrap">
          {loading ? (
            <div className="h-6 w-56 bg-black/5 animate-pulse" />
          ) : (
            <>
              <h1 className="text-[18px] font-black uppercase tracking-tighter
                             text-black truncate">
                {entity?.entity_name ?? '—'}
              </h1>
              <span className="font-mono text-[10px] uppercase tracking-[0.15em]
                               text-black/30 border border-black/10 px-2 py-0.5 shrink-0">
                {entity?.target_jurisdiction ?? '—'}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.15em]
                               text-black/30 shrink-0">
                {entity?.entity_type ?? '—'}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href={`/compliance/documents/new?entity_id=${entityId}`}
            className="font-mono text-[10px] uppercase tracking-[0.1em]
                       border border-black/15 px-3 py-1.5 text-black/40
                       hover:border-black hover:text-black transition-all
                       flex items-center gap-1.5"
          >
            <Plus size={10} strokeWidth={1.5} />
            New document
          </Link>
          <Link
            href={`/compliance/governance-suite?entity_id=${entityId}`}
            className="font-mono text-[10px] uppercase tracking-[0.1em]
                       bg-black text-white px-3 py-1.5
                       hover:bg-[#0047FF] transition-colors"
          >
            Governance suite →
          </Link>
        </div>
      </div>

      {/* ── Row 2: KPI tiles ──────────────────────────── */}
      <div className="grid grid-cols-4 gap-px bg-black/10 border border-black/10">
        {[
          {
            value: loading ? '—' : `${Math.round(completionPct)}%`,
            label: 'Governance readiness',
            colour:
              completionPct >= 80 ? '#059669' :
              completionPct >= 40 ? '#0047FF' :
              '#D97706',
          },
          {
            value: loading ? '—' : String(completedItems.length),
            label: 'Documents complete',
            colour: '#000000',
          },
          {
            value: loading ? '—' : String(totalAlerts),
            label: 'Active alerts',
            colour: totalAlerts > 0 ? '#0047FF' : '#000000',
          },
          {
            value: loading ? '—' : String(totalRequired),
            label: 'Total required',
            colour: '#000000',
          },
        ].map((tile, i) => (
          <div key={i} className="bg-white px-6 py-5">
            <p
              className="text-[32px] font-black leading-none tracking-tighter mb-1"
              style={{ color: tile.colour }}
            >
              {tile.value}
            </p>
            <p className="font-mono text-[10px] text-black/30 uppercase tracking-[0.15em]">
              {tile.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Row 3: Donut + document breakdown ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-5">

        {/* Left — donut + legend */}
        <div className="bg-white border border-black/10 flex flex-col
                        items-center justify-center px-6 py-8">
          {loading ? (
            <div className="w-[128px] h-[128px] bg-black/5 animate-pulse" />
          ) : (
            <ReadinessDot pct={Math.round(completionPct)} />
          )}
          {!loading && (
            <div className="mt-6 w-full space-y-2.5">
              {[
                { label: 'Complete',     count: completedItems.length,  colour: '#059669' },
                { label: 'In progress',  count: inProgressItems.length, colour: '#0047FF' },
                { label: 'Needs review', count: staleItems.length,      colour: '#D97706' },
                { label: 'Missing',      count: missingItems.length,    colour: 'rgba(0,0,0,0.18)' },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: row.colour }}
                    />
                    <span className="font-mono text-[9px] text-black/35
                                     uppercase tracking-[0.15em]">
                      {row.label}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-black/55">
                    {row.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — document list */}
        <div className="bg-white border border-black/10 px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[12px] font-black uppercase tracking-tighter text-black">
              Document status
            </h3>
            <Link
              href={`/compliance/documents?entity_id=${entityId}`}
              className="font-mono text-[10px] text-[#0047FF] uppercase
                         tracking-[0.15em] hover:underline"
            >
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-9 bg-black/5 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="max-h-[360px] overflow-y-auto">

              {completedItems.length > 0 && (
                <div className="mb-2">
                  <p className="font-mono text-[9px] text-black/20 uppercase
                                tracking-[0.2em] mb-1 pt-1">
                    Complete ({completedItems.length})
                  </p>
                  {completedItems.slice(0, 6).map((doc, i) => (
                    <DocRow
                      key={i}
                      name={doc.display_name}
                      status="complete"
                      alertCount={doc.active_alert_count}
                      href={doc.twin_id ? `/twins/${doc.twin_id}` : undefined}
                    />
                  ))}
                  {completedItems.length > 6 && (
                    <p className="font-mono text-[9px] text-black/20 uppercase
                                  tracking-[0.15em] py-2">
                      +{completedItems.length - 6} more
                    </p>
                  )}
                </div>
              )}

              {inProgressItems.length > 0 && (
                <div className="mb-2 mt-4">
                  <p className="font-mono text-[9px] text-black/20 uppercase
                                tracking-[0.2em] mb-1">
                    In progress ({inProgressItems.length})
                  </p>
                  {inProgressItems.map((doc, i) => (
                    <DocRow
                      key={i}
                      name={doc.display_name}
                      status={doc.status ?? 'running'}
                      alertCount={doc.active_alert_count}
                      href={doc.twin_id ? `/twins/${doc.twin_id}` : undefined}
                    />
                  ))}
                </div>
              )}

              {staleItems.length > 0 && (
                <div className="mb-2 mt-4">
                  <p className="font-mono text-[9px] text-black/20 uppercase
                                tracking-[0.2em] mb-1">
                    Needs review ({staleItems.length})
                  </p>
                  {staleItems.map((doc, i) => (
                    <DocRow
                      key={i}
                      name={doc.display_name}
                      status="stale"
                      alertCount={doc.active_alert_count}
                      href={doc.twin_id ? `/twins/${doc.twin_id}` : undefined}
                    />
                  ))}
                </div>
              )}

              {missingItems.length > 0 && (
                <div className="mt-4">
                  <p className="font-mono text-[9px] text-black/20 uppercase
                                tracking-[0.2em] mb-1">
                    Missing ({missingItems.length})
                  </p>
                  {missingItems.slice(0, 8).map((doc, i) => (
                    <DocRow
                      key={i}
                      name={doc.display_name}
                      status="missing"
                    />
                  ))}
                  {missingItems.length > 8 && (
                    <p className="font-mono text-[9px] text-black/20 uppercase
                                  tracking-[0.15em] py-2">
                      +{missingItems.length - 8} more
                    </p>
                  )}
                </div>
              )}

              {completedItems.length === 0 &&
               inProgressItems.length === 0 &&
               staleItems.length === 0 &&
               missingItems.length === 0 && (
                <div className="flex flex-col items-center justify-center
                                py-12 text-center">
                  <p className="font-mono text-[10px] text-black/25 uppercase
                                tracking-[0.2em] mb-3">
                    No documents yet
                  </p>
                  <Link
                    href={`/compliance/governance-suite?entity_id=${entityId}`}
                    className="font-mono text-[10px] text-[#0047FF] uppercase
                               tracking-[0.15em] hover:underline"
                  >
                    Start governance suite →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 4: Active alerts (conditional) ───────── */}
      {!loading && totalAlerts > 0 && (
        <div className="bg-white border border-black/10 px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <AlertTriangle
                size={14} strokeWidth={1.5}
                className="text-[#D97706]"
              />
              <h3 className="text-[12px] font-black uppercase tracking-tighter text-black">
                Active alerts
              </h3>
              <span className="font-mono text-[9px] px-2 py-0.5
                               text-[#0047FF] bg-[#0047FF]/10">
                {totalAlerts}
              </span>
            </div>
            <Link
              href="/alerts"
              className="font-mono text-[10px] text-[#0047FF] uppercase
                         tracking-[0.15em] hover:underline"
            >
              View all →
            </Link>
          </div>

          <div className="space-y-2">
            {twins
              .filter(t => (t.active_alert_count ?? 0) > 0)
              .map(twin => (
                <Link
                  key={twin.twin_id}
                  href={`/twins/${twin.twin_id}`}
                  className="flex items-stretch border border-black/10
                             hover:border-[#0047FF]/30 transition-colors
                             overflow-hidden group"
                >
                  <SeverityBar severity="medium" />
                  <div className="flex items-center justify-between
                                  flex-1 px-4 py-3">
                    <div>
                      <p className="font-mono text-[11px] text-black/65
                                    uppercase tracking-[0.08em]
                                    group-hover:text-black transition-colors">
                        {twin.display_name}
                      </p>
                      <p className="font-mono text-[10px] text-black/25
                                    mt-0.5 uppercase tracking-[0.1em]">
                        {twin.active_alert_count} open alert
                        {twin.active_alert_count > 1 ? 's' : ''}
                      </p>
                    </div>
                    <ChevronRight
                      size={13} strokeWidth={1.5}
                      className="text-black/20 group-hover:text-black/50
                                 transition-colors"
                    />
                  </div>
                </Link>
              ))
            }
          </div>
        </div>
      )}

      {/* ── Row 5: Quick actions ──────────────────────── */}
      <div className="grid grid-cols-3 gap-px bg-black/10 border border-black/10">
        {[
          {
            label: 'Draft new document',
            mono: 'Compliance Studio',
            href: `/compliance/documents/new?entity_id=${entityId}`,
          },
          {
            label: 'Governance suite',
            mono: '5 tiers · 112 templates',
            href: `/compliance/governance-suite?entity_id=${entityId}`,
          },
          {
            label: 'Submission package',
            mono: 'FSRA application',
            href: `/compliance/submission?entity_id=${entityId}`,
          },
        ].map((action, i) => (
          <Link
            key={i}
            href={action.href}
            className="bg-white px-5 py-4 flex items-center justify-between
                       group hover:bg-black/[0.02] transition-colors"
          >
            <div>
              <p className="text-[13px] font-black uppercase tracking-tighter
                             text-black group-hover:text-[#0047FF] transition-colors">
                {action.label}
              </p>
              <p className="font-mono text-[10px] text-black/25 uppercase
                             tracking-[0.12em] mt-0.5">
                {action.mono}
              </p>
            </div>
            <ChevronRight
              size={14} strokeWidth={1.5}
              className="text-black/15 group-hover:text-[#0047FF]
                         transition-colors shrink-0"
            />
          </Link>
        ))}
      </div>

    </div>
  )
}
