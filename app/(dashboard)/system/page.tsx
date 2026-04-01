'use client'

import { useSystemStatus } from '@/lib/hooks/useDashboard'
import { Activity, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useState } from 'react'

export default function SystemPage() {
  const { data, isLoading, refetch } = useSystemStatus()
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const agents = data?.agents
    ? Object.entries(data.agents)
    : []

  const liveCount = agents.filter(([, s]) => s === 'available').length

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">System</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            Agent availability and corpus health
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-[13px]"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
          Run health check
        </Button>
      </div>

      {/* Status banner */}
      <Card className={`p-4 mb-6 ${data?.vault_health === 'ok' ? 'border-[#0F7A5F]/30 bg-[#0F7A5F]/5' : 'border-amber-200 bg-amber-50'}`}>
        <div className="flex items-center gap-2">
          <Activity className={`h-4 w-4 ${data?.vault_health === 'ok' ? 'text-[#0F7A5F]' : 'text-amber-600'}`} />
          <span className="text-[13px] font-medium">
            {data?.vault_health === 'ok'
              ? `System healthy — ${liveCount} agents live`
              : 'Checking system status…'}
          </span>
        </div>
      </Card>

      {/* Agent grid */}
      <Card className="p-5 mb-6">
        <h2 className="text-[14px] font-semibold text-gray-900 mb-4">
          Agent availability
        </h2>
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-[56px] rounded-md" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {agents.map(([name, agentStatus]) => {
              const isLive = agentStatus === 'available'
              return (
                <div key={name} className="bg-[#F5F7FA] rounded-md p-3">
                  <p className="text-[12px] font-medium text-[#111827] capitalize">
                    {name.replace(/_/g, ' ')}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isLive ? 'bg-[#16A34A] animate-pulse' : 'bg-[#991B1B]'
                      }`}
                    />
                    <span className={`text-[11px] ${isLive ? 'text-[#16A34A]' : 'text-[#991B1B]'}`}>
                      {isLive ? 'Live' : 'Unavailable'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Corpus stats */}
      <Card className="p-5">
        <h2 className="text-[14px] font-semibold text-gray-900 mb-4">
          Corpus statistics
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Documents', value: data?.corpus?.documents?.toLocaleString() ?? '—' },
            { label: 'Sections', value: data?.corpus?.sections?.toLocaleString() ?? '—' },
            { label: 'Total claims', value: data?.claims_total?.toLocaleString() ?? '—' },
            { label: 'Last updated', value: data?.corpus?.last_updated ? new Date(data.corpus.last_updated).toLocaleDateString() : '—' },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#F5F7FA] rounded-lg p-3">
              <p className="text-[11px] text-[#9CA3AF] uppercase tracking-[0.06em]">
                {stat.label}
              </p>
              <p className="text-[20px] font-medium text-[#0B1829] mt-1">
                {isLoading ? <Skeleton className="h-7 w-16" /> : stat.value}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
