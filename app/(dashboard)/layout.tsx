'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, Search, Bell, BookOpen,
  Settings2, ChevronLeft, ChevronRight,
  Command, FileText, PlusCircle,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useSystemStatus } from '@/lib/hooks/useDashboard'
import { CommandPalette } from '@/components/qanun/CommandPalette'
import { useUIStore } from '@/lib/stores/uiStore'
import { EntityProvider } from '@/lib/entity-context'
import { EntitySelector } from '@/components/qanun/EntitySelector'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const navSections = [
  {
    label: 'Workspace',
    items: [
      { label: 'Dashboard',           icon: LayoutDashboard, href: '/dashboard' },
      { label: 'Research',             icon: Search,          href: '/query' },
      { label: 'Compliance Studio',    icon: FileText,        href: '/compliance/documents' },
      { label: 'Monitoring',           icon: Bell,            href: '/alerts', badge: true },
      { label: 'Corpus',               icon: BookOpen,        href: '/corpus' },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Settings',             icon: Settings2,       href: '/settings' },
    ],
  },
]

function getPageTitle(pathname: string): string {
  const map: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/query': 'Research',
    '/sessions': 'Sessions',
    '/projects': 'Projects',
    '/projects/new': 'New project',
    '/twins': 'Product twins',
    '/alerts': 'Alerts',
    '/corpus': 'Browse corpus',
    '/changes': 'Recent changes',
    '/settings': 'Settings',
    '/system': 'System',
    '/billing': 'Billing',
    '/compliance': 'Compliance Studio',
    '/compliance/classify': 'Business Model Classifier',
    '/compliance/documents': 'Document Suite',
    '/compliance/documents/new': 'New Draft',
    '/compliance/documents/draft': 'Drafting...',
    '/compliance/draft': 'New Draft',
    '/compliance/drafts': 'Drafts',
    '/compliance/twins': 'Document Twins',
    '/compliance/governance': 'Governance Framework',
    '/compliance/governance/documents': 'Document Register',
    '/compliance/governance/folders': 'Governance Folders',
    '/compliance/governance/gap-analysis': 'Gap Analysis',
    '/compliance/gap-analysis': 'Gap Analysis',
    '/compliance/ingest': 'Ingest Documents',
    '/compliance/submission': 'Submission Package',
    '/compliance/governance-suite': 'Governance Suite',
    '/compliance/entities/new': 'Entity Setup',
  }
  if (map[pathname]) return map[pathname]
  for (const [path, title] of Object.entries(map)) {
    if (pathname.startsWith(path + '/')) return title
  }
  return 'Dashboard'
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { data: statusData } = useSystemStatus()

  const liveAgentCount = statusData?.agents
    ? Object.values(statusData.agents).filter((s) => s === 'available').length
    : 10
  const pendingAlerts = 0

  useEffect(() => {
    if (status === 'loading') return
    if (session?.user && !session.user.onboardingComplete) {
      router.push('/onboarding')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="flex h-screen">
        <div className="w-[200px] bg-white border-r border-black/10 p-4 space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex-1 p-6 bg-white">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const initials = session?.user?.name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'QN'

  return (
    <EntityProvider>
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className={`bg-white border-r border-black/10 flex flex-col transition-all duration-200 ${
        collapsed ? 'w-12' : 'w-[220px]'
      }`}>
        {/* Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-4 py-4 border-b border-black/10"
        >
          <div className="w-7 h-7 bg-black flex items-center justify-center shrink-0">
            <span className="text-white font-black text-sm leading-none">Q</span>
          </div>
          {!collapsed && (
            <span className="text-[14px] font-black uppercase tracking-tighter text-black">
              QANUN
            </span>
          )}
        </Link>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navSections.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <p className="px-4 py-1 text-[9px] font-mono font-bold uppercase tracking-[0.25em] text-black/20 mt-2">
                  {section.label}
                </p>
              )}
              {section.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/')
                const Icon = item.icon
                const showBadge = 'badge' in item && item.badge && pendingAlerts > 0
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-link-new ${active ? 'active' : ''}`}
                  >
                    <Icon size={14} className="shrink-0" strokeWidth={1.5} />
                    {!collapsed && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        {showBadge && (
                          <span className="bg-black text-white text-[9px] px-1.5 py-0.5 font-mono font-bold">
                            {pendingAlerts}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Entity section */}
        {!collapsed && (
          <div className="mx-3 mb-3 border-t border-black/10 pt-3">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[9px] font-mono font-bold uppercase tracking-[0.25em] text-black/20">
                Entity
              </p>
              <Link
                href="/compliance/entities/new"
                className="w-5 h-5 flex items-center justify-center border border-black/10 hover:bg-black hover:border-black hover:text-white text-black/40 transition-all"
                title="Add new entity"
              >
                <PlusCircle size={11} strokeWidth={1.5} />
              </Link>
            </div>
            <EntitySelector />
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center py-3 text-black/20 hover:text-black/60 border-t border-black/10 transition-colors"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-[52px] bg-white border-b border-black/10 sticky top-0 z-40 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-[12px] font-black uppercase tracking-tighter text-black">
              {getPageTitle(pathname)}
            </h1>
            <div className="flex items-center gap-2 px-3 py-1 bg-[#0047FF]/5 border border-[#0047FF]/10">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0047FF] animate-pulse" />
              <span className="font-mono text-[10px] text-[#0047FF] uppercase tracking-[0.15em]">
                {liveAgentCount} agents live
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => useUIStore.getState().setPaletteOpen(true)}
              className="font-mono text-[10px] text-black/30 border border-black/10 px-3 py-1.5 hover:bg-black/5 flex items-center gap-1.5 uppercase tracking-[0.1em] transition-colors"
            >
              <Command size={11} />
              <span>Cmd K</span>
            </button>
            <button className="relative text-black/30 hover:text-black transition-colors">
              <Bell size={15} strokeWidth={1.5} />
              {pendingAlerts > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-[8px] w-3.5 h-3.5 flex items-center justify-center font-bold">
                  {pendingAlerts}
                </span>
              )}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger className="w-7 h-7 bg-black flex items-center justify-center text-white font-mono text-[10px] font-bold border-none outline-none">
                {initials}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-[12px] font-bold uppercase tracking-tight">{session?.user?.name || 'User'}</p>
                  <p className="text-[10px] font-mono text-black/40">{session?.user?.email || ''}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/settings')}>Settings</DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/billing')}>Billing</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/sign-in' })}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#F5F3EE]">
          {children}
        </main>
      </div>
      <CommandPalette />
    </div>
    </EntityProvider>
  )
}
