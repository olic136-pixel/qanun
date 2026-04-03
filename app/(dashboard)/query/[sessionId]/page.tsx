'use client'

import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { useQueryStream } from '@/lib/hooks/useQueryStream'
import { getSession, type SessionDetail, type ClaimObject } from '@/lib/api/query'
import { useEffect, useState, useMemo } from 'react'
import { MarkdownRenderer } from '@/components/qanun/MarkdownRenderer'
import { CorpusPanel } from '@/components/qanun/CorpusPanel'
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  ArrowLeft,
  FileText,
  Shield,
  BarChart3,
  AlertTriangle,
  Download,
  ExternalLink,
} from 'lucide-react'
import { getProjects, type ProjectListItem } from '@/lib/api/projects'
import { FolderOpen, RotateCcw, FileEdit } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// Display sections derived from agent_outputs keys
const OUTPUT_SECTIONS: Record<
  string,
  { label: string; icon: React.ElementType; color: string; hidden?: boolean }
> = {
  final_output: { label: 'Analysis', icon: FileText, color: 'text-[#0B1829]' },
  grounding_result: { label: 'Grounding', icon: Shield, color: 'text-[#0F7A5F]' },
  token_usage: { label: 'Token Usage', icon: BarChart3, color: 'text-gray-600' },
  // Internal fields — hide from display
  session_id: { label: 'Session ID', icon: FileText, color: 'text-gray-400', hidden: true },
  query_type: { label: 'Query Type', icon: FileText, color: 'text-gray-400', hidden: true },
  claim_ids: { label: 'Claim IDs', icon: FileText, color: 'text-gray-400', hidden: true },
  error: { label: 'Error', icon: AlertTriangle, color: 'text-[#991B1B]', hidden: true },
}

const CONFIDENCE_COLORS: Record<string, string> = {
  VERIFIED: 'bg-[#0F7A5F]/10 text-[#0F7A5F] border-[#0F7A5F]/20',
  SUPPORTED: 'bg-[#0047FF]/10 text-[#0047FF] border-[#0047FF]/20',
  INFERRED: 'bg-[#C4922A]/10 text-[#C4922A] border-[#C4922A]/20',
  CONTESTED: 'bg-red-100 text-[#991B1B] border-red-200',
}

function parseOutputValue(key: string, raw: unknown): string {
  if (raw === null || raw === undefined) return ''
  const str = typeof raw === 'string' ? raw : JSON.stringify(raw, null, 2)

  if (key === 'grounding_result') {
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
      if (parsed && typeof parsed === 'object') {
        const p = parsed as Record<string, unknown>
        const ratio = p.grounded_ratio
          ? `${Math.round((p.grounded_ratio as number) * 100)}%`
          : 'N/A'
        const grounded = p.grounded_count ?? '?'
        const total = p.total_count ?? '?'
        const status = p.held_for_review ? '⚠️ HELD FOR REVIEW' : '✓ Passed'
        const ungrounded = Array.isArray(p.ungrounded_claims)
          ? p.ungrounded_claims.length
          : 0
        return `Grounding ratio: ${ratio} (${grounded}/${total} claims grounded)\nStatus: ${status}\nUngrounded assertions: ${ungrounded}`
      }
    } catch {
      /* fall through */
    }
  }

  if (key === 'token_usage') {
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
      if (parsed && typeof parsed === 'object') {
        const entries = Object.entries(parsed as Record<string, { input: number; output: number }>)
        let totalIn = 0
        let totalOut = 0
        const lines = entries.map(([agent, usage]) => {
          const inp = usage?.input ?? 0
          const out = usage?.output ?? 0
          totalIn += inp
          totalOut += out
          return `${agent}: ${inp.toLocaleString()} in / ${out.toLocaleString()} out`
        })
        lines.push(`\nTotal: ${totalIn.toLocaleString()} in / ${totalOut.toLocaleString()} out`)
        return lines.join('\n')
      }
    } catch {
      /* fall through */
    }
  }

  return str
}

export default function SessionDetailPage() {
  const { data: authSession } = useSession()
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string
  const token = authSession?.user?.accessToken as string | null

  const [sessionData, setSessionData] = useState<SessionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['final_output'])
  )
  const [activeCitation, setActiveCitation] = useState<string | null>(null)
  const [copiedClaim, setCopiedClaim] = useState<string | null>(null)
  const [exportLoading, setExportLoading] = useState<'docx' | 'pdf' | false>(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [startTime] = useState(Date.now())
  const [saveProjectOpen, setSaveProjectOpen]       = useState(false)
  const [projects, setProjects]                     = useState<ProjectListItem[]>([])
  const [projectsLoading, setProjectsLoading]       = useState(false)
  const [savedToProject, setSavedToProject]         = useState(false)

  // Request notification permission
  useEffect(() => {
    if (typeof window === 'undefined') return
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Dynamic page title
  useEffect(() => {
    if (sessionData?.query_text) {
      const t = sessionData.query_text.length > 60
        ? sessionData.query_text.slice(0, 60) + '...'
        : sessionData.query_text
      document.title = `${t} — QANUN`
    }
    return () => { document.title = 'QANUN — Regulatory Intelligence' }
  }, [sessionData?.query_text])

  // Determine whether to stream
  const shouldStream =
    sessionData?.status === 'running' ||
    sessionData?.status === 'pending' ||
    (!sessionData && !error)

  const stream = useQueryStream(
    shouldStream ? sessionId : null,
    shouldStream ? token : null
  )

  // Fetch existing session data on mount
  useEffect(() => {
    if (!sessionId || !token) return

    const fetchSession = async () => {
      try {
        const data = await getSession(sessionId, token)
        setSessionData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load session')
      } finally {
        setLoading(false)
      }
    }

    fetchSession()
  }, [sessionId, token])

  // When stream completes, refresh session data
  useEffect(() => {
    if (stream.status === 'complete' && token) {
      getSession(sessionId, token)
        .then((data) => setSessionData(data))
        .catch(() => {})
    }
  }, [stream.status, sessionId, token])

  // Polling fallback — catches completion even if SSE stream misses it
  useEffect(() => {
    if (!sessionId || !token) return
    if (sessionData?.status === 'complete' || sessionData?.status === 'error') return

    const interval = setInterval(async () => {
      try {
        const data = await getSession(sessionId, token)
        if (data.status === 'complete' || data.status === 'error') {
          setSessionData(data)
        }
      } catch { /* ignore */ }
    }, 8_000)

    return () => clearInterval(interval)
  }, [sessionId, token, sessionData?.status])

  // Elapsed timer while running
  const stillRunning = sessionData?.status !== 'complete' && sessionData?.status !== 'error' &&
    (sessionData?.status === 'running' || sessionData?.status === 'pending' ||
    stream.status === 'running' || stream.status === 'connecting')
  useEffect(() => {
    if (!stillRunning) return
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [stillRunning, startTime])

  // Browser notification on completion
  useEffect(() => {
    if (sessionData?.status !== 'complete') return
    if (typeof document !== 'undefined' && document.hidden && 'Notification' in window && Notification.permission === 'granted') {
      const query = sessionData.query_text?.slice(0, 60) ?? 'Your research'
      new Notification('QANUN Research Complete', {
        body: `"${query}..." — ${sessionData.claims_count} claims extracted`,
        icon: '/favicon.ico',
        tag: sessionData.session_id,
      })
    }
  }, [sessionData?.status, sessionData?.query_text, sessionData?.claims_count, sessionData?.session_id])

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const copyClaim = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedClaim(id)
    setTimeout(() => setCopiedClaim(null), 2000)
  }

  async function handleExport(format: 'docx' | 'pdf') {
    if (!token) return
    setExportLoading(format)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/sessions/${sessionId}/export?format=${format}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `QANUN-research-${sessionId.slice(0, 8)}.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Export error:', e)
    } finally {
      setExportLoading(false)
    }
  }

  async function openSaveToProject() {
    if (!token) return
    setSaveProjectOpen(true)
    setSavedToProject(false)
    setProjectsLoading(true)
    try {
      const list = await getProjects(token)
      setProjects(Array.isArray(list) ? list : [])
    } catch {
      setProjects([])
    } finally {
      setProjectsLoading(false)
    }
  }

  function handleRerun() {
    if (!sessionData?.query_text) return
    router.push(`/query?q=${encodeURIComponent(sessionData.query_text)}`)
  }

  function handleDraftDocuments() {
    router.push(`/compliance/documents?from_session=${sessionId}`)
  }

  useEffect(() => {
    if (!saveProjectOpen) return
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest('[data-project-dropdown]')) {
        setSaveProjectOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [saveProjectOpen])

  // Derive display state
  const isComplete =
    sessionData?.status === 'complete' || stream.status === 'complete'
  const isRunning =
    !isComplete &&
    (stream.status === 'running' || stream.status === 'connecting' ||
    sessionData?.status === 'running')
  const isError =
    sessionData?.status === 'error' || stream.status === 'error'

  const MILESTONES = [
    { at: 0, label: 'Connecting to corpus…', detail: 'Initialising MALIS pipeline' },
    { at: 5, label: 'Retrieving relevant provisions…', detail: 'Vector search across 63,397 sections' },
    { at: 20, label: 'Running legal analysis…', detail: 'Analyst agent examining provisions' },
    { at: 40, label: "Devil's advocate review…", detail: 'Challenging the initial analysis' },
    { at: 60, label: 'Lateral thinking…', detail: 'Exploring comparative frameworks' },
    { at: 90, label: 'Stress testing…', detail: 'RSA and Stress Tester agents' },
    { at: 130, label: 'Synthesising research note…', detail: 'Orchestrator compiling final output' },
    { at: 180, label: 'Grounding and verification…', detail: 'Checking claims against corpus' },
    { at: 240, label: 'Finalising…', detail: 'Almost ready' },
  ]
  const currentMilestone = [...MILESTONES].reverse().find((m) => elapsedSeconds >= m.at) ?? MILESTONES[0]
  const progressPct = isComplete ? 100 : Math.min(95, (elapsedSeconds / 300) * 100)

  const claims: ClaimObject[] = sessionData?.claims ?? []

  // Extract the main analysis text from final_output
  const analysisText = useMemo(() => {
    const outputs = sessionData?.agent_outputs ?? {}
    const finalOutput = outputs.final_output
    if (!finalOutput) return stream.compressedDigest || null

    const raw = typeof finalOutput === 'string' ? finalOutput : String(finalOutput)
    return raw
  }, [sessionData?.agent_outputs, stream.compressedDigest])

  // Get displayable output sections (excluding hidden and final_output which is shown separately)
  const displaySections = useMemo(() => {
    const outputs = isComplete
      ? (sessionData?.agent_outputs ?? {})
      : Object.fromEntries(
          Object.entries(stream.agentUpdates).map(([k, v]) => [k, v.output])
        )

    return Object.entries(outputs).filter(([key]) => {
      const meta = OUTPUT_SECTIONS[key]
      if (meta?.hidden) return false
      if (key === 'final_output') return false // shown in main analysis card
      return true
    })
  }, [isComplete, sessionData?.agent_outputs, stream.agentUpdates])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        {/* Top row: breadcrumb + actions */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.push('/sessions')}
            className="flex items-center gap-1.5 font-mono text-[10px] text-black/30
                       uppercase tracking-[0.2em] hover:text-black/60 transition-colors"
          >
            <ArrowLeft size={11} strokeWidth={1.5} />
            Sessions
          </button>

          {/* Action buttons — shown when session is complete */}
          {isComplete && (
            <div className="flex items-center gap-2">
              {/* Re-run */}
              <button
                onClick={handleRerun}
                className="flex items-center gap-1.5 font-mono text-[10px] uppercase
                           tracking-[0.1em] text-black/40 border border-black/15 px-3 py-1.5
                           hover:border-black/40 hover:text-black/70 transition-colors"
              >
                <RotateCcw size={10} strokeWidth={1.5} />
                Re-run
              </button>

              {/* Draft Documents */}
              <button
                onClick={handleDraftDocuments}
                className="flex items-center gap-1.5 font-mono text-[10px] uppercase
                           tracking-[0.1em] text-black/40 border border-black/15 px-3 py-1.5
                           hover:border-black/40 hover:text-black/70 transition-colors"
              >
                <FileEdit size={10} strokeWidth={1.5} />
                Draft Documents
              </button>

              {/* Save to Project */}
              <div className="relative" data-project-dropdown>
                <button
                  onClick={openSaveToProject}
                  className="flex items-center gap-1.5 font-mono text-[10px] uppercase
                             tracking-[0.1em] text-black/40 border border-black/15 px-3 py-1.5
                             hover:border-black/40 hover:text-black/70 transition-colors"
                >
                  <FolderOpen size={10} strokeWidth={1.5} />
                  {savedToProject ? 'Saved ✓' : 'Save to Project'}
                </button>
                {saveProjectOpen && (
                  <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-black/15
                                  shadow-lg min-w-[240px]">
                    <div className="px-4 py-2 border-b border-black/10">
                      <p className="font-mono text-[9px] text-black/30 uppercase tracking-[0.2em]">
                        Add to project
                      </p>
                    </div>
                    {projectsLoading ? (
                      <div className="px-4 py-3 flex items-center gap-2">
                        <Loader2 size={11} className="animate-spin text-black/30" />
                        <span className="font-mono text-[10px] text-black/30">Loading…</span>
                      </div>
                    ) : projects.length === 0 ? (
                      <div className="px-4 py-3">
                        <p className="font-mono text-[10px] text-black/30">No projects yet.</p>
                      </div>
                    ) : (
                      <div className="max-h-[200px] overflow-y-auto">
                        {projects.map(p => (
                          <button
                            key={p.project_id}
                            onClick={() => {
                              setSaveProjectOpen(false)
                              setSavedToProject(true)
                              router.push(`/projects/${p.project_id}`)
                            }}
                            className="w-full text-left px-4 py-2.5 border-b border-black/5 last:border-0
                                       hover:bg-black/[0.03] transition-colors"
                          >
                            <p className="font-mono text-[11px] text-black/70 uppercase
                                         tracking-[0.05em] truncate">
                              {p.title}
                            </p>
                            <p className="font-mono text-[9px] text-black/25 mt-0.5">
                              {p.cycle_count} cycle{p.cycle_count !== 1 ? 's' : ''}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setSaveProjectOpen(false)
                        router.push('/projects/new')
                      }}
                      className="w-full text-left px-4 py-2.5 border-t border-black/10
                                 hover:bg-black/[0.03] transition-colors"
                    >
                      <span className="font-mono text-[10px] text-[#0047FF] uppercase tracking-[0.1em]">
                        + New project
                      </span>
                    </button>
                    <button
                      onClick={() => setSaveProjectOpen(false)}
                      className="absolute top-2 right-3 font-mono text-[10px] text-black/25
                                 hover:text-black/50 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Export */}
              <div className="flex items-center">
                <button
                  onClick={() => handleExport('docx')}
                  disabled={!!exportLoading}
                  className="flex items-center gap-1.5 font-mono text-[10px] uppercase
                             tracking-[0.1em] text-black/40 border border-black/15 px-3 py-1.5
                             hover:border-black/40 hover:text-black/70 transition-colors
                             disabled:opacity-40 border-r-0"
                >
                  {exportLoading === 'docx' ? <Loader2 size={10} className="animate-spin" /> : null}
                  Word
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  disabled={!!exportLoading}
                  className="flex items-center gap-1.5 font-mono text-[10px] uppercase
                             tracking-[0.1em] text-black/40 border border-black/15 px-3 py-1.5
                             hover:border-black/40 hover:text-black/70 transition-colors
                             disabled:opacity-40"
                >
                  {exportLoading === 'pdf' ? <Loader2 size={10} className="animate-spin" /> : null}
                  PDF
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Query title */}
        <h1 className="font-black text-[18px] uppercase tracking-tight text-black
                       leading-tight mb-3">
          {sessionData?.query_text ?? 'Query session'}
        </h1>

        {/* Meta row */}
        <div className="flex items-center gap-3">
          {sessionData?.jurisdictions?.map((j) => (
            <span key={j} className="font-mono text-[10px] text-black/40 uppercase
                                     tracking-[0.1em] border border-black/15 px-2 py-0.5">
              {j}
            </span>
          ))}
          <span className="font-mono text-[10px] text-black/25">
            {sessionData?.created_at
              ? new Date(sessionData.created_at).toLocaleString()
              : ''}
          </span>
        </div>
      </div>

      {/* Progress — milestone display while running */}
      {isRunning && (
        <div className="bg-white border border-[#E8EBF0] rounded-xl p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 text-[#1A5FA8] animate-spin flex-shrink-0" strokeWidth={1.5} />
              <span className="text-[14px] font-medium text-[#0B1829]">
                {currentMilestone.label}
              </span>
            </div>
            <span className="text-[12px] text-[#9CA3AF] font-mono">
              {Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, '0')}
            </span>
          </div>
          <p className="text-[12px] text-[#6B7280] mb-4 ml-[26px]">
            {currentMilestone.detail}
          </p>
          <div className="h-[3px] bg-[#E8EBF0] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1A5FA8] rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex items-center gap-1.5 mt-4">
            {MILESTONES.slice(0, 8).map((m, i) => (
              <div
                key={i}
                className={`h-[5px] flex-1 rounded-full transition-all duration-500 ${
                  elapsedSeconds >= m.at ? 'bg-[#1A5FA8]' : 'bg-[#E8EBF0]'
                }`}
              />
            ))}
          </div>
          <p className="text-[11px] text-[#9CA3AF] mt-3 text-center">
            Research continues in the background — you can navigate away and return when complete.
          </p>
        </div>
      )}
      {isError && !isComplete && (
        <div className="mb-4">
          <div className="h-[4px] bg-[#991B1B] rounded-full mb-2" />
          {stream.error && (
            <p className="text-[12px] text-[#991B1B]">{stream.error}</p>
          )}
        </div>
      )}

      {/* Complete banner */}
      {isComplete && (
        <Card className="p-4 mb-6 border-[#0F7A5F]/30 bg-[#0F7A5F]/5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#0F7A5F]" />
            <span className="text-[13px] font-medium text-[#0F7A5F]">
              Analysis complete — {claims.length} claims extracted
            </span>
          </div>
        </Card>
      )}

      {/* Error state */}
      {error && (
        <div className="border border-black/15 bg-white px-5 py-4 mb-6">
          <div className="flex items-start gap-3">
            <XCircle size={14} className="text-[#991B1B] shrink-0 mt-0.5" strokeWidth={1.5} />
            <div className="flex-1">
              <p className="font-mono text-[11px] text-black/60 uppercase tracking-[0.1em] mb-2">
                The research pipeline was unavailable. Your query has been saved.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRerun}
                  className="font-mono text-[10px] text-white uppercase tracking-[0.1em]
                             bg-black px-4 py-2 hover:bg-[#0047FF] transition-colors"
                >
                  Retry →
                </button>
                <button
                  onClick={() => router.push(`/dashboard?q=${encodeURIComponent(sessionData?.query_text ?? '')}`)}
                  className="font-mono text-[10px] text-black/40 uppercase tracking-[0.1em]
                             border border-black/15 px-4 py-2 hover:border-black/40 transition-colors"
                >
                  Try Quick Lookup →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Analysis + output sections */}
        <div className="lg:col-span-2 space-y-4">
          {/* Main analysis */}
          {analysisText && (
            <Card className="p-6">
              <h2 className="text-[14px] font-semibold text-gray-900 mb-3">
                Analysis
              </h2>
              <MarkdownRenderer
                content={analysisText}
                className="max-w-none"
                onCitationClick={(citation) => setActiveCitation(citation)}
              />
            </Card>
          )}

          {/* Output sections (grounding, token usage, etc.) */}
          <div className="space-y-3">
            {displaySections.map(([key, output]) => {
              const meta = OUTPUT_SECTIONS[key] ?? {
                label: key,
                icon: FileText,
                color: 'text-gray-600',
              }
              const Icon = meta.icon
              const isExpanded = expandedSections.has(key)
              const displayText = parseOutputValue(key, output)

              return (
                <Card key={key} className="overflow-hidden">
                  <button
                    onClick={() => toggleSection(key)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded ${meta.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-[14px] font-medium text-gray-900">
                        {meta.label}
                      </span>
                      <CheckCircle2 className="h-4 w-4 text-[#0F7A5F]" />
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t">
                      <div className="pt-3 text-[13px] text-gray-700 whitespace-pre-wrap font-mono">
                        {displayText}
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>

          {/* Running placeholder */}
          {isRunning && (
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Loader2 className="h-5 w-5 text-[#0B1829] animate-spin" />
                <span className="text-[14px] font-medium text-gray-700">
                  MALIS pipeline processing…
                </span>
              </div>
              <div className="space-y-3">
                {['Retrieving corpus documents', 'Running legal analysis', 'Cross-jurisdiction comparison', 'Grounding verification', 'Synthesising output'].map(
                  (step, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-[12px] text-gray-400"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-pulse" />
                      {step}
                    </div>
                  )
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Right: Reference Material panel */}
        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="text-[14px] font-semibold text-gray-900 mb-3">
              Reference Material
              {claims.length > 0 && (
                <Badge variant="outline" className="ml-2 text-[11px]">
                  {claims.length}
                </Badge>
              )}
            </h2>

            {claims.length === 0 && !isRunning && (
              <p className="text-[13px] text-gray-500">
                {isComplete
                  ? 'No reference material extracted.'
                  : 'Reference material will appear when the analysis completes.'}
              </p>
            )}

            {isRunning && claims.length === 0 && (
              <div className="flex items-center gap-2 text-[13px] text-gray-500">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {stream.claimsTotal > 0
                    ? `${stream.claimsTotal} claims found so far…`
                    : 'Waiting for pipeline…'}
                </span>
              </div>
            )}

            <div className="space-y-4 mt-2 max-h-[600px] overflow-y-auto pr-1">
              {(['VERIFIED', 'SUPPORTED', 'INFERRED', 'CONTESTED'] as const).map(tier => {
                const tierClaims = claims.filter(c => c.confidence_tier === tier)
                if (tierClaims.length === 0) return null
                const tierColors: Record<string, string> = {
                  VERIFIED:  'text-[#059669] border-[#059669]/20 bg-[#059669]/5',
                  SUPPORTED: 'text-[#0047FF] border-[#0047FF]/20 bg-[#0047FF]/5',
                  INFERRED:  'text-[#D97706] border-[#D97706]/20 bg-[#D97706]/5',
                  CONTESTED: 'text-[#991B1B] border-[#991B1B]/20 bg-[#991B1B]/5',
                }
                return (
                  <div key={tier}>
                    <div className={`flex items-center gap-2 px-2.5 py-1.5 border mb-2 ${tierColors[tier]}`}>
                      <span className={`font-mono text-[9px] uppercase tracking-[0.2em] font-bold`}>
                        {tier}
                      </span>
                      <span className="font-mono text-[9px] opacity-60">
                        {tierClaims.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {tierClaims.map((claim) => (
                        <div key={claim.claim_id} className="border border-black/10 p-3 bg-white">
                          <p className="font-mono text-[11px] text-black/70 leading-relaxed mb-2">
                            {claim.claim_text}
                          </p>
                          {claim.section_ref && (
                            <div className="flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => setActiveCitation(claim.section_ref)}
                                className="font-mono text-[10px] text-[#0047FF] hover:text-black
                                           transition-colors uppercase tracking-[0.05em]"
                              >
                                {claim.section_ref}
                              </button>
                              <button
                                type="button"
                                onClick={() => router.push(
                                  `/corpus?section_ref=${encodeURIComponent(claim.section_ref)}`
                                )}
                                className="font-mono text-[9px] text-black/25 hover:text-black/50
                                           uppercase tracking-[0.1em] flex items-center gap-1 transition-colors"
                              >
                                <ExternalLink size={9} strokeWidth={1.5} />
                                corpus
                              </button>
                            </div>
                          )}
                          {!claim.section_ref && (
                            <p className="font-mono text-[9px] text-black/20 uppercase tracking-[0.1em]">
                              {claim.agent_name}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      </div>
      <CorpusPanel
        citation={activeCitation}
        onClose={() => setActiveCitation(null)}
      />
    </div>
  )
}
