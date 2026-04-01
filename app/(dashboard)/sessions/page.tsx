'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { getSessions, type SessionSummary } from '@/lib/api/query'
import { useEffect, useState } from 'react'
import {
  Loader2,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

const STATUS_STYLES: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  complete: { label: 'Complete', icon: CheckCircle2, color: 'text-[#0F7A5F]' },
  running: { label: 'Running', icon: Loader2, color: 'text-[#0047FF]' },
  pending: { label: 'Pending', icon: Clock, color: 'text-[#C4922A]' },
  error: { label: 'Error', icon: AlertCircle, color: 'text-[#991B1B]' },
}

export default function SessionsPage() {
  const { data: authSession } = useSession()
  const router = useRouter()
  const token = authSession?.user?.accessToken as string | null

  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!token) return

    const fetchSessions = async () => {
      try {
        const data = await getSessions(token, { limit: 50 })
        setSessions(data.sessions)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load sessions')
      } finally {
        setLoading(false)
      }
    }

    fetchSessions()
  }, [token])

  const filteredSessions = sessions.filter(
    (s) =>
      !searchQuery ||
      s.query_text.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Sessions</h1>
        <p className="text-[14px] text-gray-500">
          {sessions.length} query session{sessions.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search sessions…"
          className="pl-10 text-[14px]"
        />
      </div>

      {error && (
        <Card className="p-4 mb-4 border-red-200 bg-red-50">
          <p className="text-[13px] text-[#991B1B]">{error}</p>
        </Card>
      )}

      {filteredSessions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[14px] text-gray-500">
            {searchQuery ? 'No sessions match your search.' : 'No sessions yet.'}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {filteredSessions.map((session) => {
          const status = STATUS_STYLES[session.status] ?? STATUS_STYLES.pending
          const StatusIcon = status.icon

          return (
            <Card
              key={session.session_id}
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => router.push(`/query/${session.session_id}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusIcon
                      className={`h-4 w-4 ${status.color} ${
                        session.status === 'running' ? 'animate-spin' : ''
                      }`}
                    />
                    <span className="text-[14px] font-medium text-gray-900 truncate">
                      {session.query_text}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[12px] text-gray-400">
                    <span>
                      {new Date(session.created_at).toLocaleDateString()} at{' '}
                      {new Date(session.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {session.jurisdictions?.map((j) => (
                      <Badge
                        key={j}
                        variant="outline"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {j}
                      </Badge>
                    ))}
                    {session.claims_count > 0 && (
                      <span>{session.claims_count} claims</span>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
