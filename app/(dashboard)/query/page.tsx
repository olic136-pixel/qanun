'use client'

import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChevronDown, ChevronUp } from 'lucide-react'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { Checkbox } from '@/components/ui/checkbox'

const JURISDICTIONS = [
  { id: 'adgm', label: 'ADGM / FSRA' },
  { id: 'difc', label: 'DIFC / DFSA' },
  { id: 'el-salvador', label: 'El Salvador' },
  { id: 'cross', label: 'Cross-jurisdiction' },
] as const

const AGENTS = [
  'orchestrator',
  'retriever',
  'analyst',
  "devil's_advocate",
  'blue_sky',
  'rsa',
  'stress_tester',
  'ux_advocate',
  'memory_scribe',
  'task_director',
] as const

const EXAMPLE_QUERIES = [
  {
    label: 'PRU 1.3.3(2) — matched principal conditions',
    query:
      'What are the four conditions for dealing as Matched Principal under PRU 1.3.3(2), and does a dual-entity CFD structure satisfy each condition?',
  },
  {
    label: 'COBS 23.12.2 — copy trading and block-delegation',
    query: 'How does COBS 23.12.2 affect copy trading platforms and block-delegation strategies?',
  },
  {
    label: 'Category 3A vs 3C — what triggers reclassification?',
    query: 'What are the key differences between Category 3A and 3C firms, and what triggers reclassification?',
  },
]

export function QueryPage() {
  const searchParams = useSearchParams()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [query, setQuery] = useState('')
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<Set<string>>(
    new Set(['adgm'])
  )
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(
    new Set(AGENTS)
  )

  // Read from URL params on mount
  useEffect(() => {
    const qParam = searchParams.get('q')
    if (qParam) {
      setQuery(qParam)
    }
    const jurisdictionParam = searchParams.get('jurisdiction')
    if (jurisdictionParam) {
      const validJurisdiction = JURISDICTIONS.find((j) => j.id === jurisdictionParam)
      if (validJurisdiction) {
        setSelectedJurisdictions(new Set([jurisdictionParam]))
      }
    }
  }, [searchParams])

  // Auto-grow textarea
  const handleTextareaInput = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 400)}px`
    }
  }

  const toggleJurisdiction = (id: string) => {
    setSelectedJurisdictions((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        // Prevent deselecting if it's the last one
        if (next.size > 1) {
          next.delete(id)
        }
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleAgent = (agent: string) => {
    setSelectedAgents((prev) => {
      const next = new Set(prev)
      if (next.has(agent)) {
        next.delete(agent)
      } else {
        next.add(agent)
      }
      return next
    })
  }

  const handleExampleClick = (exampleQuery: string) => {
    setQuery(exampleQuery)
    textareaRef.current?.focus()
    // Trigger resize
    setTimeout(handleTextareaInput, 0)
  }

  const isDisabled = !query.trim() || selectedJurisdictions.size === 0

  const handleSubmit = () => {
    if (isDisabled) return
    // TODO: Submit query
    console.log('Submitting query:', {
      query,
      jurisdictions: Array.from(selectedJurisdictions),
      agents: Array.from(selectedAgents),
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="max-w-[800px] mx-auto w-full space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-[28px] font-medium text-[#0B1829]">New query</h1>
        <p className="text-[14px] text-[#6B7280] mt-1">
          Ask anything across the regulatory corpus
        </p>
      </div>

      {/* Query Input Box */}
      <div className="bg-white border border-[#E8EBF0] rounded-xl p-5">
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onInput={handleTextareaInput}
          onKeyDown={handleKeyDown}
          placeholder="e.g. What are the four conditions for dealing as Matched Principal under PRU 1.3.3(2), and does a dual-entity CFD structure satisfy each condition?"
          className="min-h-[120px] max-h-[400px] resize-none bg-transparent border-none outline-none text-[14px] text-[#111827] leading-relaxed w-full placeholder:text-[#9CA3AF]"
        />

        {/* Character count */}
        {query.length > 300 && (
          <p className="text-[11px] text-[#9CA3AF] mt-1 text-right">
            {query.length} characters
          </p>
        )}

        {/* Jurisdiction Chips */}
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-[#E8EBF0]">
          {JURISDICTIONS.map((j) => {
            const isActive = selectedJurisdictions.has(j.id)
            return (
              <button
                key={j.id}
                onClick={() => toggleJurisdiction(j.id)}
                className={`text-[11px] px-3 py-1 rounded-full cursor-pointer transition-colors duration-100 ${
                  isActive
                    ? 'bg-[#EFF6FF] text-[#0C447C] border border-[#85B7EB] font-medium'
                    : 'bg-white text-[#6B7280] border border-[#E8EBF0] hover:border-[#9CA3AF]'
                }`}
              >
                {j.label}
              </button>
            )
          })}
        </div>

        {/* Advanced Options Accordion */}
        <Accordion className="mt-3">
          <AccordionItem value="advanced" className="border-none">
            <AccordionTrigger className="flex items-center gap-1.5 text-[12px] text-[#9CA3AF] hover:text-[#6B7280] cursor-pointer py-0 hover:no-underline [&>svg]:hidden">
              <span className="flex items-center gap-1.5">
                Advanced options
                <ChevronDown
                  size={12}
                  strokeWidth={1.5}
                  className="transition-transform group-aria-expanded/accordion-trigger:hidden"
                />
                <ChevronUp
                  size={12}
                  strokeWidth={1.5}
                  className="hidden group-aria-expanded/accordion-trigger:inline"
                />
              </span>
            </AccordionTrigger>
            <AccordionContent className="pt-3 pb-0">
              <p className="text-[11px] text-[#9CA3AF] mb-2">Select agents</p>
              <div className="grid grid-cols-2 gap-1">
                {AGENTS.map((agent) => (
                  <label
                    key={agent}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedAgents.has(agent)}
                      onCheckedChange={() => toggleAgent(agent)}
                    />
                    <span className="text-[12px] text-[#111827] capitalize">
                      {agent.replace(/_/g, ' ')}
                    </span>
                  </label>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isDisabled}
          className={`mt-4 w-full h-[44px] rounded-md text-[14px] font-medium transition-all duration-150 ${
            isDisabled
              ? 'bg-[#F5F7FA] text-[#9CA3AF] cursor-not-allowed'
              : 'bg-[#0B1829] text-[#C4922A] hover:bg-[#1A5FA8] hover:text-white'
          }`}
        >
          Run query →
        </button>

        {/* Keyboard hint */}
        <p className="text-[11px] text-[#9CA3AF] text-center mt-2">
          ⌘ Enter to submit
        </p>
      </div>

      {/* Example Queries */}
      <div className="mt-2">
        <p className="text-[11px] text-[#9CA3AF] mb-2">Try an example</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_QUERIES.map((example) => (
            <button
              key={example.label}
              onClick={() => handleExampleClick(example.query)}
              className="border border-[#E8EBF0] rounded-full px-3 py-1.5 text-[12px] text-[#6B7280] hover:border-[#1A5FA8] hover:text-[#1A5FA8] cursor-pointer bg-white transition-colors duration-100"
            >
              {example.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default QueryPage
