'use client'

import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import {
  getProject,
  startCycle,
  exportToObsidian,
  exportMemo,
  getAnnotations,
  type ProjectDetail,
  type ProjectClaim,
  type VaultAnnotation,
} from '@/lib/api/projects'
import { MarkdownRenderer } from '@/components/qanun/MarkdownRenderer'
import { CorpusPanel } from '@/components/qanun/CorpusPanel'
import ConfidenceGauge from '@/components/qanun/ConfidenceGauge'
import {
  ArrowLeft,
  Loader2,
  Download,
  Play,
  FileText,
  ChevronRight,
  MessageCircleQuestion,
  X,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Pending', cls: 'bg-gray-100 text-gray-600' },
  running: { label: 'Running', cls: 'bg-blue-50 text-[#1A5FA8] animate-pulse' },
  complete: { label: 'Complete', cls: 'bg-[#0F7A5F]/10 text-[#0F7A5F]' },
  error: { label: 'Error', cls: 'bg-red-50 text-[#991B1B]' },
}

const TIER_COLOURS: Record<string, string> = {
  VERIFIED: 'bg-[#0F7A5F]/10 text-[#0F7A5F] border-[#0F7A5F]/20',
  SUPPORTED: 'bg-[#0047FF]/10 text-[#0047FF] border-[#0047FF]/20',
  INFERRED: 'bg-[#C4922A]/10 text-[#C4922A] border-[#C4922A]/20',
  SPECULATIVE: 'bg-gray-100 text-gray-500 border-gray-200',
  CONTESTED: 'bg-red-50 text-[#991B1B] border-red-200',
}

export default function ProjectDetailPage() {
  const { data: authSession } = useSession()
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const token = authSession?.user?.accessToken as string | null

  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeCitation, setActiveCitation] = useState<string | null>(null)

  // Modal state
  const [showCycleModal, setShowCycleModal] = useState(false)
  const [cycleQuestion, setCycleQuestion] = useState('')
  const [annotations, setAnnotations] = useState<VaultAnnotation[]>([])
  const [cycleSubmitting, setCycleSubmitting] = useState(false)
  const [cycleError, setCycleError] = useState<string | null>(null)

  // Export state
  const [exportLoading, setExportLoading] = useState(false)
  const [memoLoading, setMemoLoading] = useState(false)

  // Claim filters
  const [tierFilter, setTierFilter] = useState<string>('All')
  const [cycleFilter, setCycleFilter] = useState<number | null>(null)

  const fetchProject = useCallback(async () => {
    if (!token) return
    try {
      const data = await getProject(projectId, token)
      setProject(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project')
    } finally {
      setLoading(false)
    }
  }, [projectId, token])

  useEffect(() => { fetchProject() }, [fetchProject])

  // Poll while any cycle is pending/running
  useEffect(() => {
    if (!project) return
    const hasActive = project.cycles.some(
      (c) => c.status === 'pending' || c.status === 'running'
    )
    if (!hasActive) return
    const interval = setInterval(fetchProject, 10_000)
    return () => clearInterval(interval)
  }, [project, fetchProject])

  const handleStartCycle = async () => {
    if (!token || cycleQuestion.trim().length < 20) return
    setCycleSubmitting(true)
    setCycleError(null)
    try {
      await startCycle(projectId, { focus_question: cycleQuestion.trim() }, token)
      setShowCycleModal(false)
      setCycleQuestion('')
      fetchProject()
    } catch (err) {
      setCycleError(err instanceof Error ? err.message : 'Failed to start cycle')
    } finally {
      setCycleSubmitting(false)
    }
  }

  const handleExport = async () => {
    if (!token) return
    setExportLoading(true)
    try {
      const result = await exportToObsidian(projectId, token)
      if (result instanceof Blob) {
        const url = URL.createObjectURL(result)
        const a = document.createElement('a')
        a.href = url
        a.download = `qanun-${projectId.slice(0, 8)}.zip`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch {
      // Error handled silently — API returns structured response
    } finally {
      setExportLoading(false)
    }
  }

  const handleExportMemo = async () => {
    if (!token) return
    setMemoLoading(true)
    try {
      const memoText = await exportMemo(projectId, token)
      const blob = new Blob([memoText], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `QANUN-memo-${projectId.slice(0, 8)}.txt`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // Silent fail — user sees no download
    } finally {
      setMemoLoading(false)
    }
  }

  const openCycleModal = async (prefill?: string) => {
    setCycleQuestion(prefill || project?.open_questions?.[0] || '')
    setCycleError(null)
    setAnnotations([])
    setShowCycleModal(true)
    // Fetch vault annotations
    if (token) {
      try {
        const resp = await getAnnotations(projectId, token)
        setAnnotations(resp.annotations || [])
      } catch {
        // Non-critical — annotations are optional context
      }
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4">
        <Skeleton className="h-8 w-64 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6">
          <div className="space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-48" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <p className="text-[14px] text-[#991B1B] mb-4">{error || 'Project not found'}</p>
        <button
          onClick={() => router.push('/projects')}
          className="text-[13px] text-[#1A5FA8] hover:underline"
        >
          ← Back to projects
        </button>
      </div>
    )
  }

  const hasActiveCycle = project.cycles.some(
    (c) => c.status === 'pending' || c.status === 'running'
  )
  const isArchived = project.status === 'complete' || project.status === 'archived'

  // Filter claims
  const filteredClaims = project.claims.filter((c) => {
    if (tierFilter !== 'All' && c.confidence_tier !== tierFilter) return false
    if (cycleFilter !== null && c.cycle_number !== cycleFilter) return false
    return true
  })

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Back link */}
      <button
        onClick={() => router.push('/projects')}
        className="flex items-center gap-1 text-[13px] text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Projects
      </button>

      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6">
        {/* LEFT PANEL */}
        <div className="space-y-4">
          {/* Project header */}
          <Card className="p-4">
            <h1 className="text-[16px] font-semibold text-gray-900 mb-1">
              {project.title}
            </h1>
            <p className="text-[13px] text-gray-500 mb-3 line-clamp-3">
              {project.objective}
            </p>
            <ConfidenceGauge score={project.confidence_score} size="md" />
          </Card>

          {/* Cycle timeline */}
          <Card className="p-4">
            <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-gray-400 mb-3">
              Research cycles
            </p>
            {project.cycles.length === 0 && (
              <p className="text-[13px] text-gray-400 italic">No cycles yet</p>
            )}
            <div className="space-y-2">
              {project.cycles.map((cycle) => {
                const st = STATUS_BADGE[cycle.status] || STATUS_BADGE.pending
                return (
                  <a
                    key={cycle.cycle_id}
                    href={`#cycle-${cycle.cycle_number}`}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <span className="w-6 h-6 rounded-full bg-[#0B1829] text-white text-[10px] font-medium flex items-center justify-center shrink-0">
                      {cycle.cycle_number}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-gray-900 truncate">
                        {cycle.focus_question}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${st.cls}`}>
                          {st.label}
                        </span>
                        {cycle.new_claims_count > 0 && (
                          <span className="text-[10px] text-gray-400">
                            {cycle.new_claims_count} claims
                          </span>
                        )}
                      </div>
                    </div>
                  </a>
                )
              })}
            </div>
          </Card>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={() => openCycleModal()}
              disabled={hasActiveCycle || isArchived}
              className="w-full flex items-center justify-center gap-1.5 h-[38px] rounded-md text-[13px] font-medium bg-[#0B1829] text-[#C4922A] hover:bg-[#1A5FA8] hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play className="h-3.5 w-3.5" />
              Start next cycle
            </button>
            <button
              onClick={handleExport}
              disabled={exportLoading}
              className="w-full flex items-center justify-center gap-1.5 h-[38px] rounded-md text-[13px] font-medium border border-[#E8EBF0] text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              {exportLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              Export to Obsidian
            </button>
            <button
              onClick={handleExportMemo}
              disabled={memoLoading}
              className="w-full flex items-center justify-center gap-1.5 h-[34px] rounded-md text-[12px] text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              {memoLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <FileText className="h-3 w-3" />
              )}
              Export memo
            </button>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="space-y-6">
          {/* Living opinion */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-[15px] font-semibold text-gray-900">Living Opinion</h2>
              <Badge variant="outline" className="text-[10px]">
                {Math.round(project.confidence_score * 100)}%
              </Badge>
            </div>
            {project.living_opinion ? (
              <Card className="p-6">
                <MarkdownRenderer
                  content={project.living_opinion}
                  className="max-w-none"
                  onCitationClick={(citation) => setActiveCitation(citation)}
                />
              </Card>
            ) : (
              <Card className="p-6 border-dashed">
                <p className="text-[13px] text-gray-400 italic">
                  Living opinion will appear after the first cycle completes.
                </p>
              </Card>
            )}
          </section>

          {/* Open questions */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-[15px] font-semibold text-gray-900">Open Questions</h2>
              <Badge variant="outline" className="text-[10px]">
                {project.open_questions.length}
              </Badge>
            </div>
            {project.open_questions.length === 0 ? (
              <p className="text-[13px] text-gray-400">No open questions yet.</p>
            ) : (
              <div className="space-y-2">
                {project.open_questions.map((q, i) => (
                  <Card key={i} className="p-3 flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <MessageCircleQuestion className="h-4 w-4 text-[#C4922A] shrink-0 mt-0.5" />
                      <p className="text-[13px] text-gray-700">{q}</p>
                    </div>
                    <button
                      onClick={() => openCycleModal(q)}
                      disabled={hasActiveCycle || isArchived}
                      className="text-[11px] text-[#1A5FA8] hover:underline shrink-0 disabled:opacity-40"
                    >
                      Use as focus →
                    </button>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Cycle accordion */}
          {project.cycles.length > 0 && (
            <section>
              <h2 className="text-[15px] font-semibold text-gray-900 mb-3">
                Research Cycles
              </h2>
              <Accordion multiple className="space-y-2">
                {[...project.cycles].reverse().map((cycle) => {
                  const st = STATUS_BADGE[cycle.status] || STATUS_BADGE.pending
                  const cycleClaims = project.claims.filter(
                    (c) => c.cycle_number === cycle.cycle_number
                  )
                  return (
                    <AccordionItem
                      key={cycle.cycle_id}
                      value={`cycle-${cycle.cycle_number}`}
                      id={`cycle-${cycle.cycle_number}`}
                      className="border rounded-lg overflow-hidden"
                    >
                      <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 text-left [&[data-state=open]>svg]:rotate-180">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-[13px] font-medium text-gray-900 truncate">
                            Cycle {cycle.cycle_number} — {cycle.focus_question.slice(0, 60)}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ${st.cls}`}>
                            {st.label}
                          </span>
                          {cycle.new_claims_count > 0 && (
                            <span className="text-[10px] text-gray-400 shrink-0">
                              {cycle.new_claims_count} claims
                            </span>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <p className="text-[13px] text-gray-500 italic mb-2">
                          {cycle.focus_question}
                        </p>
                        {cycle.cycle_summary && (
                          <p className="text-[13px] text-gray-700 mb-3">
                            {cycle.cycle_summary}
                          </p>
                        )}
                        {cycleClaims.length > 0 && (
                          <div className="mb-3">
                            <p className="text-[11px] font-medium text-gray-500 mb-1">Claims</p>
                            <div className="space-y-1">
                              {cycleClaims.slice(0, 10).map((c) => (
                                <div
                                  key={c.id}
                                  className="flex items-start gap-2 text-[12px]"
                                >
                                  <Badge
                                    variant="outline"
                                    className={`text-[9px] shrink-0 ${TIER_COLOURS[c.confidence_tier] || ''}`}
                                  >
                                    {c.confidence_tier}
                                  </Badge>
                                  <span className="text-gray-700 line-clamp-1">
                                    {c.claim_text}
                                  </span>
                                  <span className="text-gray-400 shrink-0 font-mono">
                                    {c.section_ref || ''}
                                  </span>
                                </div>
                              ))}
                              {cycleClaims.length > 10 && (
                                <p className="text-[11px] text-gray-400">
                                  +{cycleClaims.length - 10} more claims
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        {cycle.session_id && (
                          <button
                            onClick={() => router.push(`/query/${cycle.session_id}`)}
                            className="text-[12px] text-[#1A5FA8] hover:underline flex items-center gap-1"
                          >
                            View full session
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            </section>
          )}

          {/* All claims table */}
          {project.claims.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-[15px] font-semibold text-gray-900">All Claims</h2>
                  <Badge variant="outline" className="text-[10px]">
                    {project.claims.length}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value)}
                    className="text-[12px] border border-[#E8EBF0] rounded-md px-2 py-1"
                  >
                    <option value="All">All tiers</option>
                    <option value="VERIFIED">VERIFIED</option>
                    <option value="SUPPORTED">SUPPORTED</option>
                    <option value="INFERRED">INFERRED</option>
                    <option value="SPECULATIVE">SPECULATIVE</option>
                    <option value="CONTESTED">CONTESTED</option>
                  </select>
                  <select
                    value={cycleFilter ?? ''}
                    onChange={(e) =>
                      setCycleFilter(e.target.value ? Number(e.target.value) : null)
                    }
                    className="text-[12px] border border-[#E8EBF0] rounded-md px-2 py-1"
                  >
                    <option value="">All cycles</option>
                    {project.cycles.map((c) => (
                      <option key={c.cycle_number} value={c.cycle_number}>
                        Cycle {c.cycle_number}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <Card className="overflow-hidden">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left px-3 py-2 font-medium text-gray-500">Cycle</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-500">Tier</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-500">Claim</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-500">Section</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClaims.slice(0, 25).map((c) => (
                      <tr key={c.id} className="border-b last:border-0">
                        <td className="px-3 py-2 text-gray-500">{c.cycle_number}</td>
                        <td className="px-3 py-2">
                          <Badge
                            variant="outline"
                            className={`text-[9px] ${TIER_COLOURS[c.confidence_tier] || ''}`}
                          >
                            {c.confidence_tier}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-gray-700 max-w-md truncate">
                          {c.claim_text}
                        </td>
                        <td className="px-3 py-2 text-gray-400 font-mono">
                          {c.section_ref || ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredClaims.length > 25 && (
                  <p className="text-[11px] text-gray-400 p-3 text-center">
                    Showing 25 of {filteredClaims.length} claims
                  </p>
                )}
              </Card>
            </section>
          )}
        </div>
      </div>

      {/* Corpus panel */}
      <CorpusPanel
        citation={activeCitation}
        onClose={() => setActiveCitation(null)}
      />

      {/* Start cycle modal */}
      {showCycleModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-semibold text-gray-900">
                Start next cycle
              </h3>
              <button onClick={() => setShowCycleModal(false)}>
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>
            {annotations.length > 0 && (
              <div className="mb-4">
                <p className="text-[9px] font-semibold tracking-[0.1em] uppercase text-[#C4922A] mb-2">
                  Vault annotations detected
                </p>
                <div className="space-y-2">
                  {annotations.map((ann) => (
                    <div key={ann.id} className="border border-[#C4922A]/20 bg-[#C4922A]/5 rounded-md p-2.5">
                      <p className="text-[10px] font-medium text-[#C4922A] mb-1">
                        {ann.source_section}
                      </p>
                      <p className="text-[12px] text-gray-700 line-clamp-3">
                        {ann.annotation_text.slice(0, 200)}
                        {ann.annotation_text.length > 200 ? '...' : ''}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setCycleQuestion((prev) =>
                            prev + '\n\n---\nPractitioner note: ' + ann.annotation_text
                          )
                        }
                        className="text-[11px] text-[#1A5FA8] hover:underline mt-1"
                      >
                        Use as context →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
              Focus question for this cycle
            </label>
            <textarea
              value={cycleQuestion}
              onChange={(e) => setCycleQuestion(e.target.value)}
              rows={4}
              placeholder="What specific question should this cycle resolve?"
              className="w-full border border-[#E8EBF0] rounded-md px-3 py-2.5 text-[14px] text-gray-900 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-[#1A5FA8]"
            />
            {cycleQuestion.length > 0 && cycleQuestion.trim().length < 20 && (
              <p className="text-[11px] text-[#991B1B] mt-1">Minimum 20 characters</p>
            )}
            {cycleError && (
              <div className="mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md">
                <p className="text-[12px] text-[#991B1B]">{cycleError}</p>
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowCycleModal(false)}
                className="h-[36px] px-4 text-[13px] text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleStartCycle}
                disabled={cycleSubmitting || cycleQuestion.trim().length < 20}
                className="h-[36px] px-5 rounded-md text-[13px] font-medium bg-[#0B1829] text-[#C4922A] hover:bg-[#1A5FA8] hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {cycleSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Start cycle'
                )}
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
