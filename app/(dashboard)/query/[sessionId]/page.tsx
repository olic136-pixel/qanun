'use client'

import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { useQueryStream } from '@/lib/hooks/useQueryStream'
import { getSession, type SessionDetail, type ClaimObject } from '@/lib/api/query'
import { useEffect, useState, useMemo } from 'react'
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
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'

// Display sections derived from agent_outputs keys
const OUTPUT_SECTIONS: Record<
  string,
  { label: string; icon: React.ElementType; color: string; hidden?: boolean }
> = {
  final_output: { label: 'Analysis', icon: FileText, color: 'text-navy' },
  grounding_result: { label: 'Grounding', icon: Shield, color: 'text-teal' },
  token_usage: { label: 'Token Usage', icon: BarChart3, color: 'text-gray-600' },
  // Internal fields — hide from display
  session_id: { label: 'Session ID', icon: FileText, color: 'text-gray-400', hidden: true },
  query_type: { label: 'Query Type', icon: FileText, color: 'text-gray-400', hidden: true },
  claim_ids: { label: 'Claim IDs', icon: FileText, color: 'text-gray-400', hidden: true },
  error: { label: 'Error', icon: AlertTriangle, color: 'text-[#991B1B]', hidden: true },
}

const CONFIDENCE_COLORS: Record<string, string> = {
  VERIFIED: 'bg-teal/10 text-teal border-teal/20',
  SUPPORTED: 'bg-blue/10 text-blue border-blue/20',
  INFERRED: 'bg-gold/10 text-gold border-gold/20',
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
  const [copiedClaim, setCopiedClaim] = useState<string | null>(null)

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

  // Derive display state
  const isComplete =
    sessionData?.status === 'complete' || stream.status === 'complete'
  const isRunning =
    stream.status === 'running' || stream.status === 'connecting'
  const isError =
    sessionData?.status === 'error' || stream.status === 'error'

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
        <button
          onClick={() => router.push('/query')}
          className="flex items-center gap-1 text-[13px] text-gray-500 hover:text-gray-700 mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          New query
        </button>

        <h1 className="text-xl font-semibold text-gray-900 mb-1">
          {sessionData?.query_text ?? 'Query session'}
        </h1>

        <div className="flex items-center gap-3">
          {sessionData?.jurisdictions?.map((j) => (
            <Badge key={j} variant="outline" className="text-[11px]">
              {j}
            </Badge>
          ))}
          <span className="text-[12px] text-gray-400">
            {sessionData?.created_at
              ? new Date(sessionData.created_at).toLocaleString()
              : ''}
          </span>
        </div>
      </div>

      {/* Progress bar — animated while running */}
      {!isComplete && (
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-medium text-gray-700">
              {isRunning
                ? 'Pipeline running…'
                : isError
                  ? 'Error'
                  : 'Connecting…'}
            </span>
            {isRunning && (
              <Loader2 className="h-4 w-4 text-navy animate-spin" />
            )}
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            {isRunning ? (
              <div className="h-full bg-navy/70 rounded-full animate-pulse w-2/3 transition-all duration-1000" />
            ) : (
              <Progress value={0} className="h-2" />
            )}
          </div>
          {stream.error && (
            <p className="text-[12px] text-[#991B1B] mt-2">{stream.error}</p>
          )}
        </Card>
      )}

      {/* Complete banner */}
      {isComplete && (
        <Card className="p-4 mb-6 border-teal/30 bg-teal/5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-teal" />
            <span className="text-[13px] font-medium text-teal">
              Analysis complete — {claims.length} claims extracted
            </span>
          </div>
        </Card>
      )}

      {/* Error state */}
      {error && (
        <Card className="p-6 mb-6 border-red-200 bg-red-50">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-[#991B1B]" />
            <p className="text-[14px] text-[#991B1B]">{error}</p>
          </div>
        </Card>
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
              <div className="prose prose-sm max-w-none text-[13px] text-gray-700 whitespace-pre-wrap leading-relaxed">
                {analysisText}
              </div>
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
                      <CheckCircle2 className="h-4 w-4 text-teal" />
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
                <Loader2 className="h-5 w-5 text-navy animate-spin" />
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

        {/* Right: Claims panel */}
        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="text-[14px] font-semibold text-gray-900 mb-3">
              Claims
              {claims.length > 0 && (
                <Badge variant="outline" className="ml-2 text-[11px]">
                  {claims.length}
                </Badge>
              )}
            </h2>

            {claims.length === 0 && !isRunning && (
              <p className="text-[13px] text-gray-500">
                {isComplete
                  ? 'No claims extracted.'
                  : 'Claims will appear when the analysis completes.'}
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

            <div className="space-y-3 mt-2 max-h-[600px] overflow-y-auto">
              {claims.map((claim) => (
                <div
                  key={claim.claim_id}
                  className="p-3 rounded-lg border bg-white"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${CONFIDENCE_COLORS[claim.confidence_tier] ?? ''}`}
                    >
                      {claim.confidence_tier}
                    </Badge>
                    <button
                      onClick={() =>
                        copyClaim(claim.claim_text, claim.claim_id)
                      }
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {copiedClaim === claim.claim_id ? (
                        <Check className="h-3.5 w-3.5 text-teal" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="text-[12px] text-gray-700 leading-relaxed">
                    {claim.claim_text}
                  </p>
                  {claim.section_ref && (
                    <p className="text-[11px] text-gray-400 mt-1.5">
                      {claim.section_ref}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1">
                    {claim.agent_name}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
