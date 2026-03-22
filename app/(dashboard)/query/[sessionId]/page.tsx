'use client'

import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { useQueryStream } from '@/lib/hooks/useQueryStream'
import { getSession, type SessionDetail, type ClaimObject } from '@/lib/api/query'
import { useEffect, useState } from 'react'
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
  Search,
  Scale,
  BookOpen,
  Shield,
  FileText,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  Zap,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'

const AGENT_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  orchestrator: { label: 'Orchestrator', icon: Sparkles, color: 'text-gold' },
  retriever: { label: 'Retriever', icon: Search, color: 'text-blue' },
  analyst: { label: 'Analyst', icon: Scale, color: 'text-teal' },
  devils_advocate: { label: "Devil's Advocate", icon: AlertTriangle, color: 'text-[#991B1B]' },
  blue_sky: { label: 'Blue Sky', icon: Lightbulb, color: 'text-gold' },
  rsa: { label: 'RSA', icon: Shield, color: 'text-navy' },
  stress_tester: { label: 'Stress Tester', icon: Zap, color: 'text-orange-500' },
  ux_advocate: { label: 'UX Advocate', icon: Users, color: 'text-blue' },
  memory_scribe: { label: 'Memory Scribe', icon: BookOpen, color: 'text-teal' },
  task_director: { label: 'Task Director', icon: FileText, color: 'text-gray-700' },
}

const TOTAL_AGENTS = 10

const CONFIDENCE_COLORS: Record<string, string> = {
  VERIFIED: 'bg-teal/10 text-teal border-teal/20',
  SUPPORTED: 'bg-blue/10 text-blue border-blue/20',
  INFERRED: 'bg-gold/10 text-gold border-gold/20',
  CONTESTED: 'bg-red-100 text-[#991B1B] border-red-200',
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
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set())
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
        // Auto-expand all agents
        if (data.claims) {
          const agents = new Set(data.claims.map((c) => c.agent_name))
          setExpandedAgents(agents)
        }
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

  const toggleAgent = (agent: string) => {
    setExpandedAgents((prev) => {
      const next = new Set(prev)
      if (next.has(agent)) next.delete(agent)
      else next.add(agent)
      return next
    })
  }

  const copyClaim = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedClaim(id)
    setTimeout(() => setCopiedClaim(null), 2000)
  }

  // Derive display state
  const isComplete = sessionData?.status === 'complete' || stream.status === 'complete'
  const isRunning = stream.status === 'running' || stream.status === 'connecting'
  const isError = sessionData?.status === 'error' || stream.status === 'error'

  const agentsComplete = isComplete
    ? Object.keys(sessionData?.agent_outputs ?? {})
    : stream.agentsComplete

  const progressPercent = isComplete
    ? 100
    : (agentsComplete.length / TOTAL_AGENTS) * 100

  const claims: ClaimObject[] = sessionData?.claims ?? []
  const digest = sessionData?.compressed_digest || stream.compressedDigest

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

      {/* Progress bar */}
      {!isComplete && (
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-medium text-gray-700">
              {isRunning
                ? `Running — ${agentsComplete.length}/${TOTAL_AGENTS} agents complete`
                : isError
                  ? 'Error'
                  : 'Connecting…'}
            </span>
            {isRunning && (
              <Loader2 className="h-4 w-4 text-navy animate-spin" />
            )}
          </div>
          <Progress value={progressPercent} className="h-2" />
          {stream.error && (
            <p className="text-[12px] text-[#991B1B] mt-2">{stream.error}</p>
          )}
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
        {/* Left: Agent outputs + digest */}
        <div className="lg:col-span-2 space-y-4">
          {/* Digest */}
          {digest && (
            <Card className="p-6">
              <h2 className="text-[14px] font-semibold text-gray-900 mb-3">
                Synthesis
              </h2>
              <div className="prose prose-sm max-w-none text-[13px] text-gray-700 whitespace-pre-wrap">
                {digest}
              </div>
            </Card>
          )}

          {/* Agent sections */}
          <div className="space-y-3">
            {Object.entries(
              isComplete
                ? (sessionData?.agent_outputs ?? {})
                : stream.agentUpdates
            ).map(([agentName, output]) => {
              const meta = AGENT_META[agentName] ?? {
                label: agentName,
                icon: Search,
                color: 'text-gray-600',
              }
              const Icon = meta.icon
              const isExpanded = expandedAgents.has(agentName)
              const agentOutput =
                typeof output === 'object' && output !== null && 'output' in output
                  ? (output as { output: string }).output
                  : typeof output === 'string'
                    ? output
                    : JSON.stringify(output, null, 2)

              return (
                <Card key={agentName} className="overflow-hidden">
                  <button
                    onClick={() => toggleAgent(agentName)}
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
                      <div className="pt-3 text-[13px] text-gray-700 whitespace-pre-wrap">
                        {agentOutput}
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>

          {/* Running agents placeholder */}
          {isRunning &&
            Array.from({ length: Math.max(0, TOTAL_AGENTS - agentsComplete.length) }).map(
              (_, i) => (
                <Card key={`pending-${i}`} className="p-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </Card>
              )
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
                  : 'Claims will appear as agents complete.'}
              </p>
            )}

            {isRunning && claims.length === 0 && (
              <div className="flex items-center gap-2 text-[13px] text-gray-500">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {stream.claimsTotal > 0
                    ? `${stream.claimsTotal} claims found so far…`
                    : 'Waiting for agent results…'}
                </span>
              </div>
            )}

            <div className="space-y-3 mt-2">
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
                      onClick={() => copyClaim(claim.claim_text, claim.claim_id)}
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
                    {AGENT_META[claim.agent_name]?.label ?? claim.agent_name}
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
