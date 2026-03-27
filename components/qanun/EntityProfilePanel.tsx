'use client'

import { useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp, Check, Loader2, User } from 'lucide-react'
import { updateEntityProfile, type EntityProfile, type EntityProfileUpdatePayload } from '@/lib/api/entities'

interface Props {
  entityId: string
  entityName: string
  profile: EntityProfile
  mlroName: string
  complianceName: string
  seoName: string
  token: string
  onSaved?: (updated: EntityProfile & { mlro_name: string; compliance_name: string; seo_name: string }) => void
}

const PLACEHOLDER = (v: string) => !v || v.startsWith('[[') || v === '[TO BE CONFIRMED]'

const JURISDICTION_OPTIONS = [
  'UAE', 'Saudi Arabia', 'Kuwait', 'Qatar', 'Bahrain', 'Oman',
  'Egypt', 'Jordan', 'UK', 'Switzerland', 'Luxembourg', 'Cayman Islands',
  'BVI', 'Singapore', 'Hong Kong', 'United States', 'Other',
]

const AUM_OPTIONS = [
  'Under USD 10m', 'USD 10–50m', 'USD 50–100m', 'USD 100–500m',
  'USD 500m–1bn', 'Over USD 1bn',
]

export function EntityProfilePanel({
  entityId, entityName, profile, mlroName, complianceName, seoName, token, onSaved,
}: Props) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [mlro, setMlro] = useState(PLACEHOLDER(mlroName) ? '' : mlroName)
  const [compliance, setCompliance] = useState(PLACEHOLDER(complianceName) ? '' : complianceName)
  const [seo, setSeo] = useState(PLACEHOLDER(seoName) ? '' : seoName)
  const [jurisdictions, setJurisdictions] = useState<string[]>(profile.primary_jurisdictions ?? [])
  const [clientComposition, setClientComposition] = useState(profile.client_composition ?? '')
  const [aumRange, setAumRange] = useState(profile.aum_range ?? '')
  const [foreignBranches, setForeignBranches] = useState<boolean | undefined>(profile.has_foreign_branches)
  const [pepExposure, setPepExposure] = useState(profile.pep_exposure ?? '')
  const [staffCount, setStaffCount] = useState(profile.staff_count_range ?? '')

  const missingCount = [
    PLACEHOLDER(mlroName) && !mlro,
    PLACEHOLDER(complianceName) && !compliance,
    !jurisdictions.length,
    !aumRange,
  ].filter(Boolean).length

  function toggleJurisdiction(j: string) {
    setJurisdictions((prev) =>
      prev.includes(j) ? prev.filter((x) => x !== j) : [...prev, j]
    )
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const payload: EntityProfileUpdatePayload = {}
      if (mlro) payload.mlro_name = mlro
      if (compliance) payload.compliance_name = compliance
      if (seo) payload.seo_name = seo
      if (jurisdictions.length) payload.primary_jurisdictions = jurisdictions
      if (clientComposition) payload.client_composition = clientComposition
      if (aumRange) payload.aum_range = aumRange
      if (foreignBranches !== undefined) payload.has_foreign_branches = foreignBranches
      if (pepExposure) payload.pep_exposure = pepExposure
      if (staffCount) payload.staff_count_range = staffCount

      const res = await updateEntityProfile(entityId, payload, token)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      onSaved?.({
        ...res.entity_profile,
        mlro_name: mlro || mlroName,
        compliance_name: compliance || complianceName,
        seo_name: seo || seoName,
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border border-[#E8EBF0] rounded-lg bg-white overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <User size={14} className="text-gray-400 shrink-0" />
          <span className="text-[13px] font-semibold text-[#0B1829]">Entity Profile</span>
          {missingCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
              <AlertTriangle size={9} />
              {missingCount} field{missingCount > 1 ? 's' : ''} missing
            </span>
          )}
          {missingCount === 0 && (
            <span className="text-[10px] text-[#0F7A5F] font-medium">Profile complete</span>
          )}
        </div>
        {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </button>

      {open && (
        <div className="border-t border-[#E8EBF0] px-4 py-4 space-y-4">
          <p className="text-[11px] text-gray-500 leading-relaxed">
            These facts are injected into every document draft for <strong>{entityName}</strong>.
            Missing fields will appear as <code className="text-[10px] bg-gray-100 px-1 rounded">[TO BE CONFIRMED]</code> placeholders in the output — Claude will not invent them.
          </p>

          {/* Key personnel */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-2">Key Personnel</p>
            <div className="grid grid-cols-1 gap-2">
              {[
                { label: 'MLRO name', value: mlro, set: setMlro, placeholder: 'e.g. Jane Smith' },
                { label: 'Compliance officer', value: compliance, set: setCompliance, placeholder: 'e.g. David Jones' },
                { label: 'Senior executive officer (SEO)', value: seo, set: setSeo, placeholder: 'e.g. Sarah Al-Rashidi' },
              ].map(({ label, value, set, placeholder }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-500 w-40 shrink-0">{label}</span>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 text-[12px] px-2 py-1.5 border border-[#E8EBF0] rounded focus:outline-none focus:border-[#1A5FA8] bg-white"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Geographic footprint */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 mb-2">
              Primary Client Jurisdictions
            </p>
            <div className="flex flex-wrap gap-1.5">
              {JURISDICTION_OPTIONS.map((j) => (
                <button
                  key={j}
                  onClick={() => toggleJurisdiction(j)}
                  className={`text-[11px] px-2 py-1 rounded-full border transition-colors cursor-pointer ${
                    jurisdictions.includes(j)
                      ? 'border-[#1A5FA8] bg-blue-50 text-[#1A5FA8] font-medium'
                      : 'border-[#E8EBF0] text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {j}
                </button>
              ))}
            </div>
          </div>

          {/* Client composition + AUM */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 block mb-1">
                AUM Range
              </label>
              <select
                value={aumRange}
                onChange={(e) => setAumRange(e.target.value)}
                className="w-full text-[12px] px-2 py-1.5 border border-[#E8EBF0] rounded focus:outline-none focus:border-[#1A5FA8] bg-white"
              >
                <option value="">Select…</option>
                {AUM_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 block mb-1">
                Foreign branches / offices
              </label>
              <div className="flex gap-2 mt-1">
                {[{ label: 'None', value: false }, { label: 'Yes', value: true }].map(({ label, value }) => (
                  <button
                    key={label}
                    onClick={() => setForeignBranches(value)}
                    className={`flex-1 text-[12px] py-1.5 rounded border transition-colors cursor-pointer ${
                      foreignBranches === value
                        ? 'border-[#1A5FA8] bg-blue-50 text-[#1A5FA8] font-medium'
                        : 'border-[#E8EBF0] text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Client composition text */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 block mb-1">
              Client Composition (optional)
            </label>
            <input
              type="text"
              value={clientComposition}
              onChange={(e) => setClientComposition(e.target.value)}
              placeholder="e.g. 70% institutional, 20% UHNWI, 10% corporate treasury"
              className="w-full text-[12px] px-2 py-1.5 border border-[#E8EBF0] rounded focus:outline-none focus:border-[#1A5FA8] bg-white"
            />
          </div>

          {/* PEP + staff */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 block mb-1">
                PEP Exposure (optional)
              </label>
              <input
                type="text"
                value={pepExposure}
                onChange={(e) => setPepExposure(e.target.value)}
                placeholder="e.g. Low — approx 5% of clients"
                className="w-full text-[12px] px-2 py-1.5 border border-[#E8EBF0] rounded focus:outline-none focus:border-[#1A5FA8] bg-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-400 block mb-1">
                Staff Count (optional)
              </label>
              <input
                type="text"
                value={staffCount}
                onChange={(e) => setStaffCount(e.target.value)}
                placeholder="e.g. 5–10"
                className="w-full text-[12px] px-2 py-1.5 border border-[#E8EBF0] rounded focus:outline-none focus:border-[#1A5FA8] bg-white"
              />
            </div>
          </div>

          {error && (
            <p className="text-[12px] text-red-600">{error}</p>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-1.5 px-4 py-2 rounded text-[12px] font-semibold transition-colors ${
              saved
                ? 'bg-[#0F7A5F] text-white cursor-default'
                : saving
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-[#0B1829] text-white hover:bg-[#1D2D44] cursor-pointer'
            }`}
          >
            {saving ? (
              <><Loader2 size={12} className="animate-spin" /> Saving…</>
            ) : saved ? (
              <><Check size={12} /> Saved</>
            ) : (
              'Save profile'
            )}
          </button>
        </div>
      )}
    </div>
  )
}
