'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSession } from '@/lib/api/query'
import { useState, useEffect, useRef, Suspense } from 'react'
import {
  Loader2,
  FileSearch,
  Cpu,
  Paperclip,
  X,
  File,
  CheckCircle2,
  BookMarked,
  Workflow,
  SlidersHorizontal,
} from 'lucide-react'
import Link from 'next/link'

const JURISDICTIONS = [
  { id: 'ADGM', label: 'ADGM / FSRA' },
  { id: 'DIFC', label: 'DIFC / DFSA' },
  { id: 'EL_SALVADOR', label: 'El Salvador' },
]

const EXAMPLES = [
  {
    text: 'What are the four conditions for dealing as Matched Principal under PRU 1.3.3(2), and does a dual-entity CFD structure — with an Internaliser and a separate Risk Co — satisfy each condition?',
    tag: 'PRU',
    complexity: 'complex' as const,
  },
  {
    text: 'When does a copy trading or mirror trading service require a Managing Assets FSP under COBS 23.12.2, and can a block-delegation model avoid this by characterising client parameter-setting as the investment decision?',
    tag: 'COBS',
    complexity: 'complex' as const,
  },
  {
    text: 'What are the capital requirements for a Category 3C Authorised Person under PRU, and how does Section 3.6 apply to a firm that also holds a custody permission?',
    tag: 'PRU',
    complexity: 'moderate' as const,
  },
  {
    text: 'Under ADGM FSMR Schedule 2, which Regulated Activities require a financial promotion to be issued or approved by an Authorised Person, and what exemptions apply to professional clients?',
    tag: 'FSMR',
    complexity: 'moderate' as const,
  },
]

const COMPLEXITY_DOT: Record<string, string> = {
  simple: 'bg-[#16A34A]',
  moderate: 'bg-[#C4922A]',
  complex: 'bg-[#991B1B]',
}

const PIPELINE_STEPS = [
  { title: 'Corpus retrieval', desc: 'Pinecone vector search across 63,397 sections. Top passages retrieved.' },
  { title: 'Legal analysis', desc: 'Analyst and Devil\'s Advocate agents examine the provisions in detail.' },
  { title: 'Lateral thinking', desc: 'Blue Sky agent explores comparative frameworks and analogous jurisdictions.' },
  { title: 'Stress testing', desc: 'Stress Tester and RSA agents challenge the analysis for weak points.' },
  { title: 'Synthesis', desc: 'Orchestrator produces a structured research note with grounded claims.' },
]

function QueryPageInner() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [queryText, setQueryText] = useState('')
  const [activeJurisdictions, setActiveJurisdictions] = useState<string[]>(['ADGM'])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])

  useEffect(() => {
    const q = searchParams.get('q')
    const j = searchParams.get('jurisdiction')
    if (q) setQueryText(q)
    if (j) {
      const match = JURISDICTIONS.find((jur) => jur.id === j || jur.label === j)
      if (match) setActiveJurisdictions([match.id])
    }
  }, [searchParams])

  useEffect(() => {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 400) + 'px'
    }
  }, [queryText])

  const toggleJurisdiction = (id: string) => {
    setActiveJurisdictions((prev) => {
      const next = prev.includes(id) ? prev.filter((j) => j !== id) : [...prev, id]
      return next.length === 0 ? prev : next
    })
  }

  const handleSubmit = async () => {
    if (!queryText.trim() || !session?.user?.accessToken) return
    if (activeJurisdictions.length === 0) {
      setError('Select at least one jurisdiction')
      return
    }
    setError(null)
    setIsSubmitting(true)
    if (attachedFiles.length > 0) {
      console.log('Attached files:', attachedFiles.map((f) => f.name))
    }
    try {
      const result = await createSession(
        { query: queryText.trim(), jurisdictions: activeJurisdictions },
        session.user.accessToken as string
      )
      router.push(`/query/${result.session_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session')
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachedFiles((prev) => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const removeFile = (idx: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  const canSubmit = queryText.trim().length > 0 && !isSubmitting

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* LEFT COLUMN */}
        <div>
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-[26px] font-medium text-[#0B1829]">Start a Research Project</h1>
            <p className="text-[13px] text-[#6B7280] mt-1.5 leading-relaxed">
              QANUN runs a full 10-agent analysis — retrieval, legal reasoning, devil&apos;s advocate, blue-sky, stress-testing, and synthesis.
              <br />
              Results include a structured research note, grounded claims with confidence tiers, and direct links to the cited provisions.
            </p>
          </div>

          {/* Research card */}
          <div className="bg-white border border-[#E8EBF0] rounded-xl overflow-hidden">
            {/* Top bar */}
            <div className="bg-[#F5F7FA] border-b border-[#E8EBF0] px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSearch className="h-[15px] w-[15px] text-[#1A5FA8]" />
                <span className="text-[12px] font-medium text-[#0B1829]">Research query</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#9CA3AF]">
                <Cpu className="h-3 w-3" />
                <span>10 agents · MALIS pipeline</span>
              </div>
            </div>

            {/* Textarea */}
            <div className="px-5 pt-4 pb-3">
              <textarea
                ref={textareaRef}
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSubmitting}
                placeholder={`Describe your research question in full. The more context you provide, the more precise the analysis.\n\ne.g. Under ADGM COBS 23.12.2, when does a copy trading service require a Managing Assets FSP — and can a block-delegation model operated by a Category 3C licensee avoid this requirement by characterising client parameter-setting as the investment decision?`}
                className="min-h-[160px] max-h-[400px] resize-none bg-transparent border-none outline-none text-[14px] text-[#111827] leading-[1.7] w-full placeholder:text-[#9CA3AF]"
              />
              {attachedFiles.length > 0 && (
                <p className="text-[11px] text-[#6B7280] italic mt-1">
                  Attached documents will be included in the research context.
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-[#E8EBF0]" />

            {/* Toolbar */}
            <div className="px-5 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {JURISDICTIONS.map((j) => {
                  const active = activeJurisdictions.includes(j.id)
                  return (
                    <button
                      key={j.id}
                      onClick={() => toggleJurisdiction(j.id)}
                      disabled={isSubmitting}
                      className={`text-[11px] font-medium px-3 py-1.5 rounded-full cursor-pointer transition-colors duration-100 ${
                        active
                          ? 'bg-[#0B1829] text-[#C4922A]'
                          : 'bg-white text-[#6B7280] border border-[#E8EBF0] hover:border-[#9CA3AF]'
                      }`}
                    >
                      {j.label}
                    </button>
                  )
                })}
                <div className="w-px h-4 bg-[#E8EBF0]" />
                <label className="border border-[#E8EBF0] rounded-md px-3 h-[34px] text-[12px] text-[#6B7280] hover:bg-[#F5F7FA] cursor-pointer flex items-center gap-1.5 transition-colors">
                  <Paperclip className="h-[13px] w-[13px]" />
                  Attach document
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.docx,.txt"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#9CA3AF] hidden sm:inline">⌘↵</span>
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className={`h-[38px] px-5 rounded-md text-[13px] font-medium transition-all duration-150 ${
                    canSubmit
                      ? 'bg-[#0B1829] text-[#C4922A] hover:bg-[#1A5FA8] hover:text-white'
                      : 'bg-[#F5F7FA] text-[#9CA3AF] cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-[14px] w-[14px] animate-spin" />
                  ) : (
                    'Start research →'
                  )}
                </button>
              </div>
            </div>

            {/* Attached files */}
            {attachedFiles.length > 0 && (
              <div className="px-5 pb-3 border-t border-[#E8EBF0] pt-3 flex flex-wrap gap-2">
                {attachedFiles.map((f, i) => (
                  <span
                    key={`${f.name}-${i}`}
                    className="bg-[#EFF6FF] border border-[#85B7EB] rounded-md px-2.5 py-1 text-[11px] text-[#0C447C] flex items-center gap-1.5"
                  >
                    <File className="h-[11px] w-[11px]" />
                    {f.name.length > 24 ? f.name.slice(0, 24) + '…' : f.name}
                    <X
                      className="h-[11px] w-[11px] cursor-pointer hover:text-[#991B1B]"
                      onClick={() => removeFile(i)}
                    />
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mt-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-[13px] text-[#991B1B]">{error}</p>
            </div>
          )}

          {/* Research scope */}
          <div className="mt-4 bg-white border border-[#E8EBF0] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal className="h-[14px] w-[14px] text-[#6B7280]" />
              <span className="text-[13px] font-medium text-[#0B1829]">Research scope</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {/* Standard */}
              <div className="border-2 border-[#1A5FA8] bg-[#EFF6FF] rounded-xl p-4 cursor-pointer">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-[#0B1829]">Standard</span>
                  <CheckCircle2 className="h-4 w-4 text-[#1A5FA8]" />
                </div>
                <p className="text-[12px] text-[#6B7280] mt-1.5 leading-relaxed">
                  Full 10-agent pipeline. Legal analysis, devil&apos;s advocate, lateral thinking, stress-testing. 60–90 seconds.
                </p>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-[#9CA3AF]">
                  <span>10 agents</span>
                  <span>·</span>
                  <span>Full corpus</span>
                  <span>·</span>
                  <span>~90s</span>
                </div>
              </div>
              {/* Deep research */}
              <div
                onClick={() => router.push('/projects/new')}
                className="border border-[#E8EBF0] bg-white rounded-xl p-4 cursor-pointer hover:border-[#1A5FA8] hover:bg-[#F8FAFF] transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-[#0B1829]">Deep research</span>
                  <span className="bg-[#1A5FA8]/10 text-[#1A5FA8] text-[9px] uppercase tracking-[0.06em] px-2 py-0.5 rounded-full font-medium">
                    Beta
                  </span>
                </div>
                <p className="text-[12px] text-[#6B7280] mt-1.5 leading-relaxed">
                  Multi-session iterative analysis with memory. Builds a structured legal opinion over multiple research cycles.
                </p>
                <div className="mt-2 text-[11px] text-[#9CA3AF]">Multiple cycles · Living opinion · Obsidian export</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-4">
          {/* Example projects */}
          <div className="bg-white border border-[#E8EBF0] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <BookMarked className="h-[14px] w-[14px] text-[#6B7280]" />
              <span className="text-[13px] font-medium text-[#0B1829]">
                Example research projects
              </span>
            </div>
            <div className="space-y-2">
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQueryText(ex.text)
                    textareaRef.current?.focus()
                  }}
                  className="w-full border border-[#E8EBF0] rounded-lg p-3 cursor-pointer hover:border-[#1A5FA8] hover:bg-[#F8FAFF] transition-all duration-100 text-left group"
                >
                  <p className="text-[12px] font-medium text-[#0B1829] leading-snug group-hover:text-[#1A5FA8] transition-colors">
                    {ex.text.length > 120 ? ex.text.slice(0, 120) + '…' : ex.text}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="bg-[#F5F7FA] text-[#6B7280] font-mono text-[9px] px-1.5 py-0.5 rounded-sm">
                      {ex.tag}
                    </span>
                    <span className={`w-1.5 h-1.5 rounded-full ${COMPLEXITY_DOT[ex.complexity]}`} />
                    <span className="text-[10px] text-[#9CA3AF] capitalize">{ex.complexity}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Pipeline explainer */}
          <div className="bg-white border border-[#E8EBF0] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Workflow className="h-[14px] w-[14px] text-[#6B7280]" />
              <span className="text-[13px] font-medium text-[#0B1829]">
                What happens when you run research
              </span>
            </div>
            <div className="space-y-3">
              {PIPELINE_STEPS.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#F5F7FA] text-[10px] font-medium text-[#6B7280] flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-[12px] font-medium text-[#0B1829]">{step.title}</p>
                    <p className="text-[11px] text-[#9CA3AF] mt-0.5 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function QueryPage() {
  return (
    <Suspense>
      <QueryPageInner />
    </Suspense>
  )
}
