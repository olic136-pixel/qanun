'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSession } from '@/lib/api/query'
import { useState, useEffect, Suspense } from 'react'
import { Loader2, Search, Sparkles, Scale, BookOpen, Shield, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

const JURISDICTIONS = [
  { id: 'ADGM', label: 'ADGM / FSRA' },
  { id: 'DIFC', label: 'DIFC / DFSA' },
  { id: 'EL_SALVADOR', label: 'El Salvador' },
]

const AGENTS = [
  { id: 'retriever', label: 'Retriever', icon: Search, description: 'Searches the regulatory corpus' },
  { id: 'analyzer', label: 'Analyzer', icon: Scale, description: 'Legal analysis and interpretation' },
  { id: 'comparator', label: 'Comparator', icon: BookOpen, description: 'Cross-jurisdiction comparison' },
  { id: 'validator', label: 'Validator', icon: Shield, description: 'Claim verification and grounding' },
  { id: 'synthesizer', label: 'Synthesizer', icon: FileText, description: 'Final synthesis and memo' },
]

function QueryPageInner() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [queryText, setQueryText] = useState('')
  const [activeJurisdictions, setActiveJurisdictions] = useState<string[]>(['ADGM'])
  const [selectedAgents, setSelectedAgents] = useState<string[]>(
    AGENTS.map((a) => a.id)
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const q = searchParams.get('q')
    const j = searchParams.get('jurisdiction')
    if (q) setQueryText(q)
    if (j) {
      const match = JURISDICTIONS.find(
        (jur) => jur.id === j || jur.label === j
      )
      if (match) setActiveJurisdictions([match.id])
    }
  }, [searchParams])

  const toggleJurisdiction = (id: string) => {
    setActiveJurisdictions((prev) =>
      prev.includes(id) ? prev.filter((j) => j !== id) : [...prev, id]
    )
  }

  const toggleAgent = (id: string) => {
    setSelectedAgents((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  const handleSubmit = async () => {
    if (!queryText.trim() || !session?.user?.accessToken) return
    if (activeJurisdictions.length === 0) {
      setError('Select at least one jurisdiction')
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      const result = await createSession(
        {
          query: queryText.trim(),
          jurisdictions: activeJurisdictions,
          agents: selectedAgents,
        },
        session.user.accessToken as string
      )
      router.push(`/query/${result.session_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create query session')
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-gold" />
          <h1 className="text-2xl font-semibold text-gray-900">New Query</h1>
        </div>
        <p className="text-[14px] text-gray-600">
          Ask a regulatory question. QANUN will search the corpus, analyse, and
          synthesise a grounded response with citations.
        </p>
      </div>

      {/* Query input */}
      <Card className="p-6 mb-6">
        <label className="block text-[13px] font-medium text-gray-900 mb-2">
          Your question
        </label>
        <Textarea
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. What are the ADGM requirements for financial promotions by virtual asset service providers?"
          className="min-h-[120px] text-[14px] resize-none"
          disabled={isSubmitting}
        />
        <p className="text-[11px] text-gray-400 mt-2">
          Press ⌘+Enter to submit
        </p>
      </Card>

      {/* Jurisdictions */}
      <Card className="p-6 mb-6">
        <label className="block text-[13px] font-medium text-gray-900 mb-3">
          Jurisdictions
        </label>
        <div className="flex flex-wrap gap-2">
          {JURISDICTIONS.map((j) => (
            <button
              key={j.id}
              onClick={() => toggleJurisdiction(j.id)}
              disabled={isSubmitting}
              className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors ${
                activeJurisdictions.includes(j.id)
                  ? 'bg-navy text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {j.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Agents */}
      <Card className="p-6 mb-6">
        <label className="block text-[13px] font-medium text-gray-900 mb-3">
          Agents
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {AGENTS.map((agent) => {
            const Icon = agent.icon
            const isSelected = selectedAgents.includes(agent.id)
            return (
              <button
                key={agent.id}
                onClick={() => toggleAgent(agent.id)}
                disabled={isSubmitting}
                className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                  isSelected
                    ? 'border-navy bg-navy/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div
                  className={`mt-0.5 p-1.5 rounded ${
                    isSelected ? 'bg-navy text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="text-[13px] font-medium text-gray-900">
                    {agent.label}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {agent.description}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-[13px] text-[#991B1B]">{error}</p>
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !queryText.trim()}
          className="bg-navy hover:bg-navy/90 text-white px-6"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting…
            </>
          ) : (
            <>
              Run query →
            </>
          )}
        </Button>
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
