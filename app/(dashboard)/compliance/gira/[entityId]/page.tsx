'use client'

import { use, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Download,
  Loader2,
  RotateCcw,
  X,
} from 'lucide-react'
import {
  getGiraPreflight,
  generateGira,
  getGiraStatus,
  getGiraDownloadUrl,
  type Jurisdiction,
  type CeeQuestion,
} from '@/lib/api/gira'

export default function GiraPage({
  params,
}: {
  params: Promise<{ entityId: string }>
}) {
  const { entityId } = use(params)
  const { data: session } = useSession()
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken || ''

  const [jurisdiction, setJurisdiction] = useState<Jurisdiction>('ADGM')
  const [jobId, setJobId] = useState<string | null>(null)

  if (jobId) {
    return (
      <GenerationState
        jobId={jobId}
        jurisdiction={jurisdiction}
        token={token}
        onReset={() => setJobId(null)}
      />
    )
  }

  return (
    <PreflightState
      entityId={entityId}
      jurisdiction={jurisdiction}
      setJurisdiction={setJurisdiction}
      token={token}
      onGenerated={(id) => setJobId(id)}
    />
  )
}

// ── STATE A: Preflight ────────────────────────────────────────

function PreflightState({
  entityId, jurisdiction, setJurisdiction, token, onGenerated,
}: {
  entityId: string
  jurisdiction: Jurisdiction
  setJurisdiction: (j: Jurisdiction) => void
  token: string
  onGenerated: (jobId: string) => void
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['gira-preflight', entityId, jurisdiction],
    queryFn: () => getGiraPreflight(entityId, jurisdiction, token),
    enabled: !!token && !!entityId,
  })

  const generate = useMutation({
    mutationFn: () => generateGira(entityId, jurisdiction, token),
    onSuccess: (res) => onGenerated(res.job_id),
  })

  return (
    <div className="max-w-[1000px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400 mb-1">
            GIRA Application Form
          </p>
          <h2 className="text-xl font-bold text-[#0B1829]">Pre-flight check</h2>
        </div>
        <div className="flex items-center rounded-md border border-[#E8EBF0] overflow-hidden">
          {(['ADGM', 'VARA'] as Jurisdiction[]).map((j) => (
            <button
              key={j}
              onClick={() => setJurisdiction(j)}
              className={`px-4 py-1.5 text-[11px] font-semibold transition-colors ${
                jurisdiction === j
                  ? 'bg-[#0B1829] text-white'
                  : 'bg-white text-[#0B1829] hover:bg-[#F5F7FA]'
              }`}
            >
              {j}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="py-16 text-center text-sm text-gray-500">Loading preflight…</div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {(error as Error).message}
        </div>
      )}

      {data && (
        <>
          {/* Completion ring + readiness banner */}
          <div className="bg-white border border-[#E8EBF0] rounded-lg p-6 flex items-center gap-8">
            <CompletionRing pct={Math.round((data.completion_pct ?? 0) * 100)} />

            <div className="flex-1">
              {data.ready_to_generate ? (
                <div className="flex items-start gap-3 p-4 bg-[#EAF4F1] border border-[#0F7A5F]/20 rounded-md">
                  <CheckCircle2 size={18} strokeWidth={1.5} className="text-[#0F7A5F] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[13px] font-bold text-[#0F7A5F]">Ready to generate</p>
                    <p className="text-[11px] text-[#0F7A5F]/80 mt-0.5">
                      All blocking fields are complete for {jurisdiction}.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-md">
                  <AlertTriangle size={18} strokeWidth={1.5} className="text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[13px] font-bold text-amber-700">
                      {data.blocking_fields.length} blocking {data.blocking_fields.length === 1 ? 'field' : 'fields'} missing
                    </p>
                    <p className="text-[11px] text-amber-700/80 mt-0.5">
                      Complete these fields before generating the {jurisdiction} form.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Two columns: blocking + optional */}
          <div className="grid grid-cols-2 gap-4">
            <FieldColumn
              title="Blocking fields"
              icon={X}
              tone="red"
              fields={data.blocking_fields}
              emptyLabel="All blocking fields complete."
            />
            <FieldColumn
              title="Optional missing"
              icon={AlertCircle}
              tone="amber"
              fields={data.optional_missing}
              emptyLabel="No optional fields missing."
            />
          </div>

          {/* CEE questions */}
          {data.cee_questions.length > 0 && (
            <div className="bg-white border border-[#E8EBF0] rounded-lg p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400 mb-4">
                CEE Questions
              </p>
              <div className="space-y-4">
                {data.cee_questions.map((q) => (
                  <CeeQuestionCard key={q.id} question={q} />
                ))}
              </div>
            </div>
          )}

          {/* Generate button */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => generate.mutate()}
              disabled={!data.ready_to_generate || generate.isPending}
              title={!data.ready_to_generate ? 'Complete blocking fields first' : undefined}
              className="px-5 py-2.5 text-[12px] font-semibold rounded-md bg-[#0B1829] text-white hover:bg-[#1D2D44] transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {generate.isPending ? 'Generating…' : 'Generate Application Form'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function CompletionRing({ pct }: { pct: number }) {
  const radius = 48
  const circumference = 2 * Math.PI * radius
  const dash = (circumference * pct) / 100

  return (
    <div className="relative w-[120px] h-[120px] shrink-0">
      <svg width={120} height={120} className="-rotate-90">
        <circle
          cx={60} cy={60} r={radius}
          stroke="#E8EBF0" strokeWidth={8} fill="none"
        />
        <circle
          cx={60} cy={60} r={radius}
          stroke="#0F7A5F" strokeWidth={8} fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-2xl font-bold text-[#0B1829]">{pct}%</p>
        <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-gray-400">Complete</p>
      </div>
    </div>
  )
}

function FieldColumn({
  title, icon: Icon, tone, fields, emptyLabel,
}: {
  title: string
  icon: React.ElementType
  tone: 'red' | 'amber'
  fields: { field: string; label: string }[]
  emptyLabel: string
}) {
  const toneTw = tone === 'red' ? 'text-red-600' : 'text-amber-600'

  return (
    <div className="bg-white border border-[#E8EBF0] rounded-lg p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400 mb-3">
        {title}
      </p>
      {fields.length === 0 ? (
        <p className="text-[12px] text-gray-400">{emptyLabel}</p>
      ) : (
        <ul className="space-y-2">
          {fields.map((f) => (
            <li key={f.field} className="flex items-start gap-2">
              <Icon size={12} strokeWidth={1.5} className={`${toneTw} shrink-0 mt-0.5`} />
              <div>
                <p className="text-[12px] text-[#0B1829]">{f.label}</p>
                <p className="text-[10px] text-gray-400 font-mono">{f.field}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function CeeQuestionCard({ question }: { question: CeeQuestion }) {
  // Phase 7 will wire cross-population — inputs are display-only for now.
  const [value, setValue] = useState(question.answer ?? '')

  return (
    <div className="border border-[#E8EBF0] rounded-md p-4">
      <p className="text-[12px] font-semibold text-[#0B1829]">{question.prompt}</p>
      {question.helper_text && (
        <p className="mt-1 text-[11px] text-gray-500">{question.helper_text}</p>
      )}
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={2}
        className="mt-2 w-full border border-[#E8EBF0] rounded-md px-2.5 py-1.5 text-[12px]"
        placeholder="Your answer…"
      />
    </div>
  )
}

// ── STATE B: Generation ───────────────────────────────────────

function GenerationState({
  jobId, jurisdiction, token, onReset,
}: {
  jobId: string
  jurisdiction: Jurisdiction
  token: string
  onReset: () => void
}) {
  const { data } = useQuery({
    queryKey: ['gira-status', jobId],
    queryFn: () => getGiraStatus(jobId, token),
    enabled: !!token,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === 'exported' || status === 'stub_pending_phase4' || status === 'failed') {
        return false
      }
      return 3000
    },
  })

  const status = data?.status ?? 'queued'

  return (
    <div className="max-w-[800px] mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400 mb-1">
            GIRA Application Form
          </p>
          <h2 className="text-xl font-bold text-[#0B1829]">
            {status === 'exported' ? 'Ready to download' : 'Generating application'}
          </h2>
        </div>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-md border border-[#E8EBF0] text-[#0B1829] hover:bg-[#F5F7FA]"
        >
          <RotateCcw size={12} strokeWidth={1.5} />
          Generate new version
        </button>
      </div>

      {(status === 'queued' || status === 'running') && (
        <div className="bg-white border border-[#E8EBF0] rounded-lg p-8 flex items-center gap-4">
          <Loader2 size={20} className="text-[#0B1829] animate-spin" />
          <div>
            <p className="text-[13px] font-semibold text-[#0B1829]">
              Generating {jurisdiction} application form…
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              This may take a moment. Status refreshes every 3 seconds.
            </p>
          </div>
        </div>
      )}

      {status === 'exported' && (
        <div className="bg-white border border-[#E8EBF0] rounded-lg p-6">
          <div className="flex items-start gap-3 p-4 bg-[#EAF4F1] border border-[#0F7A5F]/20 rounded-md">
            <CheckCircle2 size={18} strokeWidth={1.5} className="text-[#0F7A5F] shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-[13px] font-bold text-[#0F7A5F]">Application form ready</p>
              <p className="text-[11px] text-[#0F7A5F]/80 mt-0.5">
                Your {jurisdiction} GIRA application form has been generated.
              </p>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <a
              href={getGiraDownloadUrl(jobId, token)}
              className="inline-flex items-center gap-2 px-4 py-2 text-[12px] font-semibold rounded-md bg-[#0B1829] text-white hover:bg-[#1D2D44] transition-colors"
            >
              <Download size={13} strokeWidth={1.5} />
              Download Application Form
            </a>
          </div>
        </div>
      )}

      {status === 'stub_pending_phase4' && (
        <div className="bg-white border border-[#E8EBF0] rounded-lg p-6">
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-md">
            <AlertCircle size={18} strokeWidth={1.5} className="text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-bold text-amber-700">
                GIRA renderer building — Phase 4 in progress
              </p>
              <p className="text-[11px] text-amber-700/80 mt-0.5">
                Form structure ready. DOCX export coming soon.
              </p>
            </div>
          </div>
        </div>
      )}

      {status === 'failed' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-[13px] font-bold text-red-700">Generation failed</p>
          <p className="text-[11px] text-red-700/80 mt-0.5">
            {data?.message ?? 'An unexpected error occurred. Try again.'}
          </p>
        </div>
      )}
    </div>
  )
}
