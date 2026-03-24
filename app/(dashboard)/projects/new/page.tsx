'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createProject } from '@/lib/api/projects'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'

const JURISDICTIONS = [
  { id: 'ADGM / FSRA', label: 'ADGM / FSRA' },
  { id: 'DIFC / DFSA', label: 'DIFC / DFSA' },
  { id: 'El Salvador', label: 'El Salvador' },
]

const FOCUS_AREAS = ['PRU', 'COBS', 'FSMR', 'GEN', 'MKT', 'FUNDS', 'AML']

export default function NewProjectPage() {
  const { data: authSession } = useSession()
  const router = useRouter()
  const token = authSession?.user?.accessToken as string | null

  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('')
  const [objective, setObjective] = useState('')
  const [jurisdiction, setJurisdiction] = useState('ADGM / FSRA')
  const [focusAreas, setFocusAreas] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleFocus = (area: string) => {
    setFocusAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    )
  }

  const canProceed = step === 1 && title.trim().length >= 5 && objective.trim().length >= 50

  const handleSubmit = async () => {
    // Re-read token at submit time to catch session refresh
    const currentToken = authSession?.user?.accessToken
    if (!currentToken || typeof currentToken !== 'string') {
      setError('Session expired — please sign in again.')
      return
    }
    setError(null)
    setIsSubmitting(true)
    try {
      const result = await createProject(
        {
          title: title.trim(),
          objective: objective.trim(),
          jurisdiction,
          focus_areas: focusAreas,
        },
        currentToken
      )
      router.push(`/projects/${result.project_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push('/projects')}
          className="flex items-center gap-1 text-[13px] text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Cancel
        </button>
        <span className="text-[12px] text-gray-400">Step {step} of 2</span>
      </div>

      <h1 className="text-2xl font-semibold text-gray-900 mb-1">New project</h1>
      <p className="text-[14px] text-gray-500 mb-6">
        {step === 1
          ? 'Define the legal question you want to research.'
          : 'Set the jurisdiction and optional focus areas.'}
      </p>

      {step === 1 && (
        <Card className="p-6 space-y-5">
          <div>
            <label className="block text-[13px] font-medium text-gray-900 mb-1.5">
              Project title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. TradeDar — Category 3A Licence Analysis"
              className="w-full border border-[#E8EBF0] rounded-md px-3 py-2.5 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#1A5FA8] focus:border-[#1A5FA8]"
            />
            {title.length > 0 && title.trim().length < 5 && (
              <p className="text-[11px] text-[#991B1B] mt-1">Minimum 5 characters</p>
            )}
          </div>
          <div>
            <label className="block text-[13px] font-medium text-gray-900 mb-1.5">
              Research objective
            </label>
            <textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="What is the core legal question you need answered?"
              rows={5}
              className="w-full border border-[#E8EBF0] rounded-md px-3 py-2.5 text-[14px] text-gray-900 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-[#1A5FA8] focus:border-[#1A5FA8]"
            />
            <div className="flex justify-between mt-1">
              {objective.length > 0 && objective.trim().length < 50 && (
                <p className="text-[11px] text-[#991B1B]">Minimum 50 characters</p>
              )}
              <p className="text-[11px] text-gray-400 ml-auto">
                {objective.length} / 50 min
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={!canProceed}
              className={`flex items-center gap-1.5 h-[38px] px-5 rounded-md text-[13px] font-medium transition-all ${
                canProceed
                  ? 'bg-[#0B1829] text-[#C4922A] hover:bg-[#1A5FA8] hover:text-white'
                  : 'bg-[#F5F7FA] text-[#9CA3AF] cursor-not-allowed'
              }`}
            >
              Next
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="p-6 space-y-5">
          <div>
            <label className="block text-[13px] font-medium text-gray-900 mb-2">
              Jurisdiction
            </label>
            <div className="flex flex-wrap gap-2">
              {JURISDICTIONS.map((j) => (
                <button
                  key={j.id}
                  onClick={() => setJurisdiction(j.id)}
                  className={`text-[12px] font-medium px-4 py-2 rounded-full transition-colors ${
                    jurisdiction === j.id
                      ? 'bg-[#0B1829] text-[#C4922A]'
                      : 'bg-white text-[#6B7280] border border-[#E8EBF0] hover:border-[#9CA3AF]'
                  }`}
                >
                  {j.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-gray-900 mb-2">
              Focus areas (optional)
            </label>
            <p className="text-[12px] text-gray-500 mb-2">
              Helps focus the first research cycle
            </p>
            <div className="flex flex-wrap gap-2">
              {FOCUS_AREAS.map((area) => (
                <button
                  key={area}
                  onClick={() => toggleFocus(area)}
                  className={`text-[12px] font-medium px-3 py-1.5 rounded-full transition-colors ${
                    focusAreas.includes(area)
                      ? 'bg-[#1A5FA8] text-white'
                      : 'bg-white text-[#6B7280] border border-[#E8EBF0] hover:border-[#9CA3AF]'
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-[13px] text-[#991B1B]">{error}</p>
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1 text-[13px] text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 h-[38px] px-5 rounded-md text-[13px] font-medium bg-[#0B1829] text-[#C4922A] hover:bg-[#1A5FA8] hover:text-white transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Create project'
              )}
            </button>
          </div>
        </Card>
      )}
    </div>
  )
}
