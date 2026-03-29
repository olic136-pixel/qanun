'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEntity } from '@/lib/entity-context'
import { Loader2, ArrowLeft, Play, FileStack } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'

const JURISDICTIONS = [
  { code: 'ADGM', label: 'ADGM / FSRA' },
  { code: 'VARA', label: 'VARA — Dubai' },
  { code: 'EL_SALVADOR', label: 'El Salvador — CNAD' },
]

const TIER_OPTIONS = [
  { tier: 1, label: 'Registration Pack', description: 'Documents submitted with licence application' },
  { tier: 2, label: 'Mandatory Compliance Framework', description: 'Policies required as licence conditions' },
  { tier: 3, label: 'Corporate Governance Framework', description: 'Board structure and authority documents' },
  { tier: 4, label: 'Operational Procedures', description: 'Step-by-step activity instructions' },
  { tier: 5, label: 'Regulatory Filings & Monitoring', description: 'Ongoing filing templates' },
]

interface SuiteJob {
  suite_job_id: string
  status: string
  total_documents: number
  doc_types: string[]
  poll_url: string
}

export default function GovernanceSuitePage() {
  const { data: session } = useSession()
  const { selectedEntity } = useEntity()
  const router = useRouter()
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken || ''

  const [jurisdiction, setJurisdiction] = useState('ADGM')
  const [selectedTiers, setSelectedTiers] = useState<number[]>([1, 2])
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')

  function toggleTier(tier: number) {
    setSelectedTiers(prev =>
      prev.includes(tier) ? prev.filter(t => t !== tier) : [...prev, tier]
    )
  }

  async function handleStartSuite() {
    if (!selectedEntity?.id || !token) return
    setStarting(true)
    setError('')
    try {
      const res = await apiFetch<SuiteJob>('/api/drafting/suite', {
        method: 'POST',
        body: JSON.stringify({
          entity_id: selectedEntity.id,
          jurisdiction,
          tiers: selectedTiers.sort(),
          doc_types: [],
        }),
        token,
      })
      router.push(`/compliance/governance-suite/${res.suite_job_id}`)
    } catch (e: any) {
      setError(e.message)
      setStarting(false)
    }
  }

  return (
    <div className="max-w-[720px] mx-auto py-8 px-4">
      {/* Header */}
      <button
        onClick={() => router.push('/compliance/documents')}
        className="flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 mb-4 transition-colors"
      >
        <ArrowLeft size={12} /> Back to documents
      </button>

      <div className="flex items-center gap-3 mb-2">
        <FileStack size={20} className="text-[#0F7A5F]" />
        <h1 className="text-xl font-bold text-[#0B1829]">Governance Suite</h1>
      </div>
      <p className="text-[13px] text-gray-500 mb-7">
        Draft a complete governance package for {selectedEntity?.name ?? 'this entity'} across
        selected tiers. Each document is drafted sequentially and can be downloaded individually
        or as a ZIP.
      </p>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-[13px] mb-5">
          {error}
        </div>
      )}

      {/* Jurisdiction */}
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-2">
          Jurisdiction
        </p>
        <div className="flex gap-2">
          {JURISDICTIONS.map(j => (
            <button
              key={j.code}
              onClick={() => setJurisdiction(j.code)}
              className={`px-4 py-2 rounded-lg text-[12px] font-semibold border transition-colors ${
                jurisdiction === j.code
                  ? 'bg-[#0B1829] text-white border-[#0B1829]'
                  : 'bg-white text-gray-600 border-[#E8EBF0] hover:border-gray-300'
              }`}
            >
              {j.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tier selection */}
      <div className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-2">
          Tiers to include
        </p>
        <div className="space-y-2">
          {TIER_OPTIONS.map(t => (
            <button
              key={t.tier}
              onClick={() => toggleTier(t.tier)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                selectedTiers.includes(t.tier)
                  ? 'border-[#0F7A5F] bg-[#0F7A5F]/5'
                  : 'border-[#E8EBF0] bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[13px] font-semibold text-[#0B1829]">
                    Tier {t.tier} — {t.label}
                  </span>
                  <p className="text-[11px] text-gray-500 mt-0.5">{t.description}</p>
                </div>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ml-4 ${
                  selectedTiers.includes(t.tier)
                    ? 'border-[#0F7A5F] bg-[#0F7A5F]'
                    : 'border-gray-300'
                }`}>
                  {selectedTiers.includes(t.tier) && (
                    <span className="text-white text-[10px] font-bold">✓</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Summary + start */}
      <div className="p-4 bg-[#F5F7FA] rounded-lg mb-4">
        <p className="text-[12px] text-gray-600">
          <span className="font-semibold text-[#0B1829]">{selectedTiers.length} tier{selectedTiers.length !== 1 ? 's' : ''}</span> selected
          {' · '}
          <span className="font-semibold text-[#0B1829]">{jurisdiction}</span>
          {' · '}
          Documents drafted sequentially
        </p>
      </div>

      <button
        onClick={handleStartSuite}
        disabled={starting || selectedTiers.length === 0 || !selectedEntity}
        className="flex items-center justify-center gap-2 w-full py-3 bg-[#0F7A5F] text-white rounded-lg text-[14px] font-semibold hover:bg-[#0F6E56] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {starting ? (
          <><Loader2 size={16} className="animate-spin" /> Starting suite…</>
        ) : (
          <><Play size={16} /> Start Governance Suite</>
        )}
      </button>
    </div>
  )
}
