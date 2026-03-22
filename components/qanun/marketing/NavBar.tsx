'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { QanunWordmark } from '@/components/qanun/QanunWordmark'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function useScrollPosition() {
  const [scrollY, setScrollY] = useState(0)
  useEffect(() => {
    const handler = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])
  return scrollY
}

const navLinks = [
  { label: 'Product', href: '/#features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
]

export function NavBar() {
  const scrollY = useScrollPosition()
  const [mobileOpen, setMobileOpen] = useState(false)
  const scrolled = scrollY > 48

  return (
    <>
      <nav
        className={`sticky top-0 z-50 transition-all duration-150 ${
          scrolled
            ? 'bg-white border-b border-[#E8EBF0]'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 h-16">
          {/* Left: Q mark + wordmark */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#0B1829] rounded-[6px] flex items-center justify-center">
              <span className="text-[#C4922A] text-sm font-medium italic">Q</span>
            </div>
            <QanunWordmark size="md" />
          </Link>

          {/* Centre: nav links (desktop) */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-[#6B7280] hover:text-[#111827] transition-colors duration-120"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right: CTA buttons (desktop) */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/sign-in"
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className={cn(
                buttonVariants({ size: 'sm' }),
                'bg-[#0B1829] text-[#C4922A] hover:bg-[#1A5FA8] hover:text-white'
              )}
            >
              Get started
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl p-6 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="block text-sm text-[#6B7280] hover:text-[#111827] py-2"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-[#E8EBF0] pt-4 space-y-3">
              <Link
                href="/sign-in"
                className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className={cn(
                  buttonVariants(),
                  'w-full bg-[#0B1829] text-[#C4922A] hover:bg-[#1A5FA8] hover:text-white'
                )}
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
