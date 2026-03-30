'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useOnboardingStore } from '@/lib/stores/onboardingStore'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

const roles = [
  'Founder / CEO',
  'CLO / General Counsel',
  'In-house Compliance',
  'Law firm associate',
  'Law firm partner',
  'Other',
]

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
      router.push('/dashboard')
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <h2 className="text-[22px] font-black uppercase tracking-tighter text-black mb-1">Tell us about yourself</h2>
      <p className="text-[12px] text-black/40 mb-6">What best describes your role?</p>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {roles.map((r) => (
          <button key={r} onClick={() => store.setRole(r)}
            className={`text-left border p-4 text-sm cursor-pointer transition-colors ${
              store.role === r ? 'border-black bg-black/5' : 'border-black/10 hover:border-black/30'
            }`}>
            {r}
          </button>
        ))}
      </div>
      <div className="mb-6">
        <label className="font-mono text-[10px] text-black/40 uppercase tracking-[0.2em] mb-1 block">Organisation name</label>
        <Input placeholder="Your company" value={store.orgName} onChange={(e) => store.setOrgName(e.target.value)} />
      </div>

      {error && <p className="text-[13px] text-black mb-3">{error}</p>}

      <button
        disabled={submitting}
        className="btn-primary w-full"
        onClick={async () => {
          setError('')
          if (!store.role) { setError('Please select a role'); return }
          await submitOnboarding()
        }}
      >
        {submitting ? <Loader2 className="animate-spin" size={18} /> : 'Continue'}
      </button>
    </div>
  )
}
