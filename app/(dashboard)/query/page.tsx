'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSession } from '@/lib/api/query'
import { useState, useEffect, useRef, Suspense } from 'react'
import { Loader2, Paperclip, X, File } from 'lucide-react'
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
  const [scopeMode, setScopeMode] = useState<'standard' | 'deep'>('standard')

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
    if (activeJurisdictions.length === 0) { setError('Select at least one jurisdiction'); return }
    setError(null)
    setIsSubmitting(true)
    try {
      const result = await createSession(
        { query: queryText.trim(), jurisdictions: activeJurisdictions },
        session.user.accessToken as string
      )
      if (scopeMode === 'deep') {
        router.push('/projects/new')
      } else {
        router.push(`/query/${result.session_id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session')
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); handleSubmit() }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setAttachedFiles(prev => [...prev, ...Array.from(e.target.files!)])
  }

  const removeFile = (idx: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const canSubmit = queryText.trim().length > 0 && !isSubmitting

  return (
    <div className="w-full max-w-[860px]">

      {/* Page heading */}
      <div className="mb-8">
        <h1 className="text-[22px] font-black uppercase tracking-tighter text-black">
          Start a Research Project
        </h1>
        <p className="font-mono text-[10px] text-black/30 uppercase tracking-[0.2em] mt-1">
          10-agent MALIS pipeline · ADGM · VARA · El Salvador
        </p>
      </div>

      {/* Main textarea — full width, no card border at top */}
      <div className="border border-black/20 focus-within:border-black transition-colors">
        <textarea
          ref={textareaRef}
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSubmitting}
          placeholder="Describe the regulatory question in full."
          className="w-full min-h-[200px] max-h-[400px] resize-none bg-white border-none
                     outline-none px-5 pt-5 pb-3
                     font-mono text-[13px] text-black leading-[1.8]
                     placeholder:text-black/20 placeholder:font-mono
                     disabled:opacity-50"
        />

        {/* Attached files strip */}
        {attachedFiles.length > 0 && (
          <div className="px-5 pb-3 flex flex-wrap gap-2 border-t border-black/10 pt-3">
            {attachedFiles.map((f, i) => (
              <span key={`${f.name}-${i}`}
                className="bg-[#0047FF]/5 border border-[#0047FF]/20 px-2.5 py-1
                           font-mono text-[10px] text-[#0047FF] flex items-center gap-1.5">
                <File className="h-[10px] w-[10px]" />
                {f.name.length > 28 ? f.name.slice(0, 28) + '…' : f.name}
                <X className="h-[10px] w-[10px] cursor-pointer hover:text-black"
                   onClick={() => removeFile(i)} />
              </span>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div className="border-t border-black/10 px-5 py-3 flex items-center justify-between gap-4 bg-white">

          {/* Left — jurisdiction + attach */}
          <div className="flex items-center gap-2 flex-wrap">
            {JURISDICTIONS.map((j) => {
              const active = activeJurisdictions.includes(j.id)
              return (
                <button
                  key={j.id}
                  onClick={() => toggleJurisdiction(j.id)}
                  disabled={isSubmitting}
                  className={`font-mono text-[10px] uppercase tracking-[0.1em] px-3 py-1.5
                               transition-colors duration-100 ${
                    active
                      ? 'bg-black text-white'
                      : 'text-black/40 border border-black/15 hover:border-black/40'
                  }`}
                >
                  {j.label}
                </button>
              )
            })}
            <div className="w-px h-4 bg-black/10 mx-1" />
            <label className="font-mono text-[10px] uppercase tracking-[0.1em] text-black/30
                               border border-black/15 px-3 py-1.5 cursor-pointer
                               hover:border-black/40 hover:text-black/60 transition-colors
                               flex items-center gap-1.5">
              <Paperclip className="h-[10px] w-[10px]" />
              Attach
              <input ref={fileInputRef} type="file" multiple
                     accept=".pdf,.docx,.txt" className="hidden"
                     onChange={handleFileChange} />
            </label>
          </div>

          {/* Right — scope + submit */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex border border-black/15">
              <button
                onClick={() => setScopeMode('standard')}
                className={`font-mono text-[10px] uppercase tracking-[0.1em] px-3 py-1.5
                             transition-colors ${
                  scopeMode === 'standard' ? 'bg-black text-white' : 'text-black/30 hover:text-black/60'
                }`}
              >
                Standard
              </button>
              <button
                onClick={() => setScopeMode('deep')}
                className={`font-mono text-[10px] uppercase tracking-[0.1em] px-3 py-1.5
                             border-l border-black/15 transition-colors ${
                  scopeMode === 'deep' ? 'bg-black text-white' : 'text-black/30 hover:text-black/60'
                }`}
              >
                Deep
              </button>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`font-mono text-[11px] uppercase tracking-[0.1em] px-5 py-2
                           transition-all duration-150 flex items-center gap-2 ${
                canSubmit
                  ? 'bg-black text-white hover:bg-[#0047FF]'
                  : 'bg-black/10 text-black/20 cursor-not-allowed'
              }`}
            >
              {isSubmitting
                ? <><Loader2 className="h-[11px] w-[11px] animate-spin" />Running</>
                : <>Run ⌘↵</>
              }
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-3 border border-black/20 px-4 py-3">
          <p className="font-mono text-[11px] text-black/60">{error}</p>
        </div>
      )}

      {/* Scope description — contextual, below toolbar */}
      <div className="mt-3 flex items-start gap-2">
        <span className="font-mono text-[10px] text-black/20 uppercase tracking-[0.2em] shrink-0 mt-px">
          {scopeMode === 'standard' ? 'Standard' : 'Deep'}
        </span>
        <p className="font-mono text-[10px] text-black/30 leading-relaxed">
          {scopeMode === 'standard'
            ? '10 agents · retrieval, analysis, adversarial review, lateral thinking, stress-testing, synthesis · ~90 seconds'
            : 'Multi-session iterative analysis · builds a structured legal opinion over multiple research cycles · living opinion · Obsidian export'
          }
        </p>
      </div>

      {/* Example queries — flat list, below the form */}
      <div className="mt-12">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-black/20 mb-5">
          Example queries
        </p>
        <div className="space-y-0 border-t border-black/10">
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => { setQueryText(ex.text); textareaRef.current?.focus() }}
              className="w-full text-left flex items-start justify-between gap-6
                         py-4 border-b border-black/10
                         hover:bg-black/[0.02] transition-colors group"
            >
              <p className="font-mono text-[12px] text-black/50 leading-relaxed
                             group-hover:text-black/80 transition-colors">
                {ex.text.length > 140 ? ex.text.slice(0, 140) + '…' : ex.text}
              </p>
              <span className="font-mono text-[10px] text-black/20 uppercase
                               tracking-[0.15em] shrink-0 mt-0.5 group-hover:text-[#0047FF] transition-colors">
                {ex.tag} →
              </span>
            </button>
          ))}
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
