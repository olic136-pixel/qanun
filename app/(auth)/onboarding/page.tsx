'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useOnboardingStore } from '@/lib/stores/onboardingStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

const roles = [
  'Founder / CEO',
  'CLO / General Counsel',
  'In-house Compliance',
  'Law firm associate',
  'Law firm partner',
  'Other',
]

const jurisdictionOptions = [
  'ADGM',
  'DIFC',
  'El Salvador',
  'Saudi Arabia',
  'Mauritius',
  'Pakistan',
  'Bahrain',
  'Other',
]

const exampleQueries = [
  'PRU 1.3.3 matched principal conditions',
  'COBS 23.12.2 copy trading requirements',
  'Category 3A vs 3C: what additional FSPs are needed?',
]

function StepDots({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      {([1, 2, 3] as const).map((s) => (
        <div key={s} className="flex flex-col items-center gap-1">
          <div
            className={`w-3 h-3 rounded-full border-2 transition-colors ${
              s < current
                ? 'bg-[#0F7A5F] border-[#0F7A5F]'
                : s === current
                  ? 'bg-[#0B1829] border-[#0B1829]'
                  : 'bg-transparent border-[#9CA3AF]'
            }`}
          />
          <span className="text-[10px] text-[#9CA3AF]">
            {s === 1 ? 'About you' : s === 2 ? 'Jurisdictions' : 'First query'}
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

  async function submitOnboarding(redirectTo: string) {
    setSubmitting(true)
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/onboarding`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.user?.accessToken}`,
          },
          body: JSON.stringify({
            role: store.role,
            org_name: store.orgName,
            jurisdictions: store.jurisdictions,
          }),
        }
      )
      store.reset()
      router.push(redirectTo)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleNext() {
    setError('')
    if (store.step === 1) {
      if (!store.role) {
        setError('Please select a role')
        return
      }
      store.setStep(2)
    } else if (store.step === 2) {
      if (store.jurisdictions.length === 0) {
        setError('Select at least one jurisdiction')
        return
      }
      store.setStep(3)
    }
  }

  function handleBack() {
    setError('')
    if (store.step === 2) store.setStep(1)
    else if (store.step === 3) store.setStep(2)
  }

  return (
    <div className="w-full max-w-md">
      <StepDots current={store.step} />

      {/* Step 1 */}
      {store.step === 1 && (
        <div>
          <h2 className="text-xl font-semibold text-[#0B1829] mb-1">
            Tell us about yourself
          </h2>
          <p className="text-sm text-[#6B7280] mb-6">
            What best describes your role?
          </p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {roles.map((r) => (
              <button
                key={r}
                onClick={() => store.setRole(r)}
                className={`text-left border rounded-lg p-4 text-sm cursor-pointer transition-colors ${
                  store.role === r
                    ? 'border-[#1A5FA8] bg-[#EFF6FF]'
                    : 'border-[#E8EBF0] hover:border-[#9CA3AF]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <div>
            <label className="text-sm font-medium text-[#111827] mb-1 block">
              Organisation name
            </label>
            <Input
              placeholder="Your company"
              value={store.orgName}
              onChange={(e) => store.setOrgName(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Step 2 */}
      {store.step === 2 && (
        <div>
          <h2 className="text-xl font-semibold text-[#0B1829] mb-1">
            Where do you operate?
          </h2>
          <p className="text-sm text-[#6B7280] mb-6">
            Select all that apply. Your dashboard will prioritise these.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {jurisdictionOptions.map((j) => (
              <button
                key={j}
                onClick={() => store.toggleJurisdiction(j)}
                className={`text-left border rounded-lg p-4 text-sm cursor-pointer transition-colors ${
                  store.jurisdictions.includes(j)
                    ? 'border-[#1A5FA8] bg-[#EFF6FF]'
                    : 'border-[#E8EBF0] hover:border-[#9CA3AF]'
                }`}
              >
                {j}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3 */}
      {store.step === 3 && (
        <div>
          <h2 className="text-xl font-semibold text-[#0B1829] mb-1">
            Run your first query
          </h2>
          <p className="text-sm text-[#6B7280] mb-4">
            Optional — you can do this later.
          </p>
          <Textarea
            placeholder="e.g. What are the capital requirements for a Category 3A entity?"
            className="min-h-[120px] mb-3"
            value={store.firstQuery}
            onChange={(e) => store.setFirstQuery(e.target.value)}
          />
          <div className="flex flex-wrap gap-2 mb-6">
            {exampleQueries.map((q) => (
              <button
                key={q}
                onClick={() => store.setFirstQuery(q)}
                className="text-xs border border-[#E8EBF0] rounded-md px-3 py-1.5 text-[#6B7280] hover:border-[#1A5FA8] hover:text-[#1A5FA8] transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <Button
              disabled={submitting}
              className="flex-1 bg-[#0B1829] text-white hover:bg-[#1A5FA8]"
              onClick={() => {
                const redirect = store.firstQuery
                  ? `/query?q=${encodeURIComponent(store.firstQuery)}`
                  : '/dashboard'
                submitOnboarding(redirect)
              }}
            >
              {submitting ? (
                <Loader2 className="animate-spin" size={18} />
              ) : store.firstQuery ? (
                'Start with this query'
              ) : (
                'Go to dashboard \u2192'
              )}
            </Button>
            {!store.firstQuery && (
              <Button
                variant="ghost"
                disabled={submitting}
                onClick={() => submitOnboarding('/dashboard')}
              >
                Skip for now
              </Button>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="text-[13px] text-[#991B1B] mt-3">{error}</p>
      )}

      {/* Navigation */}
      {store.step < 3 && (
        <div className="flex justify-between mt-8">
          {store.step > 1 ? (
            <Button variant="ghost" onClick={handleBack}>
              Back
            </Button>
          ) : (
            <div />
          )}
          <Button
            className="bg-[#0B1829] text-white hover:bg-[#1A5FA8]"
            onClick={handleNext}
          >
            Next
          </Button>
        </div>
      )}
      {store.step === 3 && (
        <div className="mt-4">
          <Button variant="ghost" onClick={handleBack}>
            Back
          </Button>
        </div>
      )}
    </div>
  )
}
