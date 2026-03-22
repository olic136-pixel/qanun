'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { getSystemStatus, getDashboardKPIs } from '@/lib/api/system'

export function useSystemStatus() {
  const { data: session } = useSession()
  const token = session?.user?.accessToken as string

  return useQuery({
    queryKey: ['system-status'],
    queryFn: () => getSystemStatus(token),
    enabled: !!token,
    refetchInterval: 30_000,
  })
}

export function useDashboardKPIs() {
  const { data: session } = useSession()
  const token = session?.user?.accessToken as string

  return useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: () => getDashboardKPIs(token),
    enabled: !!token,
    refetchInterval: 60_000,
  })
}
