'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { getProjects, type ProjectListItem } from '@/lib/api/projects'
import { useEffect, useState } from 'react'
import { FolderOpen, Plus, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import ConfidenceGauge from '@/components/qanun/ConfidenceGauge'

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function ProjectsPage() {
  const { data: authSession } = useSession()
  const router = useRouter()
  const token = authSession?.user?.accessToken as string | null

  const [projects, setProjects] = useState<ProjectListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    const fetch = async () => {
      try {
        const data = await getProjects(token)
        setProjects(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load projects')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [token])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Projects</h1>
          <p className="text-[14px] text-gray-500">
            {projects.length} research project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => router.push('/projects/new')}
          className="flex items-center gap-1.5 h-[38px] px-4 rounded-md text-[13px] font-medium bg-[#0B1829] text-[#C4922A] hover:bg-[#1A5FA8] hover:text-white transition-all"
        >
          <Plus className="h-4 w-4" />
          New project
        </button>
      </div>

      {error && (
        <Card className="p-4 mb-4 border-red-200 bg-red-50">
          <p className="text-[13px] text-[#991B1B]">{error}</p>
        </Card>
      )}

      {projects.length === 0 && !error && (
        <div className="text-center py-16">
          <FolderOpen className="h-10 w-10 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
          <h3 className="text-[15px] font-medium text-gray-900 mb-1">No research projects yet</h3>
          <p className="text-[13px] text-gray-500 mb-4 max-w-md mx-auto">
            Deep Research builds a living legal opinion across multiple research cycles.
          </p>
          <button
            onClick={() => router.push('/projects/new')}
            className="text-[13px] font-medium text-[#1A5FA8] hover:underline"
          >
            Start a project →
          </button>
        </div>
      )}

      <div className="space-y-3">
        {projects.map((project) => (
          <Card
            key={project.project_id}
            className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => router.push(`/projects/${project.project_id}`)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 mr-4">
                <p className="text-[14px] font-semibold text-gray-900 truncate">
                  {project.title}
                </p>
                <p className="text-[13px] text-gray-500 mt-0.5 line-clamp-2">
                  {project.objective}
                </p>
                <div className="mt-2">
                  <ConfidenceGauge score={project.confidence_score} size="sm" />
                </div>
                <div className="flex items-center gap-3 mt-2 text-[12px] text-gray-400">
                  <span>{project.cycle_count} cycle{project.cycle_count !== 1 ? 's' : ''}</span>
                  <span>·</span>
                  <span>{project.open_questions_count} open question{project.open_questions_count !== 1 ? 's' : ''}</span>
                  <span>·</span>
                  <span>{timeAgo(project.updated_at)}</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
