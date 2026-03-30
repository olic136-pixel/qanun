'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useOnboardingStore } from '@/lib/stores/onboardingStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, ArrowRight, Building2 } from 'lucide-react'

const roles = [
  'Founder / CEO',
  'CLO / General Counsel',
  'In-house Compliance',
  'Law firm associate',
  'Law firm partner',
  'Other',
]

function StepDots({ current }: { current: 1 | 2 }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      {([1, 2] as const).map((s) => (
        <div key={s} className="flex flex-col items-center gap-1">
          <div className={`w-3 h-3 rounded-full border-2 transition-colors ${
            s < current
              ? 'bg-[#0F7A5F] border-[#0F7A5F]'
              : s === current
                ? 'bg-[#0B1829] border-[#0B1829]'
                : 'bg-transparent border-[#9CA3AF]'
          }`} />
          <span className="text-[10px] text-[#9CA3AF]">
            {s === 1 ? 'About you' : 'Your entity'}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const store = useOnboardingStore()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submitOnboarding() {
    setSubmitting(true)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.user?.accessToken}`,
        },
        body: JSON.stringify({ role: store.role, org_name: store.orgName }),
      })
      store.reset()
      router.push('/compliance/entities/new')
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <StepDots current={store.step} />

      {/* Step 1 — About you */}
      {store.step === 1 && (
        <div>
          <h2 className="text-xl font-semibold text-[#0B1829] mb-1">Tell us about yourself</h2>
          <p className="text-sm text-[#6B7280] mb-6">What best describes your role?</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {roles.map((r) => (
              <button key={r} onClick={() => store.setRole(r)}
                className={`text-left border rounded-lg p-4 text-sm cursor-pointer transition-colors ${
                  store.role === r ? 'border-[#1A5FA8] bg-[#EFF6FF]' : 'border-[#E8EBF0] hover:border-[#9CA3AF]'
                }`}>
                {r}
              </button>
            ))}
          </div>
          <div>
            <label className="text-sm font-medium text-[#111827] mb-1 block">Organisation name</label>
            <Input placeholder="Your company" value={store.orgName} onChange={(e) => store.setOrgName(e.target.value)} />
          </div>
        </div>
      )}

      {/* Step 2 — Create your entity */}
      {store.step === 2 && (
        <div>
          <h2 className="text-xl font-semibold text-[#0B1829] mb-1">Create your first entity</h2>
          <p className="text-sm text-[#6B7280] mb-6">
            An entity is the regulated firm you are building a compliance structure for. Qanun will ask you a series of focused questions to determine the right regulatory framework and generate your complete governance suite.
          </p>
          <div className="border border-[#E8EBF0] rounded-xl p-5 bg-[#F5F7FA] mb-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#0B1829] flex items-center justify-center shrink-0 mt-0.5">
                <Building2 size={14} className="text-[#C4922A]" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[#0B1829] mb-1">Conversational setup</p>
                <p className="text-[12px] text-[#6B7280] leading-relaxed">
                  No forms. No dropdowns. Qanun will have a short conversation with you to understand your business, confirm the right licence category, and recommend the complete governance document suite for your entity.
                </p>
              </div>
            </div>
          </div>
          {error && <p className="text-[13px] text-[#991B1B] mb-3">{error}</p>}
          <Button disabled={submitting} className="w-full bg-[#0B1829] text-white hover:bg-[#1A5FA8]"
            onClick={submitOnboarding}>
            {submitting
              ? <Loader2 className="animate-spin" size={18} />
              : <><span>Begin Entity Setup</span><ArrowRight size={14} className="ml-2" /></>
            }
          </Button>
        </div>
      )}

      {/* Navigation */}
      {store.step === 1 && (
        <div className="flex justify-end mt-8">
          <Button className="bg-[#0B1829] text-white hover:bg-[#1A5FA8]"
            onClick={() => { setError(''); if (!store.role) { setError('Please select a role'); return; } store.setStep(2) }}>
            Next
          </Button>
        </div>
      )}
      {store.step === 2 && (
        <div className="mt-4">
          <Button variant="ghost" onClick={() => store.setStep(1)}>Back</Button>
        </div>
      )}
    </div>
  )
}
