'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { getSessions } from '@/lib/api/query'
import { useUIStore } from '@/lib/stores/uiStore'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  Search,
  LayoutDashboard,
  Clock,
  Hexagon,
  Bell,
  BookOpen,
  GitCommit,
  Settings2,
  CreditCard,
  Plus,
} from 'lucide-react'

const STATIC_COMMANDS = [
  { id: 'new-query', label: 'New query', icon: Plus, href: '/query', group: 'Actions' },
  { id: 'dashboard', label: 'Go to Dashboard', icon: LayoutDashboard, href: '/dashboard', group: 'Navigation' },
  { id: 'sessions', label: 'View sessions', icon: Clock, href: '/sessions', group: 'Navigation' },
  { id: 'twins', label: 'Product twins', icon: Hexagon, href: '/twins', group: 'Navigation' },
  { id: 'alerts', label: 'Alerts', icon: Bell, href: '/alerts', group: 'Navigation' },
  { id: 'corpus', label: 'Browse corpus', icon: BookOpen, href: '/corpus', group: 'Navigation' },
  { id: 'changes', label: 'Recent changes', icon: GitCommit, href: '/changes', group: 'Navigation' },
  { id: 'settings', label: 'Settings', icon: Settings2, href: '/settings', group: 'Navigation' },
  { id: 'billing', label: 'Billing', icon: CreditCard, href: '/billing', group: 'Navigation' },
]

export function CommandPalette() {
  const { paletteOpen: open, setPaletteOpen: setOpen } = useUIStore()
  const [query, setQuery] = useState('')
  const [sessions, setSessions] = useState<Array<{ session_id: string; query_text: string }>>([])
  const [selected, setSelected] = useState(0)
  const router = useRouter()
  const { data: session } = useSession()
  const token = session?.user?.accessToken as string

  // Open on Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(!open)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, setOpen])

  // Load recent sessions when opened
  useEffect(() => {
    if (open && token) {
      getSessions(token, { limit: 5 })
        .then((data) => setSessions(data.sessions ?? []))
        .catch(() => {})
    }
    if (!open) {
      setQuery('')
      setSelected(0)
    }
  }, [open, token])

  const filtered =
    query.length === 0
      ? STATIC_COMMANDS
      : STATIC_COMMANDS.filter((c) =>
          c.label.toLowerCase().includes(query.toLowerCase())
        )

  const sessionResults = sessions
    .filter(
      (s) =>
        query.length === 0 ||
        s.query_text.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 3)
    .map((s) => ({
      id: s.session_id,
      label: s.query_text,
      icon: Clock,
      href: `/query/${s.session_id}`,
      group: 'Recent sessions',
    }))

  const allResults = [...filtered, ...sessionResults]
  const totalResults = allResults.length

  // Keyboard navigation
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelected((s) => Math.min(s + 1, totalResults - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelected((s) => Math.max(s - 1, 0))
      }
      if (e.key === 'Enter' && allResults[selected]) {
        router.push(allResults[selected].href)
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, selected, totalResults, allResults, router, setOpen])

  // Build grouped results with global indices
  const grouped: Record<string, Array<(typeof allResults)[0] & { globalIdx: number }>> = {}
  allResults.forEach((item, idx) => {
    const g = item.group
    if (!grouped[g]) grouped[g] = []
    grouped[g].push({ ...item, globalIdx: idx })
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 overflow-hidden max-w-[560px] rounded-xl border border-[#E8EBF0] shadow-lg">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E8EBF0]">
          <Search className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" strokeWidth={1.5} />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelected(0)
            }}
            placeholder="Search pages, sessions, corpus..."
            className="flex-1 text-[14px] text-[#111827] placeholder:text-[#9CA3AF] bg-transparent border-none outline-none"
          />
          <kbd className="bg-[#F5F7FA] border border-[#E8EBF0] rounded px-1.5 text-[10px] text-[#9CA3AF]">
            esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto py-2">
          {allResults.length === 0 && (
            <div className="px-4 py-8 text-center text-[13px] text-[#9CA3AF]">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <div className="px-4 pt-3 pb-1 text-[10px] font-medium uppercase tracking-[0.08em] text-[#9CA3AF]">
                {group}
              </div>
              {items.map((item) => {
                const Icon = item.icon
                const isSelected = item.globalIdx === selected
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      router.push(item.href)
                      setOpen(false)
                    }}
                    onMouseEnter={() => setSelected(item.globalIdx)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-75 ${
                      isSelected ? 'bg-[#EFF6FF]' : 'hover:bg-[#F5F7FA]'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-[#1A5FA8]' : 'bg-[#F5F7FA]'
                      }`}
                    >
                      <Icon
                        className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-[#6B7280]'}`}
                        strokeWidth={1.5}
                      />
                    </div>
                    <span
                      className={`text-[13px] truncate ${
                        isSelected ? 'text-[#0C447C] font-medium' : 'text-[#111827]'
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[#E8EBF0] flex items-center gap-4 text-[10px] text-[#9CA3AF]">
          <span>
            <kbd className="font-mono">↑↓</kbd> navigate
          </span>
          <span>
            <kbd className="font-mono">↵</kbd> open
          </span>
          <span>
            <kbd className="font-mono">esc</kbd> close
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
