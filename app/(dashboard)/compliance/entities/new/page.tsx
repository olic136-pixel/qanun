'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createEntity } from '@/lib/api/entities'

const FSP_CATEGORIES = [
  { value: 'category_1', label: 'Category 1 — Deposit Taking' },
  { value: 'category_2', label: 'Category 2 — Dealing in Investments' },
  { value: 'category_3a', label: 'Category 3A — Managing Investments (Retail)' },
  { value: 'category_3b', label: 'Category 3B — Managing CIFs' },
  { value: 'category_3c', label: 'Category 3C — Managing Assets (Professional Only)' },
  { value: 'category_4', label: 'Category 4 — Arranging Deals' },
  { value: 'representative_office', label: 'Representative Office' },
]

const COMMON_ACTIVITIES = [
  'Managing Assets',
  'Arranging Deals in Investments',
  'Advising on Investments',
  'Managing a Collective Investment Fund',
  'Dealing in Investments as Agent',
  'Dealing in Investments as Principal',
  'Providing Custody',
]

export default function NewEntityPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken || ''

  const [form, setForm] = useState({
    entity_name: '',
    entity_type: 'category_3c',
    permitted_activities: [] as string[],
    is_fund_manager: false,
    has_retail_clients: false,
    mlro_name: '[[MLROName]]',
    compliance_name: '[[ComplianceName]]',
    seo_name: '[[SEOName]]',
    target_jurisdiction: 'ADGM',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function toggleActivity(act: string) {
    setForm((f) => ({
      ...f,
      permitted_activities: f.permitted_activities.includes(act)
        ? f.permitted_activities.filter((a) => a !== act)
        : [...f.permitted_activities, act],
    }))
  }

  async function handleSubmit() {
    if (!form.entity_name.trim()) {
      setError('Entity name is required')
      return
    }
    if (form.permitted_activities.length === 0) {
      setError('Select at least one permitted activity')
      return
    }
    if (!token) {
      setError('Not authenticated')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await createEntity(form, token)
      router.push(`/compliance/submission`)
    } catch (e: any) {
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft size={14} /> Back
      </button>

      <h1 className="text-xl font-bold text-[#0B1829] mb-2">Add Entity</h1>
      <p className="text-sm text-gray-500 mb-8">
        Create an FSP applicant entity to begin drafting its compliance document suite.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm mb-6">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Entity Name *</label>
          <input
            type="text"
            value={form.entity_name}
            onChange={(e) => setForm((f) => ({ ...f, entity_name: e.target.value }))}
            placeholder="e.g. Acme Capital Management Ltd"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-400"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">FSP Category *</label>
          <select
            value={form.entity_type}
            onChange={(e) => setForm((f) => ({ ...f, entity_type: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-400"
          >
            {FSP_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Permitted Activities *</label>
          <div className="space-y-2">
            {COMMON_ACTIVITIES.map((act) => (
              <label key={act} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.permitted_activities.includes(act)}
                  onChange={() => toggleActivity(act)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">{act}</span>
              </label>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_fund_manager}
            onChange={(e) => setForm((f) => ({ ...f, is_fund_manager: e.target.checked }))}
            className="rounded"
          />
          <span className="text-sm font-semibold text-gray-700">Fund manager</span>
        </label>

        <div className="border border-gray-200 rounded-lg p-5 space-y-4">
          <p className="text-sm font-semibold text-gray-700">
            Key Personnel
            <span className="text-gray-400 font-normal ml-2">(placeholders OK)</span>
          </p>
          {[
            { key: 'seo_name', label: 'Senior Executive Officer' },
            { key: 'compliance_name', label: 'Compliance Officer' },
            { key: 'mlro_name', label: 'MLRO' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
              <input
                type="text"
                value={(form as Record<string, any>)[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 bg-[#0B1829] text-white font-semibold rounded-md text-sm hover:bg-[#1D2D44] disabled:bg-gray-400 transition-colors"
        >
          {loading ? 'Creating…' : '→ Create Entity & Begin Package'}
        </button>
      </div>
    </div>
  )
}
