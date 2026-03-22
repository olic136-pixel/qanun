'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    if (session?.user && !session.user.onboardingComplete) {
      router.push('/onboarding')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="flex h-screen">
        <div className="w-[220px] bg-[#0B1829] p-4 space-y-4">
          <Skeleton className="h-8 w-32 bg-white/10" />
          <Skeleton className="h-4 w-24 bg-white/10" />
          <Skeleton className="h-4 w-28 bg-white/10" />
          <Skeleton className="h-4 w-20 bg-white/10" />
        </div>
        <div className="flex-1 p-6 bg-[#F5F7FA]">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-md" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return <div>{children}</div>
}
