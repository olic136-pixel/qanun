'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Loader2 } from 'lucide-react'
import { useEntity } from '@/lib/entity-context'
import { checkGovernanceProfile, type GovernanceProfile } from '@/lib/api/governance'
import { GovernanceOnboardingWizard } from './GovernanceOnboardingWizard'
import { GovernanceDashboard } from './GovernanceDashboard'

type PageState = 'loading' | 'onboarding' | 'dashboard' | 'no_entity' | 'error'

export default function GovernancePage() {
  const { data: session } = useSession()
  const { selectedEntity, loading: entityLoading } = useEntity()

  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken || ''

  const [pageState, setPageState] = useState<PageState>('loading')
  const [profile, setProfile] = useState<GovernanceProfile | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (entityLoading) return

    if (!selectedEntity) {
      setPageState('no_entity')
      return
    }

    if (!token) {
      setPageState('loading')
      return
    }

    let cancelled = false

    async function checkProfile() {
      setPageState('loading')
      try {
        const result = await checkGovernanceProfile(selectedEntity!.id, token)
        if (cancelled) return
        if (result) {
          setProfile(result)
          setPageState('dashboard')
        } else {
          setPageState('onboarding')
        }
      } catch (e: unknown) {
        if (cancelled) return
        const message = e instanceof Error ? e.message : 'Failed to check governance profile'
        setError(message)
        setPageState('error')
      }
    }

    checkProfile()
    return () => { cancelled = true }
  }, [selectedEntity, token, entityLoading])

  if (pageState === 'loading') {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-500">
        <Loader2 size={16} className="animate-spin mr-2" />
        Loading governance framework…
      </div>
    )
  }

  if (pageState === 'no_entity') {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-500">
        Select an entity to view its governance framework.
      </div>
    )
  }

  if (pageState === 'error') {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-[13px]">
          {error}
        </div>
      </div>
    )
  }

  if (pageState === 'onboarding') {
    return <GovernanceOnboardingWizard />
  }

  // pageState === 'dashboard'
  return <GovernanceDashboard entityId={selectedEntity!.id} profile={profile!} />
}
