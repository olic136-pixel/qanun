'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, Search, Clock, Hexagon, Bell, BookOpen,
  GitCommit, Settings2, CreditCard, ChevronLeft, ChevronRight,
  Sun, Moon, Command, Activity, FolderOpen, Sparkles,
  FileText, FilePlus, Download, BarChart3, Package, PlusCircle, Shield,
} from 'lucide-react'
import { QanunWordmark } from '@/components/qanun/QanunWordmark'
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
      { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
      { label: 'Research', icon: Search, href: '/query' },
      { label: 'Projects', icon: FolderOpen, href: '/projects' },
      { label: 'Sessions', icon: Clock, href: '/sessions' },
    ],
  },
  {
    label: 'Monitoring',
    items: [
      { label: 'Product twins', icon: Hexagon, href: '/twins' },
      { label: 'Alerts', icon: Bell, href: '/alerts', badge: 1 },
    ],
  },
  {
    label: 'Corpus',
    items: [
      { label: 'Browse corpus', icon: BookOpen, href: '/corpus' },
      { label: 'Recent changes', icon: GitCommit, href: '/changes' },
    ],
  },
  {
    label: 'Compliance Studio',
    items: [
      { label: 'Governance', icon: Shield, href: '/compliance/governance' },
      { label: 'Classify', icon: Sparkles, href: '/compliance/classify' },
      { label: 'Documents', icon: FileText, href: '/compliance/documents' },
      { label: 'New draft', icon: FilePlus, href: '/compliance/documents/new' },
      { label: 'Gap analysis', icon: BarChart3, href: '/compliance/gap-analysis' },
      { label: 'Submission', icon: Package, href: '/compliance/submission' },
      { label: '+ Entity', icon: PlusCircle, href: '/compliance/entities/new' },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Settings', icon: Settings2, href: '/settings' },
      { label: 'System', icon: Activity, href: '/system' },
      { label: 'Billing', icon: CreditCard, href: '/billing' },
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
  }
  // Check for exact match first, then prefix match for dynamic routes
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
  const corpusDocs = statusData?.corpus?.documents?.toLocaleString() ?? '2,484'
  const corpusSections = statusData?.corpus?.sections?.toLocaleString() ?? '63,397'
  const corpusHealthy = statusData?.vault_health === 'ok'

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
      <aside
        className={`bg-[#0B1829] flex flex-col transition-all duration-200 ${
          collapsed ? 'w-12' : 'w-[220px]'
        }`}
      >
        {/* Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-4 py-4 border-b border-white/[0.08]"
        >
          <div className="w-[26px] h-[26px] bg-[rgba(196,146,42,0.15)] border border-[rgba(196,146,42,0.4)] rounded-[5px] flex items-center justify-center shrink-0">
            <span className="text-[#C4922A] text-xs font-medium italic">Q</span>
          </div>
          {!collapsed && <QanunWordmark size="sm" dark />}
        </Link>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          {navSections.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <p className="px-4 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-white/50 mt-2">
                  {section.label}
                </p>
              )}
              {section.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/')
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 text-[12px] cursor-pointer transition-all duration-120 ${
                      active
                        ? 'bg-[rgba(26,95,168,0.2)] text-white border-l-2 border-[#1A5FA8] -ml-[2px] pl-[calc(1rem+2px)]'
                        : 'text-white/70 hover:bg-white/5 hover:text-white/90'
                    }`}
                  >
                    <Icon size={16} className="shrink-0" />
                    {!collapsed && (
                      <span className="flex-1">{item.label}</span>
                    )}
                    {!collapsed && 'badge' in item && item.badge && item.badge > 0 && (
                      <span className="bg-[#991B1B] text-white text-[9px] px-1.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Entity selector */}
        {!collapsed && (
          <div className="mx-3 mb-2">
            <p className="px-1 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-white/50">
              Entity
            </p>
            <EntitySelector />
          </div>
        )}

        {/* Corpus status footer */}
        {!collapsed && (
          <div className="mx-3 mb-3 bg-[rgba(15,122,95,0.1)] border border-[rgba(15,122,95,0.25)] rounded-[7px] p-[9px]">
            <p className="text-[9px] text-white/50 uppercase tracking-[0.08em] mb-1.5">
              Corpus status
            </p>
            <div className="space-y-1">
              {[
                { label: 'Documents', value: corpusDocs },
                { label: 'Sections', value: corpusSections },
                { label: 'Health', value: 'Live' },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-[10px]">
                  <span className="text-white/50">{row.label}</span>
                  <span className={`${row.label === 'Health' ? 'text-[#5DCAA5]' : 'text-white/70'} ${row.label === 'Health' && corpusHealthy ? 'animate-pulse' : ''}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center py-3 text-white/30 hover:text-white/60 border-t border-white/[0.08]"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-[52px] bg-white border-b border-[#E8EBF0] sticky top-0 z-40 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-[15px] font-medium text-[#111827]">
              {getPageTitle(pathname)}
            </h1>
            <span className="bg-green-50 text-green-700 text-[12px] px-3 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              {liveAgentCount} agents live
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => useUIStore.getState().setPaletteOpen(true)}
              className="text-[13px] text-[#6B7280] border border-[#E8EBF0] rounded-md px-3 py-1.5 hover:bg-[#F5F7FA] flex items-center gap-1.5"
            >
              <Command size={12} />
              <span>Cmd K</span>
            </button>
            <button className="text-[#6B7280] hover:text-[#111827]">
              <Sun size={16} />
            </button>
            <button className="relative text-[#6B7280] hover:text-[#111827]">
              <Bell size={16} />
              <span className="absolute -top-1 -right-1 bg-[#991B1B] text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center">
                1
              </span>
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger className="w-[30px] h-[30px] rounded-full bg-[#0B1829] flex items-center justify-center text-[#C4922A] text-[11px] font-medium border-none outline-none">
                {initials}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{session?.user?.name || 'User'}</p>
                  <p className="text-xs text-[#6B7280]">{session?.user?.email || ''}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/billing')}>
                  Billing
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/sign-in' })}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#F5F7FA]">
          {children}
        </main>
      </div>
      <CommandPalette />
    </div>
    </EntityProvider>
  )
}
